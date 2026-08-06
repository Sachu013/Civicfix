const alertService = require('../services/alertService');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all alerts
// @route   GET /api/alerts
const getAlerts = asyncHandler(async (req, res) => {
    const alerts = await alertService.getAllAlerts();
    res.json(alerts);
});

// @desc    Create alert (Admin only)
// @route   POST /api/alerts
const createAlert = asyncHandler(async (req, res) => {
    const alert = await alertService.createAlert({
        ...req.body,
        postedBy: req.user._id,
    });
    res.status(201).json(alert);
});

module.exports = {
    getAlerts,
    createAlert,
};
