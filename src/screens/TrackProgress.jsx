import { useState, useEffect } from 'react';
import {
    FaThumbsUp, FaThumbsDown, FaSearch, FaFilter,
    FaUser, FaSortAmountDown, FaCheckCircle, FaExclamationTriangle,
    FaImage, FaMapMarkerAlt, FaCommentDots, FaArrowRight
} from 'react-icons/fa';
import { subscribeToIssues } from '../services/issueService';
import { handleVote, getVoteCounts, getUserVote } from '../services/voteService';
import { useAuth } from '../context/AuthContext';
import { ISSUE_CATEGORIES, getCategoryById, getStatusMeta } from '../config/categories';
import { timeAgo, formatToIST } from '../utils/formatDate';
import { SkeletonPage } from '../components/SkeletonCard';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const STATUSES = [
    { id: 'all', label: 'All Issues' },
    { id: 'pending', label: 'Pending' },
    { id: 'in-progress', label: 'In Progress' },
    { id: 'resolved', label: 'Resolved' }
];

const PAGE_SIZE = 8;

/**
 * Expandable description component that truncates long text and shows a "Read more" / "Read less" toggle.
 */
const ExpandableDescription = ({ text, maxChars = 130 }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!text) return null;
    const isLong = text.length > maxChars;

    return (
        <div className="text-sm text-gray-700 leading-relaxed">
            <span>
                {isLong && !isExpanded ? `${text.slice(0, maxChars)}... ` : text}
            </span>
            {isLong && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsExpanded(!isExpanded);
                    }}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 ml-1 inline-flex items-center cursor-pointer hover:underline"
                >
                    {isExpanded ? 'Read less' : 'Read more'}
                </button>
            )}
        </div>
    );
};

const IssueCard = ({ issue, user }) => {
    const [voteData, setVoteData] = useState({ upvotes: 0, downvotes: 0 });
    const [userVote, setUserVote] = useState(null);
    const [expanded, setExpanded] = useState(false);
    const [voteLoading, setVoteLoading] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const category = getCategoryById(issue.category);
    const status = getStatusMeta(issue.status);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            const [counts, uv] = await Promise.all([
                getVoteCounts(issue.id),
                user ? getUserVote(issue.id, user.uid) : null,
            ]);
            if (!cancelled) { setVoteData(counts); setUserVote(uv); }
        };
        load();
        return () => { cancelled = true; };
    }, [issue.id, user]);

    const handleVoteClick = async (voteType) => {
        if (!user) { toast.error('Please log in to vote.'); return; }
        if (voteLoading) return;
        setVoteLoading(true);
        try {
            const result = await handleVote(issue.id, user.uid, voteType);
            const newCounts = await getVoteCounts(issue.id);
            setVoteData(newCounts);
            setUserVote(result === 'removed' ? null : result);
            toast.success(result === 'removed' ? 'Vote removed' : `${voteType === 'upvote' ? '👍 Upvoted' : '👎 Downvoted'}`);
        } catch {
            toast.error('Failed to register vote.');
        } finally {
            setVoteLoading(false);
        }
    };

    const totalVotes = voteData.upvotes + voteData.downvotes;
    const upvoteRatio = totalVotes > 0 ? Math.round((voteData.upvotes / totalVotes) * 100) : 0;

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
            <div className="p-5">
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                        <span
                            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full text-white shadow-xs"
                            style={{ backgroundColor: category.color }}
                        >
                            <span>{category.icon}</span>
                            <span>{category.label}</span>
                        </span>
                        {issue.photoURLs?.length > 0 && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                <FaImage size={10} /> {issue.photoURLs.length}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-bold ${status.bg} ${status.text}`}>
                            {issue.status === 'in-progress' && (
                                <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                            )}
                            {status.label}
                        </span>
                    </div>
                </div>

                {/* Title */}
                <h3
                    onClick={() => setExpanded(!expanded)}
                    className="font-extrabold text-gray-900 text-base sm:text-lg mb-2 cursor-pointer hover:text-blue-600 transition-colors leading-snug"
                >
                    {issue.title || issue.description?.slice(0, 80)}
                </h3>

                {/* Description with "Read more" toggle */}
                {issue.description && (
                    <div className="mb-3">
                        <ExpandableDescription text={issue.description} maxChars={130} />
                    </div>
                )}

                {/* Meta details */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500 font-medium pt-1 border-t border-gray-50">
                    <span className="flex items-center gap-1 text-gray-700">
                        <FaMapMarkerAlt className="text-blue-600" /> {issue.location}
                    </span>
                    <span className="flex items-center gap-1">
                        <FaUser size={11} className="text-gray-400" /> {issue.userName || issue.userEmail?.split('@')[0]}
                    </span>
                    <span>🕒 {timeAgo(issue.createdAt)}</span>
                </div>
            </div>

            {/* Expanded section (Photos & Official Authority Responses) */}
            {expanded && (
                <div className="px-5 pb-5 border-t border-gray-100 pt-4 bg-slate-50/60 animate-fade-in space-y-4">
                    {/* Full Photos gallery */}
                    {issue.photoURLs?.length > 0 && (
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Attached Photos ({issue.photoURLs.length})</p>
                            <div className="flex gap-3 overflow-x-auto pb-2">
                                {issue.photoURLs.map((url, i) => (
                                    <img
                                        key={i}
                                        src={url}
                                        alt={`Evidence ${i + 1}`}
                                        onClick={() => setSelectedPhoto(url)}
                                        className="w-32 h-24 object-cover rounded-xl border border-gray-300 flex-shrink-0 shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Authority Note Card */}
                    {issue.adminNote && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-xs">
                            <div className="flex items-center gap-2 text-blue-800 font-bold text-xs mb-1">
                                <FaCommentDots size={14} />
                                <span>Official Authority Response</span>
                            </div>
                            <p className="text-xs sm:text-sm text-blue-900 font-medium leading-relaxed">{issue.adminNote}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Voting & Action Footer */}
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-white">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleVoteClick('upvote')}
                        disabled={voteLoading}
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            userVote === 'upvote'
                                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300'
                                : 'bg-slate-100 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300'
                        }`}
                    >
                        <FaThumbsUp size={12} />
                        <span>{voteData.upvotes}</span>
                    </button>
                    <button
                        onClick={() => handleVoteClick('downvote')}
                        disabled={voteLoading}
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            userVote === 'downvote'
                                ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-300'
                                : 'bg-slate-100 text-gray-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300'
                        }`}
                    >
                        <FaThumbsDown size={12} />
                        <span>{voteData.downvotes}</span>
                    </button>

                    {totalVotes > 0 && (
                        <span className="hidden sm:inline-block text-xs font-semibold text-gray-500 ml-1">
                            {upvoteRatio}% community approval
                        </span>
                    )}
                </div>

                <button
                    onClick={() => setExpanded(!expanded)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer px-2 py-1 rounded-lg hover:bg-blue-50"
                >
                    {expanded ? 'Hide Photos ▲' : 'View Photos & Notes ▼'}
                </button>
            </div>

            {/* Photo Lightbox Modal */}
            {selectedPhoto && (
                <div
                    className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedPhoto(null)}
                >
                    <div className="relative max-w-3xl max-h-[90vh]">
                        <img src={selectedPhoto} alt="Zoomed view" className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl" />
                        <button
                            onClick={() => setSelectedPhoto(null)}
                            className="absolute top-3 right-3 bg-white/20 hover:bg-white text-black hover:text-black rounded-full p-2 backdrop-blur-md"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const TrackProgress = () => {
    const [allIssues, setAllIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const [myIssuesOnly, setMyIssuesOnly] = useState(false);
    const [page, setPage] = useState(1);
    const { user } = useAuth();

    useEffect(() => {
        const unsub = subscribeToIssues((issues) => {
            setAllIssues(issues);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    useEffect(() => { setPage(1); }, [search, statusFilter, categoryFilter, myIssuesOnly, sortBy]);

    let filtered = allIssues.filter(issue => {
        const matchSearch = !search ||
            issue.title?.toLowerCase().includes(search.toLowerCase()) ||
            issue.description?.toLowerCase().includes(search.toLowerCase()) ||
            issue.location?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'all' || issue.status === statusFilter;
        const matchCat = categoryFilter === 'all' || issue.category === categoryFilter;
        const matchUser = !myIssuesOnly || issue.userId === user?.uid;
        return matchSearch && matchStatus && matchCat && matchUser;
    });

    if (sortBy === 'newest') {
        filtered.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    } else if (sortBy === 'oldest') {
        filtered.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
    }

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    if (loading) return <SkeletonPage count={5} />;

    return (
        <div className="bg-slate-50 min-h-screen pb-12">
            {/* Top Search Hero */}
            <div className="bg-gradient-to-r from-blue-900 via-blue-700 to-sky-600 text-white py-10 px-4 sm:px-6 shadow-md mb-8">
                <div className="max-w-5xl mx-auto">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                        <div>
                            <div className="inline-flex items-center gap-2 bg-white/15 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md mb-2">
                                <span>🔍 Public Civic Feed</span>
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Track Progress</h1>
                            <p className="text-blue-100 text-sm mt-1">
                                Real-time feed of all citizen complaints and municipal resolutions.
                            </p>
                        </div>

                        <Link
                            to="/report"
                            className="bg-white text-blue-700 hover:bg-blue-50 font-bold px-6 py-2.5 rounded-xl text-sm shadow-md transition-transform hover:-translate-y-0.5 cursor-pointer whitespace-nowrap"
                        >
                            + Report an Issue
                        </Link>
                    </div>

                    {/* Integrated Search Bar */}
                    <div className="relative max-w-2xl">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by keywords, street, colony or problem type..."
                            className="w-full pl-11 pr-4 py-3.5 bg-white text-gray-800 placeholder-gray-400 rounded-2xl text-sm font-medium shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-300/50"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold bg-gray-100 rounded-full w-5 h-5 flex items-center justify-center"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6">
                {/* Filter & Control Bar */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-6 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        {/* Status Tabs */}
                        <div className="flex gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-gray-200 overflow-x-auto">
                            {STATUSES.map(s => {
                                const count = s.id === 'all'
                                    ? allIssues.length
                                    : allIssues.filter(i => i.status === s.id).length;
                                return (
                                    <button
                                        key={s.id}
                                        onClick={() => setStatusFilter(s.id)}
                                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                                            statusFilter === s.id
                                                ? 'bg-blue-600 text-white shadow-xs'
                                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
                                        }`}
                                    >
                                        <span>{s.label}</span>
                                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${statusFilter === s.id ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Controls */}
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Category dropdown */}
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="border border-gray-300 rounded-xl text-xs px-3 py-2 text-gray-700 bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            >
                                <option value="all">All Categories</option>
                                {ISSUE_CATEGORIES.map(c => (
                                    <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                                ))}
                            </select>

                            {/* Sort dropdown */}
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="border border-gray-300 rounded-xl text-xs px-3 py-2 text-gray-700 bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            >
                                <option value="newest">Sort: Newest First</option>
                                <option value="oldest">Sort: Oldest First</option>
                            </select>

                            {/* My issues button */}
                            {user && (
                                <button
                                    onClick={() => setMyIssuesOnly(!myIssuesOnly)}
                                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                        myIssuesOnly
                                            ? 'bg-blue-600 text-white shadow-xs'
                                            : 'bg-slate-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                                    }`}
                                >
                                    <FaUser size={10} />
                                    <span>My Issues</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Results Count Banner */}
                <div className="flex items-center justify-between mb-4 px-1">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Showing {paginated.length} of {filtered.length} issues
                    </p>
                    {(search || statusFilter !== 'all' || categoryFilter !== 'all' || myIssuesOnly) && (
                        <button
                            onClick={() => { setSearch(''); setStatusFilter('all'); setCategoryFilter('all'); setMyIssuesOnly(false); }}
                            className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                        >
                            Reset all filters
                        </button>
                    )}
                </div>

                {/* Issues List */}
                {paginated.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
                        <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
                            <FaFilter size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">No issues found matching your filters</h3>
                        <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                            Try broadening your search term or selecting "All Issues" to see all reports.
                        </p>
                        <button
                            onClick={() => { setSearch(''); setStatusFilter('all'); setCategoryFilter('all'); setMyIssuesOnly(false); }}
                            className="mt-5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
                        >
                            Clear Filters
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {paginated.map(issue => (
                            <IssueCard key={issue.id} issue={issue} user={user} />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 transition-colors cursor-pointer shadow-xs"
                        >
                            ← Previous
                        </button>
                        <span className="text-xs font-extrabold text-gray-700 px-3">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40 transition-colors cursor-pointer shadow-xs"
                        >
                            Next →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrackProgress;