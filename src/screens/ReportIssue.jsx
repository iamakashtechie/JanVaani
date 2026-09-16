import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { submitIssue } from '../services/issueService';
import { ISSUE_CATEGORIES, getCategoryById } from '../config/categories';
import { validateIssueForm } from '../utils/validators';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
    FaMapMarkerAlt, FaTimes, FaCamera, FaCheckCircle,
    FaInfoCircle, FaShieldAlt, FaArrowRight, FaSpinner,
    FaCrosshairs, FaExclamationTriangle
} from 'react-icons/fa';
import toast from 'react-hot-toast';

// Fix Leaflet default marker icons for Vite bundling
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const pinIcon = L.divIcon({
    className: '',
    html: `<div style="
        width:34px;height:34px;border-radius:50% 50% 50% 0;
        background:#dc2626;border:3px solid white;
        box-shadow:0 4px 12px rgba(0,0,0,0.4);
        transform:rotate(-45deg);
        display:flex;align-items:center;justify-content:center;
    "><div style="width:10px;height:10px;background:white;border-radius:50%;transform:rotate(45deg);"></div></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -34],
});

/**
 * Helper component to handle map clicks & pan animations
 */
const MapEventsHandler = ({ coordinates, onLocationChange }) => {
    const map = useMap();

    // Fly to coordinates when updated via GPS
    useEffect(() => {
        if (coordinates?.lat && coordinates?.lng) {
            map.flyTo([coordinates.lat, coordinates.lng], 16, { duration: 1.2 });
        }
    }, [coordinates, map]);

    useMapEvents({
        click(e) {
            onLocationChange({
                lat: e.latlng.lat,
                lng: e.latlng.lng,
            });
        },
    });

    return null;
};

const MAX_PHOTOS = 3;
const MAX_DESC = 500;

const ReportIssue = () => {
    const [formData, setFormData] = useState({
        title: '',
        category: '',
        description: '',
        location: '',
        coordinates: null, // Compulsory { lat, lng }
        photos: [],
    });
    const [photoPreviews, setPhotoPreviews] = useState([]);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [gpsLoading, setGpsLoading] = useState(false);
    const { user } = useAuth();
    const navigate = useNavigate();

    const markerRef = useRef(null);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    };

    const handleLocationSelect = (coords) => {
        setFormData(prev => ({
            ...prev,
            coordinates: coords,
            // If location text field is empty, provide default coordinates label
            location: prev.location.trim() ? prev.location : `Pinned Location (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`
        }));
        if (errors.coordinates) setErrors(prev => ({ ...prev, coordinates: '' }));
        toast.success('Exact map location pinned! 📍', { id: 'pin-success' });
    };

    const handleMarkerDragEnd = () => {
        const marker = markerRef.current;
        if (marker != null) {
            const latlng = marker.getLatLng();
            handleLocationSelect({ lat: latlng.lat, lng: latlng.lng });
        }
    };

    const handlePhotoChange = (e) => {
        const files = Array.from(e.target.files);
        const remaining = MAX_PHOTOS - formData.photos.length;
        const toAdd = files.slice(0, remaining);

        const newPreviews = toAdd.map(f => URL.createObjectURL(f));
        setFormData(prev => ({ ...prev, photos: [...prev.photos, ...toAdd] }));
        setPhotoPreviews(prev => [...prev, ...newPreviews]);
    };

    const removePhoto = (index) => {
        setFormData(prev => ({ ...prev, photos: prev.photos.filter((_, i) => i !== index) }));
        setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleGPS = () => {
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by your browser.');
            return;
        }
        setGpsLoading(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                handleLocationSelect(coords);
                setGpsLoading(false);
                toast.success('Current GPS location detected & pinned! 🎯');
            },
            (err) => {
                toast.error('Could not detect GPS location. Please click on the map to place the pin.');
                setGpsLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validateIssueForm(formData);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            if (validationErrors.coordinates) {
                toast.error('Map location selection is compulsory! Please click on the map.');
            } else {
                toast.error('Please complete all required fields.');
            }
            return;
        }

        setLoading(true);
        try {
            await submitIssue(formData, user);
            toast.success('Civic issue reported successfully! 🎉');
            navigate('/track');
        } catch (err) {
            toast.error('Failed to submit report. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Calculate form completion percentage
    let completedSteps = 0;
    if (formData.title.trim().length >= 5) completedSteps++;
    if (formData.category) completedSteps++;
    if (formData.description.trim().length >= 20) completedSteps++;
    if (formData.location.trim().length >= 3) completedSteps++;
    if (formData.coordinates) completedSteps++;
    const progressPercent = Math.round((completedSteps / 5) * 100);

    const defaultMapCenter = [22.5726, 88.3639]; // Kolkata Center

    return (
        <div className="bg-slate-50 min-h-screen pb-12">
            {/* Top Page Banner */}
            <div className="bg-gradient-to-r from-blue-900 via-blue-700 to-sky-600 text-white py-10 px-4 sm:px-6 shadow-md mb-8">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 bg-white/15 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md mb-2">
                            <span>📝 New Citizen Complaint</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Report a Civic Issue</h1>
                        <p className="text-blue-100 text-sm mt-1 max-w-xl">
                            Help municipal authorities locate and fix problems in your locality. Exact map location is compulsory for municipal triage.
                        </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center min-w-[180px]">
                        <p className="text-xs font-medium text-blue-100">Form Readiness</p>
                        <p className="text-2xl font-extrabold text-white mt-0.5">{progressPercent}%</p>
                        <div className="w-full bg-white/20 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div
                                className="bg-emerald-400 h-full rounded-full transition-all duration-300"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Form Column */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Title */}
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                                            Issue Headline <span className="text-red-500">*</span>
                                        </label>
                                        <span className="text-xs text-gray-400 font-medium">{formData.title.length}/100</span>
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => handleChange('title', e.target.value)}
                                        placeholder="e.g. Major Pothole causing traffic on Ring Road"
                                        maxLength={100}
                                        className={`w-full border rounded-xl px-4 py-3 text-sm text-gray-800 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                                            errors.title ? 'border-red-400 bg-red-50/20' : 'border-gray-300 hover:border-gray-400'
                                        }`}
                                    />
                                    {errors.title && <p className="text-xs text-red-600 font-semibold mt-1.5">{errors.title}</p>}
                                </div>

                                {/* Category Grid */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-800 mb-2">
                                        Select Category <span className="text-red-500">*</span>
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                        {ISSUE_CATEGORIES.map(cat => {
                                            const isSelected = formData.category === cat.id;
                                            return (
                                                <button
                                                    key={cat.id}
                                                    type="button"
                                                    onClick={() => handleChange('category', cat.id)}
                                                    className={`flex flex-col items-start p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                                                        isSelected
                                                            ? 'border-blue-600 bg-blue-50/80 shadow-xs'
                                                            : 'border-gray-200 bg-white hover:border-blue-200 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <span className="text-xl mb-1">{cat.icon}</span>
                                                    <span className={`text-xs font-bold truncate w-full ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
                                                        {cat.label}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {errors.category && <p className="text-xs text-red-600 font-semibold mt-1.5">{errors.category}</p>}
                                </div>

                                {/* Description */}
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="text-sm font-bold text-gray-800">
                                            Detailed Description <span className="text-red-500">*</span>
                                        </label>
                                        <span className={`text-xs font-medium ${formData.description.length >= MAX_DESC - 30 ? 'text-amber-600' : 'text-gray-400'}`}>
                                            {formData.description.length}/{MAX_DESC}
                                        </span>
                                    </div>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => handleChange('description', e.target.value)}
                                        placeholder="Describe the issue in detail: exact location reference points, severity, risk to commuters, how long it has been unresolved..."
                                        maxLength={MAX_DESC}
                                        rows={4}
                                        className={`w-full border rounded-xl px-4 py-3 text-sm text-gray-800 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-all ${
                                            errors.description ? 'border-red-400 bg-red-50/20' : 'border-gray-300 hover:border-gray-400'
                                        }`}
                                    />
                                    {errors.description && <p className="text-xs text-red-600 font-semibold mt-1.5">{errors.description}</p>}
                                </div>

                                {/* Compulsory Map Location Selector */}
                                <div className="space-y-3">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div>
                                            <label className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                                                Exact Map Location <span className="text-red-500">* (Compulsory)</span>
                                            </label>
                                            <p className="text-xs text-gray-500">
                                                Click on the map or use Auto-GPS to place the exact location marker.
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleGPS}
                                            disabled={gpsLoading}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all disabled:opacity-60 cursor-pointer shadow-xs"
                                        >
                                            <FaCrosshairs className="text-blue-600" />
                                            <span>{gpsLoading ? 'Locating...' : 'Detect My Location'}</span>
                                        </button>
                                    </div>

                                    {/* Interactive Leaflet Map Picker */}
                                    <div className={`rounded-2xl overflow-hidden border-2 transition-all shadow-sm ${
                                        errors.coordinates
                                            ? 'border-red-400 ring-2 ring-red-200'
                                            : formData.coordinates
                                                ? 'border-emerald-500 ring-2 ring-emerald-100'
                                                : 'border-gray-300 hover:border-blue-400'
                                    }`}>
                                        <div style={{ height: '280px', width: '100%' }}>
                                            <MapContainer
                                                center={formData.coordinates ? [formData.coordinates.lat, formData.coordinates.lng] : defaultMapCenter}
                                                zoom={formData.coordinates ? 16 : 5}
                                                style={{ height: '100%', width: '100%' }}
                                            >
                                                <TileLayer
                                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                />
                                                <MapEventsHandler
                                                    coordinates={formData.coordinates}
                                                    onLocationChange={handleLocationSelect}
                                                />
                                                {formData.coordinates && (
                                                    <Marker
                                                        ref={markerRef}
                                                        position={[formData.coordinates.lat, formData.coordinates.lng]}
                                                        icon={pinIcon}
                                                        draggable={true}
                                                        eventHandlers={{ dragend: handleMarkerDragEnd }}
                                                    >
                                                        <Popup>
                                                            <div className="text-xs font-bold text-gray-800">
                                                                📍 Selected Spot<br />
                                                                <span className="text-[10px] text-gray-500 font-normal">Drag or click anywhere to adjust</span>
                                                            </div>
                                                        </Popup>
                                                    </Marker>
                                                )}
                                            </MapContainer>
                                        </div>
                                    </div>

                                    {/* Coordinates Selection Status Badge */}
                                    {formData.coordinates ? (
                                        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 rounded-xl text-xs font-bold text-emerald-800 animate-fade-in">
                                            <div className="flex items-center gap-2">
                                                <FaCheckCircle className="text-emerald-600" size={15} />
                                                <span>Location Pinned: {formData.coordinates.lat.toFixed(5)}, {formData.coordinates.lng.toFixed(5)}</span>
                                            </div>
                                            <span className="text-[11px] text-emerald-700 font-medium">Click map to move pin</span>
                                        </div>
                                    ) : (
                                        <div className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                                            errors.coordinates ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-amber-50 border border-amber-200 text-amber-800'
                                        }`}>
                                            <FaExclamationTriangle size={14} className={errors.coordinates ? 'text-red-500' : 'text-amber-600'} />
                                            <span>
                                                {errors.coordinates || 'Please click on the map to pinpoint the exact issue location (Required).'}
                                            </span>
                                        </div>
                                    )}

                                    {/* Landmark text input */}
                                    <div className="pt-2">
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                            Street Address / Landmark <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.location}
                                            onChange={(e) => handleChange('location', e.target.value)}
                                            placeholder="e.g. Near HDFC Bank ATM, 4th Main Road, Ward 12"
                                            className={`w-full border rounded-xl px-4 py-3 text-sm text-gray-800 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                                                errors.location ? 'border-red-400 bg-red-50/20' : 'border-gray-300 hover:border-gray-400'
                                            }`}
                                        />
                                        {errors.location && <p className="text-xs text-red-600 font-semibold mt-1.5">{errors.location}</p>}
                                    </div>
                                </div>

                                {/* Photo Upload */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-sm font-bold text-gray-800">
                                            Evidence Photos
                                        </label>
                                        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                            {formData.photos.length}/{MAX_PHOTOS} Photos
                                        </span>
                                    </div>

                                    {formData.photos.length < MAX_PHOTOS && (
                                        <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-blue-500 bg-slate-50/80 hover:bg-blue-50/40 rounded-2xl p-6 text-center cursor-pointer transition-all group">
                                            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                                <FaCamera size={20} />
                                            </div>
                                            <p className="text-sm font-bold text-gray-700 group-hover:text-blue-600">
                                                Click to upload photos
                                            </p>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                PNG, JPG or JPEG up to 5MB (Clear photos get faster resolution)
                                            </p>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                onChange={handlePhotoChange}
                                                className="hidden"
                                            />
                                        </label>
                                    )}

                                    {photoPreviews.length > 0 && (
                                        <div className="grid grid-cols-3 gap-3 mt-3">
                                            {photoPreviews.map((url, i) => (
                                                <div key={i} className="relative group rounded-xl overflow-hidden border border-gray-200 shadow-sm aspect-video bg-black/5">
                                                    <img
                                                        src={url}
                                                        alt={`Evidence ${i + 1}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removePhoto(i)}
                                                        className="absolute top-1.5 right-1.5 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-700 cursor-pointer shadow-md transition-transform hover:scale-110"
                                                    >
                                                        <FaTimes size={10} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-extrabold py-3.5 rounded-xl transition-all text-base shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    {loading ? (
                                        <>
                                            <FaSpinner className="animate-spin text-white" size={18} />
                                            <span>Submitting & Pinning Report...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Submit Civic Report</span>
                                            <FaArrowRight size={14} />
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Right Sidebar Guide Column */}
                    <div className="space-y-6">
                        {/* Map Compulsory Info Card */}
                        <div className="bg-gradient-to-br from-blue-900 to-indigo-950 rounded-2xl p-6 text-white shadow-md">
                            <div className="flex items-center gap-2 text-sky-300 font-bold text-sm mb-2">
                                <FaMapMarkerAlt />
                                <span>Why Map Pinning is Mandatory</span>
                            </div>
                            <p className="text-xs text-slate-200 leading-relaxed mb-4">
                                Municipal road crews, electricity linemen, and sanitation trucks rely on exact GPS coordinates to dispatch inspection teams directly to the spot without lost time.
                            </p>
                            <div className="bg-white/10 rounded-xl p-3 text-xs text-blue-100 space-y-1.5">
                                <p className="font-bold text-white">💡 Pro Tip:</p>
                                <p>Click "Detect My Location" while standing near the issue, or tap anywhere on the interactive map to place the marker.</p>
                            </div>
                        </div>

                        {/* Civic Trust Card */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                            <div className="flex items-center gap-2.5 text-blue-700 font-bold text-sm mb-3">
                                <FaShieldAlt size={18} />
                                <span>Citizen Guidelines</span>
                            </div>
                            <ul className="space-y-2.5 text-xs text-gray-600">
                                <li className="flex items-start gap-2">
                                    <FaCheckCircle className="text-emerald-500 mt-0.5 flex-shrink-0" />
                                    <span>Accurate landmark names expedite municipal inspection.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <FaCheckCircle className="text-emerald-500 mt-0.5 flex-shrink-0" />
                                    <span>Photos with clear lighting enable swift triage.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <FaCheckCircle className="text-emerald-500 mt-0.5 flex-shrink-0" />
                                    <span>You receive real-time notifications on status changes.</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportIssue;