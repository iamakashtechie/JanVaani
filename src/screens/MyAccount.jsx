import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserProfile, updateUserProfile } from '../services/userService';
import { subscribeToUserIssues } from '../services/issueService';
import { getCategoryById, getStatusMeta } from '../config/categories';
import { formatToIST, timeAgo } from '../utils/formatDate';
import { SkeletonPage } from '../components/SkeletonCard';
import {
    FaEdit, FaCheck, FaTimes, FaKey, FaTrash,
    FaMedal, FaClipboardList, FaCheckCircle, FaHourglassHalf,
    FaShieldAlt, FaUserCircle
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const MyAccount = () => {
    const { user, updateDisplayName, changePassword, deleteAccount } = useAuth();
    const [profile, setProfile] = useState(null);
    const [myIssues, setMyIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('issues'); // 'issues' | 'security'

    // Edit name state
    const [editingName, setEditingName] = useState(false);
    const [newName, setNewName] = useState('');
    const [savingName, setSavingName] = useState(false);

    // Change password state
    const [currentPass, setCurrentPass] = useState('');
    const [newPass, setNewPass] = useState('');
    const [savingPass, setSavingPass] = useState(false);

    // Delete account state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletePass, setDeletePass] = useState('');
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (!user) return;
        getUserProfile(user.uid).then(p => {
            setProfile(p);
            setLoading(false);
        });
        const unsub = subscribeToUserIssues(user.uid, setMyIssues);
        return () => unsub();
    }, [user]);

    const handleSaveName = async () => {
        if (!newName.trim()) return;
        setSavingName(true);
        try {
            await updateDisplayName(newName.trim());
            await updateUserProfile(user.uid, { name: newName.trim() });
            toast.success('Profile name updated!');
            setEditingName(false);
        } catch {
            toast.error('Failed to update name.');
        } finally {
            setSavingName(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (newPass.length < 6) { toast.error('New password must be at least 6 characters.'); return; }
        setSavingPass(true);
        try {
            await changePassword(currentPass, newPass);
            toast.success('Password changed successfully! 🔒');
            setCurrentPass(''); setNewPass('');
        } catch (err) {
            toast.error(err.code === 'auth/invalid-credential'
                ? 'Current password is incorrect.'
                : 'Failed to change password.');
        } finally {
            setSavingPass(false);
        }
    };

    const handleDeleteAccount = async (e) => {
        e.preventDefault();
        setDeleting(true);
        try {
            await deleteAccount(deletePass);
            toast.success('Account permanently deleted.');
        } catch (err) {
            toast.error(err.code === 'auth/invalid-credential'
                ? 'Password is incorrect.'
                : 'Failed to delete account.');
        } finally {
            setDeleting(false);
        }
    };

    if (loading) return <SkeletonPage count={2} />;

    const displayName = user?.displayName || profile?.name || user?.email?.split('@')[0];
    const resolvedCount = myIssues.filter(i => i.status === 'resolved').length;
    const pendingCount = myIssues.filter(i => i.status === 'pending' || i.status === 'in-progress').length;

    return (
        <div className="bg-slate-50 min-h-screen pb-12">
            {/* Top Page Banner */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-800 to-sky-700 text-white py-10 px-4 sm:px-6 shadow-md mb-8">
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border-2 border-white/30 text-white flex items-center justify-center text-3xl font-extrabold uppercase shadow-lg">
                            {displayName?.charAt(0)}
                        </div>
                        <div>
                            <div className="inline-flex items-center gap-1.5 bg-white/15 px-2.5 py-0.5 rounded-full text-xs font-semibold backdrop-blur-md mb-1 text-blue-100">
                                <FaMedal className="text-amber-300" />
                                <span>Active Civic Contributor</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold">{displayName}</h1>
                            <p className="text-blue-100 text-xs mt-0.5">{user?.email}</p>
                        </div>
                    </div>

                    {/* Impact metrics */}
                    <div className="grid grid-cols-3 gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 text-center min-w-[260px]">
                        <div>
                            <p className="text-xl font-black text-white">{myIssues.length}</p>
                            <p className="text-[11px] font-medium text-blue-100">Reported</p>
                        </div>
                        <div className="border-x border-white/20">
                            <p className="text-xl font-black text-emerald-300">{resolvedCount}</p>
                            <p className="text-[11px] font-medium text-blue-100">Resolved</p>
                        </div>
                        <div>
                            <p className="text-xl font-black text-amber-300">{pendingCount}</p>
                            <p className="text-[11px] font-medium text-blue-100">Pending</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
                {/* Tabs Navigation */}
                <div className="flex gap-2 border-b border-gray-200 pb-2">
                    <button
                        onClick={() => setActiveTab('issues')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                            activeTab === 'issues'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                        }`}
                    >
                        <FaClipboardList />
                        <span>My Reported Issues ({myIssues.length})</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                            activeTab === 'security'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                        }`}
                    >
                        <FaShieldAlt />
                        <span>Account & Security</span>
                    </button>
                </div>

                {/* Tab: My Issues */}
                {activeTab === 'issues' && (
                    <div className="space-y-4">
                        {myIssues.length === 0 ? (
                            <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-sm">
                                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                    <FaClipboardList size={22} />
                                </div>
                                <h3 className="text-base font-bold text-gray-800">You haven't reported any issues yet</h3>
                                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto mb-5">
                                    Spot a pothole, broken light or garbage pile? Report it to get it fixed by municipal authorities!
                                </p>
                                <Link
                                    to="/report"
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-colors"
                                >
                                    + Report First Issue
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {myIssues.map(issue => {
                                    const cat = getCategoryById(issue.category);
                                    const status = getStatusMeta(issue.status);
                                    return (
                                        <div key={issue.id} className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
                                            <div className="flex items-start justify-between gap-3 mb-2">
                                                <span
                                                    className="text-xs font-bold px-3 py-1 rounded-full text-white shadow-2xs"
                                                    style={{ backgroundColor: cat.color }}
                                                >
                                                    {cat.icon} {cat.label}
                                                </span>
                                                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${status.bg} ${status.text}`}>
                                                    {status.label}
                                                </span>
                                            </div>

                                            <h4 className="font-extrabold text-gray-900 text-sm sm:text-base mb-1">
                                                {issue.title || issue.description?.slice(0, 60)}
                                            </h4>
                                            <p className="text-xs text-gray-500 font-medium">📍 {issue.location} · 🕒 {timeAgo(issue.createdAt)}</p>

                                            {issue.adminNote && (
                                                <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 font-medium">
                                                    <span className="font-bold text-blue-800">Authority Note: </span>
                                                    {issue.adminNote}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Tab: Security & Profile */}
                {activeTab === 'security' && (
                    <div className="space-y-6">
                        {/* Profile Info Card */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
                            <h3 className="font-extrabold text-gray-900 text-base">Profile Information</h3>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Display Name</label>
                                {editingName ? (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            className="border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
                                            autoFocus
                                        />
                                        <button onClick={handleSaveName} disabled={savingName} className="bg-emerald-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer">
                                            Save
                                        </button>
                                        <button onClick={() => setEditingName(false)} className="bg-gray-100 text-gray-700 text-xs px-3 py-2.5 rounded-xl cursor-pointer">
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between bg-slate-50 px-4 py-2.5 rounded-xl border border-gray-200">
                                        <span className="text-sm font-bold text-gray-800">{displayName}</span>
                                        <button
                                            onClick={() => { setNewName(displayName); setEditingName(true); }}
                                            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                                        >
                                            <FaEdit /> Edit
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Registered Email</label>
                                    <p className="text-sm font-semibold text-gray-800 bg-slate-50 px-4 py-2.5 rounded-xl border border-gray-200 truncate">{user?.email}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Citizen Member Since</label>
                                    <p className="text-sm font-semibold text-gray-800 bg-slate-50 px-4 py-2.5 rounded-xl border border-gray-200">
                                        {user?.metadata.creationTime ? formatToIST(new Date(user.metadata.creationTime), 'medium') : '—'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Password Change Card */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
                            <h3 className="font-extrabold text-gray-900 text-base">Update Password</h3>
                            <form onSubmit={handleChangePassword} className="space-y-3">
                                <div>
                                    <label className="text-xs font-semibold text-gray-700 block mb-1">Current Password</label>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        value={currentPass}
                                        onChange={e => setCurrentPass(e.target.value)}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-700 block mb-1">New Password (min 6 characters)</label>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        value={newPass}
                                        onChange={e => setNewPass(e.target.value)}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={savingPass}
                                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
                                >
                                    {savingPass ? 'Updating...' : 'Change Password'}
                                </button>
                            </form>
                        </div>

                        {/* Danger Zone */}
                        <div className="bg-red-50/70 rounded-2xl p-6 border border-red-200 shadow-sm space-y-3">
                            <h3 className="font-extrabold text-red-900 text-base">Danger Zone</h3>
                            <p className="text-xs text-red-700 font-medium">
                                Once you delete your account, all personal profile data and identity mappings are permanently erased.
                            </p>
                            {!showDeleteConfirm ? (
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer shadow-xs"
                                >
                                    Delete Account
                                </button>
                            ) : (
                                <form onSubmit={handleDeleteAccount} className="space-y-3 pt-2">
                                    <input
                                        type="password"
                                        placeholder="Confirm with your current password"
                                        value={deletePass}
                                        onChange={e => setDeletePass(e.target.value)}
                                        className="w-full border border-red-300 rounded-xl px-4 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                                        required
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            type="submit"
                                            disabled={deleting}
                                            className="bg-red-700 hover:bg-red-800 text-white font-bold text-xs px-4 py-2 rounded-xl cursor-pointer"
                                        >
                                            {deleting ? 'Deleting...' : 'Confirm Permanent Deletion'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowDeleteConfirm(false)}
                                            className="bg-gray-200 text-gray-800 font-bold text-xs px-3 py-2 rounded-xl cursor-pointer"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyAccount;