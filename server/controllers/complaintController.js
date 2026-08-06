const complaintService = require('../services/complaintService');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Submit a complaint
// @route   POST /api/complaints
const submitComplaint = asyncHandler(async (req, res) => {
    const {
        title,
        description,
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
    });

    res.status(201).json(complaint);
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

module.exports = {
    submitComplaint,
    getMyComplaints,
    trackComplaint,
};
