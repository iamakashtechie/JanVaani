import { useState, useEffect } from 'react';
import { subscribeToIssues } from '../services/issueService';
import { getVoteCounts } from '../services/voteService';
import { ISSUE_CATEGORIES, getStatusMeta } from '../config/categories';
import { SkeletonPage } from '../components/SkeletonCard';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area, CartesianGrid, Legend
} from 'recharts';
import {
    FaChartPie, FaCheckDouble, FaHourglassHalf, FaTrophy,
    FaArrowUp, FaCalendarAlt, FaFire, FaMapMarkerAlt
} from 'react-icons/fa';

const Analytics = () => {
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [topIssues, setTopIssues] = useState([]);

    useEffect(() => {
        const unsub = subscribeToIssues(async (data) => {
            setIssues(data);
            setLoading(false);

            // Fetch top upvoted unresolved issues
            const unresolved = data.filter(i => i.status !== 'resolved').slice(0, 25);
            const withVotes = await Promise.all(
                unresolved.map(async (issue) => {
                    const counts = await getVoteCounts(issue.id);
                    return { ...issue, upvotes: counts.upvotes };
                })
            );
            withVotes.sort((a, b) => b.upvotes - a.upvotes);
            setTopIssues(withVotes.slice(0, 5));
        });
        return () => unsub();
    }, []);

    // --- Derived chart data ---
    const categoryData = ISSUE_CATEGORIES.map(cat => ({
        name: cat.label,
        shortName: cat.label.split(' ')[0],
        icon: cat.icon,
        count: issues.filter(i => i.category === cat.id).length,
        color: cat.color,
    }));

    const statusData = [
        { name: 'Resolved',    value: issues.filter(i => i.status === 'resolved').length,    color: '#10b981' },
        { name: 'In Progress', value: issues.filter(i => i.status === 'in-progress').length, color: '#3b82f6' },
        { name: 'Pending',     value: issues.filter(i => i.status === 'pending').length,     color: '#f59e0b' },
        { name: 'Escalated',   value: issues.filter(i => i.status === 'escalated').length,   color: '#ef4444' },
    ].filter(d => d.value > 0);

    const last30Days = Array.from({ length: 30 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (29 - i));
        const label = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
        const dateStr = d.toDateString();
        const count = issues.filter(issue => {
            const created = issue.createdAt?.toDate?.();
            return created && created.toDateString() === dateStr;
        }).length;
        return { label, count };
    });

    if (loading) return <SkeletonPage count={3} />;

    const totalCount = issues.length;
    const resolvedCount = issues.filter(i => i.status === 'resolved').length;
    const pendingCount = issues.filter(i => i.status === 'pending').length;
    const inProgressCount = issues.filter(i => i.status === 'in-progress').length;
    const resolutionRate = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0;

    return (
        <div className="bg-slate-50 min-h-screen pb-12">
            {/* Top Page Banner */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-800 to-sky-700 text-white py-10 px-4 sm:px-6 shadow-md mb-8">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 bg-white/15 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md mb-2">
                            <span>📊 City Intelligence & Metrics</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Civic Analytics</h1>
                        <p className="text-blue-100 text-sm mt-1 max-w-xl">
                            Live data insights into municipal response times, category distributions, and community issue prioritization.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-xl text-xs font-semibold text-blue-100">
                        <FaCalendarAlt />
                        <span>Real-time Sync Active</span>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Reports</span>
                            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl"><FaChartPie size={16} /></span>
                        </div>
                        <p className="text-3xl font-black text-gray-900 mt-2">{totalCount.toLocaleString('en-IN')}</p>
                        <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1 mt-1">
                            <FaArrowUp size={10} /> 100% transparent
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Resolved</span>
                            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><FaCheckDouble size={16} /></span>
                        </div>
                        <p className="text-3xl font-black text-emerald-600 mt-2">{resolvedCount.toLocaleString('en-IN')}</p>
                        <p className="text-xs font-semibold text-gray-500 mt-1">
                            Verified by authority
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">In Progress</span>
                            <span className="p-2 bg-amber-50 text-amber-600 rounded-xl"><FaHourglassHalf size={16} /></span>
                        </div>
                        <p className="text-3xl font-black text-amber-600 mt-2">{inProgressCount + pendingCount}</p>
                        <p className="text-xs font-semibold text-amber-700 mt-1">
                            {inProgressCount} currently active
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Success Rate</span>
                            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><FaTrophy size={16} /></span>
                        </div>
                        <p className="text-3xl font-black text-indigo-600 mt-2">{resolutionRate}%</p>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${resolutionRate}%` }} />
                        </div>
                    </div>
                </div>

                {/* Primary Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Category Breakdown Bar Chart */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="font-extrabold text-gray-900 text-base">Issues by Category</h3>
                                <p className="text-xs text-gray-500">Distribution across municipal departments</p>
                            </div>
                        </div>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="shortName" tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }} />
                                    <YAxis tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }} allowDecimals={false} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                                    />
                                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                        {categoryData.map((entry, i) => (
                                            <Cell key={i} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Status Distribution Donut */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="font-extrabold text-gray-900 text-base">Resolution Status</h3>
                                <p className="text-xs text-gray-500">Current state of reported problems</p>
                            </div>
                        </div>
                        {statusData.length > 0 ? (
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={statusData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={65}
                                            outerRadius={95}
                                            paddingAngle={4}
                                            dataKey="value"
                                        >
                                            {statusData.map((entry, i) => (
                                                <Cell key={i} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                                            formatter={(v, n) => [`${v} issues`, n]}
                                        />
                                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', fontWeight: '600' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
                                No reported issues yet
                            </div>
                        )}
                    </div>
                </div>

                {/* 30-Day Activity Area Chart */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="font-extrabold text-gray-900 text-base">30-Day Reporting Activity</h3>
                            <p className="text-xs text-gray-500">Citizen submissions timeline over the last month</p>
                        </div>
                    </div>
                    <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={last30Days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="label" tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }} interval={5} />
                                <YAxis tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }} allowDecimals={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#2563eb"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorReports)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Community Priority Leaderboard */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                            <FaFire size={16} />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-gray-900 text-base">Top Community Priority Leaderboard</h3>
                            <p className="text-xs text-gray-500">Most upvoted unresolved civic issues requiring immediate municipal attention</p>
                        </div>
                    </div>

                    {topIssues.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 text-sm font-medium">
                            No community upvotes recorded yet
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {topIssues.map((issue, idx) => {
                                const status = getStatusMeta(issue.status);
                                const medals = ['🥇', '🥈', '🥉'];
                                return (
                                    <div
                                        key={issue.id}
                                        className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-gray-200 hover:bg-blue-50/50 hover:border-blue-300 transition-all"
                                    >
                                        <div className="text-xl font-black w-8 text-center flex-shrink-0">
                                            {medals[idx] || <span className="text-sm text-gray-400 font-bold">#{idx + 1}</span>}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-extrabold text-gray-800 text-sm truncate">
                                                {issue.title || issue.description?.slice(0, 70)}
                                            </p>
                                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5 font-medium">
                                                <FaMapMarkerAlt size={10} className="text-blue-600" /> {issue.location}
                                            </p>
                                        </div>
                                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold whitespace-nowrap ${status.bg} ${status.text}`}>
                                            {status.label}
                                        </span>
                                        <div className="bg-white border border-emerald-300 px-3 py-1.5 rounded-xl font-extrabold text-emerald-700 text-xs shadow-2xs whitespace-nowrap">
                                            👍 {issue.upvotes} Votes
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Analytics;