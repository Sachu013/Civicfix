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
    ChevronRight,
    Loader2,
    Building2,
    Flame,
    Zap,
    Users,
    ArrowUpDown,
    CheckSquare,
    BarChart3
} from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export const getCanonicalUserId = (val) => {
    if (!val) return '';
    if (typeof val === 'string') {
        const trimmed = val.trim();
        if (trimmed === '[object Object]' || trimmed === 'null' || trimmed === 'undefined') return '';
        return trimmed;
    }
    if (typeof val === 'number') return String(val);

    if (typeof val === 'object' && val !== null) {
        if (val.buffer && Array.isArray(val.buffer.data)) {
            return val.buffer.data.map(b => b.toString(16).padStart(2, '0')).join('');
        }
        if (val.data && Array.isArray(val.data)) {
            return val.data.map(b => b.toString(16).padStart(2, '0')).join('');
        }
        if (val.$oid) return String(val.$oid).trim();

        const rawId = val._id || val.id;
        if (rawId) {
            if (typeof rawId === 'string' && rawId !== '[object Object]' && rawId !== 'null' && rawId !== 'undefined') {
                return rawId.trim();
            }
            if (typeof rawId === 'object' && rawId !== null) {
                if (rawId.buffer && Array.isArray(rawId.buffer.data)) {
                    return rawId.buffer.data.map(b => b.toString(16).padStart(2, '0')).join('');
                }
                if (rawId.data && Array.isArray(rawId.data)) {
                    return rawId.data.map(b => b.toString(16).padStart(2, '0')).join('');
                }
                if (rawId.$oid) return String(rawId.$oid).trim();
                const inner = getCanonicalUserId(rawId);
                if (inner) return inner;
            }
            if (typeof rawId.toString === 'function') {
                const str = rawId.toString();
                if (str && str !== '[object Object]' && str !== '[object Promise]') {
                    return str.trim();
                }
            }
        }

        if (typeof val.toString === 'function') {
            const str = val.toString();
            if (str && str !== '[object Object]' && str !== '[object Promise]') {
                return str.trim();
            }
        }
    }
    return '';
};

export const normalizeDeptCode = (code) => {
    if (!code) return '';
    const upper = String(code).trim().toUpperCase();
    if (upper === 'ROADS' || upper.includes('ROADS') || upper === 'ROADS_INFRASTRUCTURE') return 'ROADS';
    if (upper === 'WATER' || upper.includes('WATER') || upper === 'WATER_SUPPLY') return 'WATER';
    if (upper === 'SANITATION' || upper.includes('DRAINAGE') || upper.includes('SEWERAGE') || upper === 'DRAINAGE_SEWERAGE') return 'SANITATION';
    if (upper === 'WASTE' || upper.includes('WASTE') || upper.includes('GARBAGE') || upper === 'WASTE_MANAGEMENT_SANITATION') return 'WASTE';
    if (upper === 'ELECTRICAL' || upper.includes('STREETLIGHT') || upper.includes('ELECTRIC') || upper === 'STREETLIGHTS_ELECTRICITY') return 'ELECTRICAL';
    if (upper === 'PUBLIC_WORKS' || upper.includes('PUBLIC_WORKS') || upper.includes('PUBLIC SAFETY') || upper === 'PUBLIC_SAFETY_OTHER_CIVIC_HAZARDS') return 'PUBLIC_WORKS';
    return upper;
};

const AdminDashboard = () => {
    const { userInfo } = useAuth();
    const isSuperAdmin = userInfo?.role === 'super_admin' || userInfo?.role === 'admin';
    const isDeptHead = userInfo?.role === 'department_head';
    const isVerifier = userInfo?.role === 'verifier';
    const userDeptCode = userInfo?.departmentCode || '';

    const [metrics, setMetrics] = useState(null);
    const [complaints, setComplaints] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [staffMembers, setStaffMembers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterDepartment, setFilterDepartment] = useState('all');
    const [filterSlaStatus, setFilterSlaStatus] = useState('all');
    const [filterEscalation, setFilterEscalation] = useState('all');
    const [filterPriority, setFilterPriority] = useState('all');
    const [filterSeverity, setFilterSeverity] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Reassignment / Staff Assignment Modal State
    const [showReassignModal, setShowReassignModal] = useState(false);
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [targetDeptCode, setTargetDeptCode] = useState('');
    const [selectedStaffId, setSelectedStaffId] = useState('');
    const [reassignReason, setReassignReason] = useState('');
    const [updating, setUpdating] = useState(false);

    // Filter Tabs for Department Head
    const [deptHeadTab, setDeptHeadTab] = useState('all'); // 'all', 'unassigned', 'assigned'

    // Verifier Assignment Modal State (Phase 3)
    const [showAssignVerifierModal, setShowAssignVerifierModal] = useState(false);
    const [assignTargetComplaint, setAssignTargetComplaint] = useState(null);
    const [selectedVerifierId, setSelectedVerifierId] = useState('');
    const [assignReason, setAssignReason] = useState('');
    const [assignErrorMessage, setAssignErrorMessage] = useState('');

    // Priority Change Modal State
    const [showPriorityModal, setShowPriorityModal] = useState(false);
    const [priorityComplaint, setPriorityComplaint] = useState(null);
    const [selectedPriority, setSelectedPriority] = useState('Medium');

    const fetchData = async () => {
        setLoading(true);
        try {
            let complaintsData = [];
            const [metricsRes, deptsRes] = await Promise.all([
                api.get('/admin/metrics'),
                api.get('/departments')
            ]);
            setMetrics(metricsRes.data);
            setDepartments(deptsRes.data);

            if (isVerifier) {
                try {
                    const assignedRes = await api.get('/complaints/assigned-to-me');
                    complaintsData = assignedRes.data;
                } catch (e) {
                    const allRes = await api.get('/admin/complaints');
                    complaintsData = allRes.data;
                }
            } else if (isDeptHead) {
                try {
                    const deptCompRes = await api.get('/department/complaints');
                    complaintsData = deptCompRes.data?.complaints || (Array.isArray(deptCompRes.data) ? deptCompRes.data : []);
                } catch (e) {
                    const allRes = await api.get('/admin/complaints');
                    complaintsData = allRes.data;
                }
            } else {
                const complaintsRes = await api.get('/admin/complaints');
                complaintsData = complaintsRes.data;
            }
            setComplaints(complaintsData);

            if (isDeptHead) {
                try {
                    const staffRes = await api.get('/department/staff', {
                        params: userDeptCode ? { departmentCode: userDeptCode } : {}
                    });
                    setStaffMembers(staffRes.data.staffMembers || []);
                } catch (e) {
                    console.error('Failed to fetch department staff list:', e);
                }
            }
        } catch (error) {
            console.error('Failed to load dashboard metrics:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [userInfo?.role, userInfo?.departmentCode]);

    const handleQuickAssign = async () => {
        if (!selectedComplaint || !targetDeptCode) return;
        setUpdating(true);
        try {
            await api.post(`/admin/complaints/${selectedComplaint._id}/assign`, {
                departmentCode: targetDeptCode,
                reason: reassignReason || 'Manual assignment via admin dashboard',
            });
            setShowReassignModal(false);
            setReassignReason('');
            await fetchData();
        } catch (error) {
            alert('Failed to reassign department');
        } finally {
            setUpdating(false);
        }
    };

    const handleOpenAssignModal = async (c) => {
        setAssignTargetComplaint(c);
        setAssignErrorMessage('');
        const verifierObj = c.assignedVerifier || c.assignedTo;
        const currentVerifierId = getCanonicalUserId(verifierObj);

        setSelectedVerifierId(currentVerifierId);
        setAssignReason('');
        setShowAssignVerifierModal(true);

        const deptCode = normalizeDeptCode(c.departmentCode) || normalizeDeptCode(userDeptCode);
        try {
            const staffRes = await api.get('/department/staff', {
                params: deptCode ? { departmentCode: deptCode } : {}
            });
            const members = staffRes.data?.staffMembers || [];
            if (members.length > 0) {
                setStaffMembers(members);
                if (currentVerifierId) {
                    const matched = members.find(m => 
                        getCanonicalUserId(m) === currentVerifierId || 
                        m.email === currentVerifierId || 
                        String(m._id) === currentVerifierId
                    );
                    if (matched) {
                        setSelectedVerifierId(getCanonicalUserId(matched));
                    }
                }
            } else {
                const fallbackRes = await api.get('/admin/department-users');
                const allUsers = fallbackRes.data || [];
                const verifiers = allUsers.filter(u => u.role === 'verifier' || u.role === 'department_staff');
                setStaffMembers(verifiers);
            }
        } catch (e) {
            try {
                const fallbackRes = await api.get('/admin/department-users');
                const allUsers = fallbackRes.data || [];
                const verifiers = allUsers.filter(u => u.role === 'verifier' || u.role === 'department_staff');
                setStaffMembers(verifiers);
            } catch (err) {
                console.error('Failed to fetch department staff list on modal open:', err);
            }
        }
    };

    const handleAssignVerifier = async (e) => {
        e?.preventDefault();
        if (!assignTargetComplaint) return;
        setAssignErrorMessage('');

        const targetId = getCanonicalUserId(assignTargetComplaint._id || assignTargetComplaint.id || assignTargetComplaint.complaintId) || assignTargetComplaint.complaintId;
        const cleanStaffId = getCanonicalUserId(selectedVerifierId) || (typeof selectedVerifierId === 'string' ? selectedVerifierId.trim() : '');
        const currentVerifier = assignTargetComplaint.assignedVerifier || assignTargetComplaint.assignedTo;

        // If no verifier selected and complaint is unassigned, stop with a clear error message (do NOT convert to unassign)
        if (!cleanStaffId && !currentVerifier) {
            setAssignErrorMessage('Please select a field verifier from the dropdown before assigning.');
            return;
        }

        setUpdating(true);
        try {
            const isUnassigning = !cleanStaffId && !!currentVerifier;
            const payload = {
                complaintId: targetId,
                staffId: cleanStaffId || null,
                verifierId: cleanStaffId || null,
                reason: assignReason || (cleanStaffId ? 'Assigned verifier by Dept Head' : 'Unassigned verifier by Dept Head'),
                action: isUnassigning ? 'unassign' : 'assign'
            };

            console.log('[DEBUG handleAssignVerifier Payload]:', payload);
            const response = await api.post('/department/assign', payload);

            if (response.data?.success || response.status === 200) {
                setShowAssignVerifierModal(false);
                setAssignTargetComplaint(null);
                setSelectedVerifierId('');
                setAssignReason('');
                setAssignErrorMessage('');
                await fetchData();
            } else {
                setAssignErrorMessage(response.data?.message || 'Assignment failed');
            }
        } catch (error) {
            console.error('Failed to assign verifier:', error);
            const msg = error.response?.data?.message || error.message || 'Failed to assign verifier';
            setAssignErrorMessage(msg);
        } finally {
            setUpdating(false);
        }
    };

    const handleCorrectClassification = async () => {
        if (!aiModalComplaint) return;
        setUpdating(true);
        try {
            await api.put(`/admin/complaints/${aiModalComplaint._id}/classification`, correctForm);
            setShowAiModal(false);
            await fetchData();
        } catch (error) {
            alert('Failed to update classification');
        } finally {
            setUpdating(false);
        }
    };

    const handleUpdatePriority = async () => {
        if (!priorityComplaint || !selectedPriority) return;
        setUpdating(true);
        try {
            await api.patch(`/admin/complaints/${priorityComplaint._id}/priority`, { priority: selectedPriority });
            setShowPriorityModal(false);
            await fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to update complaint priority');
        } finally {
            setUpdating(false);
        }
    };

    const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#6366f1', '#ef4444', '#8b5cf6'];

    // 8 Required Metric Cards
    const summaryCards = [
        { label: 'Total Complaints', value: metrics?.total || 0, icon: MessageSquare, color: 'text-primary-600', bg: 'bg-primary-50' },
        { label: 'Unassigned', value: metrics?.unassigned || 0, icon: Users, color: 'text-rose-600', bg: 'bg-rose-50' },
        { label: 'Critical', value: metrics?.critical || 0, icon: Flame, color: 'text-red-600', bg: 'bg-red-50' },
        { label: 'High Priority', value: metrics?.highPriority || 0, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Due Soon', value: metrics?.dueSoon || 0, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
        { label: 'SLA Breached', value: metrics?.slaBreached || 0, icon: Zap, color: 'text-red-500', bg: 'bg-red-50' },
        { label: 'Resolved', value: metrics?.resolved || 0, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Escalated', value: metrics?.escalated || 0, icon: Activity, color: 'text-purple-600', bg: 'bg-purple-50' },
    ];

    const filteredComplaints = complaints.filter(c => {
        const isVerifierAssigned = !!(c.assignedVerifier || c.assignedTo);
        const matchesDeptHeadScope = !isDeptHead || (
            normalizeDeptCode(c.departmentCode) === normalizeDeptCode(userDeptCode) ||
            normalizeDeptCode(c.assignedDepartment) === normalizeDeptCode(userDeptCode)
        );
        const matchesDeptHeadTab = !isDeptHead || deptHeadTab === 'all' ||
            (deptHeadTab === 'unassigned' && !isVerifierAssigned) ||
            (deptHeadTab === 'assigned' && isVerifierAssigned);

        const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
        const matchesDept = filterDepartment === 'all' || c.departmentCode === filterDepartment;
        const matchesSla = filterSlaStatus === 'all' || (c.sla && c.sla.status === filterSlaStatus);
        const matchesEscalation = filterEscalation === 'all' || (c.escalationLevel && c.escalationLevel.toString() === filterEscalation);
        const matchesPriority = filterPriority === 'all' || c.priority === filterPriority;
        const matchesSeverity = filterSeverity === 'all' || c.severity === filterSeverity;
        const matchesSearch = c.complaintId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.category && c.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (c.assignedDepartment && c.assignedDepartment.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (c.user?.name && c.user.name.toLowerCase().includes(searchTerm.toLowerCase()));

        return matchesDeptHeadScope && matchesDeptHeadTab && matchesStatus && matchesDept && matchesSla && matchesEscalation && matchesPriority && matchesSeverity && matchesSearch;
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
                    <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-primary-600 text-white text-[10px] font-black uppercase rounded-lg">
                            CivicFix Operations Portal
                        </span>
                        {userDeptCode && (
                            <span className="px-3 py-1 bg-slate-900 text-white text-[10px] font-black uppercase rounded-lg font-mono">
                                {userDeptCode}
                            </span>
                        )}
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 font-display tracking-tight uppercase italic">
                        {isSuperAdmin
                            ? 'System Administration (Monitor Mode)'
                            : isDeptHead
                            ? `${userDeptCode} Department Head Command Center`
                            : `${userDeptCode} Field Verifier Work Queue`}
                    </h1>
                    <p className="text-slate-500 font-bold tracking-widest text-xs uppercase">
                        {isSuperAdmin
                            ? 'City-Wide Intelligence & Multi-Department Oversight'
                            : isDeptHead
                            ? 'Manage Complaints & Assign Verifiers'
                            : 'Field Inspection & Verification Queue'}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Link
                        to="/admin/analytics"
                        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-black text-xs rounded-xl flex items-center gap-2 shadow-md transition-all uppercase tracking-wider"
                    >
                        <BarChart3 size={16} />
                        <span>Civic Analytics & Intelligence</span>
                    </Link>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search ID, title, department..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-white rounded-xl text-xs font-semibold border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                </div>
            </div>

            {/* 8 Metric Cards Grid */}
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

            {/* Department Head Assignment Queue Tabs */}
            {isDeptHead && (
                <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm w-fit">
                    <button
                        onClick={() => setDeptHeadTab('all')}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${
                            deptHeadTab === 'all' ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        All Complaints ({complaints.length})
                    </button>
                    <button
                        onClick={() => setDeptHeadTab('unassigned')}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${
                            deptHeadTab === 'unassigned' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        Unassigned Queue ({complaints.filter(c => !(c.assignedVerifier || c.assignedTo)).length})
                    </button>
                    <button
                        onClick={() => setDeptHeadTab('assigned')}
                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${
                            deptHeadTab === 'assigned' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        Assigned Queue ({complaints.filter(c => !!(c.assignedVerifier || c.assignedTo)).length})
                    </button>
                </div>
            )}

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase">
                    <Filter size={16} />
                    <span>Workflow Filters:</span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Status Filter */}
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-3 py-1.5 bg-slate-50 rounded-xl text-xs font-bold text-slate-700 border border-slate-200 focus:outline-none"
                    >
                        <option value="all">All Statuses</option>
                        <option value="Submitted">Submitted</option>
                        <option value="Verified">Verified</option>
                        <option value="Assigned">Assigned</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Citizen Verification">Citizen Verification</option>
                        <option value="Closed">Closed</option>
                        <option value="Reopened">Reopened</option>
                    </select>

                    {/* Department Filter (Visible ONLY for Super Admin) */}
                    {isSuperAdmin && (
                        <select
                            value={filterDepartment}
                            onChange={(e) => setFilterDepartment(e.target.value)}
                            className="px-3 py-1.5 bg-slate-50 rounded-xl text-xs font-bold text-slate-700 border border-slate-200 focus:outline-none"
                        >
                            <option value="all">All Departments</option>
                            {departments.map((d, idx) => {
                                const deptKey = getCanonicalUserId(d.code) || getCanonicalUserId(d._id) || d.code || `dept-flt-${idx}`;
                                return (
                                    <option key={deptKey} value={d.code}>{d.name}</option>
                                );
                            })}
                        </select>
                    )}

                    {/* SLA Status Filter */}
                    <select
                        value={filterSlaStatus}
                        onChange={(e) => setFilterSlaStatus(e.target.value)}
                        className="px-3 py-1.5 bg-slate-50 rounded-xl text-xs font-bold text-slate-700 border border-slate-200 focus:outline-none"
                    >
                        <option value="all">All SLA Statuses</option>
                        <option value="on_track">On Track</option>
                        <option value="due_soon">Due Soon</option>
                        <option value="breached">SLA Breached</option>
                        <option value="completed">SLA Completed</option>
                    </select>

                    {/* Escalation Level Filter */}
                    <select
                        value={filterEscalation}
                        onChange={(e) => setFilterEscalation(e.target.value)}
                        className="px-3 py-1.5 bg-slate-50 rounded-xl text-xs font-bold text-slate-700 border border-slate-200 focus:outline-none"
                    >
                        <option value="all">All Escalations</option>
                        <option value="0">Level 0 (Normal)</option>
                        <option value="1">Level 1 (SLA Warning)</option>
                        <option value="2">Level 2 (SLA Breached)</option>
                        <option value="3">Level 3 (Admin Escalated)</option>
                    </select>

                    {/* Priority Filter */}
                    <select
                        value={filterPriority}
                        onChange={(e) => setFilterPriority(e.target.value)}
                        className="px-3 py-1.5 bg-slate-50 rounded-xl text-xs font-bold text-slate-700 border border-slate-200 focus:outline-none"
                    >
                        <option value="all">All Priorities</option>
                        <option value="Critical">Critical</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                    </select>
                </div>
            </div>

            {/* Complaints Management Table */}
            <div className="card-premium overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-black text-slate-900 uppercase italic">
                            {isDeptHead ? `${userDeptCode} Department Operations Matrix` : isVerifier ? 'Assigned Field Verifications' : 'City Operations & Complaints Overview'}
                        </h2>
                        <p className="text-xs text-slate-500 font-medium">Showing {filteredComplaints.length} of {complaints.length} records</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                <th className="p-4">Complaint ID</th>
                                <th className="p-4">Issue Details</th>
                                <th className="p-4">Department</th>
                                <th className="p-4">Assigned Verifier</th>
                                <th className="p-4">Priority</th>
                                <th className="p-4">SLA State</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs font-semibold">
                            {filteredComplaints.map((c, idx) => {
                                const verifierObj = c.assignedVerifier || c.assignedTo;
                                const canonicalId = getCanonicalUserId(c._id);
                                const rowKey = canonicalId || (typeof c._id === 'string' && c._id !== '[object Object]' ? c._id : null) || c.complaintId || `complaint-row-${idx}`;
                                const complaintLinkParam = canonicalId || (typeof c._id === 'string' && c._id !== '[object Object]' ? c._id : null) || c.complaintId;
                                return (
                                    <tr key={rowKey} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="p-4 font-mono font-bold text-primary-600">
                                            <Link to={`/admin/complaint/${complaintLinkParam}`} className="hover:underline">
                                                #{c.complaintId}
                                            </Link>
                                        </td>
                                        <td className="p-4 max-w-xs">
                                            <p className="font-bold text-slate-900 truncate">{c.title}</p>
                                            <span className="text-[10px] text-slate-500 font-semibold">{c.category} • {c.subcategory || 'General'}</span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1.5">
                                                <Building2 size={14} className="text-slate-400" />
                                                <span className="font-bold text-slate-800">{c.assignedDepartment || c.departmentCode}</span>
                                            </div>
                                            <span className="text-[9px] font-mono text-slate-400">{c.departmentCode || 'GENERAL'}</span>
                                        </td>
                                        <td className="p-4">
                                            {verifierObj ? (
                                                <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg w-fit">
                                                    <ShieldCheck size={14} />
                                                    <span className="font-bold text-xs">{verifierObj.name}</span>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg font-bold">
                                                    Unassigned
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                                c.priority === 'Critical' ? 'bg-red-100 text-red-700' :
                                                c.priority === 'High' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                                            }`}>
                                                {c.priority || c.severity || 'Medium'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {c.sla ? (
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                                                    c.sla.status === 'breached' ? 'bg-red-100 text-red-700 animate-pulse' :
                                                    c.sla.status === 'due_soon' ? 'bg-amber-100 text-amber-700' :
                                                    c.sla.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                    {c.sla.status ? c.sla.status.replace('_', ' ') : 'on track'}
                                                </span>
                                            ) : (
                                                <span className="text-[10px] text-slate-400 font-mono">N/A</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase ${
                                                c.status === 'Resolved' || c.status === 'Closed' ? 'bg-emerald-500 text-white' :
                                                c.status === 'In Progress' || c.status === 'Assigned' ? 'bg-amber-500 text-white' :
                                                c.status === 'Reopened' ? 'bg-purple-600 text-white' : 'bg-slate-700 text-white'
                                            }`}>
                                                {c.status}
                                            </span>
                                            {c.verificationState && c.verificationState !== 'UNVERIFIED' && (
                                                <span className="block mt-1 text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded font-mono truncate">
                                                    {c.verificationState === 'AWAITING_REVIEW' ? '📋 Awaiting Review' : `Report: ${c.verificationState.replace('VERIFIED_', '')}`}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* Department Head Assignment Control */}
                                                {isDeptHead && (
                                                    normalizeDeptCode(c.departmentCode) === normalizeDeptCode(userDeptCode) ||
                                                    normalizeDeptCode(c.assignedDepartment) === normalizeDeptCode(userDeptCode)
                                                ) && (
                                                    <button
                                                        onClick={() => handleOpenAssignModal(c)}
                                                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${
                                                            verifierObj
                                                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-700'
                                                                : 'bg-primary-50 hover:bg-primary-100 text-primary-700'
                                                        }`}
                                                    >
                                                        {verifierObj ? 'Reassign Verifier' : 'Assign Verifier'}
                                                    </button>
                                                )}

                                                <Link
                                                    to={`/admin/complaint/${complaintLinkParam}`}
                                                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold transition-colors"
                                                >
                                                    Details
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Department Head Verifier Assignment Modal (Phase 3) */}
            {showAssignVerifierModal && assignTargetComplaint && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="text-lg font-black text-slate-900 uppercase italic">
                                    Assign Field Verifier
                                </h3>
                                <p className="text-xs text-slate-500 font-mono">
                                    Complaint #{assignTargetComplaint.complaintId} • Dept: {userDeptCode}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowAssignVerifierModal(false)}
                                className="text-slate-400 hover:text-slate-600 font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleAssignVerifier} className="space-y-4">
                            {assignErrorMessage && (
                                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2 animate-in fade-in">
                                    <AlertTriangle size={16} className="text-rose-500 shrink-0" />
                                    <span>{assignErrorMessage}</span>
                                </div>
                            )}

                            <div>
                                <label className="text-xs font-bold text-slate-700 uppercase mb-1 block">
                                    Select {userDeptCode} Verifier
                                </label>
                                <select
                                    id="verifier-select-dropdown"
                                    value={selectedVerifierId}
                                    onChange={(e) => {
                                        const selectedVal = e.target.value;
                                        console.log('[DEBUG Verifier Dropdown onChange fired]:', selectedVal);
                                        setSelectedVerifierId(selectedVal);
                                        setAssignErrorMessage('');
                                    }}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                                >
                                    <option value="">-- Unassigned (Clear Verifier) --</option>
                                    {staffMembers.map((staff, idx) => {
                                        const dbId = getCanonicalUserId(staff);
                                        const optKey = dbId || staff.email || `staff-opt-${idx}`;
                                        return (
                                            <option key={optKey} value={dbId}>
                                                {staff.name} ({staff.email}) - {staff.role}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 uppercase mb-1 block">
                                    Assignment Note / Reason
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="Enter operational directive or assignment note..."
                                    value={assignReason}
                                    onChange={(e) => setAssignReason(e.target.value)}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowAssignVerifierModal(false)}
                                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={updating}
                                    className="px-5 py-2 bg-primary-600 text-white rounded-xl text-xs font-bold hover:bg-primary-700 transition-colors flex items-center gap-2"
                                >
                                    {updating && <Loader2 className="animate-spin" size={14} />}
                                    <span>
                                        {selectedVerifierId
                                            ? 'Assign Field Verifier'
                                            : (assignTargetComplaint?.assignedVerifier || assignTargetComplaint?.assignedTo)
                                                ? 'Unassign Verifier'
                                                : 'Assign Field Verifier'}
                                    </span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Department Reassignment Modal (Super Admin / Admin) */}
            {showReassignModal && selectedComplaint && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="text-lg font-black text-slate-900 uppercase italic">Reassign Department</h3>
                                <p className="text-xs text-slate-500 font-mono">Complaint #{selectedComplaint.complaintId}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-600 uppercase mb-1 block">Target Department</label>
                                <select
                                    value={targetDeptCode}
                                    onChange={(e) => setTargetDeptCode(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                                >
                                    {departments.map((d, idx) => {
                                        const deptKey = getCanonicalUserId(d.code) || getCanonicalUserId(d._id) || d.code || `dept-reassign-${idx}`;
                                        return (
                                            <option key={deptKey} value={d.code}>{d.name} ({d.code})</option>
                                        );
                                    })}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-600 uppercase mb-1 block">Audit Reason / Transfer Note</label>
                                <textarea
                                    rows={3}
                                    placeholder="Enter audit note for department transfer..."
                                    value={reassignReason}
                                    onChange={(e) => setReassignReason(e.target.value)}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                            <button
                                onClick={() => setShowReassignModal(false)}
                                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleQuickAssign}
                                disabled={updating}
                                className="px-5 py-2 bg-primary-600 text-white rounded-xl text-xs font-bold hover:bg-primary-700 transition-colors flex items-center gap-2"
                            >
                                {updating && <Loader2 className="animate-spin" size={14} />}
                                <span>Confirm Reassignment</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Priority Change Modal */}
            {showPriorityModal && priorityComplaint && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="text-lg font-black text-slate-900 uppercase italic">Change Priority</h3>
                                <p className="text-xs text-slate-500 font-mono">Complaint #{priorityComplaint.complaintId}</p>
                            </div>
                            <button onClick={() => setShowPriorityModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-700 block mb-2">Select Target Priority</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['Low', 'Medium', 'High', 'Critical'].map((p) => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setSelectedPriority(p)}
                                            className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                                                selectedPriority === p
                                                    ? p === 'Critical' ? 'bg-red-50 border-red-500 text-red-700 ring-2 ring-red-500/20' :
                                                      p === 'High' ? 'bg-amber-50 border-amber-500 text-amber-700 ring-2 ring-amber-500/20' :
                                                      p === 'Medium' ? 'bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-500/20' :
                                                      'bg-slate-100 border-slate-400 text-slate-800'
                                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                            }`}
                                        >
                                            {p} Priority
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                            <button
                                onClick={() => setShowPriorityModal(false)}
                                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdatePriority}
                                disabled={updating}
                                className="px-5 py-2 bg-primary-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-primary-700 disabled:opacity-50"
                            >
                                {updating ? 'Saving...' : 'Save Priority'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
