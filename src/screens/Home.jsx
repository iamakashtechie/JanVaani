import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { subscribeToIssues } from '../services/issueService';
import { getCategoryById, getStatusMeta, ISSUE_CATEGORIES } from '../config/categories';
import { timeAgo } from '../utils/formatDate';
import {
    FaArrowRight, FaFileAlt, FaMapMarkedAlt, FaChartLine,
    FaCheckCircle, FaExclamationCircle, FaBolt, FaUsers,
    FaThumbsUp, FaShieldAlt
} from 'react-icons/fa';

/* ─── Animated counter ─────────────────────────────────────────── */
const useCountUp = (target, duration = 1200) => {
    const [value, setValue] = useState(0);
    const rafRef = useRef(null);

    useEffect(() => {
        if (target === 0) return;
        const start = performance.now();
        const step = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
            setValue(Math.floor(eased * target));
            if (progress < 1) rafRef.current = requestAnimationFrame(step);
        };
        rafRef.current = requestAnimationFrame(step);
        return () => cancelAnimationFrame(rafRef.current);
    }, [target, duration]);

    return value;
};

/* ─── Stat Card with animated counter ──────────────────────────── */
const StatCard = ({ label, value, icon: Icon, gradient, suffix = '' }) => {
    const animatedVal = useCountUp(value);
    return (
        <div className={`relative overflow-hidden rounded-2xl p-5 text-white ${gradient} shadow-lg`}>
            {/* Decorative circle */}
            <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />
            <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                    <div className="bg-white/20 p-2.5 rounded-xl">
                        <Icon size={20} className="text-white" />
                    </div>
                </div>
                <p className="text-3xl font-extrabold tracking-tight text-white">
                    {animatedVal.toLocaleString('en-IN')}{suffix}
                </p>
                <p className="text-sm font-medium text-white/90 mt-0.5">{label}</p>
            </div>
        </div>
    );
};

/* ─── Recent issue card ─────────────────────────────────────────── */
const RecentIssueCard = ({ issue, index }) => {
    const category = getCategoryById(issue.category);
    const status = getStatusMeta(issue.status);
    return (
        <div
            className="group bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            style={{ animationDelay: `${index * 100}ms` }}
        >
            {/* Category chip */}
            <div className="flex items-center justify-between mb-3">
                <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full text-white"
                    style={{ backgroundColor: category.color }}
                >
                    {category.icon} {category.label}
                </span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${status.bg} ${status.text}`}>
                    {status.label}
                </span>
            </div>

            {/* Title */}
            <p className="font-bold text-gray-800 text-sm leading-snug line-clamp-2 mb-3 group-hover:text-blue-600 transition-colors">
                {issue.title || issue.description?.slice(0, 70)}
            </p>

            {/* Footer */}
            <div className="flex items-center gap-3 text-xs text-gray-500 pt-3 border-t border-gray-100">
                <span className="truncate">📍 {issue.location}</span>
                <span className="ml-auto whitespace-nowrap">🕒 {timeAgo(issue.createdAt)}</span>
            </div>
        </div>
    );
};

/* ─── Category pill strip ────────────────────────────────────────── */
const CategoryStrip = () => (
    <div className="flex gap-2 flex-wrap justify-center">
        {ISSUE_CATEGORIES.map(cat => (
            <Link
                key={cat.id}
                to={`/track`}
                className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-full border border-gray-200 bg-white text-gray-700 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50/50 transition-all hover:shadow-sm"
            >
                <span>{cat.icon}</span> {cat.label}
            </Link>
        ))}
    </div>
);

/* ─── Main Home ──────────────────────────────────────────────────── */
const Home = () => {
    const [recentIssues, setRecentIssues] = useState([]);
    const [stats, setStats] = useState({ total: 0, resolved: 0, pending: 0, inProgress: 0 });

    useEffect(() => {
        const unsub = subscribeToIssues((issues) => {
            setRecentIssues(issues.slice(0, 3));
            const total = issues.length;
            const resolved = issues.filter(i => i.status === 'resolved').length;
            const pending = issues.filter(i => i.status === 'pending').length;
            const inProgress = issues.filter(i => i.status === 'in-progress').length;
            setStats({ total, resolved, pending, inProgress });
        });
        return () => unsub();
    }, []);

    const resolutionRate = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0;

    return (
        <div className="bg-slate-50 min-h-screen">

            {/* ── HERO ─────────────────────────────────────────────── */}
            <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-600 to-sky-500">
                {/* Animated blobs */}
                <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/10 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-300/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl pointer-events-none" />

                {/* Grid pattern overlay */}
                <div
                    className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px),
                                          linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)`,
                        backgroundSize: '48px 48px',
                    }}
                />

                <div className="relative max-w-5xl mx-auto px-4 py-16 sm:py-24 text-center text-white">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-4 py-1.5 text-xs font-semibold mb-6 text-white shadow-sm">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                        Live · Citizen-Powered Platform
                    </div>

                    <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-4 leading-none text-white drop-shadow-sm">
                        Jan<span className="text-sky-200">Vaani</span>
                    </h1>
                    <p className="text-xl sm:text-2xl font-semibold text-blue-100 mb-3">
                        जनवाणी — People's Voice
                    </p>
                    <p className="text-base sm:text-lg text-blue-100/90 max-w-xl mx-auto mb-10 leading-relaxed font-normal">
                        Report civic issues, track resolutions, and hold authorities accountable — all in one place.
                    </p>

                    {/* CTA buttons */}
                    <div className="flex flex-col sm:flex-row gap-3.5 justify-center mb-12">
                        <Link
                            to="/report"
                            className="group inline-flex items-center justify-center gap-2.5 bg-white text-blue-700 font-bold px-8 py-3.5 rounded-xl hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 text-sm cursor-pointer"
                        >
                            <FaFileAlt size={16} className="text-blue-700" />
                            <span>Report an Issue</span>
                            <FaArrowRight size={13} className="text-blue-700 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link
                            to="/track"
                            className="inline-flex items-center justify-center gap-2.5 bg-blue-950/40 backdrop-blur-md border-2 border-white/40 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-blue-900/60 hover:border-white transition-all text-sm shadow-md cursor-pointer"
                        >
                            <FaChartLine size={16} className="text-white" />
                            <span>Track Progress</span>
                        </Link>
                        <Link
                            to="/map"
                            className="inline-flex items-center justify-center gap-2.5 bg-blue-950/40 backdrop-blur-md border-2 border-white/40 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-blue-900/60 hover:border-white transition-all text-sm shadow-md cursor-pointer"
                        >
                            <FaMapMarkedAlt size={16} className="text-white" />
                            <span>View Map</span>
                        </Link>
                    </div>

                    {/* Inline mini stats inside hero */}
                    <div className="flex flex-wrap justify-center gap-6 text-white text-sm font-medium">
                        <span className="flex items-center gap-1.5 bg-black/15 px-3 py-1 rounded-full backdrop-blur-sm">
                            <FaUsers size={14} className="text-sky-300" />
                            {stats.total.toLocaleString('en-IN')} issues reported
                        </span>
                        <span className="flex items-center gap-1.5 bg-black/15 px-3 py-1 rounded-full backdrop-blur-sm">
                            <FaCheckCircle size={14} className="text-emerald-300" />
                            {stats.resolved.toLocaleString('en-IN')} resolved
                        </span>
                        <span className="flex items-center gap-1.5 bg-black/15 px-3 py-1 rounded-full backdrop-blur-sm">
                            <FaBolt size={14} className="text-amber-300" />
                            {resolutionRate}% resolution rate
                        </span>
                    </div>
                </div>

                {/* Wave divider */}
                <div className="relative h-12 -mb-px">
                    <svg viewBox="0 0 1440 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute bottom-0 w-full" preserveAspectRatio="none">
                        <path d="M0 48L60 42.7C120 37.3 240 26.7 360 21.3C480 16 600 16 720 21.3C840 26.7 960 37.3 1080 37.3C1200 37.3 1320 26.7 1380 21.3L1440 16V48H0Z" fill="#f8fafc" />
                    </svg>
                </div>
            </section>

            <div className="max-w-5xl mx-auto px-4">

                {/* ── STATS CARDS ──────────────────────────────────── */}
                <section className="pt-8 pb-4">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            label="Total Issues Reported"
                            value={stats.total}
                            icon={FaExclamationCircle}
                            gradient="bg-gradient-to-br from-blue-600 to-blue-800"
                        />
                        <StatCard
                            label="Successfully Resolved"
                            value={stats.resolved}
                            icon={FaCheckCircle}
                            gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
                        />
                        <StatCard
                            label="Currently Pending"
                            value={stats.pending}
                            icon={FaBolt}
                            gradient="bg-gradient-to-br from-amber-500 to-orange-600"
                        />
                        <StatCard
                            label="Resolution Rate"
                            value={resolutionRate}
                            suffix="%"
                            icon={FaShieldAlt}
                            gradient="bg-gradient-to-br from-violet-600 to-purple-800"
                        />
                    </div>
                </section>

                {/* ── CATEGORY STRIP ───────────────────────────────── */}
                <section className="py-6">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest text-center mb-3">Browse by Category</p>
                    <CategoryStrip />
                </section>

                {/* ── HOW IT WORKS ─────────────────────────────────── */}
                <section className="py-4 mb-6">
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200 relative overflow-hidden">
                        <div className="text-center mb-8">
                            <span className="text-xs font-bold text-blue-700 uppercase tracking-widest bg-blue-100 px-3 py-1 rounded-full">Process</span>
                            <h2 className="text-2xl font-extrabold text-gray-800 mt-3">How JanVaani Works</h2>
                            <p className="text-gray-600 text-sm mt-1">Simple. Transparent. Effective.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative">
                            {[
                                {
                                    num: '01',
                                    icon: FaFileAlt,
                                    title: 'Report an Issue',
                                    desc: 'Submit a civic problem with title, category, photos, and your precise GPS location.',
                                    color: 'from-blue-500 to-blue-600',
                                },
                                {
                                    num: '02',
                                    icon: FaThumbsUp,
                                    title: 'Community Upvotes',
                                    desc: 'Citizens vote on issues to signal priority. High-vote issues get faster attention.',
                                    color: 'from-violet-500 to-violet-600',
                                },
                                {
                                    num: '03',
                                    icon: FaCheckCircle,
                                    title: 'Authority Resolves',
                                    desc: 'Local authorities track, respond, and resolve issues. You get notified on every update.',
                                    color: 'from-emerald-500 to-emerald-600',
                                },
                            ].map(({ num, icon: Icon, title, desc, color }) => (
                                <div key={num} className="flex flex-col items-center text-center p-4 relative">
                                    <div className="relative mb-4">
                                        <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
                                            <Icon size={28} className="text-white" />
                                        </div>
                                        <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white border-2 border-gray-200 text-xs font-black text-gray-700 flex items-center justify-center shadow-sm">
                                            {num.slice(1)}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-gray-800 mb-2 text-base">{title}</h3>
                                    <p className="text-sm text-gray-600 leading-relaxed max-w-xs">{desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── RECENT ISSUES ────────────────────────────────── */}
                {recentIssues.length > 0 && (
                    <section className="pb-6">
                        <div className="flex items-end justify-between mb-5">
                            <div>
                                <span className="text-xs font-bold text-blue-700 uppercase tracking-widest bg-blue-100 px-3 py-1 rounded-full">Live Feed</span>
                                <h2 className="text-2xl font-extrabold text-gray-800 mt-2">Recent Issues</h2>
                            </div>
                            <Link
                                to="/track"
                                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors group cursor-pointer"
                            >
                                View all
                                <FaArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {recentIssues.map((issue, i) => (
                                <RecentIssueCard key={issue.id} issue={issue} index={i} />
                            ))}
                        </div>
                    </section>
                )}

                {/* ── CTA BANNER ────────────────────────────────────── */}
                <section className="pb-10">
                    <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-gray-900 to-gray-800 p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
                        <div className="relative text-white">
                            <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">Make a Difference</p>
                            <h3 className="text-2xl sm:text-3xl font-extrabold leading-tight text-white">
                                Spot a problem in<br className="hidden sm:block" /> your neighbourhood?
                            </h3>
                            <p className="text-gray-300 text-sm mt-2">
                                Takes less than 2 minutes to report. Every report counts.
                            </p>
                        </div>
                        <Link
                            to="/report"
                            className="relative flex-shrink-0 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all text-sm cursor-pointer"
                        >
                            <FaFileAlt size={16} />
                            <span>Report Now</span>
                            <FaArrowRight size={13} />
                        </Link>
                    </div>
                </section>

            </div>
        </div>
    );
};

export default Home;
