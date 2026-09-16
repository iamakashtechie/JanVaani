import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createUserProfile } from '../services/userService';
import { useNavigate, Link } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaExclamationCircle, FaShieldAlt, FaCamera, FaCheckCircle, FaMapMarkerAlt, FaUsers } from 'react-icons/fa';
import { getPasswordStrength } from '../utils/validators';
import toast from 'react-hot-toast';

const Signup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [displayName, setDisplayName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signup } = useAuth();
    const navigate = useNavigate();

    const strength = getPasswordStrength(password);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!displayName.trim()) {
            setError('Display name is required.');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const userCredential = await signup(email, password);
            await createUserProfile(userCredential.user.uid, {
                email,
                name: displayName.trim(),
            });
            toast.success('Account created! Welcome to JanVaani 🎉');
            navigate('/');
        } catch (err) {
            const msg = err.code === 'auth/email-already-in-use'
                ? 'An account with this email already exists.'
                : err.message || 'Failed to create account.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
            <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden grid grid-cols-1 md:grid-cols-2">
                {/* Left Brand Showcase Column */}
                <div className="bg-gradient-to-br from-blue-900 via-blue-700 to-indigo-800 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />

                    <div>
                        <div className="inline-flex items-center gap-2 bg-white/15 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md mb-4">
                            <span>🤝 Join Your Community</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2 text-white">JanVaani</h1>
                        <p className="text-blue-100 text-sm font-medium leading-relaxed">
                            Empower your locality. Report issues, upvote community priorities, and verify municipal fixes.
                        </p>
                    </div>

                    <div className="my-8 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-blue-200 flex-shrink-0">
                                <FaCheckCircle size={15} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-white">Direct Accountability</p>
                                <p className="text-[11px] text-blue-200">Track real-time resolution timeline</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-blue-200 flex-shrink-0">
                                <FaShieldAlt size={15} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-white">Verified Notifications</p>
                                <p className="text-[11px] text-blue-200">Alerts when status changes to resolved</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-blue-200 flex-shrink-0">
                                <FaUsers size={15} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-white">Civic Karma & Badges</p>
                                <p className="text-[11px] text-blue-200">Recognized community champion score</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-white/20 text-[11px] text-blue-200">
                        <span>100% Free · Open to All Citizens</span>
                    </div>
                </div>

                {/* Right Form Column */}
                <div className="p-8 sm:p-10 flex flex-col justify-center">
                    <div className="mb-6">
                        <h2 className="text-2xl font-extrabold text-gray-900">Create Citizen Account</h2>
                        <p className="text-xs text-gray-500 mt-1">Start reporting and tracking civic problems in your area</p>
                    </div>

                    {error && (
                        <div className="flex items-start gap-2.5 bg-red-50 text-red-700 border border-red-200 rounded-xl p-3 mb-5 text-xs font-semibold leading-snug">
                            <FaExclamationCircle className="text-red-500 mt-0.5 flex-shrink-0" size={14} />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Full Name</label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                required
                                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-800 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                placeholder="Your full name"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-800 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                placeholder="name@example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Create Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-11 text-sm text-gray-800 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    placeholder="At least 6 characters"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                                >
                                    {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                                </button>
                            </div>

                            {/* Password Strength Meter */}
                            {password && (
                                <div className="mt-2">
                                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                                        <div
                                            className={`h-1.5 rounded-full transition-all ${strength.color}`}
                                            style={{ width: `${(strength.score / 4) * 100}%` }}
                                        />
                                    </div>
                                    {strength.label && (
                                        <p className="text-[11px] text-gray-500 mt-1 font-medium">
                                            Strength: <span className="font-bold text-gray-700">{strength.label}</span>
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-md hover:shadow-blue-500/25 cursor-pointer text-sm mt-2"
                        >
                            {loading ? 'Creating Account...' : 'Complete Registration'}
                        </button>
                    </form>

                    <p className="text-center text-xs text-gray-500 mt-6 font-medium">
                        Already have an account?{' '}
                        <Link to="/login" className="text-blue-600 font-bold hover:underline">
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Signup;