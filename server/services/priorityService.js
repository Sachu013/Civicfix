/**
 * Deterministic Priority Calculation Service (Sprint 6)
 * Computes CivicFix complaint priority from severity, urgency signals, safety risks, and public impact.
 */

const CRITICAL_KEYWORDS = [
    'fire', 'explosion', 'live wire', 'exposed wire', 'open sewage', 'collapsed bridge',
    'open manhole', 'toxic', 'poison', 'electrocution', 'gushing water', 'fatal', 'accident',
    'flooding', 'urban flooding', 'falling wall', 'dilapidated building', 'epidemic', 'rabid'
];

const HIGH_KEYWORDS = [
    'pothole', 'crater', 'broken pipe', 'leakage', 'blocked drain', 'stray cattle',
    'fallen tree', 'no water', 'dark street', 'traffic light broken', 'highway', 'main road'
];

/**
 * Calculates priority level ('Low', 'Medium', 'High', 'Critical') based on severity and text context.
 * 
 * @param {Object} params
 * @param {string} params.severity - Predicted or assigned severity ('Low', 'Medium', 'High', 'Critical')
 * @param {string} [params.title] - Complaint title
 * @param {string} [params.description] - Complaint description
 * @param {string} [params.urgency] - Legacy urgency input ('Low', 'Medium', 'High', 'Urgent')
 * @returns {string} Calculated priority level
 */
const calculatePriority = ({ severity = 'Medium', title = '', description = '', urgency = 'Medium' }) => {
    const fullText = `${title} ${description}`.toLowerCase();

    const hasCriticalKeyword = CRITICAL_KEYWORDS.some((kw) => fullText.includes(kw));
    const hasHighKeyword = HIGH_KEYWORDS.some((kw) => fullText.includes(kw));

    const normalizedSeverity = (severity || 'Medium').trim();

    // Critical rules
    if (normalizedSeverity === 'Critical' || urgency === 'Urgent' || (normalizedSeverity === 'High' && hasCriticalKeyword)) {
        return 'Critical';
    }

    // High rules
    if (normalizedSeverity === 'High' || hasCriticalKeyword || (normalizedSeverity === 'Medium' && hasHighKeyword)) {
        return 'High';
    }

    // Medium rules
    if (normalizedSeverity === 'Medium' || hasHighKeyword || urgency === 'High') {
        return 'Medium';
    }

    // Low rules
    return 'Low';
};

module.exports = {
    calculatePriority,
    CRITICAL_KEYWORDS,
    HIGH_KEYWORDS,
};
