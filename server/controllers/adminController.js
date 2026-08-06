const adminService = require('../services/adminService');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all complaints
// @route   GET /api/admin/complaints
const getAllComplaints = asyncHandler(async (req, res) => {
    const complaints = await adminService.getAllComplaints();
    res.json(complaints);
});

// @desc    Update a complaint's parameters
// @route   PUT /api/admin/complaints/:id
const updateComplaint = asyncHandler(async (req, res) => {
    const updatedComplaint = await adminService.updateComplaint(req.params.id, req.body);
    res.json(updatedComplaint);
});

// @desc    Get dashboard metrics
// @route   GET /api/admin/metrics
const getDashboardMetrics = asyncHandler(async (req, res) => {
    const metrics = await adminService.getDashboardMetrics();
    res.json(metrics);
});

module.exports = {
    getAllComplaints,
    updateComplaint,
    getDashboardMetrics,
};
