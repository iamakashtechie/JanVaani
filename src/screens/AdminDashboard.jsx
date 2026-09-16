import { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { updateIssueStatus } from '../services/issueService';
import { createStatusNotification } from '../services/notificationService';
import { getCategoryById, getStatusMeta, ISSUE_CATEGORIES } from '../config/categories';
import { timeAgo, formatToIST } from '../utils/formatDate';
import { SkeletonPage } from '../components/SkeletonCard';
import {
    FaUserShield, FaCheckCircle, FaSpinner, FaClock,
    FaExclamationCircle, FaSearch, FaCommentAlt, FaMapMarkerAlt,
    FaUser, FaImage
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
    { id: 'pending', label: 'Pending', color: 'bg-amber-100 text-amber-800 border-amber-300' },
    { id: 'in-progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800 border-blue-300' },
    { id: 'resolved', label: 'Resolved', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    { id: 'escalated', label: 'Escalated', color: 'bg-rose-100 text-rose-800 border-rose-300' },
];

const NOTE_TEMPLATES = [
    "Field inspection completed. Work order issued to ward team.",
    "Assigned to municipal contractor for immediate repair.",
    "Issue resolved & verified on-site by municipal inspector.",
    "Material dispatched; repair scheduled within 48 hours."
];

const AdminCard = ({ issue }) => {
    const [note, setNote] = useState(issue.adminNote || '');
    const [saving, setSaving] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const category = getCategoryById(issue.category);
    const status = getStatusMeta(issue.status);

    const handleStatusChange = async (newStatus) => {
        if (newStatus === issue.status) return;
        setSaving(true);
        try {
            await updateIssueStatus(issue.id, newStatus, note);
            await createStatusNotification(issue, newStatus);
            toast.success(`Status updated to "${newStatus.toUpperCase()}"! Citizen notified.`);
        } catch {
            toast.error('Failed to update status.');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveNote = async () => {
        setSaving(true);
        try {
            await updateIssueStatus(issue.id, issue.status, note);
            toast.success('Authority response note published!');
        } catch {
            toast.error('Failed to save note.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
            <div className="p-5">
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <span
                        className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full text-white shadow-2xs"
                        style={{ backgroundColor: category.color }}
                    >
                        <span>{category.icon}</span>
                        <span>{category.label}</span>
                    </span>

                    <span className={`text-xs px-3 py-1 rounded-full font-extrabold ${status.bg} ${status.text}`}>
                        {status.label}
                    </span>
                </div>

                <h3
                    className="font-extrabold text-gray-900 text-base mb-2 cursor-pointer hover:text-blue-600 transition-colors leading-snug"
                    onClick={() => setExpanded(!expanded)}
                >
                    {issue.title || issue.description?.slice(0, 80)}
                </h3>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 font-medium">
                    <span className="flex items-center gap-1 text-gray-700">
                        <FaMapMarkerAlt className="text-blue-600" /> {issue.location}
                    </span>
                    <span className="flex items-center gap-1">
                        <FaUser size={10} className="text-gray-400" /> {issue.userName || issue.userEmail}
                    </span>
                    <span>🕒 {timeAgo(issue.createdAt)}</span>
                </div>
            </div>

            {/* Expanded section with photos & details */}
            {expanded && (
                <div className="px-5 pb-4 border-t border-gray-100 pt-4 bg-slate-50/70 space-y-3">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Citizen Description</p>
                        <p className="text-sm text-gray-700 leading-relaxed">{issue.description}</p>
                    </div>

                    {issue.photoURLs?.length > 0 && (
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Evidence Photos ({issue.photoURLs.length})</p>
                            <div className="flex gap-3 overflow-x-auto pb-2">
                                {issue.photoURLs.map((url, i) => (
                                    <img key={i} src={url} alt="" className="w-28 h-20 object-cover rounded-xl border border-gray-300 flex-shrink-0 shadow-xs" />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Authority Action Panel */}
            <div className="px-5 pb-5 pt-3 border-t border-gray-100 bg-white space-y-3">
                {/* Status Triage Buttons */}
                <div>
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Update Lifecycle State</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {STATUS_OPTIONS.map(s => {
                            const isCurrent = issue.status === s.id;
                            return (
                                <button
                                    key={s.id}
                                    onClick={() => handleStatusChange(s.id)}
                                    disabled={saving}
                                    className={`text-xs px-3 py-2 rounded-xl font-bold transition-all cursor-pointer text-center ${
                                        isCurrent
                                            ? `${s.color} border-2 shadow-xs`
                                            : 'bg-slate-50 text-gray-600 hover:bg-slate-100 border border-gray-200'
                                    }`}
                                >
                                    {isCurrent && '✓ '} {s.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Response Note & Quick Templates */}
                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Citizen Response Note</label>
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="text-xs font-bold text-blue-600 hover:underline"
                        >
                            {expanded ? 'Collapse ▲' : 'Inspect Evidence ▼'}
                        </button>
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Add note for the citizen (e.g. Work order issued)..."
                            className="flex-1 text-xs border border-gray-300 text-gray-800 bg-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={handleSaveNote}
                            disabled={saving}
                            className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl disabled:opacity-60 transition-colors shadow-xs cursor-pointer whitespace-nowrap"
                        >
                            Save Note
                        </button>
                    </div>

                    {/* Quick Template Chips */}
                    <div className="flex gap-1.5 overflow-x-auto mt-2 pb-1">
                        {NOTE_TEMPLATES.map((tmpl, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => setNote(tmpl)}
                                className="text-[10px] font-semibold text-gray-600 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-gray-200 rounded-lg px-2.5 py-1 whitespace-nowrap transition-colors cursor-pointer"
                            >
                                + {tmpl.slice(0, 32)}...
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const AdminDashboard = () => {
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [search, setSearch] = useState('');

    useEffect(() => {
        const q = query(collection(db, 'issues'), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            setIssues(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const filtered = issues.filter(issue => {
        const matchSearch = !search ||
            issue.title?.toLowerCase().includes(search.toLowerCase()) ||
            issue.description?.toLowerCase().includes(search.toLowerCase()) ||
            issue.location?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'all' || issue.status === statusFilter;
        const matchCat = categoryFilter === 'all' || issue.category === categoryFilter;
        return matchSearch && matchStatus && matchCat;
    });

    const counts = issues.reduce((acc, i) => {
        acc[i.status] = (acc[i.status] || 0) + 1;
        return acc;
    }, {});

    if (loading) return <SkeletonPage count={4} />;

    return (
        <div className="bg-slate-50 min-h-screen pb-12">
            {/* Top Command Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white py-10 px-4 sm:px-6 shadow-md mb-8">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 border border-blue-400/30 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md mb-2">
                            <FaUserShield />
                            <span>Municipal Authority Portal</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Officer Command Dashboard</h1>
                        <p className="text-slate-300 text-sm mt-1 max-w-xl">
                            Triage citizen reports, dispatch ward contractors, publish resolution notes, and resolve civic complaints.
                        </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center min-w-[200px]">
                        <p className="text-xs font-medium text-slate-300">Pending Municipal Action</p>
                        <p className="text-3xl font-black text-amber-400">{(counts.pending || 0) + (counts['in-progress'] || 0)}</p>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
                {/* Summary Metrics Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { label: 'All Reports', key: 'all', count: issues.length, color: 'border-slate-300 bg-white text-slate-900' },
                        { label: 'Needs Triage (Pending)', key: 'pending', count: counts.pending || 0, color: 'border-amber-300 bg-amber-50/60 text-amber-900' },
                        { label: 'Work In Progress', key: 'in-progress', count: counts['in-progress'] || 0, color: 'border-blue-300 bg-blue-50/60 text-blue-900' },
                        { label: 'Resolved & Verified', key: 'resolved', count: counts.resolved || 0, color: 'border-emerald-300 bg-emerald-50/60 text-emerald-900' },
                    ].map(({ label, key, count, color }) => (
                        <button
                            key={key}
                            onClick={() => setStatusFilter(key)}
                            className={`rounded-2xl p-4 text-left border-2 transition-all cursor-pointer shadow-xs ${color} ${
                                statusFilter === key ? 'ring-2 ring-blue-600 shadow-md font-bold' : 'hover:shadow-sm'
                            }`}
                        >
                            <p className="text-2xl font-black">{count}</p>
                            <p className="text-xs font-bold mt-0.5">{label}</p>
                        </button>
                    ))}
                </div>

                {/* Filter & Search Bar */}
                <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Filter by keyword, street or citizen..."
                            className="w-full pl-10 pr-4 py-2.5 text-xs text-gray-800 bg-slate-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
                        <select
                            value={categoryFilter}
                            onChange={e => setCategoryFilter(e.target.value)}
                            className="border border-gray-300 rounded-xl text-xs px-3 py-2 text-gray-700 bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        >
                            <option value="all">All Departments</option>
                            {ISSUE_CATEGORIES.map(c => (
                                <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Issue Cards Grid */}
                {filtered.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
                        <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                            <FaCheckCircle size={24} />
                        </div>
                        <h3 className="text-base font-bold text-gray-800">No issues in this queue</h3>
                        <p className="text-xs text-gray-500 mt-1">All complaints matching this filter have been processed!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {filtered.map(issue => (
                            <AdminCard key={issue.id} issue={issue} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;