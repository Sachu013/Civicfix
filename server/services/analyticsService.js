const Complaint = require('../models/Complaint');
const Department = require('../models/Department');
const taxonomy = require('../config/complaintCategories');
const { ANOMALY_STD_DEV_THRESHOLD } = require('../config/analyticsConfig');

/**
 * Builds standard Mongoose $match query filter based on date range and dimensional parameters.
 */
const buildMatchQuery = (filters = {}) => {
    const match = {};

    // Date Range Filter
    if (filters.startDate || filters.endDate) {
        match.createdAt = {};
        if (filters.startDate) {
            match.createdAt.$gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
            match.createdAt.$lte = new Date(filters.endDate);
        }
    } else if (filters.period) {
        const now = new Date();
        let daysAgo = 30;
        if (filters.period === 'today') daysAgo = 1;
        else if (filters.period === '7days') daysAgo = 7;
        else if (filters.period === '30days') daysAgo = 30;
        else if (filters.period === '90days') daysAgo = 90;
        else if (filters.period === 'year') daysAgo = 365;

        const start = new Date();
        start.setDate(now.getDate() - daysAgo);
        match.createdAt = { $gte: start, $lte: now };
    }

    if (filters.category && filters.category !== 'all') {
        const norm = taxonomy.normalizeCategory(filters.category);
        match.$or = [
            { category: filters.category },
            { category: norm.displayName },
            { category: norm.id },
        ];
    }

    if (filters.subcategory && filters.subcategory !== 'all') {
        match.subcategory = filters.subcategory;
    }

    if (filters.departmentCode && filters.departmentCode !== 'all') {
        match.departmentCode = filters.departmentCode.toUpperCase();
    }

    if (filters.status && filters.status !== 'all') {
        match.status = filters.status;
    }

    if (filters.severity && filters.severity !== 'all') {
        match.severity = filters.severity;
    }

    if (filters.priority && filters.priority !== 'all') {
        match.priority = filters.priority;
    }

    return match;
};

/**
 * 1. Overview Metrics Engine
 */
const getOverviewMetrics = async (filters = {}) => {
    const match = buildMatchQuery(filters);

    const pipeline = [
        { $match: match },
        {
            $facet: {
                totalCount: [{ $count: 'count' }],
                statusCounts: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
                priorityCounts: [{ $group: { _id: '$priority', count: { $sum: 1 } } }],
                severityCounts: [{ $group: { _id: '$severity', count: { $sum: 1 } } }],
                slaCounts: [{ $group: { _id: '$sla.status', count: { $sum: 1 } } }],
                escalatedCount: [
                    { $match: { escalationLevel: { $gt: 0 } } },
                    { $count: 'count' },
                ],
                unassignedCount: [
                    { $match: { $or: [{ assignedTo: null }, { assignedTo: { $exists: false } }] } },
                    { $count: 'count' },
                ],
                resolutionTimes: [
                    {
                        $match: {
                            status: { $in: ['Resolved', 'Closed'] },
                            'resolution.resolvedAt': { $exists: true },
                        },
                    },
                    {
                        $project: {
                            durationHours: {
                                $divide: [
                                    { $subtract: ['$resolution.resolvedAt', '$createdAt'] },
                                    1000 * 60 * 60,
                                ],
                            },
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            avgHours: { $avg: '$durationHours' },
                            durations: { $push: '$durationHours' },
                        },
                    },
                ],
            },
        },
    ];

    const results = await Complaint.aggregate(pipeline);
    const data = results[0] || {};

    const total = data.totalCount[0]?.count || 0;

    let open = 0;
    let resolved = 0;
    let closed = 0;

    (data.statusCounts || []).forEach((item) => {
        if (item._id === 'Resolved') resolved += item.count;
        else if (item._id === 'Closed') closed += item.count;
        else open += item.count;
    });

    let critical = 0;
    let high = 0;
    let medium = 0;
    let low = 0;

    (data.priorityCounts || []).forEach((item) => {
        if (item._id === 'Critical') critical += item.count;
        else if (item._id === 'High') high += item.count;
        else if (item._id === 'Medium') medium += item.count;
        else if (item._id === 'Low') low += item.count;
    });

    let dueSoon = 0;
    let breached = 0;
    let completedSla = 0;

    (data.slaCounts || []).forEach((item) => {
        if (item._id === 'due_soon') dueSoon += item.count;
        else if (item._id === 'breached') breached += item.count;
        else if (item._id === 'completed') completedSla += item.count;
    });

    const escalated = data.escalatedCount[0]?.count || 0;
    const unassigned = data.unassignedCount[0]?.count || 0;

    const completedTotal = resolved + closed;
    const resolutionRate = total > 0 ? Number(((completedTotal / total) * 100).toFixed(1)) : 0;

    const evaluatedSlaTotal = completedSla + breached;
    const slaComplianceRate = evaluatedSlaTotal > 0 ? Number(((completedSla / evaluatedSlaTotal) * 100).toFixed(1)) : 100;

    const avgResolutionTimeHours = data.resolutionTimes[0]?.avgHours
        ? Number(data.resolutionTimes[0].avgHours.toFixed(1))
        : 0;

    // Calculate median resolution time if durations available
    let medianResolutionTimeHours = 0;
    if (data.resolutionTimes[0]?.durations?.length > 0) {
        const sorted = [...data.resolutionTimes[0].durations].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        medianResolutionTimeHours = sorted.length % 2 !== 0
            ? sorted[mid]
            : (sorted[mid - 1] + sorted[mid]) / 2;
        medianResolutionTimeHours = Number(medianResolutionTimeHours.toFixed(1));
    }

    return {
        total,
        open,
        resolved,
        closed,
        critical,
        highPriority: high,
        mediumPriority: medium,
        lowPriority: low,
        unassigned,
        dueSoon,
        slaBreached: breached,
        escalated,
        resolutionRate,
        slaComplianceRate,
        avgResolutionTimeHours,
        medianResolutionTimeHours,
    };
};

/**
 * 2. Category & Subcategory Distribution
 */
const getCategoryAnalytics = async (filters = {}) => {
    const match = buildMatchQuery(filters);

    const mainCategoryStats = await Complaint.aggregate([
        { $match: match },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
    ]);

    const subcategoryStats = await Complaint.aggregate([
        { $match: match },
        { $group: { _id: { category: '$category', subcategory: '$subcategory' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 15 },
    ]);

    const total = mainCategoryStats.reduce((sum, item) => sum + item.count, 0);

    const categories = mainCategoryStats.map((item) => ({
        category: item._id || 'Unassigned Category',
        count: item.count,
        percentage: total > 0 ? Number(((item.count / total) * 100).toFixed(1)) : 0,
    }));

    const subcategories = subcategoryStats.map((item) => ({
        category: item._id.category || 'Unknown',
        subcategory: item._id.subcategory || 'General',
        count: item.count,
        percentage: total > 0 ? Number(((item.count / total) * 100).toFixed(1)) : 0,
    }));

    return {
        total,
        categories,
        subcategories,
    };
};

/**
 * 3. Severity & Priority Analytics
 */
const getSeverityPriorityAnalytics = async (filters = {}) => {
    const match = buildMatchQuery(filters);

    const severityStats = await Complaint.aggregate([
        { $match: match },
        { $group: { _id: '$severity', count: { $sum: 1 } } },
    ]);

    const priorityStats = await Complaint.aggregate([
        { $match: match },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    const formatBreakdown = (stats) => {
        const result = { Critical: 0, High: 0, Medium: 0, Low: 0 };
        stats.forEach((item) => {
            if (item._id && result[item._id] !== undefined) {
                result[item._id] = item.count;
            }
        });
        return result;
    };

    return {
        severity: formatBreakdown(severityStats),
        priority: formatBreakdown(priorityStats),
    };
};

/**
 * 4. Department Performance Matrix
 */
const getDepartmentAnalytics = async (filters = {}) => {
    const match = buildMatchQuery(filters);

    const depts = await Department.find({ active: true }).sort({ name: 1 });

    const deptStats = await Complaint.aggregate([
        { $match: match },
        {
            $group: {
                _id: '$departmentCode',
                departmentName: { $first: '$assignedDepartment' },
                totalAssigned: { $sum: 1 },
                resolvedCount: {
                    $sum: { $cond: [{ $in: ['$status', ['Resolved', 'Closed']] }, 1, 0] },
                },
                openCount: {
                    $sum: { $cond: [{ $in: ['$status', ['Submitted', 'Verified', 'Assigned', 'In Progress', 'Reopened', 'Pending']] }, 1, 0] },
                },
                criticalCount: {
                    $sum: { $cond: [{ $eq: ['$priority', 'Critical'] }, 1, 0] },
                },
                dueSoonCount: {
                    $sum: { $cond: [{ $eq: ['$sla.status', 'due_soon'] }, 1, 0] },
                },
                breachedCount: {
                    $sum: { $cond: [{ $eq: ['$sla.status', 'breached'] }, 1, 0] },
                },
                completedSlaCount: {
                    $sum: { $cond: [{ $eq: ['$sla.status', 'completed'] }, 1, 0] },
                },
                escalatedCount: {
                    $sum: { $cond: [{ $gt: ['$escalationLevel', 0] }, 1, 0] },
                },
            },
        },
    ]);

    const statsMap = {};
    deptStats.forEach((d) => {
        statsMap[d._id] = d;
    });

    const performanceMatrix = depts.map((d) => {
        const stats = statsMap[d.code] || {};
        const assigned = stats.totalAssigned || 0;
        const resolved = stats.resolvedCount || 0;
        const open = stats.openCount || 0;
        const breached = stats.breachedCount || 0;
        const completedSla = stats.completedSlaCount || 0;

        const resolutionRate = assigned > 0 ? Number(((resolved / assigned) * 100).toFixed(1)) : 0;
        const slaEvaluated = completedSla + breached;
        const slaComplianceRate = slaEvaluated > 0 ? Number(((completedSla / slaEvaluated) * 100).toFixed(1)) : 100;

        return {
            departmentId: d._id,
            name: d.name,
            code: d.code,
            totalAssigned: assigned,
            resolvedCount: resolved,
            openCount: open,
            criticalCount: stats.criticalCount || 0,
            dueSoonCount: stats.dueSoonCount || 0,
            breachedCount: breached,
            escalatedCount: stats.escalatedCount || 0,
            resolutionRate,
            slaComplianceRate,
        };
    });

    return performanceMatrix;
};

/**
 * 5. SLA & Resolution Analytics
 */
const getSLAAnalytics = async (filters = {}) => {
    const match = buildMatchQuery(filters);

    const slaStats = await Complaint.aggregate([
        { $match: match },
        { $group: { _id: '$sla.status', count: { $sum: 1 } } },
    ]);

    const breachesByDept = await Complaint.aggregate([
        { $match: { ...match, 'sla.status': 'breached' } },
        { $group: { _id: '$assignedDepartment', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
    ]);

    const breachesByCategory = await Complaint.aggregate([
        { $match: { ...match, 'sla.status': 'breached' } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
    ]);

    let onTrack = 0, dueSoon = 0, breached = 0, completed = 0;
    slaStats.forEach((item) => {
        if (item._id === 'on_track') onTrack = item.count;
        else if (item._id === 'due_soon') dueSoon = item.count;
        else if (item._id === 'breached') breached = item.count;
        else if (item._id === 'completed') completed = item.count;
    });

    const evaluatedTotal = completed + breached;
    const slaComplianceRate = evaluatedTotal > 0 ? Number(((completed / evaluatedTotal) * 100).toFixed(1)) : 100;
    const breachRate = evaluatedTotal > 0 ? Number(((breached / evaluatedTotal) * 100).toFixed(1)) : 0;

    return {
        onTrack,
        dueSoon,
        breached,
        completed,
        slaComplianceRate,
        breachRate,
        breachesByDepartment: breachesByDept.map((b) => ({ department: b._id || 'General', count: b.count })),
        breachesByCategory: breachesByCategory.map((b) => ({ category: b._id || 'Other', count: b.count })),
    };
};

/**
 * 6. Time-Series Trend Analytics with Period-over-Period % Change
 */
const getTrendAnalytics = async (filters = {}, interval = 'daily') => {
    const match = buildMatchQuery(filters);

    let dateFormat = '%Y-%m-%d';
    if (interval === 'weekly') dateFormat = '%Y-%U';
    else if (interval === 'monthly') dateFormat = '%Y-%m';

    const timeSeries = await Complaint.aggregate([
        { $match: match },
        {
            $group: {
                _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
                total: { $sum: 1 },
                resolved: { $sum: { $cond: [{ $in: ['$status', ['Resolved', 'Closed']] }, 1, 0] } },
                critical: { $sum: { $cond: [{ $eq: ['$priority', 'Critical'] }, 1, 0] } },
            },
        },
        { $sort: { _id: 1 } },
    ]);

    // Period-over-Period Trend Calculation
    const now = new Date();
    const periodDays = filters.period === '7days' ? 7 : filters.period === '90days' ? 90 : 30;

    const currentPeriodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
    const previousPeriodStart = new Date(now.getTime() - periodDays * 2 * 24 * 60 * 60 * 1000);

    const currentPeriodCount = await Complaint.countDocuments({
        createdAt: { $gte: currentPeriodStart, $lte: now },
    });

    const previousPeriodCount = await Complaint.countDocuments({
        createdAt: { $gte: previousPeriodStart, $lt: currentPeriodStart },
    });

    let percentageChange = 0;
    if (previousPeriodCount > 0) {
        percentageChange = Number((((currentPeriodCount - previousPeriodCount) / previousPeriodCount) * 100).toFixed(1));
    } else if (currentPeriodCount > 0) {
        percentageChange = 100;
    }

    // Category Level Spikes Calculation
    const categoryTrendData = await Complaint.aggregate([
        { $match: { createdAt: { $gte: previousPeriodStart, $lte: now } } },
        {
            $group: {
                _id: {
                    category: '$category',
                    isCurrent: { $gte: ['$createdAt', currentPeriodStart] },
                },
                count: { $sum: 1 },
            },
        },
    ]);

    const categorySpikesMap = {};
    categoryTrendData.forEach((item) => {
        const cat = item._id.category;
        if (!categorySpikesMap[cat]) categorySpikesMap[cat] = { current: 0, previous: 0 };
        if (item._id.isCurrent) categorySpikesMap[cat].current += item.count;
        else categorySpikesMap[cat].previous += item.count;
    });

    const categorySpikes = Object.keys(categorySpikesMap).map((cat) => {
        const curr = categorySpikesMap[cat].current;
        const prev = categorySpikesMap[cat].previous;
        let changePercent = 0;
        if (prev > 0) changePercent = Number((((curr - prev) / prev) * 100).toFixed(1));
        else if (curr > 0) changePercent = 100;

        return { category: cat, currentCount: curr, previousCount: prev, changePercent };
    }).sort((a, b) => b.changePercent - a.changePercent);

    return {
        interval,
        currentPeriodCount,
        previousPeriodCount,
        percentageChange,
        timeSeries: timeSeries.map((t) => ({
            date: t._id,
            total: t.total,
            resolved: t.resolved,
            critical: t.critical,
        })),
        categorySpikes,
    };
};

/**
 * 7. Geospatial Complaint Data Retrieval
 */
const getGeospatialAnalytics = async (filters = {}) => {
    const match = buildMatchQuery(filters);
    match.latitude = { $exists: true, $ne: null };
    match.longitude = { $exists: true, $ne: null };

    const complaints = await Complaint.find(match)
        .select('complaintId title category subcategory severity priority status departmentCode assignedDepartment latitude longitude createdAt sla escalationLevel')
        .limit(1000);

    const features = complaints.map((c) => ({
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: [c.longitude, c.latitude],
        },
        properties: {
            id: c._id,
            complaintId: c.complaintId,
            title: c.title,
            category: c.category,
            subcategory: c.subcategory,
            severity: c.severity,
            priority: c.priority,
            status: c.status,
            departmentCode: c.departmentCode,
            assignedDepartment: c.assignedDepartment,
            createdAt: c.createdAt,
            slaStatus: c.sla ? c.sla.status : 'on_track',
            escalationLevel: c.escalationLevel || 0,
        },
    }));

    return {
        type: 'FeatureCollection',
        totalCount: features.length,
        features,
    };
};

/**
 * 8. Regional Structured Field Analytics
 */
const getRegionalAnalytics = async (filters = {}) => {
    const match = buildMatchQuery(filters);

    const localityStats = await Complaint.aggregate([
        { $match: match },
        { $group: { _id: { $ifNull: ['$locality', 'Unknown Locality'] }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
    ]);

    const pincodeStats = await Complaint.aggregate([
        { $match: match },
        { $group: { _id: { $ifNull: ['$pincode', 'Unknown Pincode'] }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
    ]);

    return {
        localities: localityStats.map((l) => ({ name: l._id, count: l.count })),
        pincodes: pincodeStats.map((p) => ({ code: p._id, count: p.count })),
    };
};

/**
 * 9. Deterministic Anomaly Detection
 */
const getAnomalies = async (filters = {}) => {
    const match = buildMatchQuery(filters);
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Group daily counts over the last 30 days per category
    const dailyCategoryCounts = await Complaint.aggregate([
        { $match: { ...match, createdAt: { $gte: thirtyDaysAgo } } },
        {
            $group: {
                _id: {
                    date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    category: '$category',
                },
                count: { $sum: 1 },
            },
        },
    ]);

    const todayStr = now.toISOString().split('T')[0];

    // Compute baseline mean & standard deviation per category
    const categoryData = {};
    dailyCategoryCounts.forEach((item) => {
        const cat = item._id.category;
        const date = item._id.date;
        if (!categoryData[cat]) categoryData[cat] = { counts: [], todayCount: 0 };

        if (date === todayStr) {
            categoryData[cat].todayCount = item.count;
        } else {
            categoryData[cat].counts.push(item.count);
        }
    });

    const anomalies = [];

    Object.keys(categoryData).forEach((cat) => {
        const data = categoryData[cat];
        const counts = data.counts;
        if (counts.length < 3) return; // Insufficient history baseline

        const sum = counts.reduce((acc, c) => acc + c, 0);
        const mean = sum / counts.length;

        const variance = counts.reduce((acc, c) => acc + Math.pow(c - mean, 2), 0) / counts.length;
        const stdDev = Math.sqrt(variance);

        const observed = data.todayCount;
        const threshold = mean + ANOMALY_STD_DEV_THRESHOLD * (stdDev || 1);

        if (observed > threshold && observed >= 5) {
            const deviation = stdDev > 0 ? Number(((observed - mean) / stdDev).toFixed(1)) : 2.5;
            anomalies.push({
                category: cat,
                metric: 'Daily Complaint Volume Spike',
                period: 'Today',
                observedValue: observed,
                expectedValue: Number(mean.toFixed(1)),
                deviationStdDev: deviation,
                message: `Unusual complaint spike detected for ${cat}: ${observed} complaints today vs historical baseline of ${mean.toFixed(1)}/day (+${((observed - mean) / (mean || 1) * 100).toFixed(0)}%).`,
            });
        }
    });

    return {
        anomalyDetected: anomalies.length > 0,
        anomalyCount: anomalies.length,
        anomalies,
    };
};

module.exports = {
    buildMatchQuery,
    getOverviewMetrics,
    getCategoryAnalytics,
    getSeverityPriorityAnalytics,
    getDepartmentAnalytics,
    getSLAAnalytics,
    getTrendAnalytics,
    getGeospatialAnalytics,
    getRegionalAnalytics,
    getAnomalies,
};
