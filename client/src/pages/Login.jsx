import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    ShieldCheck,
    ArrowRight,
    Mail,
    Lock,
    User,
    Eye,
    EyeOff,
    CheckCircle2,
    AlertCircle,
    KeyRound
} from 'lucide-react';

const Login = () => {
    const [isRegister, setIsRegister] = useState(false);
    const [accessCategory, setAccessCategory] = useState('user'); // UX hint: 'user' or 'admin'
    const [showPassword, setShowPassword] = useState(false);

    // Selected Demo Department for quick admin demo logins
    const [selectedDemoDept, setSelectedDemoDept] = useState('roads');

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

    const handleAccessCategoryChange = (cat) => {
        setAccessCategory(cat);
        if (cat === 'user') {
            setFormData(prev => ({ ...prev, role: 'citizen' }));
        } else {
            setFormData(prev => ({ ...prev, role: 'admin' }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.email.trim()) {
            setError('Please enter your email address');
            return;
        }

        if (!formData.password) {
            setError('Please enter your password');
            return;
        }

        setLoading(true);

        try {
            let user;
            if (isRegister) {
                user = await register(formData.name, formData.email, formData.password, formData.role);
            } else {
                user = await login(formData.email, formData.password);
            }

            // Single unified post-login routing
            const role = user.role;
            if (role === 'citizen') {
                navigate('/citizen-dashboard');
            } else {
                // All admin roles (super_admin, department_head, department_staff) route to shared Admin Dashboard
                navigate('/admin-dashboard');
            }
        } catch (err) {
            console.error('Login error:', err);
            const msg = err.response?.data?.message || 'Invalid email or password. Please try again.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const demoDepartments = [
        { label: 'Roads & Transportation', code: 'roads' },
        { label: 'Water Supply', code: 'water' },
        { label: 'Waste Management', code: 'waste' },
        { label: 'Street Lighting & Electrical', code: 'electrical' },
        { label: 'Drainage & Flooding', code: 'drainage' },
        { label: 'Sewage & Sanitation', code: 'sanitation' },
        { label: 'Traffic & Road Safety', code: 'traffic' },
        { label: 'Public Health', code: 'public_health' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans">
            {/* Background Accents */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary-100/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-secondary-100/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

            <div className="w-full max-w-[1050px] grid lg:grid-cols-12 gap-8 items-center relative z-10">

                {/* Left Side: Civic Branding */}
                <div className="lg:col-span-5 space-y-8 hidden lg:block pr-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/20">
                            <ShieldCheck className="text-white" size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 font-display tracking-tight leading-none">
                                CivicFix
                            </h1>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                Digital Municipal Portal
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-4xl font-extrabold text-slate-900 leading-tight tracking-tight">
                            Your City's <span className="text-primary-600">Digital Command Center</span>
                        </h2>
                        <p className="text-sm text-slate-600 leading-relaxed font-medium">
                            Connecting citizens, department officers, and city administration for transparent issue resolution, automated SLA tracking, and civic intelligence.
                        </p>
                    </div>

                    <div className="space-y-3 pt-2">
                        {[
                            'Automated AI Classification & Priority Engine',
                            'Smart Department Routing & SLA Tracking',
                            'Geospatial Hotspots & Live Incident Heatmap',
                            'Citizen Resolution Verification & Confirmation'
                        ].map((text, i) => (
                            <div key={i} className="flex items-center gap-3 text-xs font-bold text-slate-700">
                                <CheckCircle2 className="text-emerald-500 shrink-0" size={16} />
                                <span>{text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Side: Login Form Card */}
                <div className="lg:col-span-7 flex justify-center">
                    <div className="w-full max-w-[500px] bg-white rounded-3xl shadow-xl p-6 sm:p-8 border border-slate-100 space-y-6">

                        {/* Mobile Header Branding */}
                        <div className="lg:hidden text-center space-y-2 mb-4">
                            <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center shadow-md mx-auto text-white">
                                <ShieldCheck size={28} />
                            </div>
                            <h2 className="text-2xl font-extrabold text-slate-900 font-display">CivicFix</h2>
                            <p className="text-xs text-slate-500 font-medium">Your City's Digital Command Center</p>
                        </div>

                        {/* Title */}
                        <div className="space-y-1 text-center sm:text-left">
                            <h3 className="text-2xl font-black text-slate-900 font-display tracking-tight">
                                {isRegister ? 'Create an Account' : 'Sign In'}
                            </h3>
                            <p className="text-xs text-slate-500 font-medium">
                                {isRegister ? 'Enter your details to initialize portal access' : 'Select access category and enter your credentials'}
                            </p>
                        </div>

                        {/* Error Alert */}
                        {error && (
                            <div role="alert" className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-bold flex items-start gap-3 animate-in fade-in duration-200">
                                <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
                                <div className="space-y-0.5">
                                    <p className="font-extrabold">{error}</p>
                                </div>
                            </div>
                        )}

                        {/* 2 Access Category Selector Cards: USER and ADMIN */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                                Select Access Portal
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => handleAccessCategoryChange('user')}
                                    className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                                        accessCategory === 'user'
                                            ? 'border-primary-500 text-primary-600 bg-primary-50/50 shadow-sm ring-1 ring-slate-200'
                                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50/50'
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <div className={`p-2 rounded-xl ${accessCategory === 'user' ? 'bg-white/80' : 'bg-slate-100'}`}>
                                            <User size={20} />
                                        </div>
                                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                                            accessCategory === 'user' ? 'border-primary-600 bg-primary-600' : 'border-slate-300'
                                        }`}>
                                            {accessCategory === 'user' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-black text-sm text-slate-900 tracking-tight">USER</h4>
                                        <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">Report and track civic issues</p>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleAccessCategoryChange('admin')}
                                    className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                                        accessCategory === 'admin'
                                            ? 'border-secondary-500 text-secondary-600 bg-secondary-50/50 shadow-sm ring-1 ring-slate-200'
                                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50/50'
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <div className={`p-2 rounded-xl ${accessCategory === 'admin' ? 'bg-white/80' : 'bg-slate-100'}`}>
                                            <ShieldCheck size={20} />
                                        </div>
                                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                                            accessCategory === 'admin' ? 'border-secondary-600 bg-secondary-600' : 'border-slate-300'
                                        }`}>
                                            {accessCategory === 'admin' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-black text-sm text-slate-900 tracking-tight">ADMIN</h4>
                                        <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">Manage and resolve civic complaints</p>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {isRegister && (
                                <div className="space-y-1">
                                    <label htmlFor="name" className="text-[11px] font-bold text-slate-700">Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            id="name"
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
                                            placeholder="Enter your full name"
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1">
                                <label htmlFor="email" className="text-[11px] font-bold text-slate-700">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
                                        placeholder="name@example.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                    <label htmlFor="password" className="text-[11px] font-bold text-slate-700">Password</label>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
                                        placeholder="Enter password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 tracking-wide uppercase mt-2 disabled:opacity-70"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <span>{isRegister ? 'Create Account' : 'Sign In'}</span>
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Toggle Register/Login */}
                        <div className="pt-2 text-center border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsRegister(!isRegister);
                                    setError('');
                                }}
                                className="text-xs font-bold text-slate-600 hover:text-primary-600 transition-colors inline-flex items-center gap-1"
                            >
                                <span>{isRegister ? 'Already have an account?' : "Don't have an account?"}</span>
                                <span className="text-primary-600 font-extrabold underline">{isRegister ? 'Sign In' : 'Create an account'}</span>
                            </button>
                        </div>

                        {/* Secondary Demo Access Section */}
                        <div className="pt-4 border-t border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <KeyRound size={12} />
                                    <span>Demo Access Shortcuts</span>
                                </div>
                                <select
                                    value={selectedDemoDept}
                                    onChange={(e) => setSelectedDemoDept(e.target.value)}
                                    className="text-[10px] font-bold bg-slate-100 border border-slate-200 rounded-md px-1.5 py-0.5 text-slate-700"
                                >
                                    {demoDepartments.map(d => (
                                        <option key={d.code} value={d.code}>{d.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setAccessCategory('user');
                                        setFormData({ name: '', email: 'citizen@demo.com', password: 'citizen123', role: 'citizen' });
                                        setIsRegister(false);
                                        setError('');
                                    }}
                                    className="py-1.5 px-2 bg-slate-100 hover:bg-primary-50 hover:text-primary-700 text-slate-700 text-[10px] font-bold rounded-lg transition-colors truncate"
                                >
                                    Demo User
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setAccessCategory('admin');
                                        setFormData({ name: '', email: `${selectedDemoDept}_head@smartcity.gov`, password: 'head123', role: 'department_head' });
                                        setIsRegister(false);
                                        setError('');
                                    }}
                                    className="py-1.5 px-2 bg-slate-100 hover:bg-amber-50 hover:text-amber-700 text-slate-700 text-[10px] font-bold rounded-lg transition-colors truncate"
                                >
                                    Demo Dept Head
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setAccessCategory('admin');
                                        setFormData({ name: '', email: 'admin@test.com', password: '123456', role: 'admin' });
                                        setIsRegister(false);
                                        setError('');
                                    }}
                                    className="py-1.5 px-2 bg-slate-100 hover:bg-secondary-50 hover:text-secondary-700 text-slate-700 text-[10px] font-bold rounded-lg transition-colors truncate"
                                >
                                    Demo Super Admin
                                </button>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
};

export default Login;
