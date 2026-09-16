import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaExclamationCircle, FaShieldAlt, FaCamera, FaCheckCircle, FaMapMarkerAlt, FaUsers } from 'react-icons/fa';
import toast from 'react-hot-toast';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await login(email, password);
            toast.success('Welcome back to JanVaani! 👋');
            navigate('/');
        } catch (err) {
            const msg = err.code === 'auth/invalid-credential'
                ? 'Invalid email address or password.'
                : 'Failed to sign in. Please check your credentials and try again.';
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
                            <span>🏛️ Municipal Citizen Portal</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2 text-white">JanVaani</h1>
                        <p className="text-blue-100 text-sm font-medium leading-relaxed">
                            Bridging citizens and local authorities to resolve municipal issues fast and transparently.
                        </p>
                    </div>

                    <div className="my-8 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-blue-200 flex-shrink-0">
                                <FaCamera size={15} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-white">Photo Evidence</p>
                                <p className="text-[11px] text-blue-200">Upload live on-site pictures</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-blue-200 flex-shrink-0">
                                <FaMapMarkerAlt size={15} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-white">GPS Auto-Location</p>
                                <p className="text-[11px] text-blue-200">Pins coordinates automatically</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-blue-200 flex-shrink-0">
                                <FaUsers size={15} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-white">Community Upvotes</p>
                                <p className="text-[11px] text-blue-200">Prioritize urgent ward concerns</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-white/20 text-[11px] text-blue-200">
                        <span>Official Community Civic Network</span>
                    </div>
                </div>

                {/* Right Form Column */}
                <div className="p-8 sm:p-10 flex flex-col justify-center">
                    <div className="mb-6">
                        <h2 className="text-2xl font-extrabold text-gray-900">Sign In</h2>
                        <p className="text-xs text-gray-500 mt-1">Enter your citizen or authority credentials</p>
                    </div>

                    {error && (
                        <div className="flex items-start gap-2.5 bg-red-50 text-red-700 border border-red-200 rounded-xl p-3 mb-5 text-xs font-semibold leading-snug">
                            <FaExclamationCircle className="text-red-500 mt-0.5 flex-shrink-0" size={14} />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
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
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-11 text-sm text-gray-800 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                                >
                                    {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-md hover:shadow-blue-500/25 cursor-pointer text-sm mt-2"
                        >
                            {loading ? 'Authenticating...' : 'Sign In to Account'}
                        </button>
                    </form>

                    <p className="text-center text-xs text-gray-500 mt-6 font-medium">
                        Don't have a JanVaani account?{' '}
                        <Link to="/signup" className="text-blue-600 font-bold hover:underline">
                            Create Account
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;