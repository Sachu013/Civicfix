import React, { useState } from 'react';
import {
    AlertTriangle,
    MapPin,
    FileText,
    Image as ImageIcon,
    CheckCircle2,
    ArrowRight,
    ExternalLink,
    ThumbsUp,
    ShieldAlert,
    X,
    Loader2,
    Info
} from 'lucide-react';
import api from '../api';

const DuplicateWarningModal = ({
    candidates = [],
    onSubmitAnyway,
    onViewComplaint,
    onClose,
}) => {
    const [supportingId, setSupportingId] = useState(null);
    const [supportedSuccessId, setSupportedSuccessId] = useState(null);

    const handleSupport = async (complaintId) => {
        setSupportingId(complaintId);
        try {
            await api.post(`/complaints/${complaintId}/support`);
            setSupportedSuccessId(complaintId);
        } catch (error) {
            console.error('Failed to support complaint:', error);
            alert('Unable to process support request. Please try again.');
        } finally {
            setSupportingId(null);
        }
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">

                {/* Modal Header */}
                <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 flex items-start justify-between">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-200">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-xl font-black text-slate-900 font-display">
                                    Similar Complaint Found
                                </h3>
                                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900">
                                    {candidates.length} Candidate{candidates.length > 1 ? 's' : ''}
                                </span>
                            </div>
                            <p className="text-xs text-amber-800 font-medium mt-1">
                                A similar complaint may already exist near your selected location. You remain in full control.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-white/80 transition-colors"
                        title="Close Warning"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Candidates List Body */}
                <div className="p-6 overflow-y-auto space-y-4 flex-1">
                    {candidates.map((candidate) => {
                        const isSupported = supportedSuccessId === candidate.complaintId;
                        const isSupporting = supportingId === candidate.complaintId;

                        return (
                            <div
                                key={candidate.complaintId}
                                className="p-5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-4 hover:border-amber-300 transition-all shadow-sm"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md bg-slate-200 text-slate-700">
                                                {candidate.category || 'Incident'}
                                            </span>
                                            <span
                                                className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-md ${
                                                    candidate.status === 'Resolved'
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : candidate.status === 'In Progress'
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : 'bg-amber-100 text-amber-700'
                                                }`}
                                            >
                                                Status: {candidate.status}
                                            </span>
                                        </div>
                                        <h4 className="font-bold text-slate-900 text-base">
                                            {candidate.title}
                                        </h4>
                                    </div>

                                    {/* Overall Confidence Badge */}
                                    <div className="text-right shrink-0">
                                        <span className="text-xs font-black text-amber-700 bg-amber-100 border border-amber-200 px-3 py-1 rounded-full inline-flex items-center gap-1.5 shadow-xs">
                                            <ShieldAlert size={14} className="text-amber-600" />
                                            {candidate.overallScore}% — {candidate.confidence}
                                        </span>
                                    </div>
                                </div>

                                {/* Address & Thumbnail */}
                                <div className="flex items-start gap-4 text-xs text-slate-600">
                                    {candidate.imageUrl && (
                                        <img
                                            src={candidate.imageUrl}
                                            alt="Complaint thumbnail"
                                            className="w-16 h-16 object-cover rounded-xl border border-slate-200 shadow-xs shrink-0"
                                        />
                                    )}
                                    <div className="space-y-1 min-w-0">
                                        <p className="flex items-center gap-1.5 text-slate-500 font-medium">
                                            <MapPin size={14} className="text-primary-500 shrink-0" />
                                            <span className="truncate">{candidate.formattedAddress || 'Nearby Location'}</span>
                                        </p>
                                        <p className="text-[11px] text-slate-400 font-medium">
                                            Tracking ID: <span className="font-mono font-bold text-slate-700">{candidate.complaintId}</span>
                                        </p>
                                    </div>
                                </div>

                                {/* Component Scores Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                                    <div className="p-2 bg-white rounded-xl border border-slate-200/60 text-center">
                                        <span className="text-slate-400 font-bold block text-[10px] uppercase">Distance</span>
                                        <span className="font-bold text-slate-800 text-xs">{candidate.distance} m</span>
                                    </div>
                                    <div className="p-2 bg-white rounded-xl border border-slate-200/60 text-center">
                                        <span className="text-slate-400 font-bold block text-[10px] uppercase">Text Similarity</span>
                                        <span className="font-bold text-slate-800 text-xs">{candidate.textScore}%</span>
                                    </div>
                                    <div className="p-2 bg-white rounded-xl border border-slate-200/60 text-center">
                                        <span className="text-slate-400 font-bold block text-[10px] uppercase">Image Similarity</span>
                                        <span className="font-bold text-slate-800 text-xs">
                                            {candidate.imageScore !== null ? `${candidate.imageScore}%` : 'N/A'}
                                        </span>
                                    </div>
                                    <div className="p-2 bg-white rounded-xl border border-slate-200/60 text-center">
                                        <span className="text-slate-400 font-bold block text-[10px] uppercase">Location Score</span>
                                        <span className="font-bold text-slate-800 text-xs">{candidate.locationScore}%</span>
                                    </div>
                                </div>

                                {/* Action Buttons per Candidate */}
                                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200/40">
                                    <button
                                        type="button"
                                        onClick={() => onViewComplaint && onViewComplaint(candidate.complaintId)}
                                        className="btn-secondary !py-1.5 !px-3 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-100"
                                    >
                                        <ExternalLink size={13} />
                                        View Complaint
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleSupport(candidate.complaintId)}
                                        disabled={isSupporting || isSupported}
                                        className={`!py-1.5 !px-3 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs ${
                                            isSupported
                                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                                        }`}
                                    >
                                        {isSupporting ? (
                                            <Loader2 size={13} className="animate-spin" />
                                        ) : isSupported ? (
                                            <>
                                                <CheckCircle2 size={13} className="text-emerald-600" />
                                                Supported!
                                            </>
                                        ) : (
                                            <>
                                                <ThumbsUp size={13} />
                                                Support Existing Complaint
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Modal Footer Controls */}
                <div className="p-6 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                        <Info size={16} className="text-amber-500 shrink-0" />
                        <span>You can still submit your new report if it's a distinct issue.</span>
                    </div>

                    <button
                        type="button"
                        onClick={onSubmitAnyway}
                        className="btn-primary !py-3 !px-6 text-xs font-extrabold flex items-center gap-2 shadow-md hover:scale-[1.02] transition-all shrink-0 w-full sm:w-auto"
                    >
                        Submit New Complaint Anyway
                        <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DuplicateWarningModal;
