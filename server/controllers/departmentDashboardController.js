const mongoose = require('mongoose');
const analyticsService = require('../services/analyticsService');
const hotspotService = require('../services/hotspotService');
const Complaint = require('../models/Complaint');
const Department = require('../models/Department');
const User = require('../models/User');
const notificationService = require('../services/notificationService');
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

const { normalizeDepartmentCode } = require('../config/departmentConfig');

// @desc    Get Department Staff/Verifier Officers List (Scoped)
// @route   GET /api/department/staff
const getDepartmentStaff = asyncHandler(async (req, res) => {
    const rawDeptCode = req.departmentCode || req.query.departmentCode || req.user?.departmentCode;

    if (!rawDeptCode) {
        return res.status(400).json({ message: 'Department code is required' });
    }

    const departmentCode = normalizeDepartmentCode(rawDeptCode);

    const rawStaffMembers = await User.find({
        role: { $in: ['verifier', 'department_staff'] },
        departmentCode,
    }).select('_id name email role departmentCode').lean();

    const staffMembers = rawStaffMembers.map(u => {
        let cleanId = '';
        if (u._id) {
            if (typeof u._id === 'string') {
                cleanId = u._id;
            } else if (u._id.buffer && Array.isArray(u._id.buffer.data)) {
                cleanId = Buffer.from(u._id.buffer.data).toString('hex');
            } else if (u._id.data && Array.isArray(u._id.data)) {
                cleanId = Buffer.from(u._id.data).toString('hex');
            } else {
                cleanId = u._id.toString();
            }
        }
        return {
            ...u,
            _id: cleanId,
        };
    });

    res.json({
        departmentCode,
        staffMembers,
    });
});

const { sanitizeIdString, findComplaintByIdOrCode } = require('../utils/idHelper');

// @desc    Assign or Reassign Department Complaint to Department Verifier (Department Head Only)
// @route   POST /api/department/assign
const assignComplaintToStaff = asyncHandler(async (req, res) => {
    const { complaintId, staffId, verifierId, note, reason, action } = req.body;
    const targetVerifierId = verifierId || staffId;

    const cleanComplaintId = sanitizeIdString(complaintId);
    if (!cleanComplaintId) {
        return res.status(400).json({ message: 'Valid complaintId is required' });
    }

    // 1. RBAC: Only Department Head can assign or reassign verifiers
    if (req.user && req.user.role === 'super_admin') {
        return res.status(403).json({ message: 'Super Admin is monitor-only. Only Department Heads can assign or manage verifiers.' });
    }

    if (!req.user || req.user.role !== 'department_head') {
        return res.status(403).json({ message: 'Forbidden: Only Department Head can assign or reassign verifiers' });
    }

    if (!req.user.departmentCode) {
        return res.status(403).json({ message: 'Forbidden: Department Head has no assigned department' });
    }

    const headDeptCode = normalizeDepartmentCode(req.user.departmentCode);
    const complaint = await findComplaintByIdOrCode(cleanComplaintId, Complaint);

    if (!complaint) {
        return res.status(404).json({ message: 'Complaint not found' });
    }

    // 2. Head Dept vs Complaint Dept Validation
    const complaintDeptCode = normalizeDepartmentCode(complaint.departmentCode || complaint.assignedDepartment || complaint.category);
    if (headDeptCode !== complaintDeptCode) {
        return res.status(403).json({ message: `You can only assign complaints belonging to your department (${headDeptCode})` });
    }

    // Reject assignment for already resolved or closed complaints
    if (complaint.status === 'Resolved' || complaint.status === 'Closed') {
        return res.status(400).json({ message: `Cannot assign complaint that is already ${complaint.status}` });
    }

    // Handle Unassignment Action
    if (action === 'unassign' || targetVerifierId === null || targetVerifierId === undefined || targetVerifierId === '' || targetVerifierId === 'unassign') {
        const previousAssignee = complaint.assignedTo;
        complaint.assignedTo = null;
        complaint.assignedBy = req.user._id;
        complaint.assignedAt = new Date();
        complaint.assignmentSource = 'unassigned';

        complaint.assignmentHistory.push({
            verifier: null,
            assignedBy: req.user._id,
            assignedAt: new Date(),
            action: 'unassigned',
            previousDepartmentCode: complaint.departmentCode,
            newDepartmentCode: complaint.departmentCode,
            previousAssignee: previousAssignee || null,
            newAssignee: null,
            changedBy: req.user._id,
            reason: reason || note || 'Unassigned by Department Head',
            assignmentSource: 'department_head',
            timestamp: new Date(),
        });

        await complaint.save();

        await notificationService.notifyOnVerifierAssignment({
            complaint,
            verifierId: null,
            previousVerifierId: previousAssignee,
            action: 'unassign',
            reason,
            assignedBy: req.user._id,
        }).catch((err) => console.error(err));

        return res.json({
            success: true,
            message: `Complaint #${complaint.complaintId} unassigned`,
            complaint,
        });
    }

    // 3. Verifier Target Validation
    const cleanVerifierId = sanitizeIdString(targetVerifierId);
    let staffUser = null;

    const isEmail = typeof targetVerifierId === 'string' && targetVerifierId.includes('@');
    const isValidId = cleanVerifierId && mongoose.Types.ObjectId.isValid(cleanVerifierId);

    if (!isValidId && !isEmail) {
        return res.status(400).json({ message: 'Valid verifierId or staffId is required for assignment' });
    }

    if (isValidId) {
        staffUser = await User.findById(cleanVerifierId);
    }

    if (!staffUser && isEmail) {
        staffUser = await User.findOne({ email: String(targetVerifierId).trim() });
    }

    if (!staffUser) {
        return res.status(404).json({ message: 'Verifier user not found' });
    }

    if (!['verifier', 'department_staff'].includes(staffUser.role)) {
        return res.status(400).json({ message: `Invalid user role '${staffUser.role}'. Only users with role 'verifier' can be assigned` });
    }

    const verifierDeptCode = normalizeDepartmentCode(staffUser.departmentCode);
    if (verifierDeptCode !== complaintDeptCode) {
        return res.status(400).json({ message: `Staff member does not belong to your department` });
    }

    const previousAssignee = complaint.assignedTo;
    const isReassignment = !!previousAssignee && previousAssignee.toString() !== staffUser._id.toString();

    complaint.assignedTo = staffUser._id;
    complaint.assignedAt = new Date();
    complaint.assignedBy = req.user._id;
    complaint.assignmentSource = 'department_head';
    complaint.status = 'Assigned';

    complaint.assignmentHistory.push({
        verifier: staffUser._id,
        assignedBy: req.user._id,
        assignedAt: new Date(),
        action: isReassignment ? 'reassigned' : 'assigned',
        previousDepartmentCode: complaint.departmentCode,
        newDepartmentCode: complaint.departmentCode,
        previousAssignee: previousAssignee || null,
        newAssignee: staffUser._id,
        changedBy: req.user._id,
        reason: reason || note || (isReassignment ? 'Reassigned to field verifier by Department Head' : 'Assigned to field verifier by Department Head'),
        assignmentSource: 'department_head',
        timestamp: new Date(),
    });

    await complaint.save();
    await complaint.populate('assignedTo', 'name email role departmentCode');

    await notificationService.notifyOnVerifierAssignment({
        complaint,
        verifierId: staffUser._id,
        previousVerifierId: previousAssignee,
        action: isReassignment ? 'reassign' : 'assign',
        reason,
        assignedBy: req.user._id,
    }).catch((err) => console.error(err));

    res.json({
        success: true,
        message: `Complaint #${complaint.complaintId} assigned to verifier ${staffUser.name}`,
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
