const feedbackService = require('../services/feedbackService');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all feedback (Admin only)
// @route   GET /api/feedback
const getAllFeedback = asyncHandler(async (req, res) => {
    const feedback = await feedbackService.getAllFeedback();
    res.json(feedback);
});

// @desc    Submit feedback
// @route   POST /api/feedback
const submitFeedback = asyncHandler(async (req, res) => {
    const feedback = await feedbackService.createFeedback({
        ...req.body,
        user: req.user._id,
    });
    res.status(201).json(feedback);
});

module.exports = {
    getAllFeedback,
    submitFeedback,
};
