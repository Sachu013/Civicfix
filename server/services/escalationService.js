const Complaint = require('../models/Complaint');
const slaService = require('./slaService');
const ErrorResponse = require('../utils/errorResponse');

/**
 * Escalation Service
 * Level 0: Normal
 * Level 1: SLA Warning (due soon)
 * Level 2: SLA Breached / Unassigned Urgent Priority
 * Level 3: Administrative Escalation
 */
const evaluateEscalationLevel = (complaint) => {
    if (!complaint) return 0;

    // Completed complaints drop escalation
    if (complaint.status === 'Resolved' || complaint.status === 'Closed') {
        return 0;
    }

    // Manual administrative escalation explicitly set to Level 3
    if (complaint.escalationLevel === 3) {
        return 3;
    }

    // Check SLA status
    const slaStatus = slaService.getSLAStatus(
        complaint.sla ? complaint.sla.startedAt : complaint.createdAt,
        complaint.sla ? complaint.sla.dueAt : null,
        0.20,
        complaint.status === 'Resolved' || complaint.status === 'Closed'
    );

    if (slaStatus === 'breached') {
        return 2;
    }

    if (slaStatus === 'due_soon') {
        return 1;
    }

    // Critical priority complaint unassigned for > 2 hours -> Level 2
    if ((complaint.priority === 'Critical' || complaint.severity === 'Critical') && !complaint.assignedTo && !complaint.department) {
        const hoursUnassigned = (new Date().getTime() - new Date(complaint.createdAt).getTime()) / (1000 * 60 * 60);
        if (hoursUnassigned > 2) {
            return 2;
        }
    }

    return complaint.escalationLevel || 0;
};

const checkAndUpdateEscalation = async (complaintDoc) => {
    if (!complaintDoc) return complaintDoc;

    const newLevel = evaluateEscalationLevel(complaintDoc);
    if (newLevel !== complaintDoc.escalationLevel) {
        complaintDoc.escalationLevel = newLevel;
        complaintDoc.escalationHistory.push({
            level: newLevel,
            reason: `System evaluated escalation level ${newLevel} based on SLA and priority tracking.`,
            timestamp: new Date(),
        });

        if (newLevel > 0 && !complaintDoc.escalatedAt) {
            complaintDoc.escalatedAt = new Date();
        }
    }

    return complaintDoc;
};

const manuallyEscalateComplaint = async (complaintId, adminId, reason = 'Administrative escalation') => {
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
        throw new ErrorResponse('Complaint not found', 404);
    }

    complaint.escalationLevel = 3;
    complaint.escalatedAt = new Date();
    if (adminId) complaint.escalatedBy = adminId;
    complaint.escalationReason = reason;

    complaint.escalationHistory.push({
        level: 3,
        reason,
        escalatedBy: adminId,
        timestamp: new Date(),
    });

    await complaint.save();
    return complaint;
};

module.exports = {
    evaluateEscalationLevel,
    checkAndUpdateEscalation,
    manuallyEscalateComplaint,
};
