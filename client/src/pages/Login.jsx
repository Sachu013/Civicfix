import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    ShieldCheck,
    ArrowRight,
    Mail,
    Lock,
    User,
    ChevronRight,
    Globe,
    Zap,
    Activity,
    CheckCircle2
} from 'lucide-react';

const Login = () => {
    const [isRegister, setIsRegister] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'citizen'
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, register } = useAuth();
    const navigate = useNavigate();

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            let user;
            if (isRegister) {
                user = await register(formData.name, formData.email, formData.password, formData.role);
            } else {
                user = await login(formData.email, formData.password);
            }
            navigate(user.role === 'admin' ? '/admin-dashboard' : '/citizen-dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Authentication sequence failed. Check credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-primary-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-secondary-100/40 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

            <div className="w-full max-w-[1200px] grid lg:grid-cols-2 gap-12 items-center relative z-10">

                {/* Branding Section */}
                <div className="hidden lg:block space-y-10 animate-in slide-in-from-left duration-1000">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-primary-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-primary-500/30 animate-float">
                            <ShieldCheck className="text-white" size={32} />
                        </div>
                        <h1 className="text-4xl font-extrabold text-slate-900 font-display tracking-tight">
                            SmartCity <span className="text-primary-600 block text-2xl mt-1">Grievance Portal</span>
                        </h1>
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-5xl font-extrabold text-slate-800 leading-tight tracking-tighter capitalize">
                            Empowering <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-500">Every Voice</span> <br />
                            Through <span className="italic">Gov-Tech</span>
                        </h2>
                        <p className="text-lg text-slate-500 leading-relaxed max-w-md">
                            A high-security, real-time civic engagement platform connecting citizens directly with municipal authorities. Secure, encrypted, and efficient.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        {[
                            { icon: Activity, label: 'Real-time Analytics', color: 'text-primary-500' },
                            { icon: Zap, label: 'Swift Resolution', color: 'text-secondary-500' },
                            { icon: Globe, label: 'City-wide Scope', color: 'text-blue-500' },
                            { icon: CheckCircle2, label: 'Verified Integrity', color: 'text-green-500' }
                        ].map((feat, i) => (
                            <div key={i} className="flex items-center gap-3 p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white hover:border-primary-100 transition-colors shadow-sm">
                                <feat.icon className={feat.color} size={20} />
                                <span className="text-sm font-bold text-slate-700">{feat.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Form Section */}
                <div className="flex justify-center animate-in zoom-in duration-700">
                    <div className="w-full max-w-[480px] bg-white rounded-[2.5rem] shadow-premium p-10 border border-slate-100 relative group overflow-hidden">

                        {/* Progress bar line */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-slate-50">
                            <div className={`h-full bg-primary-600 transition-all duration-700 ${loading ? 'w-full shimmer' : 'w-0'}`}></div>
                        </div>

                        <div className="text-center mb-10">
                            <h3 className="text-3xl font-extrabold text-slate-900 font-display tracking-tight mb-2">
                                {isRegister ? 'Initialize Account' : 'Welcome Back'}
                            </h3>
                            <p className="text-slate-500 font-medium">Access your city's digital command center</p>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-bold flex items-center gap-3">
                                <div className="w-1.5 h-8 bg-red-500 rounded-full"></div>
                                {error}
                            </div>
                        )}

                        {/* Demo Shortcuts */}
                        <div className="mb-8 grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setFormData({ ...formData, email: 'citizen@demo.com', password: 'citizen123', role: 'citizen' });
                                    setIsRegister(false);
                                }}
                                className="flex flex-col items-center gap-2 p-4 bg-primary-50 border border-primary-100 rounded-2xl hover:bg-primary-100 transition-all group"
                            >
                                <User className="text-primary-600 group-hover:scale-110 transition-transform" size={24} />
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary-700">Demo Citizen</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setFormData({ ...formData, email: 'admin@test.com', password: '123456', role: 'admin' });
                                    setIsRegister(false);
                                }}
                                className="flex flex-col items-center gap-2 p-4 bg-secondary-50 border border-secondary-100 rounded-2xl hover:bg-secondary-100 transition-all group"
                            >
                                <ShieldCheck className="text-secondary-600 group-hover:scale-110 transition-transform" size={24} />
                                <span className="text-[10px] font-black uppercase tracking-widest text-secondary-700">Demo Admin</span>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {isRegister && (
                                <div className="space-y-2 group">
                                    <label className="text-xs font-extrabold text-slate-400 uppercase tracking-widest pl-1">Legal Name</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 transition-colors" size={20} />
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className="input-field pl-12"
                                            placeholder="Johnathan Doe"
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2 group">
                                <label className="text-xs font-extrabold text-slate-400 uppercase tracking-widest pl-1">Encryption Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 transition-colors" size={20} />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="input-field pl-12"
                                        placeholder="citizen@smartcity.gov"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 group">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Secret Keyword</label>
                                    {!isRegister && <button type="button" className="text-[10px] font-bold text-primary-600 hover:underline tracking-tight">Reset Key?</button>}
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 transition-colors" size={20} />
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        className="input-field pl-12"
                                        placeholder="••••••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            {isRegister && (
                                <div className="space-y-2">
                                    <label className="text-xs font-extrabold text-slate-400 uppercase tracking-widest pl-1">Authorization Tier</label>
                                    <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-50 rounded-2xl border border-slate-100">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, role: 'citizen' })}
                                            className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${formData.role === 'citizen' ? 'bg-white text-primary-600 shadow-sm ring-1 ring-slate-100' : 'text-slate-500 hover:bg-slate-100'
                                                }`}
                                        >
                                            Citizen Unit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, role: 'admin' })}
                                            className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${formData.role === 'admin' ? 'bg-white text-secondary-600 shadow-sm ring-1 ring-slate-100' : 'text-slate-500 hover:bg-slate-100'
                                                }`}
                                        >
                                            Admin Node
                                        </button>
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full group/btn relative overflow-hidden font-display ${formData.role === 'admin' ? 'btn-teal' : 'btn-primary'} h-[60px]`}
                            >
                                {loading ? (
                                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <span className="relative z-10 tracking-tight text-lg">
                                            {isRegister ? 'Commence Registration' : 'Authenticate Identity'}
                                        </span>
                                        <ArrowRight size={20} className="relative z-10 group-hover/btn:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 pt-8 border-t border-slate-50 text-center">
                            <button
                                onClick={() => setIsRegister(!isRegister)}
                                className="text-sm font-bold text-slate-500 hover:text-primary-600 transition-colors flex items-center justify-center gap-2 mx-auto group"
                            >
                                {isRegister ? 'Already have credentials?' : "Don't have an access node?"}
                                <span className="text-primary-600 flex items-center">
                                    {isRegister ? 'Login Here' : 'Initialize Token'}
                                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
