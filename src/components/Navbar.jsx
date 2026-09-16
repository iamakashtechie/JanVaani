import React from 'react'
import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext';
import { useAdmin } from '../context/AdminContext';
import { FaBars, FaTimes } from 'react-icons/fa';
import NotificationPanel from './NotificationPanel';

const Navbar = () => {
    const { user, logout } = useAuth();
    const { isAdmin } = useAdmin();
    const [isOpen, setIsOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Failed to log out');
        }
    };

    const closeMenu = () => setIsOpen(false);

    const linkClass = ({ isActive }) =>
        `font-medium transition-colors duration-200 hover:text-blue-600 ${
            isActive
                ? 'text-blue-600 border-b-2 border-blue-600 pb-0.5'
                : 'text-gray-700'
        }`;

    return (
        <header className="bg-white shadow-sm sticky top-0 z-40">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Brand */}
                    <NavLink
                        to="/"
                        className="text-2xl font-extrabold text-blue-600 tracking-tight hover:scale-105 transition-transform"
                    >
                        Jan<span className="text-gray-800">Vaani</span>
                    </NavLink>

                    {/* Desktop Links */}
                    <ul className="hidden md:flex items-center gap-6">
                        <li><NavLink className={linkClass} to="/">Home</NavLink></li>
                        <li><NavLink className={linkClass} to="/report">Report Issue</NavLink></li>
                        <li><NavLink className={linkClass} to="/track">Track Progress</NavLink></li>
                        <li><NavLink className={linkClass} to="/map">Map</NavLink></li>
                        <li><NavLink className={linkClass} to="/analytics">Analytics</NavLink></li>
                        {isAdmin && (
                            <li><NavLink className={linkClass} to="/admin">Admin</NavLink></li>
                        )}
                        {user && (
                            <>
                                <li><NavLink className={linkClass} to="/account">My Account</NavLink></li>
                                <li><NotificationPanel /></li>
                                <li>
                                    <button
                                        onClick={handleLogout}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors shadow-sm cursor-pointer"
                                    >
                                        Logout
                                    </button>
                                </li>
                            </>
                        )}
                    </ul>

                    {/* Mobile: notification + hamburger */}
                    <div className="flex md:hidden items-center gap-2">
                        {user && <NotificationPanel />}
                        <button
                            className="p-2 text-gray-700 hover:text-blue-600 transition-colors"
                            onClick={() => setIsOpen(!isOpen)}
                            aria-label="Toggle menu"
                        >
                            {isOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Drawer */}
            <div
                className={`md:hidden fixed inset-0 z-50 transition-opacity duration-300 ${
                    isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
            >
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/40"
                    onClick={closeMenu}
                />

                {/* Drawer Panel */}
                <div
                    className={`absolute top-0 right-0 h-full w-64 bg-white shadow-xl flex flex-col transition-transform duration-300 ${
                        isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
                >
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                        <span className="text-xl font-extrabold text-blue-600">JanVaani</span>
                        <button onClick={closeMenu} className="text-gray-500 hover:text-blue-600">
                            <FaTimes size={20} />
                        </button>
                    </div>

                    <ul className="flex flex-col gap-1 px-4 py-4 flex-1 overflow-y-auto">
                        {[
                            { to: '/', label: 'Home' },
                            { to: '/report', label: 'Report Issue' },
                            { to: '/track', label: 'Track Progress' },
                            { to: '/map', label: 'Map View' },
                            { to: '/analytics', label: 'Analytics' },
                            ...(isAdmin ? [{ to: '/admin', label: 'Admin Dashboard' }] : []),
                            ...(user ? [{ to: '/account', label: 'My Account' }] : []),
                        ].map(({ to, label }) => (
                            <li key={to}>
                                <NavLink
                                    to={to}
                                    onClick={closeMenu}
                                    className={({ isActive }) =>
                                        `block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                            isActive
                                                ? 'bg-blue-50 text-blue-600 font-semibold'
                                                : 'text-gray-700 hover:bg-gray-100'
                                        }`
                                    }
                                >
                                    {label}
                                </NavLink>
                            </li>
                        ))}
                    </ul>

                    {user && (
                        <div className="px-4 pb-6">
                            <button
                                onClick={() => { handleLogout(); closeMenu(); }}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm cursor-pointer"
                            >
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Navbar;
