import { Link } from 'react-router-dom';
import { FaHome, FaExclamationTriangle } from 'react-icons/fa';

const NotFound = () => (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 bg-slate-50">
        <div className="text-amber-500 mb-4">
            <FaExclamationTriangle size={56} />
        </div>
        <h1 className="text-7xl font-extrabold text-gray-800 mb-2">404</h1>
        <h2 className="text-2xl font-bold text-gray-700 mb-2">Page Not Found</h2>
        <p className="text-gray-600 mb-8 max-w-sm">
            The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
            to="/"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-lg transition-colors shadow-sm cursor-pointer"
        >
            <FaHome /> <span>Go Back Home</span>
        </Link>
    </div>
);

export default NotFound;
