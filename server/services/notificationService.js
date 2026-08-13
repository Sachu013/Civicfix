/**
 * Notification Service (Extension Points)
 * Safely handles event notification dispatching without throwing runtime errors.
 */

const notifyAssignment = async ({ complaint, department, assignee }) => {
    console.log(`[NotificationService] Assignment Notification: Complaint #${complaint.complaintId} assigned to department ${department ? department.name : 'General'}.`);
};

const notifyStatusUpdate = async ({ complaint, previousStatus, newStatus }) => {
    console.log(`[NotificationService] Status Update Notification: Complaint #${complaint.complaintId} changed from ${previousStatus} to ${newStatus}.`);
};

const notifyResolution = async ({ complaint, resolutionNote }) => {
    console.log(`[NotificationService] Resolution Notification: Complaint #${complaint.complaintId} marked resolved with note: "${resolutionNote}".`);
};

const notifySLAEscalation = async ({ complaint, escalationLevel, reason }) => {
    console.log(`[NotificationService] SLA Escalation Notification: Complaint #${complaint.complaintId} escalated to Level ${escalationLevel}. Reason: ${reason}`);
};

module.exports = {
    notifyAssignment,
    notifyStatusUpdate,
    notifyResolution,
    notifySLAEscalation,
};
