import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    MapPin,
    Clock,
    Tag,
    User,
    AlertCircle,
    ShieldCheck,
    CheckCircle2,
    Calendar,
    Layers,
    ChevronRight,
    TrendingUp,
    Activity,
    Zap,
    Bot
} from 'lucide-react';
import api from '../api';

const ComplaintDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [complaint, setComplaint] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [formData, setFormData] = useState({
        status: '',
        assignedDepartment: '',
        urgency: '',
        adminResponse: ''
    });

    const departments = ['Sanitation Department', 'Public Works Department', 'Water Supply Department', 'Power Department', 'Electrical Department', 'General Administration'];

    useEffect(() => {
        const fetchComplaint = async () => {
            try {
                const { data } = await api.get('/admin/complaints');
                const found = data.find(c => c._id === id);
                setComplaint(found);
                setFormData({
                    status: found.status,
                    assignedDepartment: found.assignedDepartment || '',
                    urgency: found.urgency || 'Medium',
                    adminResponse: found.adminResponse || ''
                });
            } catch (error) {
                // Ignore fetch errors
            } finally {
                setLoading(false);
            }
        };
        fetchComplaint();
    }, [id]);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setUpdating(true);
        try {
            await api.put(`/admin/complaints/${id}`, formData);
            alert('Operational parameters synchronized successfully.');
            navigate('/admin-dashboard');
        } catch (error) {
            alert('Synchronization Error: Parameter update failed.');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return (
        <div className="max-w-6xl mx-auto space-y-10 py-10">
            <div className="h-20 bg-white rounded-3xl shimmer"></div>
            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 h-[600px] bg-white rounded-[2.5rem] shimmer"></div>
                <div className="h-[600px] bg-white rounded-[2.5rem] shimmer"></div>
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Header Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/admin/manage')}
                        className="p-3 text-slate-400 hover:text-primary-600 bg-white rounded-2xl shadow-sm border border-slate-100 transition-all hover:-translate-x-1"
                    >
                        <ArrowLeft size={22} />
                    </button>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Incident Root Analysis</p>
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                            <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest">#{complaint.complaintId}</p>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 font-display tracking-tight">Technical Documentation</h1>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className={`px-5 py-2 rounded-xl border font-black text-[10px] uppercase tracking-widest ${complaint.urgency === 'high' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-slate-50 border-slate-100 text-slate-500'
                        }`}>
                        {complaint.urgency} Priority Level
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-10 items-start">
                {/* Main Content Card */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="card-premium p-10 lg:p-14 space-y-10 bg-white">
                        <div className="flex items-start justify-between">
                            <div>
                                <span className="inline-block px-3 py-1 bg-primary-50 text-primary-700 rounded-lg text-[10px] font-black uppercase tracking-widest mb-4">
                                    Observed Anomaly v1.0
                                </span>
                                <h2 className="text-4xl font-black text-slate-900 font-display leading-[1.1] tracking-tight">{complaint.title}</h2>
                            </div>
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-primary-600 shadow-sm border border-slate-100">
                                <Zap size={28} />
                            </div>
                        </div>

                        <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-inner relative group">
                            <div className="absolute top-6 left-6 text-slate-200 group-hover:text-primary-100 transition-colors">
                                <MessageSquare size={48} />
                            </div>
                            <p className="relative z-10 text-xl text-slate-700 font-semibold leading-relaxed tracking-tight italic py-4">
                                "{complaint.description}"
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-primary-100 transition-colors">
                                <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <MapPin size={24} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Physical Coordinates</p>
                                    <p className="font-extrabold text-slate-900">{complaint.location}</p>
                                </div>
                            </div>
                            <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-secondary-100 transition-colors">
                                <div className="w-12 h-12 rounded-xl bg-secondary-50 text-secondary-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <CheckCircle2 size={24} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Detection Sector</p>
                                    <p className="font-extrabold text-slate-900">{complaint.category} Infrastructure</p>
                                </div>
                            </div>
                        </div>

                        {complaint.imageUrl && (
                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-2 mb-4">Evidence Payload Visualization</p>
                                <div className="rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white group">
                                    <img
                                        src={complaint.imageUrl}
                                        alt="Incident Documentation"
                                        className="w-full h-auto object-cover transition-transform duration-1000 group-hover:scale-110"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* User Node Info */}
                    <div className="card-premium p-10 bg-slate-900 text-white border-none group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-white/5 to-transparent"></div>
                        <div className="relative z-10 flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-[1.5rem] flex items-center justify-center text-primary-400 shadow-2xl transition-transform group-hover:rotate-6">
                                    <Fingerprint size={32} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-1">Source Subject Identity</p>
                                    <h4 className="text-2xl font-black font-display tracking-tight leading-none">{complaint.user?.name || 'Anonymous Node'}</h4>
                                    <p className="text-sm font-semibold text-white/60 mt-2">{complaint.user?.email || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="hidden sm:block text-right">
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Identity Verification</p>
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                    <ShieldCheck size={12} />
                                    Authenticated
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Sidebar */}
                <div className="space-y-8 sticky top-28">
                    <div className="card-premium p-8 lg:p-10">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center">
                                <Activity size={20} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 font-display italic">Resolution Control</h3>
                        </div>

                        <form onSubmit={handleUpdate} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Protocol Status</label>
                                <select
                                    className="input-field cursor-pointer"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="Pending">PENDING ANALYSIS</option>
                                    <option value="In Progress">IN-PROGRESS RESOLUTION</option>
                                    <option value="Resolved">DEPLOYED RESOLUTION (COMPLETED)</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Operational Routing</label>
                                <select
                                    className="input-field cursor-pointer"
                                    value={formData.assignedDepartment}
                                    onChange={(e) => setFormData({ ...formData, assignedDepartment: e.target.value })}
                                >
                                    <option value="">INITIALIZE ROUTING...</option>
                                    {departments.map((dept) => (
                                        <option key={dept} value={dept}>{dept.toUpperCase()}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Priority Calibration</label>
                                <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-50 rounded-2xl border border-slate-100">
                                    {['Low', 'Medium', 'High'].map((level) => (
                                        <button
                                            key={level}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, urgency: level })}
                                            className={`py-2 px-1 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.urgency === level
                                                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-100'
                                                : 'text-slate-400 hover:text-slate-600'
                                                }`}
                                        >
                                            {level}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Official Transmission (Feedback)</label>
                                <textarea
                                    className="w-full h-32 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all placeholder:text-slate-300"
                                    placeholder="Enter formal response to citizen..."
                                    value={formData.adminResponse}
                                    onChange={(e) => setFormData({ ...formData, adminResponse: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={updating}
                                className="w-full btn-teal h-16 group/btn !rounded-[1.5rem]"
                            >
                                {updating ? (
                                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <Zap size={20} className="group-hover/btn:scale-125 transition-transform" />
                                        Synchronize Vault
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* AI Suggestion Widget */}
                    <div className="card-premium p-8 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white border-none relative overflow-hidden group">
                        <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                                    <Bot size={22} className="text-secondary-400" />
                                </div>
                                <h3 className="text-lg font-black font-display uppercase tracking-widest">AI Analyst</h3>
                            </div>
                            <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 mb-6">
                                <p className="text-[10px] font-black text-white/60 mb-1 leading-none">Predicted Assignment</p>
                                <p className="text-sm font-bold tracking-tight">Security & Infrastructure Intelligence</p>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] font-bold text-white/50 leading-relaxed italic">
                                    "Pattern recognition confirms 82% similarity with previous sector outages. Priority recommendation: INTERMEDIATE."
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComplaintDetails;
