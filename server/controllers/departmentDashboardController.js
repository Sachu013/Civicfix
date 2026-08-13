const analyticsService = require('../services/analyticsService');
const hotspotService = require('../services/hotspotService');
const Complaint = require('../models/Complaint');
const Department = require('../models/Department');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get Department Head Dashboard Overview Metrics (Scoped)
// @route   GET /api/department/dashboard
const getDepartmentDashboard = asyncHandler(async (req, res) => {
    const departmentCode = req.departmentCode || req.query.departmentCode;

    if (!departmentCode) {
        return res.status(400).json({ message: 'Department code is required for department dashboard' });
    }

    const filters = { ...req.query, departmentCode };

    const overview = await analyticsService.getOverviewMetrics(filters);
    const departmentInfo = await Department.findOne({ code: departmentCode });

    res.json({
        department: {
            code: departmentCode,
            name: departmentInfo ? departmentInfo.name : `${departmentCode} Department`,
            description: departmentInfo ? departmentInfo.description : '',
        },
        overview,
    });
});

// @desc    Get Department Complaint Queue (Scoped)
// @route   GET /api/department/complaints
const getDepartmentComplaints = asyncHandler(async (req, res) => {
    const departmentCode = req.departmentCode || req.query.departmentCode;

    if (!departmentCode) {
        return res.status(400).json({ message: 'Department code is required' });
    }

    const match = analyticsService.buildMatchQuery({ ...req.query, departmentCode });

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const total = await Complaint.countDocuments(match);
    const complaints = await Complaint.find(match)
        .populate('user', 'name email')
        .sort({ priority: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit);

    res.json({
        complaints,
        page,
        pages: Math.ceil(total / limit),
        total,
    });
});

// @desc    Get Department Performance Analytics & Category Breakdown (Scoped)
// @route   GET /api/department/analytics
const getDepartmentAnalytics = asyncHandler(async (req, res) => {
    const departmentCode = req.departmentCode || req.query.departmentCode;

    if (!departmentCode) {
        return res.status(400).json({ message: 'Department code is required' });
    }

    const filters = { ...req.query, departmentCode };

    const [overview, categories, severityPriority, trends] = await Promise.all([
        analyticsService.getOverviewMetrics(filters),
        analyticsService.getCategoryAnalytics(filters),
        analyticsService.getSeverityPriorityAnalytics(filters),
        analyticsService.getTrendAnalytics(filters),
    ]);

    res.json({
        departmentCode,
        overview,
        categories,
        severityPriority,
        trends,
    });
});

// @desc    Get Department Geospatial Hotspots (Scoped)
// @route   GET /api/department/hotspots
const getDepartmentHotspots = asyncHandler(async (req, res) => {
    const departmentCode = req.departmentCode || req.query.departmentCode;

    if (!departmentCode) {
        return res.status(400).json({ message: 'Department code is required' });
    }

    const filters = { ...req.query, departmentCode };

    const hotspots = await hotspotService.detectHotspots(filters);
    const geospatial = await analyticsService.getGeospatialAnalytics(filters);

    res.json({
        departmentCode,
        hotspots: hotspots.hotspots,
        totalHotspots: hotspots.totalHotspots,
        geospatial,
    });
});

// @desc    Get Department SLA Monitoring Queue (Scoped)
// @route   GET /api/department/sla
const getDepartmentSLA = asyncHandler(async (req, res) => {
    const departmentCode = req.departmentCode || req.query.departmentCode;

    if (!departmentCode) {
        return res.status(400).json({ message: 'Department code is required' });
    }

    const match = analyticsService.buildMatchQuery({ ...req.query, departmentCode });

    const slaOverview = await analyticsService.getSLAAnalytics({ departmentCode });

    const slaQueue = await Complaint.find(match)
        .select('complaintId title category priority severity status sla assignedDepartment createdAt')
        .sort({ 'sla.dueAt': 1 });

    res.json({
        departmentCode,
        slaOverview,
        queue: slaQueue,
    });
});

// @desc    Get Department Escalated Complaints Queue (Scoped)
// @route   GET /api/department/escalations
const getDepartmentEscalations = asyncHandler(async (req, res) => {
    const departmentCode = req.departmentCode || req.query.departmentCode;

    if (!departmentCode) {
        return res.status(400).json({ message: 'Department code is required' });
    }

    const match = analyticsService.buildMatchQuery({ ...req.query, departmentCode });
    match.escalationLevel = { $gt: 0 };

    const escalations = await Complaint.find(match)
        .populate('user', 'name email')
        .sort({ escalationLevel: -1, createdAt: -1 });

    res.json({
        departmentCode,
        totalEscalated: escalations.length,
        escalations,
    });
});

// @desc    Get Department Staff Officers List (Scoped)
// @route   GET /api/department/staff
const getDepartmentStaff = asyncHandler(async (req, res) => {
    const departmentCode = req.departmentCode || req.query.departmentCode;

    if (!departmentCode) {
        return res.status(400).json({ message: 'Department code is required' });
    }

    const staffMembers = await User.find({
        role: 'department_staff',
        departmentCode: departmentCode.toUpperCase(),
    }).select('_id name email departmentCode');

    res.json({
        departmentCode,
        staffMembers,
    });
});

// @desc    Assign Department Complaint to Department Staff Member (Scoped)
// @route   POST /api/department/assign
const assignComplaintToStaff = asyncHandler(async (req, res) => {
    const { complaintId, staffId, note } = req.body;
    const departmentCode = req.departmentCode || req.user.departmentCode;

    if (!complaintId || !staffId) {
        return res.status(400).json({ message: 'complaintId and staffId are required' });
    }

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
        return res.status(404).json({ message: 'Complaint not found' });
    }

    // Verify complaint belongs to authenticated user's department
    if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
        if (complaint.departmentCode !== departmentCode.toUpperCase()) {
            return res.status(403).json({ message: 'Forbidden: Cannot assign complaint belonging to another department' });
        }
    }

    // Verify target staff member belongs to the exact same department
    const User = require('../models/User');
    const staffUser = await User.findById(staffId);
    if (!staffUser || staffUser.role !== 'department_staff') {
        return res.status(400).json({ message: 'Invalid staff user specified' });
    }

    if (staffUser.departmentCode !== complaint.departmentCode) {
        return res.status(403).json({ message: 'Forbidden: Cannot assign complaint to staff of a different department' });
    }

    const previousAssignee = complaint.assignedTo;

    complaint.assignedTo = staffUser._id;
    complaint.assignedAt = new Date();
    complaint.assignedBy = req.user._id;
    complaint.assignmentSource = 'reassignment';
    complaint.status = 'Assigned';

    complaint.assignmentHistory.push({
        previousDepartmentCode: complaint.departmentCode,
        newDepartmentCode: complaint.departmentCode,
        previousAssignee,
        newAssignee: staffUser._id,
        changedBy: req.user._id,
        reason: note || 'Assigned to field staff officer by Department Head',
        assignmentSource: 'department_head',
        timestamp: new Date(),
    });

    await complaint.save();

    res.json({
        message: `Complaint #${complaint.complaintId} assigned to ${staffUser.name}`,
        complaint,
    });
});

module.exports = {
    getDepartmentDashboard,
    getDepartmentComplaints,
    getDepartmentAnalytics,
    getDepartmentHotspots,
    getDepartmentSLA,
    getDepartmentEscalations,
    getDepartmentStaff,
    assignComplaintToStaff,
};
