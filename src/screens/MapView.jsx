import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { subscribeToIssues } from '../services/issueService';
import { ISSUE_CATEGORIES, getCategoryById, getStatusMeta } from '../config/categories';
import { timeAgo } from '../utils/formatDate';
import { SkeletonPage } from '../components/SkeletonCard';
import { FaMapMarkedAlt, FaLayerGroup, FaImage, FaExclamationCircle } from 'react-icons/fa';
import { Link } from 'react-router-dom';

// Fix Leaflet default marker icons for Vite bundling
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const createCategoryIcon = (color) =>
    L.divIcon({
        className: '',
        html: `<div style="
            width:34px;height:34px;border-radius:50% 50% 50% 0;
            background:${color};border:3px solid white;
            box-shadow:0 4px 12px rgba(0,0,0,0.35);
            transform:rotate(-45deg);
        "></div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
        popupAnchor: [0, -34],
    });

const MapView = () => {
    const [allIssues, setAllIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categoryFilter, setCategoryFilter] = useState('all');

    useEffect(() => {
        const unsub = subscribeToIssues((issues) => {
            setAllIssues(issues);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const withCoords = allIssues.filter(i =>
        i.coordinates?.lat && i.coordinates?.lng &&
        (categoryFilter === 'all' || i.category === categoryFilter)
    );

    const withoutCoords = allIssues.filter(i =>
        (!i.coordinates?.lat || !i.coordinates?.lng) &&
        (categoryFilter === 'all' || i.category === categoryFilter)
    );

    if (loading) return <SkeletonPage count={2} />;

    return (
        <div className="bg-slate-50 min-h-screen pb-12">
            {/* Top Page Banner */}
            <div className="bg-gradient-to-r from-teal-900 via-teal-700 to-blue-700 text-white py-10 px-4 sm:px-6 shadow-md mb-8">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 bg-white/15 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md mb-2">
                            <span>🗺️ Geospatial Civic Heatmap</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Geographic Issue Map</h1>
                        <p className="text-teal-100 text-sm mt-1 max-w-xl">
                            Visual geographic spread of community reports across wards and zones. Click clusters to zoom in.
                        </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-3 text-center">
                        <p className="text-xs font-medium text-teal-100">Mapped Issues</p>
                        <p className="text-2xl font-black text-white">{withCoords.length}</p>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
                {/* Filter Chips Card */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                        <FaLayerGroup className="text-teal-600" size={14} />
                        <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Filter By Department</span>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={() => setCategoryFilter('all')}
                            className={`text-xs px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                                categoryFilter === 'all'
                                    ? 'bg-teal-700 text-white shadow-sm'
                                    : 'bg-slate-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                            }`}
                        >
                            All Categories ({allIssues.length})
                        </button>
                        {ISSUE_CATEGORIES.map(cat => {
                            const isSelected = categoryFilter === cat.id;
                            const count = allIssues.filter(i => i.category === cat.id).length;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setCategoryFilter(cat.id)}
                                    className={`flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                                        isSelected
                                            ? 'text-white shadow-sm'
                                            : 'bg-white text-gray-700 hover:bg-slate-50 border border-gray-300'
                                    }`}
                                    style={isSelected ? { backgroundColor: cat.color } : {}}
                                >
                                    <span>{cat.icon}</span>
                                    <span>{cat.label}</span>
                                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Map Container */}
                <div className="bg-white rounded-3xl overflow-hidden border border-gray-300 shadow-lg p-1">
                    <div className="rounded-2xl overflow-hidden" style={{ height: '540px' }}>
                        <MapContainer
                            center={[22.5726, 88.3639]} // Kolkata
                            zoom={12}
                            style={{ height: '100%', width: '100%' }}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <MarkerClusterGroup chunkedLoading>
                                {withCoords.map(issue => {
                                    const cat = getCategoryById(issue.category);
                                    const status = getStatusMeta(issue.status);
                                    return (
                                        <Marker
                                            key={issue.id}
                                            position={[issue.coordinates.lat, issue.coordinates.lng]}
                                            icon={createCategoryIcon(cat.color)}
                                        >
                                            <Popup>
                                                <div className="p-1 min-w-[220px]">
                                                    <div className="flex items-center justify-between gap-2 mb-1.5">
                                                        <span className="text-xs font-bold text-gray-700">{cat.icon} {cat.label}</span>
                                                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${status.bg} ${status.text}`}>
                                                            {status.label}
                                                        </span>
                                                    </div>
                                                    <p className="font-extrabold text-sm text-gray-900 mb-1 leading-snug">
                                                        {issue.title || issue.description?.slice(0, 60)}
                                                    </p>
                                                    <p className="text-xs text-gray-600 font-medium mb-1">📍 {issue.location}</p>
                                                    <p className="text-xs text-gray-400 mb-2">🕒 {timeAgo(issue.createdAt)}</p>

                                                    {issue.photoURLs?.length > 0 && (
                                                        <img
                                                            src={issue.photoURLs[0]}
                                                            alt=""
                                                            className="w-full h-24 object-cover rounded-lg mb-2 border border-gray-200"
                                                        />
                                                    )}

                                                    <Link
                                                        to="/track"
                                                        className="block text-center text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 py-1.5 rounded-lg"
                                                    >
                                                        View in Public Feed →
                                                    </Link>
                                                </div>
                                            </Popup>
                                        </Marker>
                                    );
                                })}
                            </MarkerClusterGroup>
                        </MapContainer>
                    </div>
                </div>

                {/* Issues without GPS coordinates fallback */}
                {withoutCoords.length > 0 && (
                    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <FaExclamationCircle className="text-amber-500" size={16} />
                            <h3 className="font-bold text-gray-800 text-sm">
                                Non-GPS Tagged Reports ({withoutCoords.length})
                            </h3>
                        </div>
                        <p className="text-xs text-gray-500 mb-4">
                            These issues were submitted with text address only. Use Auto-GPS when reporting for pin placement.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {withoutCoords.slice(0, 6).map(issue => {
                                const cat = getCategoryById(issue.category);
                                const status = getStatusMeta(issue.status);
                                return (
                                    <div key={issue.id} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-gray-200">
                                        <div className="min-w-0 pr-2">
                                            <p className="text-sm font-bold text-gray-800 truncate">
                                                {cat.icon} {issue.title || issue.description?.slice(0, 60)}
                                            </p>
                                            <p className="text-xs text-gray-500 font-medium truncate">📍 {issue.location}</p>
                                        </div>
                                        <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold whitespace-nowrap ${status.bg} ${status.text}`}>
                                            {status.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MapView;
