import { useEffect, useState } from 'react';
import { db } from '../config/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { FaExclamationCircle, FaCheckCircle, FaSpinner, FaList } from 'react-icons/fa';

const statCards = [
    { key: 'total',      label: 'Total Issues',   icon: FaList,             color: 'text-blue-600',   bg: 'bg-blue-50'  },
    { key: 'pending',    label: 'Pending',         icon: FaExclamationCircle, color: 'text-yellow-600', bg: 'bg-yellow-50'},
    { key: 'inProgress', label: 'In Progress',     icon: FaSpinner,          color: 'text-blue-500',   bg: 'bg-blue-50'  },
    { key: 'resolved',   label: 'Resolved',        icon: FaCheckCircle,      color: 'text-green-600',  bg: 'bg-green-50' },
];

const Statistics = () => {
    const [stats, setStats] = useState({ total: 0, resolved: 0, pending: 0, inProgress: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onSnapshot(collection(db, 'issues'), (snap) => {
            const total = snap.size;
            let resolved = 0, pending = 0, inProgress = 0;
            snap.docs.forEach(d => {
                const s = d.data().status;
                if (s === 'resolved')    resolved++;
                else if (s === 'pending') pending++;
                else if (s === 'in-progress') inProgress++;
            });
            setStats({ total, resolved, pending, inProgress });
            setLoading(false);
        });
        return () => unsub();
    }, []);

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
            {statCards.map(({ key, label, icon: Icon, color, bg }) => (
                <div key={key} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 text-center">
                    <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${bg} mb-2`}>
                        <Icon className={`${color} text-lg`} />
                    </div>
                    <p className="text-2xl font-bold text-gray-800">
                        {loading ? '—' : stats[key].toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                </div>
            ))}
        </div>
    );
};

export default Statistics;