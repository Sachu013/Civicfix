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
    Loader2
} from 'lucide-react';
import api from '../api';

const WORKFLOW_STAGES = [
    'Submitted',
    'Verified',
    'Assigned',
    'In Progress',
    'Resolved',
    'Citizen Verification',
    'Closed'
];

const ComplaintDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [complaint, setComplaint] = useState(null);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

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

    const fetchComplaintDetails = async () => {
        try {
            const [complaintsRes, deptsRes] = await Promise.all([
                api.get('/admin/complaints'),
                api.get('/departments')
            ]);
            const found = complaintsRes.data.find(c => c._id === id);
            setComplaint(found);
            setDepartments(deptsRes.data);

            if (found) {
                setStatusForm({
                    status: found.status,
                    note: '',
                    resolutionNote: found.resolution?.resolutionNote || '',
                });
                setTargetDeptCode(found.departmentCode || 'GENERAL');
            }
        } catch (error) {
            console.error('Failed to load complaint details:', error);
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

    if (loading || !complaint) return (
        <div className="max-w-6xl mx-auto space-y-10 py-10">
            <div className="h-20 bg-white rounded-3xl shimmer"></div>
            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 h-[600px] bg-white rounded-[2.5rem] shimmer"></div>
                <div className="h-[600px] bg-white rounded-[2.5rem] shimmer"></div>
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
                                            <p className="font-bold text-slate-900">
                                                Reassigned to <span className="text-primary-600">{hist.newDepartmentName}</span> ({hist.newDepartmentCode})
                                            </p>
                                            <p className="text-slate-500 font-medium">{hist.reason}</p>
                                            <span className="text-[10px] text-slate-400 font-mono block">{new Date(hist.timestamp).toLocaleString()}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-slate-400 italic">No previous reassignment records logged.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Operations Control Sidebar */}
                <div className="space-y-6">
                    {/* Department Assignment Box */}
                    <div className="card-premium p-6 bg-white space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Building2 size={18} className="text-primary-600" />
                                <h3 className="text-xs font-black uppercase text-slate-900">Assigned Department</h3>
                            </div>
                            <button
                                onClick={() => setShowReassignModal(true)}
                                className="text-[10px] font-black text-primary-600 uppercase hover:underline"
                            >
                                Reassign
                            </button>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                            <p className="font-extrabold text-sm text-slate-900">{complaint.assignedDepartment || 'General Administration'}</p>
                            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                                <span>Code: {complaint.departmentCode || 'GENERAL'}</span>
                                <span>Source: {complaint.assignmentSource || 'automatic'}</span>
                            </div>
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

                        <button
                            onClick={() => setShowEscalateModal(true)}
                            className="w-full py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-bold transition-colors"
                        >
                            Trigger Manual Escalation
                        </button>
                    </div>

                    {/* Workflow Status Progression Controls Form */}
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
        </div>
    );
};

export default ComplaintDetails;
