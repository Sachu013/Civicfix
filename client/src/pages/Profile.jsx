import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
    User,
    Mail,
    Phone,
    Shield,
    Calendar,
    MapPin,
    Bell,
    ShieldCheck,
    Settings,
    LogOut
} from 'lucide-react';

const Profile = () => {
    const { userInfo, logout } = useAuth();

    if (!userInfo) return null;

    const profileStats = [
        { label: 'Security Level', value: 'Level 2 Verified', icon: ShieldCheck, color: 'text-green-500' },
        { label: 'Contributions', value: 'Civic Citizen', icon: User, color: 'text-primary-500' },
        { label: 'City Impact', value: 'Active Citizen', icon: Calendar, color: 'text-secondary-500' },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header / Banner */}
            <div className="card-premium overflow-hidden border-none group">
                <div className="h-32 bg-gradient-to-r from-primary-600 to-secondary-500 relative">
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-3xl"></div>
                </div>
                <div className="px-10 pb-10 relative">
                    <div className="flex flex-col md:flex-row items-end gap-6 -mt-12 mb-8">
                        <div className="w-32 h-32 rounded-[2.5rem] bg-white p-2 shadow-2xl relative z-10 transition-transform group-hover:scale-105">
                            <div className="w-full h-full rounded-[2rem] bg-slate-100 flex items-center justify-center text-primary-600">
                                <User size={56} strokeWidth={1.5} />
                            </div>
                        </div>
                        <div className="flex-1 pb-2">
                            <h1 className="text-3xl font-black text-slate-900 font-display tracking-tight mb-1">{userInfo.name}</h1>
                            <p className="text-slate-500 font-bold flex items-center gap-2 text-sm uppercase tracking-widest">
                                <Shield size={14} className="text-primary-500" />
                                Verified {userInfo.role} Node
                            </p>
                        </div>
                        <div className="pb-2 flex gap-3">
                            <button className="p-3 bg-slate-50 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-2xl transition-all shadow-sm">
                                <Settings size={20} />
                            </button>
                            <button
                                onClick={logout}
                                className="px-6 py-3 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 shadow-sm"
                            >
                                <LogOut size={18} />
                                Terminate Session
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {profileStats.map((stat, i) => (
                            <div key={i} className="p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100 group/stat hover:border-primary-100 transition-all">
                                <div className={`${stat.color} mb-4 transition-transform group-hover/stat:scale-110`}>
                                    <stat.icon size={24} />
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                <p className="text-lg font-black text-slate-800">{stat.value}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Information Grid */}
            <div className="grid md:grid-cols-2 gap-8">
                <div className="card-premium p-10 space-y-8">
                    <h3 className="text-xl font-black text-slate-900 font-display">Identity Metadata</h3>

                    <div className="space-y-6">
                        {userInfo.phone && (
                            <div className="flex items-center gap-4 group">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Phone size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Authenticated Phone</p>
                                    <p className="font-bold text-slate-800">{userInfo.phone}</p>
                                </div>
                            </div>
                        )}

                        {userInfo.email && (
                            <div className="flex items-center gap-4 group">
                                <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Mail size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Email Address</p>
                                    <p className="font-bold text-slate-800">{userInfo.email}</p>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-4 group">
                            <div className="w-12 h-12 rounded-2xl bg-secondary-50 text-secondary-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <MapPin size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Primary District</p>
                                <p className="font-bold text-slate-800">SmartCity Central Municipality</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 group">
                            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Bell size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Notification Status</p>
                                <p className="font-bold text-slate-800">Active Real-time Alerts</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card-premium p-10 bg-slate-900 text-white border-none relative overflow-hidden group">
                    <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-primary-600/20 rounded-full blur-3xl transition-transform group-hover:scale-150"></div>
                    <div className="relative z-10 space-y-8 h-full flex flex-col">
                        <h3 className="text-xl font-black font-display">System Integrity</h3>
                        <p className="text-slate-400 font-medium leading-relaxed opacity-80">
                            Your account is authenticated via cryptographic OTP and protected with secure JWT tokens. All reported incidents are digitally signed across the municipal network.
                        </p>

                        <div className="mt-auto space-y-4">
                            <div className="flex justify-between items-center px-2">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Public Reputation</span>
                                <span className="text-xs font-black text-green-400">100/100</span>
                            </div>
                            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                <div className="w-[100%] h-full bg-gradient-to-r from-primary-500 to-secondary-400"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
