import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Zap, User, Mail, Lock, Phone, MapPin, ChevronDown, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

const roles = ['Customer', 'Vendor', 'Courier'];

const Register = () => {
    const [form, setForm] = useState({
        full_name: '', email: '', password: '', phone_number: '',
        role_name: 'Customer',
        full_address: '', state: '', city: '', zip_code: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const needsAddress = ['Vendor', 'Courier'].includes(form.role_name);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setSuccess(''); setLoading(true);

        if (needsAddress && (!form.full_address || !form.city || !form.state || !form.zip_code)) {
            setError('Address fields are required for Vendor and Courier accounts.');
            setLoading(false);
            return;
        }

        try {
            await register({ ...form, email: form.email.toLowerCase() });
            setSuccess('Account created! Redirecting to login...');
            setTimeout(() => navigate('/login'), 1500);
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed. Please try again.');
        } finally { setLoading(false); }
    };

    const fields = [
        { label: 'Full Name', name: 'full_name', type: 'text', placeholder: 'John Doe', icon: User, required: true },
        { label: 'Email Address', name: 'email', type: 'email', placeholder: 'you@example.com', icon: Mail, required: true },
        { label: 'Password', name: 'password', type: 'password', placeholder: '••••••••', icon: Lock, required: true },
        { label: 'Phone Number', name: 'phone_number', type: 'tel', placeholder: '+1 234 567 890', icon: Phone, required: false },
    ];

    const addressFields = [
        { label: 'Full Address', name: 'full_address', placeholder: '123 Main Street, Apt 4B' },
        { label: 'City', name: 'city', placeholder: 'Lahore' },
        { label: 'State', name: 'state', placeholder: 'Punjab' },
        { label: 'ZIP Code', name: 'zip_code', placeholder: '54000', type: 'number' },
    ];

    return (
        <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-violet-500/5 rounded-full blur-[120px]" />
            </div>

            <div className="relative w-full max-w-md animate-fade-up">
                <div className="bg-[#0e1117] border border-white/8 rounded-2xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">

                    <div className="flex flex-col items-center mb-8">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center shadow-[0_0_24px_rgba(6,182,212,0.4)] mb-4">
                            <Zap className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Create account</h2>
                        <p className="text-white/40 text-sm mt-1">Join Nexus today</p>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl mb-5">
                            <AlertCircle className="w-4 h-4 shrink-0" />{error}
                        </div>
                    )}
                    {success && (
                        <div className="flex items-center gap-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm px-4 py-3 rounded-xl mb-5">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />{success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Basic fields */}
                        {fields.map(({ label, name, type, placeholder, icon: Icon, required }) => (
                            <div key={name}>
                                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">{label}</label>
                                <div className="relative">
                                    <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                                    <input type={type} name={name} required={required} placeholder={placeholder}
                                        className="w-full bg-white/[0.04] border border-white/10 hover:border-white/15 focus:border-cyan-500/50 focus:bg-white/[0.06] rounded-xl pl-10 pr-4 py-3 text-sm text-white/85 outline-none transition-all placeholder:text-white/20"
                                        value={form[name]} onChange={handleChange} />
                                </div>
                            </div>
                        ))}

                        {/* Role selector */}
                        <div>
                            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Role</label>
                            <div className="relative">
                                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
                                <select name="role_name"
                                    className="w-full appearance-none bg-white/[0.04] border border-white/10 hover:border-white/15 focus:border-cyan-500/50 rounded-xl px-4 py-3 text-sm text-white/85 outline-none transition-all"
                                    value={form.role_name} onChange={handleChange}>
                                    {roles.map(r => <option key={r} value={r} className="bg-[#0e1117]">{r}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Address — required for Vendor and Courier */}
                        {needsAddress && (
                            <div className="space-y-3 pt-2">
                                <div className="flex items-center gap-2 pb-1 border-b border-white/8">
                                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                                    <p className="text-xs font-bold text-white/50 uppercase tracking-wider">
                                        Delivery Address <span className="text-red-400">*required</span>
                                    </p>
                                </div>
                                {addressFields.map(f => (
                                    <div key={f.name}>
                                        <label className="block text-xs text-white/40 mb-1.5">{f.label}</label>
                                        <input
                                            type={f.type || 'text'}
                                            name={f.name}
                                            placeholder={f.placeholder}
                                            required={needsAddress}
                                            className="w-full bg-white/[0.04] border border-white/10 focus:border-cyan-500/50 rounded-xl px-4 py-2.5 text-sm text-white/85 outline-none transition-all placeholder:text-white/20"
                                            value={form[f.name]}
                                            onChange={handleChange}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        <button type="submit" disabled={loading}
                            className="w-full flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 text-black font-bold py-3 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all active:scale-[0.98] mt-2">
                            {loading
                                ? <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                : <><span>Create Account</span><ArrowRight className="w-4 h-4" /></>
                            }
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-white/30">
                        Already have an account?{' '}
                        <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;