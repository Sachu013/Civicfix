const mongoose = require('mongoose');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const { normalizeDepartmentCode } = require('../config/departmentConfig');
const uploadService = require('../services/uploadService');
const notificationService = require('../services/notificationService');

const VALID_OUTCOMES = [
    'VERIFIED_CONFIRMED',
    'VERIFIED_NOT_FOUND',
    'VERIFIED_RESOLVED',
    'VERIFIED_INSUFFICIENT',
    'ISSUE_CONFIRMED',
    'ISSUE_NOT_FOUND',
    'ISSUE_ALREADY_RESOLVED',
    'INSUFFICIENT_EVIDENCE',
    'NEEDS_FURTHER_INSPECTION',
];

const { sanitizeIdString, findComplaintByIdOrCode } = require('../utils/idHelper');

// @desc    Get Verification Report details for a complaint
// @route   GET /api/complaints/:id/verification
const getVerificationReport = asyncHandler(async (req, res, next) => {
    const cleanId = sanitizeIdString(req.params.id);
    if (!cleanId) {
        return next(new ErrorResponse('Invalid or missing complaint ID', 400));
    }

    const complaint = await findComplaintByIdOrCode(cleanId);
    if (!complaint) {
        return next(new ErrorResponse('Complaint not found', 404));
    }

    const compDeptCode = normalizeDepartmentCode(complaint.departmentCode);
    const userRole = req.user ? req.user.role : null;
    const userDeptCode = req.user && req.user.departmentCode ? normalizeDepartmentCode(req.user.departmentCode) : null;

    // Verifier Authorization
    if (userRole === 'verifier' || userRole === 'department_staff') {
        if (compDeptCode !== userDeptCode) {
            return next(new ErrorResponse('Forbidden: You can only view complaints in your department', 403));
        }
        const assignedId = complaint.assignedTo ? sanitizeIdString(complaint.assignedTo._id || complaint.assignedTo) : null;
        const currentUserId = sanitizeIdString(req.user._id);
        if (!assignedId || assignedId !== currentUserId) {
            return next(new ErrorResponse('Forbidden: You can only access complaints assigned to you', 403));
        }
    } else if (userRole === 'department_head') {
        if (compDeptCode !== userDeptCode) {
            return next(new ErrorResponse(`Forbidden: You can only view complaints belonging to your department (${userDeptCode})`, 403));
        }
    } else if (userRole !== 'super_admin' && userRole !== 'admin') {
        return next(new ErrorResponse('Forbidden: Unauthorized role for verification review', 403));
    }

    await complaint.populate('verificationReport.verifier', 'name email role departmentCode');
    await complaint.populate('verificationHistory.verifier', 'name email role departmentCode');

    res.json({
        complaintId: complaint.complaintId,
        status: complaint.status,
        verificationState: complaint.verificationState || 'UNVERIFIED',
        verificationReport: complaint.verificationReport || null,
        verificationHistory: complaint.verificationHistory || [],
    });
});

// @desc    Upload evidence photos for verification report (Verifier Only)
// @route   POST /api/complaints/:id/verification/evidence
const uploadEvidence = asyncHandler(async (req, res, next) => {
    const userRole = req.user ? req.user.role : null;
    if (userRole !== 'verifier' && userRole !== 'department_staff') {
        return next(new ErrorResponse('Forbidden: Only assigned Field Verifiers can upload verification evidence', 403));
    }

    const cleanId = sanitizeIdString(req.params.id);
    if (!cleanId) {
        return next(new ErrorResponse('Invalid or missing complaint ID', 400));
    }

    const complaint = await findComplaintByIdOrCode(cleanId);
    if (!complaint) {
        return next(new ErrorResponse('Complaint not found', 404));
    }

    const compDeptCode = normalizeDepartmentCode(complaint.departmentCode);
    const userDeptCode = normalizeDepartmentCode(req.user.departmentCode);
    if (compDeptCode !== userDeptCode) {
        return next(new ErrorResponse('Forbidden: You can only upload evidence for complaints in your department', 403));
    }

    const assignedId = complaint.assignedTo ? sanitizeIdString(complaint.assignedTo._id || complaint.assignedTo) : null;
    const currentUserId = sanitizeIdString(req.user._id);
    if (!assignedId || assignedId !== currentUserId) {
        return next(new ErrorResponse('Forbidden: You can only upload evidence for complaints assigned to you', 403));
    }

    const files = req.files || (req.file ? [req.file] : []);
    if (!files || files.length === 0) {
        return next(new ErrorResponse('No evidence images provided for upload', 400));
    }

    const evidenceItems = await uploadService.uploadMultipleImages(files, {
        folder: 'civicfix_verification_evidence',
    });

    res.json({
        success: true,
        count: evidenceItems.length,
        evidence: evidenceItems,
    });
});

// @desc    Submit Field Verification Report (Verifier Only)
// @route   POST /api/complaints/:id/verification
const submitVerificationReport = asyncHandler(async (req, res, next) => {
    const userRole = req.user ? req.user.role : null;

    // Strict Authorization check: Only Verifiers can submit reports
    if (userRole !== 'verifier' && userRole !== 'department_staff') {
        if (userRole === 'super_admin' || userRole === 'admin') {
            return next(new ErrorResponse('Forbidden: Super Admin is monitor-only. Super Admin cannot edit or submit verification reports.', 403));
        }
        return next(new ErrorResponse('Forbidden: Only assigned Field Verifiers can submit verification reports', 403));
    }

    const cleanId = sanitizeIdString(req.params.id);
    if (!cleanId) {
        return next(new ErrorResponse('Invalid or missing complaint ID', 400));
    }

    const complaint = await findComplaintByIdOrCode(cleanId);
    if (!complaint) {
        return next(new ErrorResponse('Complaint not found', 404));
    }

    // Department match check
    const compDeptCode = normalizeDepartmentCode(complaint.departmentCode);
    const userDeptCode = normalizeDepartmentCode(req.user.departmentCode);
    if (compDeptCode !== userDeptCode) {
        return next(new ErrorResponse(`Forbidden: Complaint belongs to department '${compDeptCode}', which does not match your department '${userDeptCode}'`, 403));
    }

    // Assignment check: Must be assigned to this verifier
    const assignedId = complaint.assignedTo ? sanitizeIdString(complaint.assignedTo._id || complaint.assignedTo) : null;
    const currentUserId = sanitizeIdString(req.user._id);
    if (!assignedId) {
        return next(new ErrorResponse('Forbidden: This complaint is currently unassigned. Only the assigned verifier can submit a report', 403));
    }

    if (assignedId !== currentUserId) {
        return next(new ErrorResponse('Forbidden: You can only submit verification reports for complaints assigned to you', 403));
    }

    // Input Validation
    const rawOutcome = req.body.outcome || req.body.verificationOutcome;
    const outcome = rawOutcome && typeof rawOutcome === 'string' ? rawOutcome.trim() : null;
    const { findings, contactWithCitizen, citizenContactNotes, locationVerified, evidence } = req.body;

    if (!findings || typeof findings !== 'string' || findings.trim().length === 0) {
        return next(new ErrorResponse('Field findings remarks are required', 400));
    }

    if (!outcome || !VALID_OUTCOMES.includes(outcome)) {
        return next(new ErrorResponse(`Invalid verification outcome. Allowed values: ${VALID_OUTCOMES.join(', ')}`, 400));
    }

    // Duplicate Submission Prevention for same verifier
    if (
        complaint.verificationReport &&
        complaint.verificationReport.submittedAt &&
        complaint.verificationReport.status === 'submitted' &&
        complaint.verificationReport.verifier &&
        sanitizeIdString(complaint.verificationReport.verifier) === currentUserId
    ) {
        return next(new ErrorResponse('Verification report has already been submitted for this complaint. Duplicate submission rejected.', 400));
    }

    // Construct Verification Report
    const reportData = {
        verifier: req.user._id,
        submittedAt: new Date(),
        findings: findings.trim(),
        outcome,
        contactWithCitizen: !!contactWithCitizen,
        citizenContactNotes: citizenContactNotes ? citizenContactNotes.trim() : '',
        locationVerified: !!locationVerified,
        status: 'submitted',
        evidence: Array.isArray(evidence) ? evidence : [],
    };

    // Update Complaint Document
    complaint.verificationReport = reportData;

    // Map outcome to verificationState
    let stateMap = {
        'VERIFIED_CONFIRMED': 'VERIFIED_CONFIRMED',
        'VERIFIED_NOT_FOUND': 'VERIFIED_NOT_FOUND',
        'VERIFIED_RESOLVED': 'VERIFIED_RESOLVED',
        'VERIFIED_INSUFFICIENT': 'VERIFIED_INSUFFICIENT',
        'ISSUE_CONFIRMED': 'VERIFIED_CONFIRMED',
        'ISSUE_NOT_FOUND': 'VERIFIED_NOT_FOUND',
        'ISSUE_ALREADY_RESOLVED': 'VERIFIED_RESOLVED',
        'INSUFFICIENT_EVIDENCE': 'VERIFIED_INSUFFICIENT',
        'NEEDS_FURTHER_INSPECTION': 'AWAITING_REVIEW',
    };
    complaint.verificationState = stateMap[outcome] || 'AWAITING_REVIEW';

    // Append to Verification History (Preserves previous submissions/history)
    complaint.verificationHistory.push({
        verifier: req.user._id,
        action: 'submitted',
        outcome,
        findings: findings.trim(),
        evidenceCount: reportData.evidence.length,
        contactWithCitizen: reportData.contactWithCitizen,
        citizenContactNotes: reportData.citizenContactNotes,
        locationVerified: reportData.locationVerified,
        timestamp: new Date(),
    });

    await complaint.save();
    await complaint.populate('verificationReport.verifier', 'name email role departmentCode');

    await notificationService.notifyOnVerificationReport({
        complaint,
        verifierId: req.user._id,
        report: reportData,
    }).catch((err) => console.error(err));

    res.json({
        success: true,
        message: 'Verification report submitted successfully and awaiting Department Head review.',
        complaint,
    });
});

module.exports = {
    getVerificationReport,
    uploadEvidence,
    submitVerificationReport,
};
