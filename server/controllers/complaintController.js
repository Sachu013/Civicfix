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
    const { verified, feedback } = req.body;
    const updated = await complaintService.verifyResolution(req.params.id, req.user._id, {
        verified: Boolean(verified),
        feedback,
    });
    res.json(updated);
});

// @desc    Citizen reopen complaint
// @route   POST /api/complaints/:id/reopen
const reopenComplaint = asyncHandler(async (req, res) => {
    const { reason } = req.body;
    const updated = await complaintService.reopenComplaint(req.params.id, req.user._id, reason);
    res.json(updated);
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
};
