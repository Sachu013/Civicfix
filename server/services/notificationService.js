const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { NOTIFICATION_TYPES } = require('../config/notificationTypes');
const { normalizeDepartmentCode } = require('../config/departmentConfig');

/**
 * Low-level notification creator
 */
const createNotification = async (data) => {
    try {
        if (!data.recipient || !data.recipientRole || !data.type || !data.title || !data.message) {
            console.error('[NotificationService] Missing required fields for notification creation:', data);
            return null;
        }

        const notification = await Notification.create({
            recipient: data.recipient,
            recipientRole: data.recipientRole,
            type: data.type,
            title: data.title,
            message: data.message,
            complaint: data.complaint || null,
            complaintId: data.complaintId || null,
            departmentCode: data.departmentCode ? normalizeDepartmentCode(data.departmentCode) : null,
            priority: data.priority || 'medium',
            metadata: data.metadata || {},
        });

        return notification;
    } catch (err) {
        console.error('[NotificationService] Failed to create notification:', err.message || err);
        return null;
    }
};

/**
 * Finds Department Head users for a specific department
 */
const getDepartmentHeads = async (departmentCode) => {
    if (!departmentCode) return [];
    const normCode = normalizeDepartmentCode(departmentCode);
    return await User.find({
        role: 'department_head',
        departmentCode: normCode,
    });
};

/**
 * 1. Citizen: Complaint Submission Notification
 */
const notifyCitizenOnSubmission = async (complaint) => {
    if (!complaint || !complaint.user) return;

    await createNotification({
        recipient: complaint.user._id || complaint.user,
        recipientRole: 'citizen',
        type: NOTIFICATION_TYPES.COMPLAINT_SUBMITTED,
        title: `Complaint Logged: #${complaint.complaintId}`,
        message: `Your complaint "${complaint.title}" has been submitted successfully.`,
        complaint: complaint._id,
        complaintId: complaint.complaintId,
        departmentCode: complaint.departmentCode,
        priority: 'medium',
    });
};

/**
 * 2. Department Routing Notification (Citizen & Dept Head)
 */
const notifyOnDepartmentRouting = async (complaint) => {
    if (!complaint) return;

    // Notify Citizen
    if (complaint.user) {
        await createNotification({
            recipient: complaint.user._id || complaint.user,
            recipientRole: 'citizen',
            type: NOTIFICATION_TYPES.COMPLAINT_ROUTED,
            title: `Complaint Categorized: #${complaint.complaintId}`,
            message: `Your complaint has been routed to the ${complaint.assignedDepartment || complaint.departmentCode} department for processing.`,
            complaint: complaint._id,
            complaintId: complaint.complaintId,
            departmentCode: complaint.departmentCode,
            priority: 'medium',
        });
    }

    // Notify Department Heads of assigned department
    const heads = await getDepartmentHeads(complaint.departmentCode);
    for (const head of heads) {
        await createNotification({
            recipient: head._id,
            recipientRole: 'department_head',
            type: NOTIFICATION_TYPES.COMPLAINT_ROUTED,
            title: `New Complaint Routed: #${complaint.complaintId}`,
            message: `New ${complaint.priority || 'Medium'} priority complaint "${complaint.title}" routed to ${complaint.departmentCode}.`,
            complaint: complaint._id,
            complaintId: complaint.complaintId,
            departmentCode: complaint.departmentCode,
            priority: complaint.priority === 'Critical' ? 'urgent' : complaint.priority === 'High' ? 'high' : 'medium',
        });
    }
};

/**
 * 3. Verifier Assignment / Reassignment / Unassignment Notification
 */
const notifyOnVerifierAssignment = async ({ complaint, verifierId, previousVerifierId, action, reason, assignedBy }) => {
    if (!complaint) return;

    // If Unassigned
    if (action === 'unassign' || !verifierId) {
        if (previousVerifierId) {
            await createNotification({
                recipient: previousVerifierId,
                recipientRole: 'verifier',
                type: NOTIFICATION_TYPES.VERIFIER_UNASSIGNED,
                title: `Unassigned from Task: #${complaint.complaintId}`,
                message: `You have been unassigned from complaint #${complaint.complaintId}.`,
                complaint: complaint._id,
                complaintId: complaint.complaintId,
                departmentCode: complaint.departmentCode,
                priority: 'medium',
            });
        }

        const heads = await getDepartmentHeads(complaint.departmentCode);
        for (const head of heads) {
            await createNotification({
                recipient: head._id,
                recipientRole: 'department_head',
                type: NOTIFICATION_TYPES.UNASSIGNED_ALERT,
                title: `Complaint Unassigned: #${complaint.complaintId}`,
                message: `Complaint #${complaint.complaintId} has been unassigned and requires verifier assignment.`,
                complaint: complaint._id,
                complaintId: complaint.complaintId,
                departmentCode: complaint.departmentCode,
                priority: 'high',
            });
        }
        return;
    }

    // Notify New Verifier
    await createNotification({
        recipient: verifierId,
        recipientRole: 'verifier',
        type: action === 'reassign' ? NOTIFICATION_TYPES.VERIFIER_REASSIGNED : NOTIFICATION_TYPES.VERIFIER_ASSIGNED,
        title: `Field Task Assigned: #${complaint.complaintId}`,
        message: `You have been assigned to conduct field verification for complaint #${complaint.complaintId} ("${complaint.title}").`,
        complaint: complaint._id,
        complaintId: complaint.complaintId,
        departmentCode: complaint.departmentCode,
        priority: complaint.priority === 'Critical' ? 'urgent' : 'high',
    });

    // Notify Previous Verifier if reassigned
    if (previousVerifierId && previousVerifierId.toString() !== verifierId.toString()) {
        await createNotification({
            recipient: previousVerifierId,
            recipientRole: 'verifier',
            type: NOTIFICATION_TYPES.VERIFIER_UNASSIGNED,
            title: `Reassigned Task: #${complaint.complaintId}`,
            message: `Task #${complaint.complaintId} has been reassigned to another officer.`,
            complaint: complaint._id,
            complaintId: complaint.complaintId,
            departmentCode: complaint.departmentCode,
            priority: 'medium',
        });
    }

    // Notify Citizen that complaint is assigned & in progress
    if (complaint.user) {
        await createNotification({
            recipient: complaint.user._id || complaint.user,
            recipientRole: 'citizen',
            type: NOTIFICATION_TYPES.STATUS_IN_PROGRESS,
            title: `Field Inspection Assigned: #${complaint.complaintId}`,
            message: `A field verifier has been assigned to inspect your complaint #${complaint.complaintId}.`,
            complaint: complaint._id,
            complaintId: complaint.complaintId,
            departmentCode: complaint.departmentCode,
            priority: 'medium',
        });
    }
};

/**
 * 4. Field Verification Report Submitted Notification
 */
const notifyOnVerificationReport = async ({ complaint, verifierId, report }) => {
    if (!complaint || !report) return;

    const heads = await getDepartmentHeads(complaint.departmentCode);
    const isIssueFlagged = ['VERIFIED_NOT_FOUND', 'VERIFIED_INSUFFICIENT', 'ISSUE_NOT_FOUND', 'INSUFFICIENT_EVIDENCE'].includes(report.outcome);

    for (const head of heads) {
        await createNotification({
            recipient: head._id,
            recipientRole: 'department_head',
            type: isIssueFlagged ? NOTIFICATION_TYPES.VERIFICATION_ISSUE_FLAGGED : NOTIFICATION_TYPES.VERIFICATION_REPORT_SUBMITTED,
            title: `Field Report Submitted: #${complaint.complaintId}`,
            message: `Field verifier submitted report for #${complaint.complaintId}. Outcome: ${report.outcome.replace(/_/g, ' ')}.`,
            complaint: complaint._id,
            complaintId: complaint.complaintId,
            departmentCode: complaint.departmentCode,
            priority: isIssueFlagged ? 'high' : 'medium',
            metadata: { outcome: report.outcome },
        });
    }
};

/**
 * 5. Workflow Status Update Notification
 */
const notifyOnStatusUpdate = async ({ complaint, previousStatus, newStatus, note, updatedBy }) => {
    if (!complaint) return;

    // Notify Citizen (Sanitizes internal private notes!)
    if (complaint.user) {
        let citizenMsg = `Your complaint #${complaint.complaintId} status changed from "${previousStatus}" to "${newStatus}".`;
        let citizenTitle = `Status Updated: #${complaint.complaintId}`;
        let type = NOTIFICATION_TYPES.STATUS_IN_PROGRESS;

        if (newStatus === 'Resolved') {
            type = NOTIFICATION_TYPES.STATUS_RESOLVED;
            citizenTitle = `Issue Resolved: #${complaint.complaintId}`;
            citizenMsg = `Department has marked your complaint #${complaint.complaintId} as Resolved. Please confirm resolution.`;
        } else if (newStatus === 'Closed') {
            type = NOTIFICATION_TYPES.CITIZEN_CONFIRMED_CLOSED;
            citizenTitle = `Complaint Closed: #${complaint.complaintId}`;
            citizenMsg = `Your complaint #${complaint.complaintId} is officially closed. Thank you for using CivicFix!`;
        } else if (newStatus === 'Reopened') {
            type = NOTIFICATION_TYPES.CITIZEN_REJECTED_REOPENED;
            citizenTitle = `Complaint Reopened: #${complaint.complaintId}`;
            citizenMsg = `Your complaint #${complaint.complaintId} has been reopened for further investigation.`;
        }

        await createNotification({
            recipient: complaint.user._id || complaint.user,
            recipientRole: 'citizen',
            type,
            title: citizenTitle,
            message: citizenMsg,
            complaint: complaint._id,
            complaintId: complaint.complaintId,
            departmentCode: complaint.departmentCode,
            priority: newStatus === 'Resolved' ? 'high' : 'medium',
        });
    }
};

/**
 * 6. Citizen Resolution Verification & Reopening Notification
 */
const notifyOnCitizenResolutionVerification = async ({ complaint, verified, feedback }) => {
    if (!complaint) return;

    const heads = await getDepartmentHeads(complaint.departmentCode);
    const assignedVerifierId = complaint.assignedTo ? (complaint.assignedTo._id || complaint.assignedTo) : null;

    if (verified) {
        // Citizen Confirmed -> Closed
        for (const head of heads) {
            await createNotification({
                recipient: head._id,
                recipientRole: 'department_head',
                type: NOTIFICATION_TYPES.CITIZEN_CONFIRMED_CLOSED,
                title: `Resolution Confirmed: #${complaint.complaintId}`,
                message: `Citizen confirmed resolution for complaint #${complaint.complaintId}. Status is now Closed.`,
                complaint: complaint._id,
                complaintId: complaint.complaintId,
                departmentCode: complaint.departmentCode,
                priority: 'medium',
            });
        }
    } else {
        // Citizen Rejected -> Reopened
        for (const head of heads) {
            await createNotification({
                recipient: head._id,
                recipientRole: 'department_head',
                type: NOTIFICATION_TYPES.CITIZEN_REJECTED_REOPENED,
                title: `Complaint Reopened by Citizen: #${complaint.complaintId}`,
                message: `Citizen rejected resolution for complaint #${complaint.complaintId}. Reason: "${feedback || 'Unresolved'}". Action required.`,
                complaint: complaint._id,
                complaintId: complaint.complaintId,
                departmentCode: complaint.departmentCode,
                priority: 'urgent',
            });
        }

        if (assignedVerifierId) {
            await createNotification({
                recipient: assignedVerifierId,
                recipientRole: 'verifier',
                type: NOTIFICATION_TYPES.CITIZEN_REJECTED_REOPENED,
                title: `Reopened Task: #${complaint.complaintId}`,
                message: `Citizen reported issue #${complaint.complaintId} is still unresolved. Feedback: "${feedback || 'Unresolved'}"`,
                complaint: complaint._id,
                complaintId: complaint.complaintId,
                departmentCode: complaint.departmentCode,
                priority: 'urgent',
            });
        }
    }
};

/**
 * 7. SLA Alert Notification (Deduplicated to prevent repeat alerts)
 */
const notifyOnSLAEvent = async ({ complaint, slaType }) => {
    if (!complaint || !complaint.departmentCode) return;

    const heads = await getDepartmentHeads(complaint.departmentCode);
    const notifType = slaType === 'breached' ? NOTIFICATION_TYPES.SLA_BREACHED : NOTIFICATION_TYPES.SLA_WARNING;

    for (const head of heads) {
        // Check if duplicate notification already created for this complaint & head
        const existing = await Notification.findOne({
            recipient: head._id,
            complaint: complaint._id,
            type: notifType,
        });

        if (existing) {
            continue; // Skip duplicate notification creation
        }

        await createNotification({
            recipient: head._id,
            recipientRole: 'department_head',
            type: notifType,
            title: slaType === 'breached' ? `🚨 SLA Breached: #${complaint.complaintId}` : `⚠️ SLA Warning: #${complaint.complaintId}`,
            message: `Complaint #${complaint.complaintId} (${complaint.title}) is ${slaType === 'breached' ? 'in SLA BREACH state' : 'approaching SLA deadline'}.`,
            complaint: complaint._id,
            complaintId: complaint.complaintId,
            departmentCode: complaint.departmentCode,
            priority: slaType === 'breached' ? 'urgent' : 'high',
        });
    }
};

/**
 * API Helper: Fetch user's notifications (Paginated, filtered)
 */
const getUserNotifications = async (userId, queryParams = {}) => {
    const page = Number(queryParams.page) || 1;
    const limit = Number(queryParams.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = { recipient: userId };
    if (queryParams.unreadOnly === 'true' || queryParams.unreadOnly === true) {
        filter.isRead = false;
    }

    const total = await Notification.countDocuments(filter);
    const notifications = await Notification.find(filter)
        .populate('complaint', 'complaintId title status priority category departmentCode location')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const unreadCount = await Notification.countDocuments({ recipient: userId, isRead: false });

    return {
        notifications,
        unreadCount,
        page,
        pages: Math.ceil(total / limit),
        total,
    };
};

/**
 * API Helper: Get unread notification count
 */
const getUnreadCount = async (userId) => {
    return await Notification.countDocuments({ recipient: userId, isRead: false });
};

/**
 * API Helper: Mark single notification as read
 */
const markAsRead = async (notificationId, userId) => {
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
        return null;
    }
    const notification = await Notification.findOne({ _id: notificationId, recipient: userId });
    if (!notification) {
        return null;
    }

    if (!notification.isRead) {
        notification.isRead = true;
        notification.readAt = new Date();
        await notification.save();
    }

    return notification;
};

/**
 * API Helper: Mark all notifications for user as read
 */
const markAllAsRead = async (userId) => {
    const result = await Notification.updateMany(
        { recipient: userId, isRead: false },
        { $set: { isRead: true, readAt: new Date() } }
    );
    return result;
};

module.exports = {
    createNotification,
    notifyCitizenOnSubmission,
    notifyOnDepartmentRouting,
    notifyOnVerifierAssignment,
    notifyOnVerificationReport,
    notifyOnStatusUpdate,
    notifyStatusUpdate: notifyOnStatusUpdate,
    notifyOnCitizenResolutionVerification,
    notifyOnSLAEvent,
    getUserNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
};
