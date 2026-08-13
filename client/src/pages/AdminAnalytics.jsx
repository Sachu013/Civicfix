import React, { useState, useEffect } from 'react';
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
    LineChart,
    Line,
    Legend
} from 'recharts';
import {
    Activity,
    AlertTriangle,
    BarChart3,
    Building2,
    Calendar,
    CheckCircle,
    Clock,
    Filter,
    Flame,
    Layers,
    Loader2,
    MapPin,
    MessageSquare,
    TrendingUp,
    Zap,
    Bot,
    Sparkles,
    ShieldAlert,
    RefreshCw
} from 'lucide-react';
import api from '../api';
import AnalyticsMap from '../components/AnalyticsMap';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#6366f1', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

const AdminAnalytics = () => {
    const { userInfo } = useAuth();
    const isSuperAdmin = ['admin', 'super_admin'].includes(userInfo?.role);
    const userDeptCode = userInfo?.departmentCode || '';

    const [period, setPeriod] = useState('30days');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [filterCategory, setFilterCategory] = useState('all');
    const [filterDepartment, setFilterDepartment] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');

    const [loading, setLoading] = useState(true);
    const [overview, setOverview] = useState(null);
    const [categories, setCategories] = useState(null);
    const [severityPriority, setSeverityPriority] = useState(null);
    const [departments, setDepartments] = useState([]);
    const [slaData, setSlaData] = useState(null);
    const [trends, setTrends] = useState(null);
    const [geospatial, setGeospatial] = useState(null);
    const [hotspots, setHotspots] = useState(null);
    const [anomalies, setAnomalies] = useState(null);
    const [insights, setInsights] = useState(null);
    const [deptList, setDeptList] = useState([]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const params = {};
            if (period === 'custom') {
                if (startDate) params.startDate = startDate;
                if (endDate) params.endDate = endDate;
            } else {
                params.period = period;
            }

            if (filterCategory !== 'all') params.category = filterCategory;
            if (filterDepartment !== 'all') params.departmentCode = filterDepartment;
            if (filterStatus !== 'all') params.status = filterStatus;

            const [
                overviewRes,
                catRes,
                sevPriRes,
                deptRes,
                slaRes,
                trendRes,
                geoRes,
                hotspotRes,
                anomalyRes,
                insightRes,
                deptListRes
            ] = await Promise.all([
                api.get('/admin/analytics/overview', { params }),
                api.get('/admin/analytics/categories', { params }),
                api.get('/admin/analytics/severity-priority', { params }),
                api.get('/admin/analytics/departments', { params }),
                api.get('/admin/analytics/sla', { params }),
                api.get('/admin/analytics/trends', { params }),
                api.get('/admin/analytics/geospatial', { params }),
                api.get('/admin/analytics/hotspots', { params }),
                api.get('/admin/analytics/anomalies', { params }),
                api.get('/admin/analytics/insights', { params }),
                api.get('/departments')
            ]);

            setOverview(overviewRes.data);
            setCategories(catRes.data);
            setSeverityPriority(sevPriRes.data);
            setDepartments(deptRes.data);
            setSlaData(slaRes.data);
            setTrends(trendRes.data);
            setGeospatial(geoRes.data);
            setHotspots(hotspotRes.data);
            setAnomalies(anomalyRes.data);
            setInsights(insightRes.data);
            setDeptList(deptListRes.data);
        } catch (error) {
            console.error('Failed to load civic analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, [period, startDate, endDate, filterCategory, filterDepartment, filterStatus]);

    if (loading || !overview) return (
        <div className="h-[70vh] flex items-center justify-center">
            <Loader2 className="animate-spin text-primary-500" size={48} />
        </div>
    );

    const summaryCards = [
        { label: 'Total Complaints', value: overview.total, icon: MessageSquare, color: 'text-primary-600', bg: 'bg-primary-50' },
        { label: 'Open Complaints', value: overview.open, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Resolved Complaints', value: overview.resolved + overview.closed, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Critical Priority', value: overview.critical, icon: Flame, color: 'text-red-600', bg: 'bg-red-50' },
        { label: 'SLA Breached', value: overview.slaBreached, icon: Zap, color: 'text-rose-600', bg: 'bg-rose-50' },
        { label: 'Escalated Count', value: overview.escalated, icon: Activity, color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: 'Resolution Rate', value: `${overview.resolutionRate}%`, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'SLA Compliance', value: `${overview.slaComplianceRate}%`, icon: BarChart3, color: 'text-teal-600', bg: 'bg-teal-50' },
    ];

    const complaintFeatures = (geospatial?.features || []).map(f => ({
        _id: f.properties.id,
        complaintId: f.properties.complaintId,
        title: f.properties.title,
        category: f.properties.category,
        subcategory: f.properties.subcategory,
        severity: f.properties.severity,
        priority: f.properties.priority,
        status: f.properties.status,
        assignedDepartment: f.properties.assignedDepartment,
        latitude: f.geometry.coordinates[1],
        longitude: f.geometry.coordinates[0],
    }));

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-primary-600 text-white text-[10px] font-black uppercase rounded-lg">
                            Civic Analytics Engine
                        </span>
                        {userDeptCode && (
                            <span className="px-3 py-1 bg-slate-900 text-white text-[10px] font-black uppercase rounded-lg font-mono">
                                {userDeptCode}
                            </span>
                        )}
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 font-display tracking-tight uppercase italic">
                        {isSuperAdmin
                            ? 'Civic Intelligence & Global Analytics'
                            : `${userDeptCode} Department Telemetry & Analytics`}
                    </h1>
                    <p className="text-slate-500 font-bold tracking-widest text-xs uppercase">
                        {isSuperAdmin
                            ? 'Deterministic Municipal Telemetry, Geospatial Hotspots & Trend Engine'
                            : 'Department-Scoped Incident Heatmap & Workload Telemetry'}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchAnalytics}
                        className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:text-primary-600 shadow-sm transition-colors"
                        title="Refresh Analytics"
                    >
                        <RefreshCw size={18} />
                    </button>
                </div>
            </div>

            {/* Time Filter Controls Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-primary-600" />
                    <span className="text-xs font-black uppercase text-slate-700">Date Range:</span>
                    <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                        {[
                            { id: 'today', label: 'Today' },
                            { id: '7days', label: '7 Days' },
                            { id: '30days', label: '30 Days' },
                            { id: '90days', label: '90 Days' },
                            { id: 'year', label: 'This Year' },
                            { id: 'custom', label: 'Custom' },
                        ].map((p) => (
                            <button
                                key={p.id}
                                onClick={() => setPeriod(p.id)}
                                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                                    period === p.id ? 'bg-primary-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'
                                }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                {period === 'custom' && (
                    <div className="flex items-center gap-2 text-xs">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                        />
                        <span className="text-slate-400 font-bold">to</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                        />
                    </div>
                )}

                {/* Dimensional Filters */}
                <div className="flex items-center gap-3">
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                    >
                        <option value="all">All Categories</option>
                        {categories?.categories?.map((c) => (
                            <option key={c.category} value={c.category}>{c.category}</option>
                        ))}
                    </select>

                    {/* Department Switcher Dropdown (Visible ONLY for Super Admin) */}
                    {isSuperAdmin && (
                        <select
                            value={filterDepartment}
                            onChange={(e) => setFilterDepartment(e.target.value)}
                            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                        >
                            <option value="all">All Departments</option>
                            {deptList.map((d) => (
                                <option key={d._id} value={d.code}>{d.name}</option>
                            ))}
                        </select>
                    )}
                </div>
            </div>

            {/* AI Civic Insights Executive Briefing Banner */}
            <div className="card-premium p-8 bg-slate-900 text-white relative overflow-hidden space-y-6">
                <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                    <div className="w-10 h-10 bg-primary-500/20 text-primary-400 rounded-xl flex items-center justify-center">
                        <Bot size={22} />
                    </div>
                    <div>
                        <h2 className="text-lg font-black font-display uppercase italic tracking-tight">AI Executive Civic Briefing</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Fact-Based Executive Intelligence Summary</p>
                    </div>
                </div>

                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-slate-200 text-sm font-semibold leading-relaxed">
                    "{insights?.executiveSummary}"
                </div>

                {/* Insights List Cards */}
                <div className="grid md:grid-cols-3 gap-4">
                    {insights?.insights?.map((ins, idx) => (
                        <div key={idx} className="p-4 bg-white/10 rounded-xl border border-white/10 space-y-1">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-primary-400 uppercase tracking-wider">{ins.type.replace('_', ' ')}</span>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                    ins.severity === 'Critical' ? 'bg-red-500 text-white' :
                                    ins.severity === 'High' ? 'bg-amber-500 text-white' : 'bg-slate-700 text-slate-300'
                                }`}>
                                    {ins.severity}
                                </span>
                            </div>
                            <h4 className="font-bold text-xs text-white">{ins.title}</h4>
                            <p className="text-[11px] text-slate-300 font-medium leading-normal">{ins.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* 8 Overview Metric Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
                {summaryCards.map((stat, i) => (
                    <div key={i} className="card-premium p-4 group transition-all hover:translate-y-[-2px] flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{stat.label}</span>
                            <div className={`p-2 rounded-xl ${stat.bg} ${stat.color}`}>
                                <stat.icon size={16} />
                            </div>
                        </div>
                        <div className="mt-3">
                            <span className="text-2xl font-black text-slate-900 tracking-tight">{stat.value}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Volume Anomaly Alerts */}
            {anomalies?.anomalyDetected && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-rose-600">
                        <ShieldAlert size={20} />
                        <h3 className="text-sm font-black uppercase tracking-wider">Volume Anomaly Alerts Detected</h3>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        {anomalies.anomalies.map((anom, idx) => (
                            <div key={idx} className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
                                <AlertTriangle className="text-rose-600 shrink-0 mt-1" size={20} />
                                <div>
                                    <h4 className="font-extrabold text-xs text-rose-900">{anom.metric} — {anom.category}</h4>
                                    <p className="text-xs text-rose-700 font-medium mt-0.5">{anom.message}</p>
                                    <span className="text-[10px] font-mono text-rose-500 font-bold mt-1 block">Deviation: +{anom.deviationStdDev} Std Dev above baseline</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Trends & Category Distribution Charts Grid */}
            <div className="grid lg:grid-cols-3 gap-8">
                {/* Time Series Trend Line Graph */}
                <div className="lg:col-span-2 card-premium p-6 bg-white space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div>
                            <h3 className="text-base font-black text-slate-900 uppercase italic">Complaint Volume Time-Series Trend</h3>
                            <p className="text-xs text-slate-500 font-semibold">Period-over-period change: <span className={`font-black ${trends?.percentageChange > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{trends?.percentageChange > 0 ? '+' : ''}{trends?.percentageChange}%</span></p>
                        </div>
                        <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-black uppercase">{trends?.interval || 'Daily'} Interval</span>
                    </div>

                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trends?.timeSeries || []}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 10 }} />
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '12px', fontSize: '12px' }} />
                                <Line type="monotone" dataKey="total" stroke="#0ea5e9" strokeWidth={3} name="Total Volume" />
                                <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} name="Resolved" />
                                <Line type="monotone" dataKey="critical" stroke="#ef4444" strokeWidth={2} name="Critical" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Main Category Bar Chart */}
                <div className="card-premium p-6 bg-white space-y-6">
                    <div className="border-b border-slate-100 pb-4">
                        <h3 className="text-base font-black text-slate-900 uppercase italic">Top Main Categories</h3>
                        <p className="text-xs text-slate-500 font-semibold">Distribution by primary taxonomy vector</p>
                    </div>

                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={categories?.categories?.slice(0, 5) || []} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis type="number" tick={{ fontSize: 10 }} />
                                <YAxis dataKey="category" type="category" width={110} tick={{ fontSize: 9, fontWeight: 'bold' }} />
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '12px', fontSize: '12px' }} />
                                <Bar dataKey="count" fill="#0ea5e9" radius={[0, 8, 8, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Department Performance Matrix Table */}
            <div className="card-premium overflow-hidden bg-white">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-black text-slate-900 uppercase italic">Department Performance & Workload Matrix</h3>
                        <p className="text-xs text-slate-500 font-semibold">Workload distribution, resolution speed and SLA compliance by department</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                <th className="p-4">Department Name</th>
                                <th className="p-4">Code</th>
                                <th className="p-4 text-center">Assigned</th>
                                <th className="p-4 text-center">Open</th>
                                <th className="p-4 text-center">Resolved</th>
                                <th className="p-4 text-center">Critical</th>
                                <th className="p-4 text-center">SLA Breached</th>
                                <th className="p-4 text-center">Resolution Rate</th>
                                <th className="p-4 text-center">SLA Compliance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-semibold">
                            {departments.map((d) => (
                                <tr key={d.code} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="p-4 font-extrabold text-slate-900">{d.name}</td>
                                    <td className="p-4 font-mono font-bold text-primary-600">{d.code}</td>
                                    <td className="p-4 text-center font-bold">{d.totalAssigned}</td>
                                    <td className="p-4 text-center text-amber-600 font-bold">{d.openCount}</td>
                                    <td className="p-4 text-center text-emerald-600 font-bold">{d.resolvedCount}</td>
                                    <td className="p-4 text-center text-red-600 font-bold">{d.criticalCount}</td>
                                    <td className="p-4 text-center text-rose-600 font-bold">{d.breachedCount}</td>
                                    <td className="p-4 text-center font-black">{d.resolutionRate}%</td>
                                    <td className="p-4 text-center font-black">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                                            d.slaComplianceRate >= 90 ? 'bg-emerald-100 text-emerald-700' :
                                            d.slaComplianceRate >= 75 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                            {d.slaComplianceRate}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Geospatial Hotspots & Heatmap Section */}
            <div className="card-premium p-6 bg-white space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                        <h3 className="text-base font-black text-slate-900 uppercase italic">Geospatial Complaint Heatmap & Hotspot Overlay</h3>
                        <p className="text-xs text-slate-500 font-semibold">Spatial density clusters and hotspot circles (≥ 5 complaints)</p>
                    </div>
                    <span className="px-3 py-1 bg-red-50 text-red-700 rounded-lg text-[10px] font-black uppercase">
                        {hotspots?.totalHotspots || 0} Hotspots Detected
                    </span>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <AnalyticsMap
                            complaints={complaintFeatures}
                            hotspots={hotspots?.hotspots || []}
                            center={[28.6139, 77.2090]}
                            zoom={12}
                        />
                    </div>

                    {/* Hotspot Clusters Sidebar */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-black text-slate-900 uppercase">Top Hotspot Concentrations</h4>

                        <div className="space-y-3 max-h-[440px] overflow-y-auto pr-2">
                            {hotspots?.hotspots && hotspots.hotspots.length > 0 ? (
                                hotspots.hotspots.map((hs, idx) => (
                                    <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black text-rose-600 uppercase font-mono">Cluster #{idx + 1}</span>
                                            <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full font-black text-[10px]">
                                                {hs.complaintCount} Complaints
                                            </span>
                                        </div>

                                        <p className="font-extrabold text-xs text-slate-900">{hs.dominantCategory}</p>

                                        <div className="text-[10px] text-slate-500 space-y-0.5 font-medium">
                                            <p>Coordinates: {hs.center.latitude}, {hs.center.longitude}</p>
                                            {hs.criticalCount > 0 && <p className="text-red-600 font-bold">⚠️ Critical Priority: {hs.criticalCount}</p>}
                                            {hs.slaBreachedCount > 0 && <p className="text-amber-600 font-bold">🚨 SLA Breaches: {hs.slaBreachedCount}</p>}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-slate-400 italic p-4 bg-slate-50 rounded-xl text-center">
                                    No significant complaint density hotspots detected.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminAnalytics;
