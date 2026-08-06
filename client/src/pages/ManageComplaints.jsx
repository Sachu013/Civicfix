import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Search,
    Filter,
    ChevronRight,
    MapPin,
    MessageSquare,
    Clock,
    CheckCircle,
    ArrowUpRight,
    TrendingUp,
    AlertTriangle,
    Zap,
    MoreVertical,
    Activity,
    Layers,
    ShieldCheck,
    Calendar
} from 'lucide-react';
import api from '../api';

const ManageComplaints = () => {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchComplaints = async () => {
            try {
                const { data } = await api.get('/admin/complaints');
                setComplaints(data);
            } catch (error) {
                // Ignore or handle gracefully
            } finally {
                setLoading(false);
            }
        };
        fetchComplaints();
    }, []);

    const filteredComplaints = complaints.filter((c) => {
        const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
        const matchesSearch =
            c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.complaintId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.user?.name && c.user.name.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesStatus && matchesSearch;
    });

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Search and Filters */}
            <div className="card-premium p-8 lg:p-10">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-10">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black text-slate-900 font-display tracking-tight">Incident <span className="text-primary-600">Vault</span></h1>
                        <p className="text-slate-400 font-semibold text-sm">Managing city-wide infrastructure logs and resolution triggers.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-1.5 flex gap-1">
                            {['all', 'Pending', 'In Progress', 'Resolved'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filterStatus === status ? 'bg-white text-primary-600 shadow-sm ring-1 ring-slate-100' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                                        }`}
                                >
                                    {status.replace('-', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-600 transition-colors" size={24} />
                    <input
                        type="text"
                        placeholder="Universal Vault Query (Name, ID, Title)..."
                        className="w-full h-16 pl-16 pr-8 bg-slate-50 border border-slate-100 rounded-[2rem] text-slate-900 font-bold focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 focus:bg-white transition-all text-lg shadow-inner"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Table Section */}
            <div className="card-premium overflow-hidden border-none shadow-premium">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Incident Identity</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Subject / Node</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Resolution Status</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Priority Tier</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 text-right">Binary Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="5" className="px-8 py-8"><div className="h-10 bg-slate-50 rounded-2xl shimmer"></div></td>
                                    </tr>
                                ))
                            ) : filteredComplaints.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-8 py-32 text-center bg-slate-25/50">
                                        <Activity className="mx-auto mb-6 text-slate-200" size={64} />
                                        <p className="text-xl font-black text-slate-300 uppercase tracking-widest">No matching logs found in current sector</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredComplaints.map((c) => (
                                    <tr key={c._id} className="group hover:bg-slate-25 transition-colors">
                                        <td className="px-8 py-7">
                                            <div className="flex flex-col">
                                                <span className="text-base font-black text-slate-900 group-hover:text-primary-600 transition-colors line-clamp-1">{c.title}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">ID: #{c.complaintId}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-7">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-black text-xs">
                                                    {c.user?.name?.charAt(0) || '?'}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-700">{c.user?.name || 'Unknown'}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 truncate max-w-[120px]">{c.user?.email || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-7">
                                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${c.status === 'Resolved' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                                                c.status === 'In Progress' ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-slate-50 border-slate-100 text-slate-400'
                                                }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${c.status === 'Resolved' ? 'bg-emerald-500 animate-pulse' :
                                                    c.status === 'In Progress' ? 'bg-amber-500 animate-pulse' : 'bg-slate-300'
                                                    }`}></div>
                                                {c.status}
                                            </div>
                                        </td>
                                        <td className="px-8 py-7">
                                            <div className={`flex items-center gap-2 font-black text-[10px] uppercase tracking-widest ${['high', 'urgent'].includes(c.urgency?.toLowerCase()) ? 'text-red-600' :
                                                c.urgency?.toLowerCase() === 'medium' ? 'text-amber-500' : 'text-slate-400'
                                                }`}>
                                                <ShieldCheck size={14} />
                                                {c.urgency || 'Normal'}
                                            </div>
                                        </td>
                                        <td className="px-8 py-7 text-right">
                                            <Link
                                                to={`/admin/complaint/${c._id}`}
                                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-50 text-primary-600 rounded-xl hover:bg-primary-600 hover:text-white transition-all font-bold text-xs"
                                            >
                                                Detailed Analysis
                                                <ChevronRight size={14} />
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center whitespace-nowrap overflow-hidden">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Displaying {filteredComplaints.length} anomalous logs</p>
                    <div className="flex gap-2">
                        {[1, 2, 3].map(i => (
                            <button key={i} className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${i === 1 ? 'bg-primary-600 text-white' : 'bg-white border border-slate-100 text-slate-400 hover:bg-slate-50'}`}>{i}</button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManageComplaints;
