const analyticsService = require('./analyticsService');
const hotspotService = require('./hotspotService');
const aiClassificationService = require('./aiClassificationService');

/**
 * Fact-based AI Insight Generation Service
 * Formats pre-computed deterministic analytics data into structured natural language executive summaries.
 */
const generateInsights = async (filters = {}) => {
    // 1. Fetch pre-computed deterministic facts
    const overview = await analyticsService.getOverviewMetrics(filters);
    const categoryData = await analyticsService.getCategoryAnalytics(filters);
    const departmentData = await analyticsService.getDepartmentAnalytics(filters);
    const trendData = await analyticsService.getTrendAnalytics(filters);
    const hotspotsData = await hotspotService.detectHotspots(filters);
    const anomalyData = await analyticsService.getAnomalies(filters);

    const topCategory = categoryData.categories[0] ? categoryData.categories[0].category : 'Civic Issues';
    const topCatPercentage = categoryData.categories[0] ? categoryData.categories[0].percentage : 0;

    const overloadedDept = [...departmentData].sort((a, b) => b.totalAssigned - a.totalAssigned)[0];

    const structuredFacts = {
        totalComplaints: overview.total,
        openComplaints: overview.open,
        resolvedComplaints: overview.resolved,
        criticalComplaints: overview.critical,
        slaBreachedCount: overview.slaBreached,
        resolutionRatePercent: overview.resolutionRate,
        slaComplianceRatePercent: overview.slaComplianceRate,
        topCategory,
        topCatPercentage,
        percentageChange: trendData.percentageChange,
        hotspotCount: hotspotsData.totalHotspots,
        overloadedDepartment: overloadedDept ? overloadedDept.name : 'General Administration',
        anomalyCount: anomalyData.anomalyCount,
    };

    // Construct deterministic insights list first (guaranteed 100% accurate facts)
    const deterministicInsights = [
        {
            type: 'category_trend',
            title: `Primary Problem Vector: ${topCategory}`,
            description: `${topCategory} represents ${topCatPercentage}% of total complaints for this period, with a overall period volume change of ${trendData.percentageChange > 0 ? '+' : ''}${trendData.percentageChange}%.`,
            severity: trendData.percentageChange > 25 ? 'High' : 'Medium',
        },
        {
            type: 'hotspot_alert',
            title: `${hotspotsData.totalHotspots} Geographic Hotspots Identified`,
            description: hotspotsData.totalHotspots > 0
                ? `${hotspotsData.totalHotspots} high-density complaint clusters detected. Largest cluster centers on ${hotspotsData.hotspots[0]?.dominantCategory} issues (${hotspotsData.hotspots[0]?.complaintCount} complaints).`
                : 'No significant high-density geographic complaint hotspots detected for selected filters.',
            severity: hotspotsData.totalHotspots > 2 ? 'High' : 'Low',
        },
        {
            type: 'workload_sla',
            title: `Department SLA Compliance: ${overview.slaComplianceRate}%`,
            description: `${overview.slaBreached} complaints have breached SLA deadlines. ${overloadedDept ? overloadedDept.name : 'General Administration'} has highest active workload (${overloadedDept ? overloadedDept.totalAssigned : 0} complaints).`,
            severity: overview.slaBreached > 10 ? 'High' : 'Medium',
        },
    ];

    if (anomalyData.anomalyDetected) {
        anomalyData.anomalies.forEach((a) => {
            deterministicInsights.push({
                type: 'anomaly_spike',
                title: `Volume Anomaly Spike: ${a.category}`,
                description: a.message,
                severity: 'Critical',
            });
        });
    }

    // Try optional AI natural-language executive summary synthesis
    let aiSummaryText = null;
    try {
        const promptText = `Provide a concise 3-sentence executive civic briefing for city commissioners based STRICTLY on these pre-computed facts. Do not invent any numbers.
Facts: Total=${overview.total}, Open=${overview.open}, Top Category=${topCategory} (${topCatPercentage}%), Volume Change=${trendData.percentageChange}%, Hotspots=${hotspotsData.totalHotspots}, SLA Breached=${overview.slaBreached}, SLA Compliance=${overview.slaComplianceRate}%.`;

        const aiResponse = await aiClassificationService.classifyViaLocalEngine('Executive Briefing Request', promptText);
        if (aiResponse && aiResponse.reasoning) {
            aiSummaryText = aiResponse.reasoning;
        }
    } catch (aiErr) {
        // Fallback gracefully
    }

    if (!aiSummaryText) {
        aiSummaryText = `Executive Briefing: Total volume stands at ${overview.total} complaints with a ${overview.resolutionRate}% resolution rate and ${overview.slaComplianceRate}% SLA compliance. ${topCategory} remains the primary complaint vector (${topCatPercentage}% of total). ${hotspotsData.totalHotspots} spatial hotspots and ${overview.slaBreached} SLA breaches require targeted intervention.`;
    }

    return {
        facts: structuredFacts,
        executiveSummary: aiSummaryText,
        insights: deterministicInsights,
    };
};

module.exports = {
    generateInsights,
};
