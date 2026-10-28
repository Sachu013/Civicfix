const complaintService = require('../services/complaintService');
const duplicateDetectionService = require('../services/duplicateDetectionService');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Submit a complaint (supports JSON and multipart/form-data with image file)
// @route   POST /api/complaints
const submitComplaint = asyncHandler(async (req, res) => {
    const {
        title,
        description,
        category,
        subcategory,
        location,
        imageUrl,
        latitude,
        longitude,
        formattedAddress,
        landmark,
        locality,
        city,
        district,
        state,
        pincode,
        country
    } = req.body;

    const complaint = await complaintService.createComplaint({
        userId: req.user._id,
        title,
        description,
        category,
        subcategory,
        location,
        imageUrl,
        imageFile: req.file, // Passed from Multer uploadSingleImage middleware
        latitude,
        longitude,
        formattedAddress,
        landmark,
        locality,
        city,
        district,
        state,
        pincode,
        country
    });

    res.status(201).json(complaint);
});

// @desc    Check for potential duplicate complaints before creation
// @route   POST /api/complaints/check-duplicates
const checkDuplicates = asyncHandler(async (req, res) => {
    const {
        title,
        description,
        category,
        latitude,
        longitude,
        location,
        imageUrl,
    } = req.body;

    const results = await duplicateDetectionService.findPotentialDuplicates({
        latitude,
        longitude,
        title,
        description,
        category,
        imageUrl,
        imageFile: req.file,
    });

    res.json(results);
});

// @desc    Support an existing complaint
// @route   POST /api/complaints/:id/support
const supportComplaint = asyncHandler(async (req, res) => {
    const result = await complaintService.supportComplaint(req.params.id, req.user._id);
    res.json(result);
});

// @desc    Get user's complaints
// @route   GET /api/complaints/my
const getMyComplaints = asyncHandler(async (req, res) => {
    const complaints = await complaintService.getUserComplaints(req.user._id);
    res.json(complaints);
});

// @desc    Track a complaint by ID
// @route   GET /api/complaints/track/:id
const trackComplaint = asyncHandler(async (req, res) => {
    const complaint = await complaintService.trackComplaint(req.params.id);
    res.json(complaint);
});

// @desc    Get nearby complaints within radius
// @route   GET /api/complaints/nearby
const getNearbyComplaints = asyncHandler(async (req, res) => {
    const { lat, lng, radius } = req.query;
    const complaints = await complaintService.getNearbyComplaints({
        latitude: lat,
        longitude: lng,
        radiusInMeters: radius,
    });
    res.json(complaints);
});

// @desc    Citizen resolution verification (confirm/reject)
// @route   POST /api/complaints/:id/verify-resolution
const verifyResolution = asyncHandler(async (req, res) => {
    if (req.user && ['super_admin', 'admin'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Super Admin is monitor-only. Super Admin cannot modify citizen confirmation.' });
    }
    const isConfirmed = req.body.verified !== undefined ? Boolean(req.body.verified) :
                        req.body.satisfied !== undefined ? Boolean(req.body.satisfied) :
                        req.body.action === 'confirm';
    const feedback = req.body.feedback || req.body.remarks || '';
    const updated = await complaintService.verifyResolution(req.params.id, req.user._id, {
        verified: isConfirmed,
        feedback,
    });
    res.json(updated);
});

// @desc    Citizen reopen complaint
// @route   POST /api/complaints/:id/reopen
const reopenComplaint = asyncHandler(async (req, res) => {
    if (req.user && ['super_admin', 'admin'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Super Admin is monitor-only. Super Admin cannot reopen complaints.' });
    }
    const { reason } = req.body;
    const updated = await complaintService.reopenComplaint(req.params.id, req.user._id, reason);
    res.json(updated);
});

// @desc    Get complaints assigned to current logged-in verifier (Verifier Queue)
// @route   GET /api/complaints/assigned-to-me
const getAssignedToMe = asyncHandler(async (req, res) => {
    if (!req.user || !['verifier', 'department_staff', 'department_head'].includes(req.user.role)) {
        return res.status(403).json({ message: 'Forbidden: Access restricted to assigned verifiers' });
    }

    const Complaint = require('../models/Complaint');
    const { normalizeDepartmentCode } = require('../config/departmentConfig');

    const verifierDeptCode = req.user.departmentCode ? normalizeDepartmentCode(req.user.departmentCode) : null;

    const query = {
        assignedTo: req.user._id,
    };
    if (verifierDeptCode) {
        query.departmentCode = verifierDeptCode;
    }

    const complaints = await Complaint.find(query)
        .populate('user', 'name email phone')
        .populate('assignedTo', 'name email role departmentCode')
        .sort({ priority: -1, createdAt: -1 });

    res.json(complaints);
});

// @desc    Assign verifier to complaint (Department Head Only)
// @route   PUT /api/complaints/:id/assign-verifier
const assignVerifier = asyncHandler(async (req, res) => {
    const { assignComplaintToStaff } = require('./departmentDashboardController');
    req.body.complaintId = req.body.complaintId || req.params.id;
    return await assignComplaintToStaff(req, res);
});

module.exports = {
    submitComplaint,
    checkDuplicates,
    supportComplaint,
    getMyComplaints,
    trackComplaint,
    getNearbyComplaints,
    verifyResolution,
    reopenComplaint,
    getAssignedToMe,
    assignVerifier,
};
