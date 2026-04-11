import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Zap, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            setError('');
            const data = await login(email.toLowerCase(), password);
            switch (data.user.role_name) {
                case 'Admin': navigate('/admin'); break;
                case 'Vendor': navigate('/vendor'); break;
                case 'Courier': navigate('/courier'); break;
                default: navigate('/'); break;
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[85vh] flex items-center justify-center px-4">
            {/* Background glow */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[100px]" />
            </div>

            <div className="relative w-full max-w-md animate-fade-up">
                {/* Card */}
                <div className="bg-[#0e1117] border border-white/8 rounded-2xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">

                    {/* Logo */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center shadow-[0_0_24px_rgba(6,182,212,0.4)] mb-4">
                            <Zap className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Welcome back</h2>
                        <p className="text-white/40 text-sm mt-1">Sign in to your Nexus account</p>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl mb-6">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                                <input
                                    type="email" required
                                    className="w-full bg-white/[0.04] border border-white/10 hover:border-white/15 focus:border-cyan-500/50 focus:bg-white/[0.06] rounded-xl pl-10 pr-4 py-3 text-sm text-white/85 outline-none transition-all duration-200 placeholder:text-white/20"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                                <input
                                    type="password" required
                                    className="w-full bg-white/[0.04] border border-white/10 hover:border-white/15 focus:border-cyan-500/50 focus:bg-white/[0.06] rounded-xl pl-10 pr-4 py-3 text-sm text-white/85 outline-none transition-all duration-200 placeholder:text-white/20"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 text-black font-bold py-3 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all duration-200 active:scale-[0.98] mt-2"
                        >
                            {loading ? (
                                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                            ) : (
                                <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>
                            )}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-white/30">
                        No account?{' '}
                        <Link to="/register" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
                            Create one here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;