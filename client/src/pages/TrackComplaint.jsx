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
    ShieldCheck,
    Calendar,
    Layers,
    Fingerprint,
    Building2,
    ThumbsUp,
    ThumbsDown,
    Loader2,
    RefreshCw
} from 'lucide-react';
import api from '../api';

const TrackComplaint = () => {
    const [searchParams] = useSearchParams();
    const [complaintId, setComplaintId] = useState(searchParams.get('id') || '');
    const [complaint, setComplaint] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Citizen Verification State
    const [feedback, setFeedback] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [verificationSubmitted, setVerificationSubmitted] = useState(false);

    const fetchComplaint = async (id = complaintId) => {
        if (!id) return;
        setLoading(true);
        setError('');
        setComplaint(null);
        try {
            const { data } = await api.get(`/complaints/track/${id}`);
            setComplaint(data);
        } catch (err) {
            setError('Complaint ID not found. Please check and try again.');
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

    const handleVerifyResolution = async (verified) => {
        if (!complaint) return;
        setVerifying(true);
        try {
            const { data } = await api.post(`/complaints/${complaint._id}/verify-resolution`, {
                verified,
                feedback,
            });
            setComplaint(data);
            setVerificationSubmitted(true);
            alert(verified ? 'Thank you! Issue resolution confirmed.' : 'Issue marked as unresolved and reopened for response team.');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to submit verification response');
        } finally {
            setVerifying(false);
        }
    };

    const statusSteps = [
        { label: 'Submitted', icon: Clock },
        { label: 'Assigned', icon: Building2 },
        { label: 'In Progress', icon: Activity },
        { label: 'Resolved', icon: CheckCircle2 },
    ];

    const getStatusIndex = (status) => {
        const s = (status || '').trim().toLowerCase();
        if (s === 'submitted' || s === 'pending') return 0;
        if (s === 'verified' || s === 'assigned') return 1;
        if (s === 'in progress' || s === 'reopened') return 2;
        if (s === 'resolved' || s === 'citizen verification' || s === 'closed') return 3;
        return 0;
    };

    return (
        <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Search Bar Section */}
            <div className="card-premium p-10 lg:p-14 bg-slate-900 border-none relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-64 h-64 bg-primary-600/20 rounded-full blur-[100px] transition-all group-hover:scale-125"></div>
                <div className="relative z-10 text-center mb-10">
                    <h2 className="text-4xl font-black text-white font-display tracking-tight mb-4">
                        Civic Issue <span className="text-primary-400">Tracking Portal</span>
                    </h2>
                    <p className="text-slate-400 font-medium max-w-lg mx-auto leading-relaxed">
                        Enter your complaint ID code to query real-time status and operational progression.
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
                            placeholder="ENTER COMPLAINT ID (EX: CMP12345678)..."
                            className="w-full h-20 pl-16 pr-44 bg-white/10 border border-white/10 rounded-[2.5rem] text-white font-black tracking-widest placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:bg-white/15 focus:border-primary-500/50 transition-all text-xl"
                            required
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="absolute right-3 top-3 bottom-3 px-8 btn-primary !rounded-[2rem] h-auto flex items-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Track Complaint'}
                        </button>
                    </div>
                </form>
            </div>

            {error && (
                <div className="p-8 bg-red-50 border border-red-100 rounded-[2.5rem] text-red-600 text-center animate-in zoom-in">
                    <AlertCircle className="mx-auto mb-4" size={40} />
                    <p className="text-lg font-black tracking-tight mb-1">Query Error</p>
                    <p className="text-sm font-semibold opacity-80">{error}</p>
                </div>
            )}

            {complaint && (
                <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
                    {/* Visual Progress Bar */}
                    <div className="card-premium p-10 lg:p-12 bg-white">
                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 font-display">Complaint Lifecycle Progress</h3>
                                <p className="text-slate-500 font-semibold text-xs">Tracking ID #{complaint.complaintId}</p>
                            </div>
                            <span className={`px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-widest ${
                                complaint.status === 'Resolved' || complaint.status === 'Closed' ? 'bg-emerald-100 text-emerald-700' :
                                complaint.status === 'In Progress' ? 'bg-amber-100 text-amber-700' : 'bg-primary-100 text-primary-700'
                            }`}>
                                {complaint.status}
                            </span>
                        </div>

                        <div className="relative">
                            <div className="absolute top-8 left-0 w-full h-1 bg-slate-100 -translate-y-1/2">
                                <div
                                    className="h-full bg-primary-600 transition-all duration-1000 shadow-lg"
                                    style={{ width: `${(getStatusIndex(complaint.status) / (statusSteps.length - 1)) * 100}%` }}
                                />
                            </div>

                            <div className="relative flex justify-between">
                                {statusSteps.map((step, index) => {
                                    const isActive = getStatusIndex(complaint.status) >= index;
                                    return (
                                        <div key={index} className="flex flex-col items-center group">
                                            <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center relative z-10 transition-all duration-500 border-4 ${
                                                isActive
                                                    ? 'bg-primary-600 border-white text-white shadow-xl scale-110'
                                                    : 'bg-white border-slate-100 text-slate-300'
                                            }`}>
                                                <step.icon size={24} />
                                            </div>
                                            <p className={`mt-4 font-black text-xs uppercase tracking-widest ${
                                                isActive ? 'text-slate-900' : 'text-slate-300'
                                            }`}>
                                                {step.label}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Citizen Resolution Verification Widget */}
                    {(complaint.status === 'Resolved' || complaint.status === 'Citizen Verification') && (
                        <div className="card-premium p-8 bg-gradient-to-r from-emerald-500 to-teal-600 text-white space-y-6">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 size={28} />
                                <div>
                                    <h3 className="text-xl font-black font-display uppercase tracking-tight">Resolution Verification</h3>
                                    <p className="text-emerald-100 text-xs font-medium">The department has marked this issue as resolved. Please confirm if the issue is fixed.</p>
                                </div>
                            </div>

                            {complaint.resolution?.resolutionNote && (
                                <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20 text-xs">
                                    <span className="font-bold block text-white/80 uppercase text-[10px]">Department Resolution Note:</span>
                                    <p className="mt-1 font-semibold text-white">"{complaint.resolution.resolutionNote}"</p>
                                </div>
                            )}

                            {complaint.status === 'Closed' ? (
                                <div className="p-4 bg-white/20 rounded-2xl text-center text-xs font-bold uppercase">
                                    ✓ Resolution Confirmed & Closed
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-emerald-100 uppercase mb-1 block">Feedback / Observations (Optional)</label>
                                        <input
                                            type="text"
                                            placeholder="Enter any feedback regarding resolution..."
                                            value={feedback}
                                            onChange={(e) => setFeedback(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-white text-slate-800 rounded-xl text-xs font-medium focus:outline-none"
                                        />
                                    </div>

                                    <div className="flex flex-wrap gap-4">
                                        <button
                                            onClick={() => handleVerifyResolution(true)}
                                            disabled={verifying}
                                            className="px-6 py-3 bg-white text-emerald-700 hover:bg-emerald-50 rounded-xl text-xs font-extrabold uppercase transition-all flex items-center gap-2 shadow-lg"
                                        >
                                            {verifying ? <Loader2 className="animate-spin" size={16} /> : <ThumbsUp size={16} />}
                                            <span>Yes, Issue Fixed (Confirm)</span>
                                        </button>

                                        <button
                                            onClick={() => handleVerifyResolution(false)}
                                            disabled={verifying}
                                            className="px-6 py-3 bg-rose-600 text-white hover:bg-rose-700 rounded-xl text-xs font-extrabold uppercase transition-all flex items-center gap-2 shadow-lg"
                                        >
                                            {verifying ? <Loader2 className="animate-spin" size={16} /> : <ThumbsDown size={16} />}
                                            <span>No, Still Unresolved (Reopen)</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Detail Cards */}
                    <div className="grid lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 card-premium p-8 space-y-6 bg-white">
                            <div>
                                <span className="inline-block px-3 py-1 bg-primary-50 text-primary-700 rounded-lg text-[10px] font-black uppercase tracking-widest mb-3">
                                    {complaint.category} • {complaint.subcategory || 'General'}
                                </span>
                                <h2 className="text-2xl font-black text-slate-900 font-display">{complaint.title}</h2>
                            </div>

                            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-slate-700 font-semibold text-sm leading-relaxed italic">
                                    "{complaint.description}"
                                </p>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 bg-white">
                                    <MapPin size={20} className="text-primary-600" />
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Location</p>
                                        <p className="font-bold text-xs text-slate-900">{complaint.location}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 bg-white">
                                    <Building2 size={20} className="text-primary-600" />
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Assigned Department</p>
                                        <p className="font-bold text-xs text-slate-900">{complaint.assignedDepartment || 'General Administration'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Status Sidebar */}
                        <div className="space-y-6">
                            <div className="card-premium p-6 bg-white space-y-4">
                                <h3 className="text-xs font-black uppercase text-slate-900">Complaint Details</h3>
                                <div className="space-y-3 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-slate-400 font-bold uppercase text-[10px]">Submitted Date:</span>
                                        <span className="font-bold text-slate-800">{new Date(complaint.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400 font-bold uppercase text-[10px]">Current Status:</span>
                                        <span className="font-bold text-primary-600">{complaint.status}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400 font-bold uppercase text-[10px]">Department:</span>
                                        <span className="font-bold text-slate-800">{complaint.assignedDepartment || 'General'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TrackComplaint;
