import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    MapPin,
    Clock,
    User,
    ShieldCheck,
    CheckCircle2,
    Zap,
    Building2,
    AlertTriangle,
    Activity,
    Bot,
    History,
    Check,
    Upload,
    Loader2,
    FileText,
    CheckCircle,
    XCircle,
    Phone,
    Image as ImageIcon
} from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import VerifierWorkspace from '../components/VerifierWorkspace';

const WORKFLOW_STAGES = [
    'Submitted',
    'Verified',
    'Assigned',
    'In Progress',
    'Resolved',
    'Citizen Verification',
    'Closed'
];

const NORMALIZE_DEPT_MAP = {
    'ROADS': 'ROADS', 'ROADS & INFRASTRUCTURE': 'ROADS', 'ROADS_INFRASTRUCTURE': 'ROADS',
    'WATER': 'WATER', 'WATER SUPPLY': 'WATER', 'WATER_SUPPLY': 'WATER',
    'SANITATION': 'SANITATION', 'DRAINAGE': 'SANITATION', 'DRAINAGE & SEWERAGE': 'SANITATION', 'DRAINAGE_SEWERAGE': 'SANITATION',
    'ELECTRICAL': 'ELECTRICAL', 'STREETLIGHTS': 'ELECTRICAL', 'STREET LIGHT': 'ELECTRICAL', 'STREETLIGHTS_ELECTRICITY': 'ELECTRICAL',
    'WASTE': 'WASTE', 'GARBAGE': 'WASTE', 'WASTE MANAGEMENT': 'WASTE', 'SOLID_WASTE_MANAGEMENT': 'WASTE',
    'PUBLIC_WORKS': 'PUBLIC_WORKS', 'PARKS': 'PUBLIC_WORKS', 'PUBLIC INFRASTRUCTURE': 'PUBLIC_WORKS',
};

const getNormalizedDeptCode = (code) => {
    if (!code) return '';
    const upper = code.toString().trim().toUpperCase();
    return NORMALIZE_DEPT_MAP[upper] || upper;
};

const ComplaintDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { userInfo } = useAuth();

    const isVerifier = userInfo?.role === 'verifier';
    const isDeptHead = userInfo?.role === 'department_head';
    const isSuperAdmin = userInfo?.role === 'super_admin' || userInfo?.role === 'admin';

    const [complaint, setComplaint] = useState(null);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [fetchError, setFetchError] = useState(null);

    const userDeptCode = getNormalizedDeptCode(userInfo?.departmentCode);
    const complaintDeptCode = getNormalizedDeptCode(complaint?.departmentCode || complaint?.assignedDepartment || complaint?.category);
    const canAssignVerifier = isDeptHead && Boolean(userDeptCode) && userDeptCode === complaintDeptCode;

    // Status Update Form State
    const [statusForm, setStatusForm] = useState({
        status: '',
        note: '',
        resolutionNote: '',
    });
    const [resolutionImageFile, setResolutionImageFile] = useState(null);

    // Reassignment Modal State
    const [showReassignModal, setShowReassignModal] = useState(false);
    const [targetDeptCode, setTargetDeptCode] = useState('');
    const [reassignReason, setReassignReason] = useState('');

    // Escalation Modal State
    const [showEscalateModal, setShowEscalateModal] = useState(false);
    const [escalateReason, setEscalateReason] = useState('');

    // Assign Verifier Modal State
    const [showAssignVerifierModal, setShowAssignVerifierModal] = useState(false);
    const [staffMembers, setStaffMembers] = useState([]);
    const [selectedVerifierId, setSelectedVerifierId] = useState('');
    const [assignReason, setAssignReason] = useState('');
    const [assignErrorMessage, setAssignErrorMessage] = useState('');

    const handleOpenAssignModal = async () => {
        setAssignErrorMessage('');
        setShowAssignVerifierModal(true);
        const currVerifier = complaint?.assignedVerifier || complaint?.assignedTo;
        let currId = '';
        if (currVerifier) {
            if (typeof currVerifier === 'string') {
                currId = currVerifier;
            } else if (currVerifier._id) {
                currId = typeof currVerifier._id === 'string' ? currVerifier._id : String(currVerifier._id);
            }
        }
        setSelectedVerifierId(currId);

        const targetDept = complaintDeptCode || userDeptCode;
        try {
            const res = await api.get('/department/staff', {
                params: targetDept ? { departmentCode: targetDept } : {}
            });
            if (res.data && Array.isArray(res.data.staffMembers)) {
                setStaffMembers(res.data.staffMembers);
            } else {
                setStaffMembers([]);
            }
        } catch (e) {
            console.error('Failed to load department staff:', e);
            setStaffMembers([]);
        }
    };

    const handleAssignVerifier = async (e) => {
        e.preventDefault();
        setAssignErrorMessage('');

        const currentVerifier = complaint?.assignedVerifier || complaint?.assignedTo;
        if (!selectedVerifierId && !currentVerifier) {
            setAssignErrorMessage('Please select a field verifier from the dropdown before assigning.');
            return;
        }

        if (!canAssignVerifier) {
            setAssignErrorMessage(`Forbidden: Only the Department Head for ${complaintDeptCode || 'this department'} can assign verifiers.`);
            return;
        }

        setUpdating(true);
        try {
            let cleanCompId = '';
            if (complaint.complaintId) {
                cleanCompId = complaint.complaintId;
            } else if (typeof complaint._id === 'string') {
                cleanCompId = complaint._id;
            } else if (complaint._id?.$oid) {
                cleanCompId = complaint._id.$oid;
            } else if (complaint._id) {
                cleanCompId = String(complaint._id);
            }

            const isUnassigning = !selectedVerifierId && !!currentVerifier;
            const payload = {
                complaintId: cleanCompId,
                staffId: selectedVerifierId || null,
                verifierId: selectedVerifierId || null,
                reason: assignReason || (selectedVerifierId ? 'Assigned verifier by Dept Head' : 'Unassigned verifier by Dept Head'),
                action: isUnassigning ? 'unassign' : 'assign'
            };

            const response = await api.post('/department/assign', payload);
            if (response.data && (response.data.complaint || response.data.success)) {
                setComplaint(response.data.complaint || complaint);
                setShowAssignVerifierModal(false);
                setAssignReason('');
                setAssignErrorMessage('');
            } else {
                setAssignErrorMessage(response.data?.message || 'Assignment failed');
            }
        } catch (error) {
            console.error('Failed to assign verifier:', error);
            setAssignErrorMessage(error.response?.data?.message || 'Failed to assign verifier');
        } finally {
            setUpdating(false);
        }
    };

    const matchesId = (c) => {
        if (!c) return false;
        const targetStr = String(id || '').trim();
        if (c.complaintId === targetStr) return true;
        if (typeof c._id === 'string' && c._id === targetStr) return true;
        if (c._id?.$oid && String(c._id.$oid) === targetStr) return true;
        if (c._id?.buffer && Array.isArray(c._id.buffer.data)) {
            const hex = Buffer.from(c._id.buffer.data).toString('hex');
            if (hex === targetStr) return true;
        }
        if (c._id?.data && Array.isArray(c._id.data)) {
            const hex = Buffer.from(c._id.data).toString('hex');
            if (hex === targetStr) return true;
        }
        return String(c._id || '') === targetStr;
    };

    const fetchComplaintDetails = async () => {
        setLoading(true);
        setFetchError(null);
        try {
            let found = null;
            let depts = [];
            try {
                const deptsRes = await api.get('/departments');
                depts = Array.isArray(deptsRes.data) ? deptsRes.data : [];
            } catch (e) {}

            // Priority 1: Direct track endpoint by ID or public complaint code
            if (id) {
                try {
                    const trackRes = await api.get(`/complaints/track/${id}`);
                    if (trackRes.data && (trackRes.data.title || trackRes.data.complaintId || trackRes.data._id)) {
                        found = trackRes.data;
                    }
                } catch (e) {}
            }

            // Priority 2: Role-based list fallbacks
            if (!found && isVerifier) {
                try {
                    const assignedRes = await api.get('/complaints/assigned-to-me');
                    const list = Array.isArray(assignedRes.data) ? assignedRes.data : [];
                    found = list.find(matchesId);
                } catch (e) {}
            }

            if (!found && isDeptHead) {
                try {
                    const deptCompRes = await api.get('/department/complaints');
                    const deptList = deptCompRes.data?.complaints || (Array.isArray(deptCompRes.data) ? deptCompRes.data : []);
                    found = deptList.find(matchesId);
                } catch (e) {}
            }

            if (!found) {
                try {
                    const complaintsRes = await api.get('/admin/complaints');
                    const allList = Array.isArray(complaintsRes.data) ? complaintsRes.data : [];
                    found = allList.find(matchesId);
                } catch (e) {}
            }

            setDepartments(depts);

            if (found) {
                setComplaint(found);
                setStatusForm({
                    status: found.status || 'Submitted',
                    note: '',
                    resolutionNote: found.resolution?.resolutionNote || '',
                });
                setTargetDeptCode(found.departmentCode || 'PUBLIC_WORKS');
            } else {
                setComplaint(null);
                setFetchError(`Complaint record #${id} could not be retrieved or access is restricted.`);
            }
        } catch (error) {
            console.error('Failed to load complaint details:', error);
            setFetchError(error.message || 'Failed to retrieve complaint record');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComplaintDetails();
    }, [id]);

    const handleUpdateStatus = async (e) => {
        e.preventDefault();
        setUpdating(true);
        try {
            const formData = new FormData();
            formData.append('status', statusForm.status);
            if (statusForm.note) formData.append('note', statusForm.note);
            if (statusForm.resolutionNote) formData.append('resolutionNote', statusForm.resolutionNote);
            if (resolutionImageFile) formData.append('image', resolutionImageFile);

            await api.put(`/admin/complaints/${id}/status`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            alert(`Workflow status successfully updated to ${statusForm.status}`);
            await fetchComplaintDetails();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to update workflow status');
        } finally {
            setUpdating(false);
        }
    };

    const handleReassign = async () => {
        setUpdating(true);
        try {
            await api.post(`/admin/complaints/${id}/assign`, {
                departmentCode: targetDeptCode,
                reason: reassignReason || 'Manual administrative department update',
            });
            setShowReassignModal(false);
            setReassignReason('');
            alert('Department reassigned successfully');
            await fetchComplaintDetails();
        } catch (error) {
            alert('Failed to reassign department');
        } finally {
            setUpdating(false);
        }
    };

    const handleEscalate = async () => {
        setUpdating(true);
        try {
            await api.post(`/admin/complaints/${id}/escalate`, {
                reason: escalateReason || 'Manual administrative escalation',
            });
            setShowEscalateModal(false);
            setEscalateReason('');
            alert('Complaint manually escalated');
            await fetchComplaintDetails();
        } catch (error) {
            alert('Failed to escalate complaint');
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

    if (fetchError || !complaint) return (
        <div className="max-w-lg mx-auto my-16 p-8 bg-white rounded-3xl border border-rose-100 shadow-xl space-y-6 text-center animate-in fade-in">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
                <AlertTriangle size={32} />
            </div>
            <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 uppercase italic">Complaint Analysis Record Unavailable</h3>
                <p className="text-xs text-slate-500 font-medium">
                    {fetchError || `Unable to locate complaint record #${id}.`}
                </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
                <button
                    onClick={fetchComplaintDetails}
                    className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition-all shadow-md inline-flex items-center gap-2 uppercase tracking-wider"
                >
                    <Loader2 size={16} className="animate-spin" />
                    <span>Retry Request</span>
                </button>
                <button
                    onClick={() => navigate(-1)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                >
                    Return Back
                </button>
            </div>
        </div>
    );

    const currentStageIndex = WORKFLOW_STAGES.indexOf(complaint.status) !== -1
        ? WORKFLOW_STAGES.indexOf(complaint.status)
        : complaint.status === 'Reopened' ? 3 : 0;

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Header Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/admin-dashboard')}
                        className="p-3 text-slate-400 hover:text-primary-600 bg-white rounded-2xl shadow-sm border border-slate-100 transition-all hover:-translate-x-1"
                    >
                        <ArrowLeft size={22} />
                    </button>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Incident Root Analysis</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                            <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest">#{complaint.complaintId}</span>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 font-display tracking-tight">Complaint Lifecycle & Operational Control</h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className={`px-4 py-1.5 rounded-xl border font-black text-[10px] uppercase tracking-widest ${
                        complaint.priority === 'Critical' ? 'bg-red-50 border-red-200 text-red-700' :
                        complaint.priority === 'High' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}>
                        Priority: {complaint.priority || complaint.severity || 'Medium'}
                    </span>
                    <span className={`px-4 py-1.5 rounded-xl text-white font-black text-[10px] uppercase tracking-widest ${
                        complaint.status === 'Resolved' || complaint.status === 'Closed' ? 'bg-emerald-600' : 'bg-primary-600'
                    }`}>
                        {complaint.status}
                    </span>
                </div>
            </div>

            {/* Super Admin Read-Only Banner */}
            {isSuperAdmin && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between text-amber-900 shadow-sm">
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-amber-500 text-white rounded-xl font-mono text-[10px] font-black uppercase">
                            MONITORING MODE
                        </span>
                        <p className="text-xs font-bold">
                            Super Admin monitoring mode active. All operational controls are read-only.
                        </p>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-900 bg-amber-200/60 px-3 py-1 rounded-lg">
                        READ ONLY
                    </span>
                </div>
            )}

            {/* Workflow Progression Stepper */}
            <div className="card-premium p-6 bg-white border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Operational Status Progression Workflow</p>
                <div className="flex items-center justify-between relative overflow-x-auto pb-2">
                    {WORKFLOW_STAGES.map((stage, idx) => {
                        const isDone = idx < currentStageIndex;
                        const isCurrent = idx === currentStageIndex;
                        return (
                            <div key={stage} className="flex flex-col items-center min-w-[100px] text-center z-10">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                                    isDone ? 'bg-emerald-500 text-white shadow-md' :
                                    isCurrent ? 'bg-primary-600 text-white ring-4 ring-primary-100' : 'bg-slate-100 text-slate-400'
                                }`}>
                                    {isDone ? <Check size={16} /> : idx + 1}
                                </div>
                                <span className={`text-[10px] font-extrabold mt-2 ${
                                    isCurrent ? 'text-primary-600' : isDone ? 'text-slate-800' : 'text-slate-400'
                                }`}>
                                    {stage}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 items-start">
                {/* Main Details Area */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Complaint Overview */}
                    <div className="card-premium p-8 bg-white space-y-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <span className="inline-block px-3 py-1 bg-primary-50 text-primary-700 rounded-lg text-[10px] font-black uppercase tracking-widest mb-3">
                                    {complaint.category} • {complaint.subcategory || 'General'}
                                </span>
                                <h2 className="text-3xl font-black text-slate-900 font-display">{complaint.title}</h2>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-slate-700 font-medium text-sm leading-relaxed italic">
                                "{complaint.description}"
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-white border border-slate-100 flex items-center gap-3">
                                <MapPin size={20} className="text-primary-600" />
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase">Location</p>
                                    <p className="font-extrabold text-xs text-slate-800">{complaint.location}</p>
                                </div>
                            </div>
                            <div className="p-4 rounded-xl bg-white border border-slate-100 flex items-center gap-3">
                                <Clock size={20} className="text-primary-600" />
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase">Submission Timestamp</p>
                                    <p className="font-extrabold text-xs text-slate-800">{new Date(complaint.createdAt).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        {complaint.imageUrl && (
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Evidence Payload Visualization</p>
                                <div className="rounded-2xl overflow-hidden border border-slate-200 max-h-96">
                                    <img src={complaint.imageUrl} alt="Evidence" className="w-full h-full object-cover" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* AI Multimodal Classification metadata (Sprint 6 Retained) */}
                    {complaint.aiClassification && (
                        <div className="card-premium p-6 bg-slate-900 text-white space-y-4">
                            <div className="flex items-center gap-3 text-primary-400">
                                <Bot size={20} />
                                <h3 className="text-sm font-black uppercase tracking-widest">Sprint 6 AI Classification Intelligence</h3>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                                <div>
                                    <span className="text-[10px] text-slate-400 uppercase block font-bold">Category</span>
                                    <span className="font-bold text-white">{complaint.aiClassification.category}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-400 uppercase block font-bold">Subcategory</span>
                                    <span className="font-bold text-white">{complaint.aiClassification.subcategory}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-400 uppercase block font-bold">Severity</span>
                                    <span className="font-bold text-white">{complaint.aiClassification.severity}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-400 uppercase block font-bold">AI Confidence</span>
                                    <span className="font-bold text-emerald-400">{((complaint.aiClassification.confidence || 0.85) * 100).toFixed(1)}%</span>
                                </div>
                            </div>

                            {complaint.aiClassification.reasoning && (
                                <div className="p-3 bg-white/10 rounded-xl text-xs text-slate-300 italic">
                                    "{complaint.aiClassification.reasoning}"
                                </div>
                            )}
                        </div>
                    )}

                    {/* Verifier Investigation Workspace (for assigned field verifiers) */}
                    {isVerifier && (
                        <VerifierWorkspace
                            complaint={complaint}
                            token={userInfo?.token}
                            onReportSubmitted={(updatedComplaint) => setComplaint(updatedComplaint)}
                        />
                    )}

                    {/* Verification Report Review Card (for Department Head / Super Admin review) */}
                    {complaint.verificationReport && complaint.verificationReport.outcome && !isVerifier && (
                        <div className="card-premium p-6 bg-white space-y-6 border-l-4 border-l-indigo-600">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <div className="flex items-center gap-2">
                                    <FileText size={20} className="text-indigo-600" />
                                    <h3 className="text-sm font-black text-slate-900 uppercase">Field Verification Report Review</h3>
                                </div>
                                <span className="px-3 py-1 bg-amber-100 text-amber-800 text-[10px] font-black uppercase rounded-full">
                                    {complaint.verificationState ? complaint.verificationState.replace(/_/g, ' ') : 'AWAITING REVIEW'}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Verifier Outcome</span>
                                    <span className="font-bold text-slate-900">{complaint.verificationReport.outcome}</span>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Submitted Timestamp</span>
                                    <span className="font-bold text-slate-900">
                                        {complaint.verificationReport.submittedAt ? new Date(complaint.verificationReport.submittedAt).toLocaleString() : 'N/A'}
                                    </span>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Location Verification</span>
                                    <span className="font-bold text-slate-900">
                                        {complaint.verificationReport.locationVerified ? 'Verified On-Site' : 'Location Not Verified'}
                                    </span>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Citizen Contact Status</span>
                                    <span className="font-bold text-slate-900">
                                        {complaint.verificationReport.contactWithCitizen ? 'Contact Made' : 'No Contact Made'}
                                    </span>
                                    {complaint.verificationReport.contactWithCitizen && complaint.verificationReport.citizenContactNotes && (
                                        <p className="text-[11px] text-slate-600 mt-1 italic">
                                            "{complaint.verificationReport.citizenContactNotes}"
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Field Investigation Findings</span>
                                <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-800 font-medium whitespace-pre-wrap border border-slate-100">
                                    {complaint.verificationReport.findings || 'No findings reported.'}
                                </div>
                            </div>

                            {complaint.verificationReport.evidence && complaint.verificationReport.evidence.length > 0 && (
                                <div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase block mb-2">
                                        Verification Evidence Photos ({complaint.verificationReport.evidence.length})
                                    </span>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {complaint.verificationReport.evidence.map((ev, idx) => (
                                            <div key={idx} className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                                                <img src={ev.url} alt={ev.caption || `Evidence ${idx + 1}`} className="w-full h-28 object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Citizen Confirmation & Reopen History Card */}
                    {(complaint.citizenVerification || complaint.reopenCount > 0 || complaint.status === 'Reopened') && (
                        <div className="card-premium p-6 bg-white space-y-4 border-l-4 border-l-purple-600">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 size={20} className="text-purple-600" />
                                    <h3 className="text-sm font-black text-slate-900 uppercase">Citizen Resolution Verification & Reopen History</h3>
                                </div>
                                {complaint.reopenCount > 0 && (
                                    <span className="px-3 py-1 bg-purple-100 text-purple-800 text-[10px] font-black uppercase rounded-full">
                                        Reopened ({complaint.reopenCount} Cycle{complaint.reopenCount > 1 ? 's' : ''})
                                    </span>
                                )}
                            </div>

                            <div className="grid md:grid-cols-2 gap-4 text-xs">
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Confirmation Status</span>
                                    <span className={`font-bold ${complaint.status === 'Closed' ? 'text-emerald-700' : complaint.status === 'Reopened' ? 'text-purple-700' : 'text-amber-700'}`}>
                                        {complaint.status === 'Closed' ? 'Confirmed by Citizen (Closed)' : complaint.status === 'Reopened' ? 'Rejected by Citizen (Reopened)' : 'Awaiting Citizen Confirmation'}
                                    </span>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Reopen Cycle Count</span>
                                    <span className="font-bold text-slate-900">{complaint.reopenCount || 0}</span>
                                </div>
                            </div>

                            {complaint.citizenVerification?.feedback && (
                                <div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Citizen Feedback Remarks</span>
                                    <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-800 font-medium italic border border-slate-100">
                                        "{complaint.citizenVerification.feedback}"
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Audit History Timeline */}
                    <div className="card-premium p-6 bg-white space-y-6">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                            <History size={18} className="text-primary-600" />
                            <h3 className="text-sm font-black text-slate-900 uppercase">Audit Trail & Assignment History</h3>
                        </div>

                        <div className="space-y-4">
                            {complaint.assignmentHistory && complaint.assignmentHistory.length > 0 ? (
                                complaint.assignmentHistory.map((hist, idx) => (
                                    <div key={idx} className="flex gap-4 items-start text-xs border-l-2 border-primary-200 pl-4 py-1">
                                        <div className="space-y-1">
                                            {hist.action ? (
                                                <p className="font-bold text-slate-900">
                                                    Verifier <span className="uppercase text-primary-700">{hist.action}</span>: {' '}
                                                    <span className="font-extrabold text-slate-900">
                                                        {hist.verifier?.name || (typeof hist.verifier === 'string' ? hist.verifier : 'N/A')}
                                                    </span>
                                                    {hist.assignedBy?.name && (
                                                        <span className="text-slate-500 font-normal"> by {hist.assignedBy.name}</span>
                                                    )}
                                                </p>
                                            ) : (
                                                <p className="font-bold text-slate-900">
                                                    Reassigned to <span className="text-primary-600">{hist.newDepartmentName}</span> ({hist.newDepartmentCode})
                                                </p>
                                            )}
                                            {hist.reason && <p className="text-slate-500 font-medium">{hist.reason}</p>}
                                            <span className="text-[10px] text-slate-400 font-mono block">
                                                {new Date(hist.assignedAt || hist.timestamp || Date.now()).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-slate-400 italic">No assignment history records logged.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Operations Control Sidebar */}
                <div className="space-y-6">
                    {/* Department & Verifier Assignment Box */}
                    <div className="card-premium p-6 bg-white space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Building2 size={18} className="text-primary-600" />
                                <h3 className="text-xs font-black uppercase text-slate-900">Assigned Department</h3>
                            </div>
                            {!isVerifier && !isSuperAdmin && (
                                <button
                                    onClick={() => setShowReassignModal(true)}
                                    className="text-[10px] font-black text-primary-600 uppercase hover:underline"
                                >
                                    Reassign
                                </button>
                            )}
                        </div>

                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                            <p className="font-extrabold text-sm text-slate-900">{complaint.assignedDepartment || 'General Administration'}</p>
                            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                                <span>Code: {complaint.departmentCode || 'GENERAL'}</span>
                                <span>Source: {complaint.assignmentSource || 'automatic'}</span>
                            </div>
                        </div>

                        {/* Verifier Details */}
                        <div className="pt-2 border-t border-slate-100 space-y-2">
                            <div className="flex items-center justify-between text-slate-900">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck size={16} className="text-emerald-600" />
                                    <span className="text-xs font-black uppercase">Assigned Verifier</span>
                                </div>
                                {canAssignVerifier ? (
                                    <button
                                        onClick={handleOpenAssignModal}
                                        className="text-[10px] font-black text-primary-600 uppercase hover:underline"
                                    >
                                        {(complaint.assignedVerifier || complaint.assignedTo) ? 'Reassign' : 'Assign'}
                                    </button>
                                ) : isDeptHead ? (
                                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                        Cross-Department ({complaintDeptCode || 'Other'})
                                    </span>
                                ) : isSuperAdmin ? (
                                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                        Monitor Only
                                    </span>
                                ) : null}
                            </div>
                            {(complaint.assignedVerifier || complaint.assignedTo) ? (
                                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 space-y-1">
                                    <p className="font-extrabold text-xs text-emerald-900">
                                        {(complaint.assignedVerifier || complaint.assignedTo).name}
                                    </p>
                                    <p className="text-[10px] text-emerald-700 font-mono">
                                        {(complaint.assignedVerifier || complaint.assignedTo).email}
                                    </p>
                                    {complaint.assignedAt && (
                                        <p className="text-[9px] text-slate-400 font-mono pt-1">
                                            Assigned: {new Date(complaint.assignedAt).toLocaleString()}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100 flex items-center justify-between">
                                    <p className="text-xs font-bold text-rose-700">No verifier assigned</p>
                                    {canAssignVerifier && (
                                        <button
                                            onClick={handleOpenAssignModal}
                                            className="px-2.5 py-1 bg-primary-600 text-white text-[10px] font-bold rounded-lg uppercase hover:bg-primary-700 transition"
                                        >
                                            Assign
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SLA Tracking Card */}
                    <div className="card-premium p-6 bg-white space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Clock size={18} className="text-amber-500" />
                                <h3 className="text-xs font-black uppercase text-slate-900">SLA Performance</h3>
                            </div>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                complaint.sla?.status === 'breached' ? 'bg-red-100 text-red-700' :
                                complaint.sla?.status === 'due_soon' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                                {complaint.sla?.status || 'on_track'}
                            </span>
                        </div>

                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                                <span className="text-slate-400 font-bold text-[10px] uppercase">Started:</span>
                                <span className="font-bold text-slate-800">{complaint.sla ? new Date(complaint.sla.startedAt).toLocaleString() : 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400 font-bold text-[10px] uppercase">Deadline:</span>
                                <span className="font-bold text-slate-800">{complaint.sla ? new Date(complaint.sla.dueAt).toLocaleString() : 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400 font-bold text-[10px] uppercase">Target Duration:</span>
                                <span className="font-bold text-slate-800">{complaint.sla?.durationHours || 168} Hours</span>
                            </div>
                        </div>
                    </div>

                    {/* Escalation Control Card */}
                    <div className="card-premium p-6 bg-white space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <AlertTriangle size={18} className="text-purple-600" />
                                <h3 className="text-xs font-black uppercase text-slate-900">Escalation Status</h3>
                            </div>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-100 text-purple-800">
                                Level {complaint.escalationLevel || 0}
                            </span>
                        </div>

                        {!isVerifier && !isSuperAdmin && (
                            <button
                                onClick={() => setShowEscalateModal(true)}
                                className="w-full py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-bold transition-colors"
                            >
                                Trigger Manual Escalation
                            </button>
                        )}
                    </div>

                    {/* Workflow Status Progression Controls Form (ONLY FOR DEPT HEAD - VERIFIERS REPORT, SUPER ADMIN MONITORS) */}
                    {isDeptHead && (
                        <div className="card-premium p-6 bg-white space-y-4">
                            <h3 className="text-xs font-black uppercase text-slate-900">Advance Workflow Status</h3>

                            <form onSubmit={handleUpdateStatus} className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">New Status</label>
                                    <select
                                        value={statusForm.status}
                                        onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                                    >
                                        {WORKFLOW_STAGES.map((s) => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                        <option value="Rejected">Rejected</option>
                                        <option value="Reopened">Reopened</option>
                                    </select>
                                </div>

                                {statusForm.status === 'Resolved' && (
                                    <div className="space-y-3 p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                                        <label className="text-[10px] font-bold text-emerald-800 uppercase block">Resolution Notes</label>
                                        <textarea
                                            rows={2}
                                            placeholder="Enter work details & resolution notes..."
                                            value={statusForm.resolutionNote}
                                            onChange={(e) => setStatusForm({ ...statusForm, resolutionNote: e.target.value })}
                                            className="w-full p-2 bg-white border border-emerald-200 rounded-lg text-xs"
                                        />
                                        <div>
                                            <label className="text-[10px] font-bold text-emerald-800 uppercase block mb-1">Optional Resolution Evidence Image</label>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => setResolutionImageFile(e.target.files[0])}
                                                className="text-xs text-slate-600"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Audit Note / Comment</label>
                                    <textarea
                                        rows={2}
                                        placeholder="Add reason or status change comment..."
                                        value={statusForm.note}
                                        onChange={(e) => setStatusForm({ ...statusForm, note: e.target.value })}
                                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={updating}
                                    className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
                                >
                                    {updating && <Loader2 className="animate-spin" size={14} />}
                                    <span>Save Status Transition</span>
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>

            {/* Reassign Department Modal */}
            {showReassignModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-6 shadow-2xl">
                        <h3 className="text-lg font-black text-slate-900 uppercase italic">Reassign Department</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-600 uppercase mb-1 block">Target Department</label>
                                <select
                                    value={targetDeptCode}
                                    onChange={(e) => setTargetDeptCode(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                                >
                                    {departments.map((d) => (
                                        <option key={d._id} value={d.code}>{d.name} ({d.code})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-600 uppercase mb-1 block">Audit Reason</label>
                                <textarea
                                    rows={3}
                                    placeholder="Enter reason for department reassignment..."
                                    value={reassignReason}
                                    onChange={(e) => setReassignReason(e.target.value)}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <button onClick={() => setShowReassignModal(false)} className="px-4 py-2 bg-slate-100 text-xs font-bold rounded-xl">Cancel</button>
                            <button onClick={handleReassign} disabled={updating} className="px-5 py-2 bg-primary-600 text-white text-xs font-bold rounded-xl">Confirm</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Escalate Modal */}
            {showEscalateModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-6 shadow-2xl">
                        <h3 className="text-lg font-black text-slate-900 uppercase italic">Manual Administrative Escalation</h3>

                        <div>
                            <label className="text-xs font-bold text-slate-600 uppercase mb-1 block">Escalation Reason</label>
                            <textarea
                                rows={3}
                                placeholder="Enter justification for administrative escalation..."
                                value={escalateReason}
                                onChange={(e) => setEscalateReason(e.target.value)}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <button onClick={() => setShowEscalateModal(false)} className="px-4 py-2 bg-slate-100 text-xs font-bold rounded-xl">Cancel</button>
                            <button onClick={handleEscalate} disabled={updating} className="px-5 py-2 bg-purple-600 text-white text-xs font-bold rounded-xl">Escalate</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Assign Verifier Modal */}
            {showAssignVerifierModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="text-lg font-black text-slate-900 uppercase italic">
                                    Assign Field Verifier
                                </h3>
                                <p className="text-xs text-slate-500 font-mono">
                                    Complaint #{complaint.complaintId}
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
                                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2">
                                    <AlertTriangle size={16} className="text-rose-500 shrink-0" />
                                    <span>{assignErrorMessage}</span>
                                </div>
                            )}

                            <div>
                                <label className="text-xs font-bold text-slate-700 uppercase mb-1 block">
                                    Select Department Verifier
                                </label>
                                <select
                                    value={selectedVerifierId}
                                    onChange={(e) => {
                                        setSelectedVerifierId(e.target.value);
                                        setAssignErrorMessage('');
                                    }}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                                >
                                    <option value="">-- Unassigned (Clear Verifier) --</option>
                                    {staffMembers.map((staff, idx) => {
                                        const dbId = typeof staff._id === 'string' ? staff._id : (staff._id?._id || String(staff._id || ''));
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
                                    Assignment Note / Directive
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
                                            : (complaint?.assignedVerifier || complaint?.assignedTo)
                                                ? 'Unassign Verifier'
                                                : 'Assign Field Verifier'}
                                    </span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ComplaintDetails;
