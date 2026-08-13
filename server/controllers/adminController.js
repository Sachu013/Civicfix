const adminService = require('../services/adminService');
const escalationService = require('../services/escalationService');
const slaService = require('../services/slaService');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const Department = require('../models/Department');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

/**
 * Ensures Department Heads and Staff can ONLY access complaints within their assigned department.
 */
const verifyComplaintDepartmentAccess = (req, complaint) => {
    if (!req.user) return;
    const userRole = req.user.role;
    const isSuper = userRole === 'super_admin' || userRole === 'admin';
    if (isSuper) return; // Super Admin has global access

    if (userRole === 'department_head' || userRole === 'department_staff') {
        const userDept = req.user.departmentCode ? req.user.departmentCode.toUpperCase() : '';
        const complaintDept = complaint.departmentCode ? complaint.departmentCode.toUpperCase() : '';

        if (userDept !== complaintDept) {
            throw new ErrorResponse(`Forbidden: Access denied to complaint in department '${complaintDept}'`, 403);
        }
    } else if (userRole === 'citizen') {
        if (complaint.user.toString() !== req.user._id.toString()) {
            throw new ErrorResponse('Forbidden: Access denied to complaint', 403);
        }
    }
};

// @desc    Get all complaints with multi-field filters (Scoped for Department users)
// @route   GET /api/admin/complaints
const getAllComplaints = asyncHandler(async (req, res) => {
    if (req.user && (req.user.role === 'department_head' || req.user.role === 'department_staff')) {
        req.query.departmentCode = req.user.departmentCode.toUpperCase();
    }
    const complaints = await adminService.getAllComplaints(req.query);
    res.json(complaints);
});

// @desc    Update a complaint's parameters
// @route   PUT /api/admin/complaints/:id
const updateComplaint = asyncHandler(async (req, res) => {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
        throw new ErrorResponse('Complaint not found', 404);
    }
    verifyComplaintDepartmentAccess(req, complaint);

    const adminId = req.user ? req.user._id : null;
    const updatedComplaint = await adminService.updateComplaint(req.params.id, req.body, adminId);
    res.json(updatedComplaint);
});

// @desc    Assign or reassign complaint to department/officer
// @route   POST /api/admin/complaints/:id/assign
const assignComplaint = asyncHandler(async (req, res) => {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
        throw new ErrorResponse('Complaint not found', 404);
    }
    verifyComplaintDepartmentAccess(req, complaint);

    const adminId = req.user ? req.user._id : null;
    const updated = await adminService.assignComplaint(req.params.id, adminId, req.body);
    res.json(updated);
});

// @desc    Alias for reassigning complaint
// @route   POST /api/admin/complaints/:id/reassign
const reassignComplaint = asyncHandler(async (req, res) => {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
        throw new ErrorResponse('Complaint not found', 404);
    }
    verifyComplaintDepartmentAccess(req, complaint);

    const adminId = req.user ? req.user._id : null;
    const updated = await adminService.assignComplaint(req.params.id, adminId, req.body);
    res.json(updated);
});

// @desc    Get assignment audit log history for a complaint
// @route   GET /api/admin/complaints/:id/assignment-history
const getAssignmentHistory = asyncHandler(async (req, res) => {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
        throw new ErrorResponse('Complaint not found', 404);
    }
    verifyComplaintDepartmentAccess(req, complaint);

    const history = await adminService.getAssignmentHistory(req.params.id);
    res.json(history);
});

// @desc    Update complaint status workflow state
// @route   PUT /api/admin/complaints/:id/status
const updateComplaintStatus = asyncHandler(async (req, res) => {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
        throw new ErrorResponse('Complaint not found', 404);
    }
    verifyComplaintDepartmentAccess(req, complaint);

    const adminId = req.user ? req.user._id : null;
    const updated = await adminService.updateComplaintStatus(req.params.id, adminId, {
        status: req.body.status,
        note: req.body.note,
        resolutionNote: req.body.resolutionNote,
        resolutionImageFile: req.file,
    });
    res.json(updated);
});

// @desc    Manually escalate a complaint
// @route   POST /api/admin/complaints/:id/escalate
const escalateComplaint = asyncHandler(async (req, res) => {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
        throw new ErrorResponse('Complaint not found', 404);
    }
    verifyComplaintDepartmentAccess(req, complaint);

    const adminId = req.user ? req.user._id : null;
    const reason = req.body.reason || 'Administrative manual escalation';
    const updated = await escalationService.manuallyEscalateComplaint(req.params.id, adminId, reason);
    res.json(updated);
});

// @desc    Get detailed SLA status for a complaint
// @route   GET /api/admin/complaints/:id/sla
const getComplaintSLA = asyncHandler(async (req, res) => {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
        throw new ErrorResponse('Complaint not found', 404);
    }
    verifyComplaintDepartmentAccess(req, complaint);

    const isCompleted = complaint.status === 'Resolved' || complaint.status === 'Closed';
    const status = slaService.getSLAStatus(
        complaint.sla ? complaint.sla.startedAt : complaint.createdAt,
        complaint.sla ? complaint.sla.dueAt : null,
        0.20,
        isCompleted
    );
    const remaining = slaService.getRemainingTime(complaint.sla ? complaint.sla.dueAt : null);

    res.json({
        complaintId: complaint.complaintId,
        sla: complaint.sla,
        computedStatus: status,
        remainingTime: remaining,
        isCompleted,
    });
});

// @desc    Get detailed escalation status for a complaint
// @route   GET /api/admin/complaints/:id/escalation
const getComplaintEscalation = asyncHandler(async (req, res) => {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
        throw new ErrorResponse('Complaint not found', 404);
    }
    verifyComplaintDepartmentAccess(req, complaint);

    res.json({
        complaintId: complaint.complaintId,
        escalationLevel: complaint.escalationLevel,
        escalatedAt: complaint.escalatedAt,
        escalatedBy: complaint.escalatedBy,
        escalationReason: complaint.escalationReason,
        history: complaint.escalationHistory || [],
    });
});

// @desc    Accept or manually correct AI classification for a complaint
// @route   PUT /api/admin/complaints/:id/classification
const updateComplaintClassification = asyncHandler(async (req, res) => {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
        throw new ErrorResponse('Complaint not found', 404);
    }
    verifyComplaintDepartmentAccess(req, complaint);

    const adminId = req.user ? req.user._id : null;
    const updatedComplaint = await adminService.updateComplaintClassification(req.params.id, adminId, req.body);
    res.json(updatedComplaint);
});

// @desc    Get dashboard metrics
// @route   GET /api/admin/metrics
const getDashboardMetrics = asyncHandler(async (req, res) => {
    let filters = { ...req.query };
    if (req.user && (req.user.role === 'department_head' || req.user.role === 'department_staff')) {
        filters.departmentCode = req.user.departmentCode ? req.user.departmentCode.toUpperCase() : '';
    }
    const metrics = await adminService.getDashboardMetrics(filters);
    res.json(metrics);
});

// @desc    Super Admin: Create Department Head or Staff user
// @route   POST /api/admin/department-users
const createDepartmentUser = asyncHandler(async (req, res) => {
    const { name, email, password, role, departmentCode } = req.body;

    if (!['department_head', 'department_staff'].includes(role)) {
        throw new ErrorResponse("Invalid role. Must be 'department_head' or 'department_staff'", 400);
    }

    if (!departmentCode) {
        throw new ErrorResponse('Department code is required', 400);
    }

    const dept = await Department.findOne({ code: departmentCode.toUpperCase() });
    if (!dept) {
        throw new ErrorResponse(`Department '${departmentCode}' not found`, 404);
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
        throw new ErrorResponse('User with this email already exists', 400);
    }

    const user = await User.create({
        name,
        email,
        password,
        role,
        departmentCode: dept.code,
        department: dept._id,
    });

    res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        departmentCode: user.departmentCode,
    });
});

// @desc    Super Admin: Get list of Department Users
// @route   GET /api/admin/department-users
const getDepartmentUsers = asyncHandler(async (req, res) => {
    const users = await User.find({
        role: { $in: ['department_head', 'department_staff'] },
    }).select('-password').sort({ role: 1, departmentCode: 1 });

// @desc    Update complaint priority with auditability and scope check
// @route   PATCH /api/admin/complaints/:id/priority
// @route   PUT /api/admin/complaints/:id/priority
const updateComplaintPriority = asyncHandler(async (req, res) => {
    const { priority } = req.body;
    const validPriorities = ['Low', 'Medium', 'High', 'Critical'];

    if (!priority || !validPriorities.includes(priority)) {
        return res.status(400).json({
            message: `Invalid priority value. Must be one of: ${validPriorities.join(', ')}`,
        });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
        return res.status(404).json({ message: 'Complaint not found' });
    }

    // Verify department scope authorization
    verifyComplaintDepartmentAccess(req, complaint);

    const adminId = req.user ? req.user._id : null;

    complaint.priority = priority;
    if (!complaint.finalClassification) {
        complaint.finalClassification = {};
    }
    complaint.finalClassification.priority = priority;
    complaint.reviewedByAdmin = true;
    complaint.reviewedAt = new Date();
    if (adminId) complaint.reviewedBy = adminId;
    complaint.aiClassificationStatus = 'manually_reviewed';

    // Recalculate SLA with updated priority
    complaint.sla = slaService.calculateSLAForComplaint(
        complaint.severity || 'Medium',
        complaint.department,
        complaint.sla ? complaint.sla.startedAt : complaint.createdAt
    );

    const updated = await complaint.save();
    res.json({
        message: `Complaint #${complaint.complaintId} priority updated to '${priority}'`,
        complaint: updated,
    });
});

module.exports = {
    getAllComplaints,
    updateComplaint,
    assignComplaint,
    reassignComplaint,
    getAssignmentHistory,
    updateComplaintStatus,
    escalateComplaint,
    getComplaintSLA,
    getComplaintEscalation,
    updateComplaintClassification,
    updateComplaintPriority,
    getDashboardMetrics,
    createDepartmentUser,
    getDepartmentUsers,
};
