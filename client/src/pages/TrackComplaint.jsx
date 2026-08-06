import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Search,
    Clock,
    MapPin,
    Tag,
    AlertCircle,
    CheckCircle2,
    Activity,
    ArrowRight,
    ShieldCheck,
    Calendar,
    Layers,
    ChevronRight,
    Fingerprint
} from 'lucide-react';
import api from '../api';

const TrackComplaint = () => {
    const [searchParams] = useSearchParams();
    const [complaintId, setComplaintId] = useState(searchParams.get('id') || '');
    const [complaint, setComplaint] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchComplaint = async (id = complaintId) => {
        if (!id) return;
        setLoading(true);
        setError('');
        setComplaint(null);
        try {
            const { data } = await api.get(`/complaints/track/${id}`);
            setComplaint(data);
        } catch (err) {
            setError('Identifier not found in the global vault. Please verify and try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (searchParams.get('id')) {
            fetchComplaint(searchParams.get('id'));
        }
    }, [searchParams]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchComplaint();
    };

    const statusSteps = [
        { label: 'Pending', status: 'pending', icon: Clock },
        { label: 'Analyzing', status: 'in-progress', icon: Activity },
        { label: 'Resolved', status: 'resolved', icon: CheckCircle2 }
    ];

    const getStatusIndex = (status) => {
        const s = (status || '').trim().toLowerCase();
        if (s === 'pending') return 0;
        if (s === 'in progress' || s === 'in-progress' || s === 'analyzing') return 1;
        if (s === 'resolved') return 2;
        return 0;
    };

    return (
        <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Search Bar Section */}
            <div className="card-premium p-10 lg:p-14 bg-slate-900 border-none relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-64 h-64 bg-primary-600/20 rounded-full blur-[100px] transition-all group-hover:scale-125"></div>
                <div className="relative z-10 text-center mb-10">
                    <h2 className="text-4xl font-black text-white font-display tracking-tight mb-4">Infrastructure <span className="text-primary-400">Tracking Vault</span></h2>
                    <p className="text-slate-400 font-medium max-w-lg mx-auto leading-relaxed">
                        Enter your unique report identifier code to initialize a real-time status query against our municipal resolution mainframe.
                    </p>
                </div>

                <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative z-10">
                    <div className="relative">
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-400 transition-colors">
                            <Fingerprint size={28} />
                        </div>
                        <input
                            type="text"
                            value={complaintId}
                            onChange={(e) => setComplaintId(e.target.value.toUpperCase())}
                            placeholder="ENTER IDENTIFIER (EX: COMP-1234)..."
                            className="w-full h-20 pl-16 pr-44 bg-white/10 border border-white/10 rounded-[2.5rem] text-white font-black tracking-widest placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:bg-white/15 focus:border-primary-500/50 transition-all text-xl"
                            required
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="absolute right-3 top-3 bottom-3 px-8 btn-primary !rounded-[2rem] h-auto"
                        >
                            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Execute Query'}
                        </button>
                    </div>
                </form>
            </div>

            {error && (
                <div className="p-8 bg-red-50 border border-red-100 rounded-[2.5rem] text-red-600 text-center animate-in zoom-in">
                    <AlertCircle className="mx-auto mb-4" size={40} />
                    <p className="text-lg font-black tracking-tight mb-1">Access Protocol Failed</p>
                    <p className="text-sm font-semibold opacity-80">{error}</p>
                </div>
            )}

            {complaint && (
                <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
                    {/* Visual Progress Bar */}
                    <div className="card-premium p-10 lg:p-14">
                        <div className="flex justify-between items-center mb-12">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 font-display">Resolution Progress</h3>
                                <p className="text-slate-500 font-semibold text-sm">Real-time status feed</p>
                            </div>
                            <div className={`px-5 py-2 rounded-full font-black text-xs uppercase tracking-widest border-2 ${['high', 'urgent'].includes(complaint.urgency?.toLowerCase()) ? 'bg-red-50 border-red-100 text-red-600' :
                                complaint.urgency?.toLowerCase() === 'medium' ? 'bg-amber-50 border-amber-100 text-amber-600' :
                                    'bg-green-50 border-green-100 text-green-600'
                                }`}>
                                {complaint.urgency || 'NORMAL'} PRIORITY NODE
                            </div>
                        </div>

                        <div className="relative">
                            {/* Connector Line */}
                            <div className="absolute top-8 left-0 w-full h-1 bg-slate-100 -translate-y-1/2">
                                <div
                                    className="h-full bg-primary-600 transition-all duration-1000 shadow-lg shadow-primary-500/30"
                                    style={{ width: `${(getStatusIndex(complaint.status) / 2) * 100}%` }}
                                />
                            </div>

                            <div className="relative flex justify-between">
                                {statusSteps.map((step, index) => {
                                    const isActive = getStatusIndex(complaint.status) >= index;
                                    return (
                                        <div key={index} className="flex flex-col items-center group">
                                            <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center relative z-10 transition-all duration-500 border-4 ${isActive
                                                ? 'bg-primary-600 border-white text-white shadow-xl shadow-primary-200 scale-110'
                                                : 'bg-white border-slate-50 text-slate-300'
                                                }`}>
                                                <step.icon size={24} />
                                            </div>
                                            <p className={`mt-6 font-black text-xs uppercase tracking-widest transition-colors ${isActive ? 'text-slate-900 font-black' : 'text-slate-300'
                                                }`}>
                                                {step.label}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Detail Grid */}
                    <div className="grid lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 card-premium p-10 space-y-8">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Detailed Log Entry</p>
                                    <h2 className="text-3xl font-black text-slate-900 leading-none">{complaint.title}</h2>
                                </div>
                                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-primary-600 shadow-sm">
                                    <Tag size={28} />
                                </div>
                            </div>

                            <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
                                <p className="text-slate-700 font-semibold leading-relaxed whitespace-pre-line text-lg italic">
                                    "{complaint.description}"
                                </p>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-6">
                                <div className="flex items-center gap-4 p-5 rounded-2xl border border-slate-100 bg-white">
                                    <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                                        <MapPin size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Coordinates</p>
                                        <p className="font-bold text-slate-900 truncate">{complaint.location}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-5 rounded-2xl border border-slate-100 bg-white">
                                    <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-xl flex items-center justify-center">
                                        <Layers size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Assigned Node</p>
                                        <p className="font-bold text-slate-900">{complaint.assignedDepartment || 'Analyzing Routing...'}</p>
                                    </div>
                                </div>
                            </div>

                            {complaint.adminResponse && (
                                <div className="p-8 bg-primary-50 rounded-[2rem] border border-primary-100 flex gap-5">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary-600 shadow-sm shrink-0">
                                        <MessageSquare size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest mb-1">Official Admin Response</p>
                                        <p className="text-slate-700 font-semibold leading-relaxed">{complaint.adminResponse}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-6">
                            <div className="card-premium p-8 bg-gradient-to-br from-secondary-500 to-secondary-600 text-white border-none relative overflow-hidden group">
                                <div className="absolute right-0 bottom-0 w-32 h-32 bg-white/10 rounded-full blur-3xl translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform"></div>
                                <h4 className="text-xs font-black uppercase tracking-[0.3em] opacity-70 mb-8">Metadata Summary</h4>
                                <div className="space-y-6 relative z-10">
                                    <div className="flex items-center gap-4">
                                        <Calendar size={20} className="text-secondary-200" />
                                        <div>
                                            <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-0.5">Initialize Date</p>
                                            <p className="font-black text-sm">{new Date(complaint.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <ShieldCheck size={20} className="text-secondary-200" />
                                        <div>
                                            <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-0.5">Verification</p>
                                            <p className="font-black text-sm uppercase">End-to-End Encrypted</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {complaint.imageUrl && (
                                <div className="card-premium p-4 group">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 px-2">Visual Payload</p>
                                    <div className="relative rounded-[1.5rem] overflow-hidden aspect-video shadow-2xl">
                                        <img
                                            src={complaint.imageUrl}
                                            alt="Incident Evidence"
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            onError={(e) => e.target.style.display = 'none'}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent"></div>
                                    </div>
                                </div>
                            )}

                            <div className="card-premium p-8 text-center group">
                                <p className="text-xs font-bold text-slate-400 mb-6">Need priority assistance?</p>
                                <button className="w-full btn-secondary h-14 group-hover:bg-slate-50">
                                    Open Support Ticket
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TrackComplaint;
