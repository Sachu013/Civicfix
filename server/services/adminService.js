const Complaint = require('../models/Complaint');
const Department = require('../models/Department');
const ErrorResponse = require('../utils/errorResponse');
const taxonomy = require('../config/complaintCategories');
const routingService = require('./routingService');
const slaService = require('./slaService');
const escalationService = require('./escalationService');
const notificationService = require('./notificationService');
const uploadService = require('./uploadService');

// Valid status transitions map
const ALLOWED_STATUS_TRANSITIONS = {
    Submitted: ['Verified', 'Assigned', 'In Progress', 'Rejected'],
    Pending: ['Verified', 'Assigned', 'In Progress', 'Resolved', 'Rejected'], // Legacy support
    Verified: ['Assigned', 'In Progress', 'Rejected'],
    Assigned: ['In Progress', 'Resolved', 'Reopened'],
    'In Progress': ['Resolved'],
    Resolved: ['Citizen Verification', 'Closed', 'Reopened'],
    'Citizen Verification': ['Closed', 'Reopened'],
    Reopened: ['In Progress', 'Assigned'],
    Closed: ['Reopened'],
    Rejected: ['Reopened'],
};

const getAllComplaints = async (filters = {}) => {
    const query = {};

    if (filters.status && filters.status !== 'all') {
        query.status = filters.status;
    }

    if (filters.category && filters.category !== 'all') {
        const norm = taxonomy.normalizeCategory(filters.category);
        query.$or = [
            { category: filters.category },
            { category: norm.displayName },
            { category: norm.id },
        ];
    }

    if (filters.subcategory && filters.subcategory !== 'all') {
        query.subcategory = filters.subcategory;
    }

    if (filters.severity && filters.severity !== 'all') {
        query.severity = filters.severity;
    }

    if (filters.priority && filters.priority !== 'all') {
        query.priority = filters.priority;
    }

    if (filters.departmentCode && filters.departmentCode !== 'all') {
        query.departmentCode = filters.departmentCode.toUpperCase();
    }

    if (filters.slaStatus && filters.slaStatus !== 'all') {
        query['sla.status'] = filters.slaStatus;
    }

    if (filters.escalationLevel && filters.escalationLevel !== 'all') {
        query.escalationLevel = Number(filters.escalationLevel);
    }

    if (filters.assignmentStatus && filters.assignmentStatus !== 'all') {
        if (filters.assignmentStatus === 'unassigned') {
            query.$or = [{ assignedTo: null }, { assignedTo: { $exists: false } }];
        } else if (filters.assignmentStatus === 'assigned') {
            query.assignedTo = { $ne: null };
        }
    }

    const complaints = await Complaint.find(query)
        .populate('user', 'name email')
        .populate('department', 'name code slaConfig contactInformation')
        .populate('assignedTo', 'name email')
        .populate('assignedBy', 'name email')
        .sort({ createdAt: -1 });

    // Ensure live SLA calculation for returned docs
    return complaints.map((comp) => {
        const isCompleted = comp.status === 'Resolved' || comp.status === 'Closed';
        const liveSLAStatus = slaService.getSLAStatus(
            comp.sla ? comp.sla.startedAt : comp.createdAt,
            comp.sla ? comp.sla.dueAt : null,
            0.20,
            isCompleted
        );
        if (comp.sla && comp.sla.status !== liveSLAStatus) {
            comp.sla.status = liveSLAStatus;
        }
        return comp;
    });
};

const assignComplaint = async (id, adminId, { departmentCode, assignedTo, reason }) => {
    const complaint = await Complaint.findById(id);
    if (!complaint) {
        throw new ErrorResponse('Complaint not found', 404);
    }

    let targetDept = null;
    if (departmentCode) {
        targetDept = await Department.findOne({ code: departmentCode.toUpperCase(), active: true });
        if (!targetDept) {
            throw new ErrorResponse(`Department with code '${departmentCode}' not found or inactive`, 404);
        }
    }

    const previousDepartmentCode = complaint.departmentCode;
    const previousDepartmentName = complaint.assignedDepartment;
    const previousAssignee = complaint.assignedTo;

    const newDepartmentCode = targetDept ? targetDept.code : complaint.departmentCode;
    const newDepartmentName = targetDept ? targetDept.name : complaint.assignedDepartment;
    const newAssignee = assignedTo !== undefined ? assignedTo : complaint.assignedTo;

    const now = new Date();

    complaint.department = targetDept ? targetDept._id : complaint.department;
    complaint.departmentCode = newDepartmentCode;
    complaint.assignedDepartment = newDepartmentName;
    if (assignedTo !== undefined) complaint.assignedTo = assignedTo;
    complaint.assignedAt = now;
    if (adminId) complaint.assignedBy = adminId;
    complaint.assignmentSource = complaint.assignedDepartment !== previousDepartmentName ? 'reassignment' : 'admin';

    // Log assignment history
    complaint.assignmentHistory.push({
        previousDepartmentCode,
        newDepartmentCode,
        previousDepartmentName,
        newDepartmentName,
        previousAssignee,
        newAssignee,
        changedBy: adminId,
        reason: reason || 'Manual administrative assignment update.',
        assignmentSource: complaint.assignmentSource,
        timestamp: now,
    });

    // Update workflow status if still in 'Submitted' or 'Verified'
    if (complaint.status === 'Submitted' || complaint.status === 'Verified') {
        complaint.status = 'Assigned';
        complaint.statusHistory.push({
            previousStatus: complaint.status,
            newStatus: 'Assigned',
            changedBy: adminId,
            note: `Complaint assigned to ${newDepartmentName}.`,
            timestamp: now,
        });
    }

    // Recalculate SLA if department changed
    if (targetDept && previousDepartmentCode !== newDepartmentCode) {
        complaint.sla = slaService.calculateSLAForComplaint(
            complaint.severity,
            targetDept,
            complaint.sla ? complaint.sla.startedAt : now
        );
    }

    const updated = await complaint.save();
    return updated;
};

const updateComplaintStatus = async (id, adminId, { status, note, resolutionNote, resolutionImageFile }) => {
    const complaint = await Complaint.findById(id);
    if (!complaint) {
        throw new ErrorResponse('Complaint not found', 404);
    }

    if (!status) {
        throw new ErrorResponse('Status parameter is required', 400);
    }

    const previousStatus = complaint.status;

    // Validate status transition unless setting same status
    if (previousStatus !== status) {
        const allowedNext = ALLOWED_STATUS_TRANSITIONS[previousStatus] || [];
        if (!allowedNext.includes(status)) {
            throw new ErrorResponse(
                `Invalid status transition from '${previousStatus}' to '${status}'. Allowed transitions: ${allowedNext.join(', ')}`,
                400
            );
        }
    }

    const now = new Date();
    complaint.status = status;

    // Handle Resolution specific logic
    if (status === 'Resolved') {
        let resolutionImageMetadata = null;
        if (resolutionImageFile) {
            resolutionImageMetadata = await uploadService.uploadImage(resolutionImageFile);
        }

        complaint.resolution = {
            resolvedAt: now,
            resolvedBy: adminId,
            resolutionNote: resolutionNote || note || 'Issue resolved by administration.',
            resolutionImage: resolutionImageMetadata,
        };

        if (complaint.sla) {
            complaint.sla.status = 'completed';
        }
        complaint.escalationLevel = 0;
    } else if (status === 'Closed') {
        if (complaint.sla) {
            complaint.sla.status = 'completed';
        }
        complaint.escalationLevel = 0;
    }

    if (previousStatus !== status) {
        complaint.statusHistory.push({
            previousStatus,
            newStatus: status,
            changedBy: adminId,
            note: note || resolutionNote || `Status updated to ${status}`,
            timestamp: now,
        });
    }

    const updated = await complaint.save();

    // Trigger status update notification
    notificationService.notifyStatusUpdate({ complaint: updated, previousStatus, newStatus: status }).catch(() => {});

    return updated;
};

const updateComplaint = async (id, updateData, adminId) => {
    const complaint = await Complaint.findById(id);
    if (!complaint) {
        throw new ErrorResponse('Complaint not found', 404);
    }

    if (updateData.status && updateData.status !== complaint.status) {
        return await updateComplaintStatus(id, adminId, {
            status: updateData.status,
            note: updateData.adminResponse || updateData.note,
        });
    }

    if (updateData.assignedDepartment || updateData.departmentCode) {
        await assignComplaint(id, adminId, {
            departmentCode: updateData.departmentCode || updateData.assignedDepartment,
            assignedTo: updateData.assignedTo,
            reason: updateData.reason || 'Admin update',
        });
    }

    if (updateData.adminResponse) complaint.adminResponse = updateData.adminResponse;
    if (updateData.urgency) complaint.urgency = updateData.urgency;
    if (updateData.severity) complaint.severity = updateData.severity;
    if (updateData.priority) complaint.priority = updateData.priority;

    const updatedComplaint = await complaint.save();
    return updatedComplaint;
};

const updateComplaintClassification = async (id, adminId, classificationData = {}) => {
    const complaint = await Complaint.findById(id);
    if (!complaint) {
        throw new ErrorResponse('Complaint not found', 404);
    }

    const category = classificationData.category || complaint.category;
    const subcategory = classificationData.subcategory || complaint.subcategory;
    const severity = classificationData.severity || complaint.severity;
    const priority = classificationData.priority || complaint.priority;

    // Normalize category display name
    const norm = taxonomy.normalizeCategory(category, subcategory);

    complaint.category = norm.displayName;
    complaint.subcategory = norm.subcategoryDisplayName;
    complaint.severity = severity;
    complaint.priority = priority;

    complaint.finalClassification = {
        category: norm.displayName,
        subcategory: norm.subcategoryDisplayName,
        severity,
        priority,
    };

    complaint.reviewedByAdmin = true;
    complaint.reviewedAt = new Date();
    if (adminId) complaint.reviewedBy = adminId;
    complaint.aiClassificationStatus = 'manually_reviewed';

    // Re-evaluate department routing on manual category correction
    const deptRouting = await routingService.determineDepartment({
        category: norm.displayName,
        subcategory: norm.subcategoryDisplayName,
        finalClassification: complaint.finalClassification,
    });

    if (deptRouting.code !== complaint.departmentCode) {
        const previousDeptCode = complaint.departmentCode;
        const previousDeptName = complaint.assignedDepartment;

        complaint.department = deptRouting.departmentId;
        complaint.departmentCode = deptRouting.code;
        complaint.assignedDepartment = deptRouting.name;
        complaint.assignmentSource = 'admin';

        complaint.assignmentHistory.push({
            previousDepartmentCode: previousDeptCode,
            newDepartmentCode: deptRouting.code,
            previousDepartmentName: previousDeptName,
            newDepartmentName: deptRouting.name,
            changedBy: adminId,
            reason: 'Department updated due to admin classification correction.',
            assignmentSource: 'admin',
            timestamp: new Date(),
        });
    }

    // Recalculate SLA with updated severity & department
    complaint.sla = slaService.calculateSLAForComplaint(
        severity,
        deptRouting.departmentDoc,
        complaint.sla ? complaint.sla.startedAt : complaint.createdAt
    );

    const updated = await complaint.save();
    return updated;
};

const getDashboardMetrics = async (filters = {}) => {
    const query = {};
    if (filters.departmentCode && filters.departmentCode !== 'all') {
        query.departmentCode = filters.departmentCode.toUpperCase();
    }

    const total = await Complaint.countDocuments(query);
    const unassigned = await Complaint.countDocuments({
        ...query,
        $or: [{ assignedTo: null }, { assignedTo: { $exists: false } }],
    });
    const pending = await Complaint.countDocuments({ ...query, status: { $in: ['Submitted', 'Pending'] } });
    const inProgress = await Complaint.countDocuments({ ...query, status: { $in: ['Assigned', 'In Progress', 'Verified'] } });
    const resolved = await Complaint.countDocuments({ ...query, status: { $in: ['Resolved', 'Closed'] } });

    const critical = await Complaint.countDocuments({ ...query, priority: 'Critical' });
    const highPriority = await Complaint.countDocuments({ ...query, priority: 'High' });

    // Dynamic SLA status metrics
    const dueSoon = await Complaint.countDocuments({ ...query, 'sla.status': 'due_soon' });
    const slaBreached = await Complaint.countDocuments({ ...query, 'sla.status': 'breached' });
    const escalated = await Complaint.countDocuments({ ...query, escalationLevel: { $gt: 0 } });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const newToday = await Complaint.countDocuments({ ...query, createdAt: { $gte: startOfDay } });

    const matchStage = Object.keys(query).length > 0 ? [{ $match: query }] : [];

    const categoryStats = await Complaint.aggregate([
        ...matchStage,
        { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);

    const statusStats = await Complaint.aggregate([
        ...matchStage,
        { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const severityStats = await Complaint.aggregate([
        ...matchStage,
        { $group: { _id: '$severity', count: { $sum: 1 } } },
    ]);

    const priorityStats = await Complaint.aggregate([
        ...matchStage,
        { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    const departmentStats = await Complaint.aggregate([
        ...matchStage,
        { $group: { _id: '$assignedDepartment', count: { $sum: 1 } } },
    ]);

    return {
        total,
        unassigned,
        pending,
        inProgress,
        resolved,
        critical,
        highPriority,
        dueSoon,
        slaBreached,
        escalated,
        newToday,
        categoryStats,
        statusStats,
        severityStats,
        priorityStats,
        departmentStats,
    };
};

const getAssignmentHistory = async (complaintId) => {
    const complaint = await Complaint.findById(complaintId)
        .populate('assignmentHistory.changedBy', 'name email')
        .populate('assignmentHistory.previousAssignee', 'name email')
        .populate('assignmentHistory.newAssignee', 'name email');

    if (!complaint) {
        throw new ErrorResponse('Complaint not found', 404);
    }
    return complaint.assignmentHistory || [];
};

module.exports = {
    getAllComplaints,
    assignComplaint,
    updateComplaintStatus,
    updateComplaint,
    updateComplaintClassification,
    getDashboardMetrics,
    getAssignmentHistory,
};
