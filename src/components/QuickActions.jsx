import { Link } from 'react-router-dom';
import { FaFileAlt, FaChartBar, FaMapMarkedAlt } from 'react-icons/fa';

const actions = [
    {
        to: '/report',
        icon: FaFileAlt,
        label: 'Report an Issue',
        description: 'Submit a new civic complaint',
        color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
        to: '/track',
        icon: FaChartBar,
        label: 'Track Progress',
        description: 'View all reported issues',
        color: 'bg-indigo-600 hover:bg-indigo-700',
    },
    {
        to: '/map',
        icon: FaMapMarkedAlt,
        label: 'View Map',
        description: 'See issues on a map',
        color: 'bg-teal-600 hover:bg-teal-700',
    },
];

const QuickActions = () => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
            {actions.map(({ to, icon: Icon, label, description, color }) => (
                <Link
                    key={to}
                    to={to}
                    className={`${color} text-white rounded-xl p-5 flex items-center gap-4 transition-all hover:-translate-y-1 hover:shadow-lg`}
                >
                    <div className="bg-white/20 p-3 rounded-lg">
                        <Icon size={22} />
                    </div>
                    <div>
                        <p className="font-semibold">{label}</p>
                        <p className="text-xs text-white/80">{description}</p>
                    </div>
                </Link>
            ))}
        </div>
    );
};

export default QuickActions;