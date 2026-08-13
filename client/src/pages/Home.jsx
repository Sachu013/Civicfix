import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    PlusCircle,
    Search,
    AlertTriangle,
    CheckCircle,
    Clock,
    ArrowRight,
    TrendingUp,
    MapPin,
    MessageSquare,
    ShieldAlert,
    BarChart3,
    Users,
    Zap,
    Megaphone,
    ChevronRight,
    Loader2,
    Send
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import api from '../api';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const Home = () => {
    const [complaints, setComplaints] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedbackForm, setFeedbackForm] = useState({ rating: 5, category: 'App Experience', comment: '' });
    const [submittingFeedback, setSubmittingFeedback] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [compRes, alertRes, newsRes] = await Promise.all([
                    api.get('/complaints/my'),
                    api.get('/alerts'),
                    api.get('/announcements')
                ]);
                setComplaints(compRes.data);
                setAlerts(alertRes.data);
                setAnnouncements(newsRes.data);
            } catch (error) {
                // Silently catch fetch errors
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleFeedbackSubmit = async (e) => {
        e.preventDefault();
        setSubmittingFeedback(true);
        try {
            await api.post('/feedback', feedbackForm);
            alert('Feedback transmitted successfully. Thank you for your contribution!');
            setShowFeedback(false);
            setFeedbackForm({ rating: 5, category: 'App Experience', comment: '' });
        } catch (error) {
            alert('Binary transmission failure. Please retry.');
        } finally {
            setSubmittingFeedback(false);
        }
    };

    const stats = [
        { label: 'Total Complaints', value: complaints.length, icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Pending Complaints', value: complaints.filter(c => c.status === 'Pending').length, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
        { label: 'Resolved Complaints', value: complaints.filter(c => c.status === 'Resolved').length, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50' },
        { label: 'Critical Node', value: complaints.filter(c => c.urgency === 'High').length, icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-50' },
    ];

    const chartData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
            {
                label: 'Resolution Rate (%)',
                data: [65, 78, 72, 85, 92, 88, 95],
                fill: true,
                backgroundColor: 'rgba(14, 165, 233, 0.1)',
                borderColor: '#0ea5e9',
                borderWidth: 3,
                pointBackgroundColor: '#fff',
                pointBorderWidth: 2,
                tension: 0.4,
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#1e293b',
                padding: 12,
                titleFont: { size: 14, weight: 'bold' },
                bodyFont: { size: 13 },
                usePointStyle: true,
            }
        },
        scales: {
            y: { display: false },
            x: { grid: { display: false }, border: { display: false } }
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Hero Welcome */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 px-8 py-16 lg:p-20 text-white shadow-2xl">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary-600/20 to-transparent"></div>
                <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary-600/30 rounded-full blur-[120px]"></div>
                <div className="relative z-10 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/10 mb-6 group cursor-default">
                        <Zap size={16} className="text-secondary-400 group-hover:scale-125 transition-transform" />
                        <span className="text-xs font-bold tracking-widest uppercase">System Optimal v2.0</span>
                    </div>
                    <h1 className="text-4xl lg:text-6xl font-extrabold font-display leading-[1.1] mb-6">
                        Your Gateway to a <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-secondary-400 font-black italic">
                            Smarter City.
                        </span>
                    </h1>
                    <p className="text-lg text-slate-300 mb-10 max-w-lg leading-relaxed font-medium">
                        Securely report incidents, monitor city infrastructure, and track resolution sequences in real-time. Direct communication with municipal authorities.
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <Link to="/submit" className="btn-primary">
                            <PlusCircle size={20} />
                            Initiate New Report
                        </Link>
                        <Link to="/track" className="btn-secondary !bg-white/10 !border-white/10 !text-white hover:!bg-white/20">
                            <Search size={20} />
                            Access tracking Vault
                        </Link>
                    </div>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="card-premium p-8 group relative overflow-hidden">
                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-slate-50 rounded-full transition-transform group-hover:scale-150"></div>
                        <div className="relative z-10">
                            <div className={`${stat.bg} ${stat.color} w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm`}>
                                <stat.icon size={26} />
                            </div>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">{stat.label}</p>
                            <h3 className="text-3xl font-black text-slate-900">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* My Complaints Section */}
                <div className="lg:col-span-2 card-premium p-8 lg:p-10 flex flex-col space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 font-display tracking-tight">My Complaints</h2>
                            <p className="text-slate-500 text-xs font-semibold">Track and view all civic issues submitted by your account</p>
                        </div>
                        <Link to="/submit" className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm transition-all uppercase tracking-wider shrink-0">
                            <PlusCircle size={16} />
                            <span>Report New Issue</span>
                        </Link>
                    </div>

                    <div className="space-y-4 flex-1">
                        {loading ? (
                            [1, 2, 3].map(i => (
                                <div key={i} className="h-24 bg-slate-50 rounded-3xl shimmer"></div>
                            ))
                        ) : complaints.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-center space-y-3">
                                <div className="w-12 h-12 bg-slate-200/60 rounded-2xl flex items-center justify-center text-slate-400">
                                    <MessageSquare size={24} />
                                </div>
                                <div>
                                    <p className="text-slate-700 font-bold text-sm">You haven't submitted any complaints yet.</p>
                                    <p className="text-slate-400 text-xs font-medium mt-0.5">Report local potholes, water leaks, or street light issues to your city administration.</p>
                                </div>
                                <Link to="/submit" className="px-4 py-2 bg-primary-600 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5 mt-2">
                                    <PlusCircle size={14} />
                                    <span>Submit Complaint Now</span>
                                </Link>
                            </div>
                        ) : (
                            complaints.map((c) => (
                                <div
                                    key={c._id}
                                    className="p-5 bg-white border border-slate-150 rounded-2xl hover:shadow-lg hover:border-primary-200 transition-all space-y-3"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono text-xs font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                                                #{c.complaintId}
                                            </span>
                                            <h3 className="font-bold text-slate-900 text-base line-clamp-1">{c.title}</h3>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                                c.priority === 'Critical' ? 'bg-red-100 text-red-700 border border-red-200' :
                                                c.priority === 'High' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                                                c.priority === 'Medium' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                                                'bg-slate-100 text-slate-600'
                                            }`}>
                                                {c.priority || 'Medium'} Priority
                                            </span>
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                                c.status === 'Resolved' || c.status === 'Closed' ? 'bg-emerald-100 text-emerald-700' :
                                                c.status === 'In Progress' || c.status === 'Assigned' ? 'bg-amber-100 text-amber-700' :
                                                'bg-slate-100 text-slate-700'
                                            }`}>
                                                {c.status}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 font-medium pt-1 border-t border-slate-100">
                                        <div className="flex flex-wrap items-center gap-4">
                                            <div className="flex items-center gap-1 text-slate-600 font-semibold">
                                                <MapPin size={14} className="text-primary-500 shrink-0" />
                                                <span className="truncate max-w-[200px]">{c.location || c.assignedDepartment || 'City Area'}</span>
                                            </div>
                                            <span className="text-slate-300">•</span>
                                            <span className="text-slate-500 font-bold">{c.category}</span>
                                            {c.assignedDepartment && (
                                                <>
                                                    <span className="text-slate-300">•</span>
                                                    <span className="text-slate-500 font-semibold">{c.assignedDepartment}</span>
                                                </>
                                            )}
                                        </div>

                                        <Link
                                            to={`/track?id=${c.complaintId}`}
                                            className="px-3 py-1.5 bg-slate-100 hover:bg-primary-50 text-slate-700 hover:text-primary-600 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 ml-auto"
                                        >
                                            <span>Track Complaint</span>
                                            <ArrowRight size={14} />
                                        </Link>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* City Analytics Widget */}
                <div className="card-premium p-8 lg:p-10 bg-gradient-to-br from-primary-600 to-primary-800 border-none text-white relative overflow-hidden group">
                    <div className="absolute -right-20 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="relative z-10 h-full flex flex-col">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                                <TrendingUp size={22} />
                            </div>
                            <h2 className="text-xl font-bold font-display leading-tight">Infrastructure Efficiency</h2>
                        </div>

                        <div className="flex-1 min-h-[220px]">
                            <Line data={chartData} options={chartOptions} />
                        </div>

                        <div className="mt-8 pt-8 border-t border-white/10">
                            <div className="flex justify-between items-center px-2">
                                <div className="text-center">
                                    <p className="text-[10px] uppercase font-bold text-white/60 tracking-widest mb-1">Density</p>
                                    <p className="text-2xl font-black italic tracking-tighter">0.82</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] uppercase font-bold text-white/60 tracking-widest mb-1">Response</p>
                                    <p className="text-2xl font-black italic tracking-tighter">94%</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] uppercase font-bold text-white/60 tracking-widest mb-1">Rating</p>
                                    <p className="text-2xl font-black italic tracking-tighter">A+</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Nearby Alerts & Announcements */}
            <div className="grid lg:grid-cols-3 gap-8">
                {/* Nearby Alerts */}
                <div className="lg:col-span-2 card-premium p-8 lg:p-10">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shadow-sm">
                                <ShieldAlert size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900 font-display uppercase italic">Critical Alerts</h2>
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Real-time hazard telemetry</p>
                            </div>
                        </div>
                        <span className="px-4 py-1.5 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest animate-pulse">Live</span>
                    </div>

                    <div className="space-y-4">
                        {alerts.length === 0 ? (
                            <div className="p-10 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200 text-center">
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No active alerts in current sector</p>
                            </div>
                        ) : (
                            alerts.slice(0, 3).map((alert, i) => (
                                <div key={i} className={`p-6 rounded-[1.5rem] border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group transition-all ${alert.severity === 'Critical' ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
                                    <div className="flex gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${alert.severity === 'Critical' ? 'bg-rose-100 text-rose-600' : 'bg-white text-primary-600 shadow-sm'}`}>
                                            <AlertTriangle size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-extrabold text-slate-900 group-hover:text-rose-600 transition-colors">{alert.title}</h4>
                                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">
                                                <MapPin size={12} className="text-primary-500" />
                                                {alert.area}
                                            </div>
                                        </div>
                                    </div>
                                    <span className={`px-4 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${alert.severity === 'Critical' ? 'bg-rose-600 text-white shadow-lg shadow-rose-200' : 'bg-white border border-slate-100 text-slate-500'}`}>
                                        {alert.severity}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* City Announcements */}
                <div className="card-premium p-8 lg:p-10 bg-white">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center shadow-sm">
                            <Megaphone size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 font-display uppercase italic">City News</h2>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Official announcements</p>
                        </div>
                    </div>
                    <div className="space-y-6">
                        {announcements.length === 0 ? (
                            <div className="text-center py-10 opacity-50">
                                <p className="text-xs font-bold uppercase tracking-widest">Quiet in the city today...</p>
                            </div>
                        ) : (
                            announcements.slice(0, 3).map((news, i) => (
                                <div key={i} className="group cursor-pointer">
                                    <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest mb-1">{news.category}</p>
                                    <h4 className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors line-clamp-2 leading-tight mb-2">{news.title}</h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">{new Date(news.createdAt).toLocaleDateString()}</p>
                                    {i < Math.min(announcements.length, 3) - 1 && <div className="mt-6 border-b border-slate-50" />}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Nearby Emergency Services */}
            <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <h2 className="text-3xl font-black text-slate-900 font-display tracking-tight uppercase italic">Nearby <span className="text-primary-600">Services</span></h2>
                        <p className="text-slate-500 font-bold tracking-widest text-[10px] uppercase">Immediate response infrastructure in your perimeter</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        { title: 'City Hospital', category: 'Health', distance: '0.8km', status: 'Operational', icon: Users, color: 'text-rose-600', bg: 'bg-rose-50' },
                        { title: 'Police Sector 4', category: 'Security', distance: '1.2km', status: 'Optimal', icon: ShieldAlert, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { title: 'Fire Response Unit', category: 'Emergency', distance: '2.5km', status: 'Active', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
                    ].map((svc, i) => (
                        <div key={i} className="card-premium p-10 group relative overflow-hidden transition-all hover:-translate-y-2">
                            <div className={`absolute top-0 right-0 w-32 h-32 ${svc.bg} rounded-bl-[5rem] translate-x-10 -translate-y-10 group-hover:scale-125 transition-transform`}></div>
                            <div className="relative z-10">
                                <div className={`${svc.bg} ${svc.color} w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:rotate-6 transition-transform`}>
                                    <svc.icon size={32} />
                                </div>
                                <div className="space-y-1 mb-6">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{svc.category}</p>
                                    <h4 className="text-2xl font-black text-slate-900 font-display tracking-tight">{svc.title}</h4>
                                </div>
                                <div className="flex items-center justify-between border-t border-slate-50 pt-6">
                                    <div className="flex items-center gap-2">
                                        <MapPin size={14} className="text-primary-600" />
                                        <span className="text-sm font-black text-slate-900 italic tracking-tighter">{svc.distance}</span>
                                    </div>
                                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest">{svc.status}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Featured Service Grid and Feedback Section */}
            <div className="grid md:grid-cols-3 gap-6">
                {[
                    { icon: ShieldAlert, title: 'Rapid Response', desc: 'Direct emergency link to municipal safety units.', color: 'from-orange-500 to-red-500' },
                    { icon: BarChart3, title: 'Data Integrity', desc: 'Verified status updates through decentralized tracking.', color: 'from-blue-500 to-indigo-500' },
                    { icon: Users, title: 'Citizen Voice', desc: 'Direct democratic engagement in city prioritization.', color: 'from-emerald-500 to-teal-500', action: () => setShowFeedback(true) }
                ].map((tool, i) => (
                    <div key={i} className="card-premium p-8 group overflow-hidden">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tool.color} flex items-center justify-center text-white mb-6 shadow-lg shadow-black/10 transition-transform group-hover:rotate-6`}>
                            <tool.icon size={24} />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 mb-3 tracking-tight">{tool.title}</h3>
                        <p className="text-sm text-slate-500 font-semibold leading-relaxed mb-6">{tool.desc}</p>
                        <button
                            onClick={tool.action}
                            className="text-xs font-black uppercase text-slate-400 group-hover:text-primary-600 tracking-[0.2em] flex items-center gap-2 transition-colors"
                        >
                            {tool.action ? 'Submit Feedback' : 'Explore Hub'} <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-all" />
                        </button>
                    </div>
                ))}
            </div>

            {/* Feedback Modal */}
            {showFeedback && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl relative animate-in zoom-in-95 duration-300">
                        <button onClick={() => setShowFeedback(false)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-600">
                            <Zap size={24} className="rotate-45" />
                        </button>
                        <h2 className="text-2xl font-black text-slate-900 font-display mb-2">Public Sentiment Node</h2>
                        <p className="text-slate-500 font-bold tracking-widest text-[10px] uppercase mb-8">Transmit your experience to the municipal council</p>

                        <form onSubmit={handleFeedbackSubmit} className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Service Rating</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setFeedbackForm({ ...feedbackForm, rating: star })}
                                            className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg transition-all ${feedbackForm.rating >= star ? 'bg-amber-100 text-amber-600 shadow-sm' : 'bg-slate-50 text-slate-300'}`}
                                        >
                                            ★
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Feedback Category</label>
                                <select
                                    className="input-field"
                                    value={feedbackForm.category}
                                    onChange={e => setFeedbackForm({ ...feedbackForm, category: e.target.value })}
                                >
                                    <option value="App Experience">APP EXPERIENCE</option>
                                    <option value="City Services">CITY SERVICES</option>
                                    <option value="Infrastructure">INFRASTRUCTURE</option>
                                    <option value="Other">OTHER</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Operational Comments</label>
                                <textarea
                                    placeholder="DETAILED FEEDBACK PAYLOAD..."
                                    className="input-field h-32"
                                    value={feedbackForm.comment}
                                    onChange={e => setFeedbackForm({ ...feedbackForm, comment: e.target.value })}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submittingFeedback}
                                className="w-full h-16 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary-200 transition-all flex items-center justify-center gap-2"
                            >
                                {submittingFeedback ? <Loader2 className="animate-spin" size={20} /> : <><Send size={18} /> Transmit Evaluation</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Home;
