import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';
import {
    MessageSquare,
    CheckCircle,
    Clock,
    Activity,
    AlertTriangle,
    ShieldCheck,
    Search,
    Filter,
    MoreVertical,
    ChevronRight,
    Send,
    Loader2
} from 'lucide-react';
import api from '../api';

const AdminDashboard = () => {
    const [metrics, setMetrics] = useState(null);
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Response Modal State
    const [showResponseModal, setShowResponseModal] = useState(false);
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [adminResponse, setAdminResponse] = useState('');
    const [updating, setUpdating] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [metricsRes, complaintsRes] = await Promise.all([
                api.get('/admin/metrics'),
                api.get('/admin/complaints')
            ]);
            setMetrics(metricsRes.data);
            setComplaints(complaintsRes.data);
        } catch (error) {
            // Ignore fetch errors
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleUpdateStatus = async (id, status) => {
        setUpdating(true);
        try {
            await api.put(`/admin/complaints/${id}`, { status });
            await fetchData();
        } catch (error) {
            alert('Failed to update status');
        } finally {
            setUpdating(false);
        }
    };

    const handleSendResponse = async () => {
        if (!adminResponse.trim()) return;
        setUpdating(true);
        try {
            await api.put(`/admin/complaints/${selectedComplaint._id}`, { adminResponse });
            setShowResponseModal(false);
            setAdminResponse('');
            await fetchData();
        } catch (error) {
            alert('Failed to send response');
        } finally {
            setUpdating(false);
        }
    };

    const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#6366f1', '#ef4444', '#8b5cf6'];

    const stats = [
        { label: 'Total Logs', value: metrics?.total || 0, icon: MessageSquare, color: 'text-primary-600', bg: 'bg-primary-50' },
        { label: 'Pending', value: metrics?.pending || 0, icon: Clock, color: 'text-rose-500', bg: 'bg-rose-50' },
        { label: 'In Progress', value: metrics?.inProgress || 0, icon: Activity, color: 'text-amber-500', bg: 'bg-amber-50' },
        { label: 'Resolved', value: metrics?.resolved || 0, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { label: 'New Today', value: metrics?.newToday || 0, icon: ShieldCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    ];

    const filteredComplaints = complaints.filter(c => {
        const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
        const matchesSearch = c.complaintId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.user?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    if (loading) return (
        <div className="h-[60vh] flex items-center justify-center">
            <Loader2 className="animate-spin text-primary-500" size={48} />
        </div>
    );

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black text-slate-900 font-display tracking-tight uppercase italic">Admin <span className="text-primary-600">Mainframe</span></h1>
                    <p className="text-slate-500 font-bold tracking-widest text-xs uppercase">City Digital Infrastructure Control Center</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-white p-1 rounded-2xl shadow-sm border border-slate-100 flex">
                        {['all', 'Pending', 'In Progress', 'Resolved'].map((s) => (
                            <button
                                key={s}
                                onClick={() => setFilterStatus(s)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === s ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900'}`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="card-premium p-6 group transition-all hover:translate-y-[-4px]">
                        <div className={`${stat.bg} ${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center mb-4`}>
                            <stat.icon size={22} />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                        <h3 className="text-3xl font-black text-slate-900">{stat.value}</h3>
                    </div>
                ))}
            </div>

            {/* Charts Grid */}
            <div className="grid lg:grid-cols-2 gap-8">
                {/* Category Bar Chart */}
                <div className="card-premium p-8">
                    <h3 className="text-lg font-black text-slate-800 mb-8 border-l-4 border-primary-500 pl-4 uppercase tracking-tight">Incidents by Sector</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={metrics?.categoryStats || []}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="count" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Status Pie Chart */}
                <div className="card-premium p-8">
                    <h3 className="text-lg font-black text-slate-800 mb-8 border-l-4 border-secondary-500 pl-4 uppercase tracking-tight">Resolution Integrity</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={metrics?.statusStats || []}
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={8}
                                    dataKey="count"
                                    nameKey="_id"
                                >
                                    {metrics?.statusStats?.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="card-premium overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/50">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 font-display">Operational Vault</h2>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Managing {filteredComplaints.length} unique nodes</p>
                    </div>
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="SEARCH VAULT..."
                            className="w-full h-12 pl-12 pr-4 bg-white border border-slate-200 rounded-2xl text-xs font-black tracking-widest focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all uppercase"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white border-b border-slate-100">
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Node ID</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Reporter</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Sector</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Binary Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 bg-white">
                            {filteredComplaints.map((c) => (
                                <tr key={c._id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-slate-900 group-hover:text-primary-600 transition-colors uppercase italic">{c.complaintId}</span>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{new Date(c.createdAt).toLocaleString()}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 font-black text-[10px] uppercase">
                                                {c.user?.name?.charAt(0) || '?'}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-slate-800 tracking-tight">{c.user?.name}</span>
                                                <span className="text-[10px] font-bold text-slate-400 lowercase opacity-60">{c.user?.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-700">{c.category}</span>
                                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                                <AlertTriangle size={10} className={c.urgency === 'High' ? 'text-rose-500' : 'text-slate-300'} />
                                                {c.location}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${c.status === 'Resolved' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                                            c.status === 'In Progress' ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-slate-50 border-slate-100 text-slate-400'
                                            }`}>
                                            {c.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                                            {c.status === 'Pending' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(c._id, 'In Progress')}
                                                    className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                                                    title="Mark In Progress"
                                                >
                                                    <Activity size={18} />
                                                </button>
                                            )}
                                            {c.status !== 'Resolved' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(c._id, 'Resolved')}
                                                    className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all"
                                                    title="Mark Resolved"
                                                >
                                                    <CheckCircle size={18} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => {
                                                    setSelectedComplaint(c);
                                                    setAdminResponse(c.adminResponse || '');
                                                    setShowResponseModal(true);
                                                }}
                                                className="p-2 text-primary-500 hover:bg-primary-50 rounded-lg transition-all"
                                                title="Official Feedback"
                                            >
                                                <Send size={18} />
                                            </button>
                                            <Link to={`/admin/complaint/${c._id}`} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-all">
                                                <ChevronRight size={18} />
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Official Response Modal */}
            {showResponseModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-lg bg-white rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-300 relative border border-slate-100">
                        <div className="absolute top-0 left-0 w-full h-2 bg-primary-600 rounded-t-full"></div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2 font-display uppercase italic tracking-tight">Official Feedback Node</h3>
                        <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-8 flex items-center gap-2">
                            Incident #{selectedComplaint?.complaintId}
                        </p>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Official Transmission</label>
                                <textarea
                                    className="w-full h-40 p-6 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all placeholder:text-slate-300"
                                    placeholder="Enter formal response to citizen..."
                                    value={adminResponse}
                                    onChange={(e) => setAdminResponse(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setShowResponseModal(false)}
                                    className="flex-1 h-16 bg-slate-50 hover:bg-slate-100 text-slate-400 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all"
                                >
                                    Abort
                                </button>
                                <button
                                    onClick={handleSendResponse}
                                    disabled={updating || !adminResponse.trim()}
                                    className="flex-1 h-16 bg-primary-600 hover:bg-primary-700 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-primary-200 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {updating ? <Loader2 className="animate-spin" size={20} /> : (
                                        <>
                                            Transmit Feedback
                                            <Send size={16} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
