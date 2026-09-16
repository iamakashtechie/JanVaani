export const ISSUE_CATEGORIES = [
    { id: 'road',        label: 'Road & Infrastructure', icon: '🛣️',  color: '#f59e0b' },
    { id: 'water',       label: 'Water & Drainage',      icon: '💧',  color: '#3b82f6' },
    { id: 'electricity', label: 'Electricity',           icon: '⚡',  color: '#eab308' },
    { id: 'sanitation',  label: 'Sanitation & Waste',    icon: '🗑️',  color: '#84cc16' },
    { id: 'parks',       label: 'Parks & Public Spaces', icon: '🌳',  color: '#22c55e' },
    { id: 'other',       label: 'Other',                 icon: '📌',  color: '#6b7280' },
];

export const getCategoryById = (id) =>
    ISSUE_CATEGORIES.find(c => c.id === id) || ISSUE_CATEGORIES[ISSUE_CATEGORIES.length - 1];

export const STATUS_META = {
    pending: {
        label: 'Pending',
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        border: 'border-yellow-300',
        dot: '#d97706',
    },
    'in-progress': {
        label: 'In Progress',
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        border: 'border-blue-300',
        dot: '#2563eb',
    },
    resolved: {
        label: 'Resolved',
        bg: 'bg-green-100',
        text: 'text-green-800',
        border: 'border-green-300',
        dot: '#16a34a',
    },
    escalated: {
        label: 'Escalated',
        bg: 'bg-red-100',
        text: 'text-red-800',
        border: 'border-red-300',
        dot: '#dc2626',
    },
};

export const getStatusMeta = (status) =>
    STATUS_META[status] || STATUS_META['pending'];
