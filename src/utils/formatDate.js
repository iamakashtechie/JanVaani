/**
 * Format a Firestore Timestamp or JS Date to IST string.
 * @param {import('firebase/firestore').Timestamp | Date} timestamp
 * @param {'medium'|'short'|'long'} dateStyle
 * @returns {string}
 */
export const formatToIST = (timestamp, dateStyle = 'medium') => {
    if (!timestamp) return '—';
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle,
        timeStyle: 'short',
    }).format(date);
};

/**
 * Returns a relative "time ago" string (e.g. "3 hours ago").
 * @param {import('firebase/firestore').Timestamp | Date} timestamp
 * @returns {string}
 */
export const timeAgo = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return formatToIST(timestamp, 'short');
};
