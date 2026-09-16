import { useState, useRef, useEffect } from 'react';
import { FaBell, FaCheckDouble } from 'react-icons/fa';
import { useNotifications } from '../context/NotificationContext';
import { timeAgo } from '../utils/formatDate';
import { getStatusMeta } from '../config/categories';

const NotificationPanel = () => {
    const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
    const [open, setOpen] = useState(false);
    const panelRef = useRef(null);

    // Close panel on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNotificationClick = (notif) => {
        if (!notif.read) markRead(notif.id);
    };

    return (
        <div className="relative" ref={panelRef}>
            {/* Bell Button */}
            <button
                onClick={() => setOpen(!open)}
                className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors cursor-pointer"
                aria-label="Notifications"
            >
                <FaBell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {open && (
                <div className="absolute right-0 top-10 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 animate-slide-down overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <h3 className="font-semibold text-gray-800">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 transition-colors cursor-pointer font-medium"
                            >
                                <FaCheckDouble size={12} />
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* Notification List */}
                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center text-gray-400 text-sm">
                                No notifications yet
                            </div>
                        ) : (
                            notifications.slice(0, 15).map((notif) => {
                                const statusMeta = getStatusMeta(notif.newStatus);
                                return (
                                    <div
                                        key={notif.id}
                                        onClick={() => handleNotificationClick(notif)}
                                        className={`px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${
                                            !notif.read ? 'bg-blue-50/70' : ''
                                        }`}
                                    >
                                        <div className="flex items-start gap-2">
                                            {!notif.read && (
                                                <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                                            )}
                                            <div className={!notif.read ? '' : 'ml-4'}>
                                                <p className="text-sm text-gray-700 leading-snug">
                                                    {notif.message}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusMeta.bg} ${statusMeta.text}`}>
                                                        {notif.newStatus}
                                                    </span>
                                                    <span className="text-xs text-gray-400">
                                                        {timeAgo(notif.createdAt)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationPanel;
