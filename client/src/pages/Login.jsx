import React, { useState, useEffect } from 'react';
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
    KeyRound,
    Phone,
    RotateCcw,
    Clock,
    Smartphone
} from 'lucide-react';

const Login = () => {
    const [accessCategory, setAccessCategory] = useState('user'); // 'user' (Citizen OTP) or 'admin' (Email/Password)

    // Citizen OTP Flow States
    const [otpStep, setOtpStep] = useState(1); // 1: Request OTP, 2: Verify OTP
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [cooldown, setCooldown] = useState(0);
    const [otpExpirySeconds, setOtpExpirySeconds] = useState(300); // 5 minutes

    // Admin Flow States
    const [showPassword, setShowPassword] = useState(false);
    const [selectedDemoDept, setSelectedDemoDept] = useState('roads');
    const [adminFormData, setAdminFormData] = useState({
        email: '',
        password: '',
    });

    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, requestCitizenOtp, verifyCitizenOtp, loginCitizenDemo } = useAuth();
    const navigate = useNavigate();

    // Demo Citizen Fast Login (bypasses phone entry & OTP verification)
    const handleDemoCitizenLogin = async () => {
        setError('');
        setSuccessMessage('');
        setLoading(true);

        try {
            await loginCitizenDemo();
            setSuccessMessage('Demo Citizen authenticated! Redirecting...');
            setTimeout(() => {
                navigate('/citizen-dashboard');
            }, 300);
        } catch (err) {
            console.error('Demo citizen login error:', err);
            const msg = err.response?.data?.message || 'Failed to authenticate Demo Citizen. Please ensure demo auth is enabled on the server.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    // Cooldown Timer countdown
    useEffect(() => {
        let timer;
        if (cooldown > 0) {
            timer = setInterval(() => {
                setCooldown((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [cooldown]);

    // OTP Expiry Timer countdown
    useEffect(() => {
        let timer;
        if (otpStep === 2 && otpExpirySeconds > 0) {
            timer = setInterval(() => {
                setOtpExpirySeconds((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [otpStep, otpExpirySeconds]);

    const handleAccessCategoryChange = (cat) => {
        setAccessCategory(cat);
        setError('');
        setSuccessMessage('');
    };

    const handleAdminInputChange = (e) => {
        setAdminFormData({ ...adminFormData, [e.target.name]: e.target.value });
    };

    // Citizen OTP Step 1: Request OTP
    const handleRequestOtp = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        const cleanedPhone = phone.trim().replace(/[\s\-\(\)]/g, '');
        if (!cleanedPhone || !/^\+?\d{10,15}$/.test(cleanedPhone)) {
            setError('Please enter a valid 10-digit phone number.');
            return;
        }

        setLoading(true);

        try {
            const res = await requestCitizenOtp(phone);
            setSuccessMessage(res.message || 'OTP sent successfully!');
            setOtpStep(2);
            setCooldown(res.cooldownSeconds || 60);
            setOtpExpirySeconds(300);
        } catch (err) {
            console.error('Request OTP error:', err);
            const msg = err.response?.data?.message || 'Failed to send OTP. Please check your phone number and try again.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    // Citizen OTP Step 2: Verify OTP
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (!otp || otp.length !== 6) {
            setError('Please enter the complete 6-digit OTP code.');
            return;
        }

        setLoading(true);

        try {
            const user = await verifyCitizenOtp(phone, otp);
            setSuccessMessage('OTP verified successfully! Redirecting...');
            setTimeout(() => {
                navigate('/citizen-dashboard');
            }, 300);
        } catch (err) {
            console.error('Verify OTP error:', err);
            const msg = err.response?.data?.message || 'Invalid OTP code. Please try again.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    // Admin Email/Password Login Submit
    const handleAdminSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!adminFormData.email.trim()) {
            setError('Please enter your administrator email address.');
            return;
        }

        if (!adminFormData.password) {
            setError('Please enter your password.');
            return;
        }

        setLoading(true);

        try {
            const user = await login(adminFormData.email, adminFormData.password);
            const role = user.role;
            if (role === 'citizen') {
                navigate('/citizen-dashboard');
            } else {
                navigate('/admin-dashboard');
            }
        } catch (err) {
            console.error('Admin login error:', err);
            const msg = err.response?.data?.message || 'Invalid email or password. Please try again.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const demoDepartments = [
        { label: 'Roads & Infrastructure', code: 'roads' },
        { label: 'Water Supply', code: 'water' },
        { label: 'Drainage & Sewerage', code: 'sanitation' },
        { label: 'Waste Management & Sanitation', code: 'waste' },
        { label: 'Streetlights & Electricity', code: 'electrical' },
        { label: 'Public Safety & Other Hazards', code: 'publicworks' },
    ];

    const formatSeconds = (secs) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

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
                            'Secure Citizen Phone & OTP Authentication',
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

                        {/* 2 Access Category Selector Cards: Citizen OTP vs Admin Email/Password */}
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
                                            <Smartphone size={20} />
                                        </div>
                                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                                            accessCategory === 'user' ? 'border-primary-600 bg-primary-600' : 'border-slate-300'
                                        }`}>
                                            {accessCategory === 'user' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-black text-sm text-slate-900 tracking-tight">CITIZEN LOGIN</h4>
                                        <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">Phone Number + OTP</p>
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
                                        <h4 className="font-black text-sm text-slate-900 tracking-tight">ADMIN LOGIN</h4>
                                        <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">Email + Password</p>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Title */}
                        <div className="space-y-1 text-center sm:text-left pt-1">
                            <h3 className="text-2xl font-black text-slate-900 font-display tracking-tight">
                                {accessCategory === 'user' ? (otpStep === 1 ? 'Citizen Login' : 'Enter OTP') : 'Admin Portal Login'}
                            </h3>
                            <p className="text-xs text-slate-500 font-medium">
                                {accessCategory === 'user'
                                    ? (otpStep === 1 ? 'Enter your phone number to receive a 6-digit verification code' : `Verification code sent to ${phone}`)
                                    : 'Enter officer credentials to access department management'}
                            </p>
                        </div>

                        {/* Alerts */}
                        {error && (
                            <div role="alert" className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-bold flex items-start gap-3 animate-in fade-in duration-200">
                                <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
                                <p className="font-extrabold">{error}</p>
                            </div>
                        )}

                        {successMessage && (
                            <div role="alert" className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-start gap-3 animate-in fade-in duration-200">
                                <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" size={16} />
                                <p className="font-extrabold">{successMessage}</p>
                            </div>
                        )}

                        {/* CITIZEN PHONE + OTP FORM */}
                        {accessCategory === 'user' && (
                            <div className="space-y-4">
                                {otpStep === 1 ? (
                                    /* Step 1: Phone Input Form */
                                    <form onSubmit={handleRequestOtp} className="space-y-4">
                                        <div className="space-y-1">
                                            <label htmlFor="phone" className="text-[11px] font-bold text-slate-700">Phone Number</label>
                                            <div className="relative">
                                                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                <input
                                                    id="phone"
                                                    type="tel"
                                                    value={phone}
                                                    onChange={(e) => setPhone(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all tracking-wider"
                                                    placeholder="9876543210"
                                                    required
                                                />
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-medium">Standard 10-digit mobile number</p>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 tracking-wide uppercase disabled:opacity-70"
                                        >
                                            {loading ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            ) : (
                                                <>
                                                    <span>Send OTP</span>
                                                    <ArrowRight size={18} />
                                                </>
                                            )}
                                        </button>
                                    </form>
                                ) : (
                                    /* Step 2: OTP Input Form */
                                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <label htmlFor="otp" className="text-[11px] font-bold text-slate-700">Enter 6-Digit OTP</label>
                                                <div className="flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                                                    <Clock size={12} />
                                                    <span>Expires in {formatSeconds(otpExpirySeconds)}</span>
                                                </div>
                                            </div>
                                            <input
                                                id="otp"
                                                type="text"
                                                maxLength={6}
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                                className="w-full py-3.5 text-center text-2xl font-black tracking-[0.5em] bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
                                                placeholder="••••••"
                                                required
                                                autoFocus
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 pt-1">
                                            <button
                                                type="button"
                                                disabled={cooldown > 0 || loading}
                                                onClick={handleRequestOtp}
                                                className="py-3 px-3 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                                            >
                                                <RotateCcw size={14} />
                                                <span>{cooldown > 0 ? `Resend (${cooldown}s)` : 'Resend OTP'}</span>
                                            </button>

                                            <button
                                                type="submit"
                                                disabled={loading || otpExpirySeconds <= 0}
                                                className="py-3 px-3 bg-primary-600 hover:bg-primary-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 uppercase disabled:opacity-70"
                                            >
                                                {loading ? (
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                ) : (
                                                    <>
                                                        <span>Verify OTP</span>
                                                        <ArrowRight size={14} />
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        <div className="text-center pt-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setOtpStep(1);
                                                    setOtp('');
                                                    setError('');
                                                    setSuccessMessage('');
                                                }}
                                                className="text-xs font-bold text-slate-500 hover:text-primary-600 underline transition-colors"
                                            >
                                                Change Phone Number ({phone})
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        )}

                        {/* ADMIN EMAIL + PASSWORD FORM */}
                        {accessCategory === 'admin' && (
                            <form onSubmit={handleAdminSubmit} className="space-y-4">
                                <div className="space-y-1">
                                    <label htmlFor="email" className="text-[11px] font-bold text-slate-700">Official Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            id="email"
                                            type="email"
                                            name="email"
                                            value={adminFormData.email}
                                            onChange={handleAdminInputChange}
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
                                            placeholder="officer@smartcity.gov"
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
                                            value={adminFormData.password}
                                            onChange={handleAdminInputChange}
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
                                    className="w-full py-3 bg-secondary-600 hover:bg-secondary-700 text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 tracking-wide uppercase mt-2 disabled:opacity-70"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <span>Sign In to Admin Portal</span>
                                            <ArrowRight size={18} />
                                        </>
                                    )}
                                </button>
                            </form>
                        )}

                        {/* Demo Access Shortcuts */}
                        <div className="pt-4 border-t border-slate-100 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <KeyRound size={12} />
                                    <span>Demo Access Shortcuts</span>
                                </div>
                                <select
                                    value={selectedDemoDept}
                                    onChange={(e) => setSelectedDemoDept(e.target.value)}
                                    className="text-[10px] font-bold bg-slate-100 border border-slate-200 rounded-md px-1.5 py-0.5 text-slate-700 cursor-pointer"
                                >
                                    {demoDepartments.map((d) => (
                                        <option key={d.code} value={d.code}>{d.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <button
                                    type="button"
                                    onClick={handleDemoCitizenLogin}
                                    disabled={loading}
                                    className="py-2 px-2 bg-slate-100 hover:bg-primary-50 hover:text-primary-700 text-slate-700 text-[10px] font-bold rounded-xl transition-all truncate border border-slate-200/60 disabled:opacity-50"
                                >
                                    Demo Citizen
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setAccessCategory('admin');
                                        setAdminFormData({ email: `${selectedDemoDept}_head@smartcity.gov`, password: 'head123' });
                                        setError('');
                                        setSuccessMessage('');
                                    }}
                                    className="py-2 px-2 bg-slate-100 hover:bg-amber-50 hover:text-amber-700 text-slate-700 text-[10px] font-bold rounded-xl transition-all truncate border border-slate-200/60"
                                >
                                    Dept Head
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setAccessCategory('admin');
                                        setAdminFormData({ email: `${selectedDemoDept}_verifier@smartcity.gov`, password: 'verifier123' });
                                        setError('');
                                        setSuccessMessage('');
                                    }}
                                    className="py-2 px-2 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-[10px] font-bold rounded-xl transition-all truncate border border-slate-200/60"
                                >
                                    Verifier
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setAccessCategory('admin');
                                        setAdminFormData({ email: 'admin@smartcity.gov', password: 'admin123' });
                                        setError('');
                                        setSuccessMessage('');
                                    }}
                                    className="py-2 px-2 bg-slate-100 hover:bg-secondary-50 hover:text-secondary-700 text-slate-700 text-[10px] font-bold rounded-xl transition-all truncate border border-slate-200/60"
                                >
                                    Super Admin
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
