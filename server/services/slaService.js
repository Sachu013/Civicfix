/**
 * Service Level Agreement (SLA) Tracking Service
 * Authoritative backend calculations for complaint SLA deadlines and status tracking.
 */

const DEFAULT_SLA_HOURS = {
    Critical: 24,
    High: 72,
    Medium: 168,
    Low: 336,
};

const WARNING_THRESHOLD_PERCENT = 0.20; // 20% remaining time triggers 'due_soon'

/**
 * Calculates dueAt date given severity, department SLA config, and start date.
 */
const calculateDeadline = (severity = 'Medium', departmentDoc = null, startedAt = new Date()) => {
    let hours = DEFAULT_SLA_HOURS[severity] || DEFAULT_SLA_HOURS.Medium;

    if (departmentDoc && departmentDoc.slaConfig) {
        const sevKey = severity ? severity.toLowerCase() : 'medium';
        if (departmentDoc.slaConfig[sevKey]) {
            hours = departmentDoc.slaConfig[sevKey];
        }
    }

    const start = new Date(startedAt);
    const dueAt = new Date(start.getTime() + hours * 60 * 60 * 1000);

    return {
        startedAt: start,
        dueAt,
        durationHours: hours,
        warningThresholdHours: hours * WARNING_THRESHOLD_PERCENT,
    };
};

/**
 * Determines SLA status based on current time vs due date.
 */
const getSLAStatus = (startedAt, dueAt, warningThresholdPercent = WARNING_THRESHOLD_PERCENT, isCompleted = false) => {
    if (isCompleted) {
        return 'completed';
    }

    if (!dueAt) {
        return 'not_started';
    }

    const now = new Date().getTime();
    const start = new Date(startedAt || Date.now()).getTime();
    const due = new Date(dueAt).getTime();

    if (now >= due) {
        return 'breached';
    }

    const totalDuration = due - start;
    const remainingTime = due - now;

    if (totalDuration > 0 && (remainingTime / totalDuration) <= warningThresholdPercent) {
        return 'due_soon';
    }

    return 'on_track';
};

const getRemainingTime = (dueAt) => {
    if (!dueAt) return { hours: 0, minutes: 0, isOverdue: false };

    const diffMs = new Date(dueAt).getTime() - new Date().getTime();
    if (diffMs <= 0) {
        const overdueMs = Math.abs(diffMs);
        return {
            hours: Math.floor(overdueMs / (1000 * 60 * 60)),
            minutes: Math.floor((overdueMs % (1000 * 60 * 60)) / (1000 * 60)),
            isOverdue: true,
        };
    }

    return {
        hours: Math.floor(diffMs / (1000 * 60 * 60)),
        minutes: Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)),
        isOverdue: false,
    };
};

const isOverdue = (dueAt) => {
    if (!dueAt) return false;
    return new Date().getTime() > new Date(dueAt).getTime();
};

/**
 * Build SLA object for embedding into Complaint document.
 */
const calculateSLAForComplaint = (severity = 'Medium', departmentDoc = null, startedAt = new Date()) => {
    const { startedAt: start, dueAt, durationHours, warningThresholdHours } = calculateDeadline(severity, departmentDoc, startedAt);
    const status = getSLAStatus(start, dueAt, WARNING_THRESHOLD_PERCENT, false);

    return {
        startedAt: start,
        dueAt,
        durationHours,
        status,
        warningThresholdHours,
        breachedAt: status === 'breached' ? dueAt : null,
    };
};

module.exports = {
    DEFAULT_SLA_HOURS,
    WARNING_THRESHOLD_PERCENT,
    calculateDeadline,
    getSLAStatus,
    getRemainingTime,
    isOverdue,
    calculateSLAForComplaint,
};
