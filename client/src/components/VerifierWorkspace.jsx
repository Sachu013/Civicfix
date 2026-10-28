import React, { useState } from 'react';
import api from '../api';
import { getCanonicalId } from '../utils/idUtils';
import { 
  ClipboardCheck, 
  Upload, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock, 
  Phone, 
  MapPin, 
  Image as ImageIcon,
  Trash2,
  Lock,
  Send
} from 'lucide-react';

const OUTCOME_OPTIONS = [
  { value: 'VERIFIED_CONFIRMED', label: 'Verified & Confirmed', description: 'Issue exists at physical location and matches description.' },
  { value: 'VERIFIED_NOT_FOUND', label: 'Verified - Not Found / Invalid', description: 'Issue could not be located or was false report.' },
  { value: 'VERIFIED_RESOLVED', label: 'Verified - Already Resolved', description: 'Issue was already fixed prior to verification inspection.' },
  { value: 'VERIFIED_INSUFFICIENT', label: 'Verified - Insufficient Information', description: 'More details or exact landmark required from citizen.' }
];

export default function VerifierWorkspace({ complaint, token, onReportSubmitted }) {
  const isSubmitted = complaint?.verificationState && complaint.verificationState !== 'UNVERIFIED';
  const existingReport = complaint?.verificationReport || {};

  // Form state
  const [findings, setFindings] = useState(existingReport.findings || '');
  const [outcome, setOutcome] = useState(existingReport.outcome || 'VERIFIED_CONFIRMED');
  const [contactWithCitizen, setContactWithCitizen] = useState(existingReport.contactWithCitizen || false);
  const [citizenContactNotes, setCitizenContactNotes] = useState(existingReport.citizenContactNotes || '');
  const [locationVerified, setLocationVerified] = useState(existingReport.locationVerified !== undefined ? existingReport.locationVerified : true);
  
  // Evidence state
  const [evidenceList, setEvidenceList] = useState(existingReport.evidence || []);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Handle uploading evidence files
  const handleEvidenceUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const cleanComplaintId = getCanonicalId(complaint);
    if (!cleanComplaintId) {
      setError('Cannot upload evidence: Missing or invalid complaint ID.');
      return;
    }

    if (evidenceList.length + files.length > 5) {
      setError('Maximum 5 evidence images allowed per verification report.');
      return;
    }

    setUploading(true);
    setError('');
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('evidence', files[i]);
    }

    try {
      const headers = { 'Content-Type': 'multipart/form-data' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await api.post(
        `/complaints/${cleanComplaintId}/verification/evidence`,
        formData,
        { headers }
      );

      if (res.data && res.data.evidence) {
        setEvidenceList((prev) => [...prev, ...res.data.evidence]);
      }
    } catch (err) {
      console.error('Evidence upload error:', err);
      setError(err.response?.data?.message || 'Failed to upload evidence files.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveEvidence = (index) => {
    setEvidenceList((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit report
  const handleSubmitReport = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanComplaintId = getCanonicalId(complaint);
    if (!cleanComplaintId) {
      setError('Cannot submit report: Missing or invalid complaint ID.');
      return;
    }

    if (!findings || findings.trim().length < 10) {
      setError('Findings description must be at least 10 characters long.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        findings: findings.trim(),
        outcome,
        contactWithCitizen,
        citizenContactNotes: contactWithCitizen ? citizenContactNotes.trim() : '',
        locationVerified,
        evidence: evidenceList
      };

      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await api.post(
        `/complaints/${cleanComplaintId}/verification`,
        payload,
        { headers }
      );

      setSuccessMsg('Verification report submitted successfully! Status set to Awaiting Review.');
      if (onReportSubmitted) {
        onReportSubmitted(res.data.complaint || res.data);
      }
    } catch (err) {
      console.error('Submit report error:', err);
      setError(err.response?.data?.message || 'Failed to submit verification report.');
    } finally {
      setSubmitting(false);
    }
  };

  const getOutcomeBadge = (outcomeValue) => {
    switch (outcomeValue) {
      case 'VERIFIED_CONFIRMED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"><CheckCircle className="w-3.5 h-3.5 mr-1" /> Confirmed On-Site</span>;
      case 'VERIFIED_NOT_FOUND':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300"><XCircle className="w-3.5 h-3.5 mr-1" /> Not Found / Invalid</span>;
      case 'VERIFIED_RESOLVED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"><CheckCircle className="w-3.5 h-3.5 mr-1" /> Already Resolved</span>;
      case 'VERIFIED_INSUFFICIENT':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"><AlertCircle className="w-3.5 h-3.5 mr-1" /> Insufficient Details</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">{outcomeValue}</span>;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Field Verification Workspace</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Conduct on-site investigation and record verification findings for Department Head review.
            </p>
          </div>
        </div>
        <div>
          {isSubmitted ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
              <Clock className="w-3.5 h-3.5 mr-1 animate-pulse" /> Awaiting Dept Head Review
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
              <ClipboardCheck className="w-3.5 h-3.5 mr-1" /> Investigation Active
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 dark:bg-red-950/40 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-sm flex items-center">
          <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
          {error}
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-lg text-sm flex items-center">
          <CheckCircle className="w-4 h-4 mr-2 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* READ ONLY MODE IF SUBMITTED */}
      {isSubmitted ? (
        <div className="space-y-6">
          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start space-x-3">
            <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-semibold text-amber-900 dark:text-amber-200 text-sm">Report Submitted & Locked</h4>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                Your verification report was submitted on{' '}
                <span className="font-medium">
                  {existingReport.submittedAt ? new Date(existingReport.submittedAt).toLocaleString() : 'N/A'}
                </span>
                . Official status decision is currently pending Department Head review.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">
                Verification Outcome
              </span>
              <div className="mt-1">{getOutcomeBadge(existingReport.outcome)}</div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">
                Location Verification
              </span>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 flex items-center">
                <MapPin className="w-4 h-4 mr-1.5 text-indigo-500" />
                {existingReport.locationVerified ? 'Physical location verified on-site' : 'Location could not be verified on-site'}
              </p>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">
                Citizen Contact Status
              </span>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 flex items-center">
                <Phone className="w-4 h-4 mr-1.5 text-indigo-500" />
                {existingReport.contactWithCitizen ? 'Contacted Citizen' : 'No Citizen Contact Made'}
              </p>
              {existingReport.contactWithCitizen && existingReport.citizenContactNotes && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700 italic">
                  "{existingReport.citizenContactNotes}"
                </p>
              )}
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">
                Evidence Files Uploaded
              </span>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {existingReport.evidence ? existingReport.evidence.length : 0} photo(s) attached
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Investigation Findings</h4>
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
              {existingReport.findings || 'No findings recorded.'}
            </div>
          </div>

          {/* Evidence Grid */}
          {existingReport.evidence && existingReport.evidence.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                <ImageIcon className="w-4 h-4 mr-1.5 text-indigo-500" /> Verification Evidence Photos ({existingReport.evidence.length})
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {existingReport.evidence.map((ev, idx) => (
                  <div key={idx} className="group relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900">
                    <img
                      src={ev.url}
                      alt={ev.caption || `Evidence photo ${idx + 1}`}
                      className="w-full h-32 object-cover transition duration-200 group-hover:scale-105"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] p-1 truncate">
                      {ev.caption || `Photo ${idx + 1}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* EDITABLE FORM MODE FOR VERIFIER */
        <form onSubmit={handleSubmitReport} className="space-y-6">
          {/* Outcome selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
              Verification Outcome <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {OUTCOME_OPTIONS.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => setOutcome(opt.value)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition duration-150 flex flex-col justify-between ${
                    outcome === opt.value
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 dark:border-indigo-500 ring-2 ring-indigo-500/20'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm text-gray-900 dark:text-white">{opt.label}</span>
                    <input
                      type="radio"
                      name="outcome"
                      value={opt.value}
                      checked={outcome === opt.value}
                      onChange={() => setOutcome(opt.value)}
                      className="text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{opt.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Findings textarea */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
              Field Investigation Findings <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Provide specific observations, site condition measurements, or details gathered during inspection.
            </p>
            <textarea
              rows={4}
              value={findings}
              onChange={(e) => setFindings(e.target.value)}
              placeholder="e.g. Inspected site at 10:30 AM. Found 2-meter wide pothole near intersection causing traffic hazard. Verified depth is ~15cm..."
              className="w-full rounded-lg border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 text-sm p-3"
              required
            />
          </div>

          {/* Verification Toggles & Citizen Contact */}
          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-indigo-500" />
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Physical Location Verified On-Site</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={locationVerified}
                  onChange={(e) => setLocationVerified(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:after:border-gray-600 peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-indigo-500" />
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Direct Contact Made With Citizen</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={contactWithCitizen}
                    onChange={(e) => setContactWithCitizen(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:after:border-gray-600 peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {contactWithCitizen && (
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Citizen Discussion / Contact Notes
                  </label>
                  <input
                    type="text"
                    value={citizenContactNotes}
                    onChange={(e) => setCitizenContactNotes(e.target.value)}
                    placeholder="e.g. Called citizen at 9:45 AM. Confirmed exact location near landmark."
                    className="w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white text-xs p-2.5"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Evidence Upload Gallery */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
                Upload Field Evidence Photos (Max 5)
              </label>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {evidenceList.length} / 5 photos uploaded
              </span>
            </div>

            {/* Thumbnails preview */}
            {evidenceList.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                {evidenceList.map((ev, idx) => (
                  <div key={idx} className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 group">
                    <img src={ev.url} alt={ev.caption || `Evidence ${idx + 1}`} className="w-full h-24 object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveEvidence(idx)}
                      className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-80 hover:opacity-100 transition"
                      title="Remove image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="p-1 bg-black/60 text-white text-[10px] truncate">
                      {ev.caption || `Evidence ${idx + 1}`}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {evidenceList.length < 5 && (
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl cursor-pointer bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800/60 transition">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-6 h-6 text-gray-400 mb-1" />
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">Click to upload photo evidence</span> or drag and drop
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">PNG, JPG, JPEG up to 10MB</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleEvidenceUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>
            )}
            {uploading && <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2 animate-pulse">Uploading evidence...</p>}
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
            <button
              type="submit"
              disabled={submitting || uploading}
              className="inline-flex items-center px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 shadow-sm transition"
            >
              {submitting ? (
                <>Submitting Verification Report...</>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" /> Submit Verification Report
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
