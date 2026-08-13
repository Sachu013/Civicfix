const Complaint = require('../models/Complaint');
const analyticsService = require('./analyticsService');
const { HOTSPOT_MIN_COMPLAINTS } = require('../config/analyticsConfig');

/**
 * Deterministic Geospatial Hotspot Detection Algorithm
 * Groups complaints into spatial clusters using grid rounding (1.5 km precision)
 */
const detectHotspots = async (filters = {}) => {
    const match = analyticsService.buildMatchQuery(filters);
    match.latitude = { $exists: true, $ne: null };
    match.longitude = { $exists: true, $ne: null };

    const complaints = await Complaint.find(match).select(
        'latitude longitude category subcategory priority severity status departmentCode assignedDepartment sla escalationLevel'
    );

    if (!complaints || complaints.length === 0) {
        return {
            totalHotspots: 0,
            hotspots: [],
        };
    }

    // Grid step size (~1.5km precision in degrees)
    const GRID_STEP = 0.0135;

    const clusters = {};

    complaints.forEach((c) => {
        const gridLat = (Math.round(c.latitude / GRID_STEP) * GRID_STEP).toFixed(4);
        const gridLng = (Math.round(c.longitude / GRID_STEP) * GRID_STEP).toFixed(4);
        const cellKey = `${gridLat}_${gridLng}`;

        if (!clusters[cellKey]) {
            clusters[cellKey] = {
                latSum: 0,
                lngSum: 0,
                complaints: [],
            };
        }

        clusters[cellKey].latSum += c.latitude;
        clusters[cellKey].lngSum += c.longitude;
        clusters[cellKey].complaints.push(c);
    });

    const hotspots = [];

    Object.keys(clusters).forEach((cellKey) => {
        const cluster = clusters[cellKey];
        const count = cluster.complaints.length;

        // Apply strict minimum complaint density threshold
        if (count >= HOTSPOT_MIN_COMPLAINTS) {
            const avgLat = Number((cluster.latSum / count).toFixed(6));
            const avgLng = Number((cluster.lngSum / count).toFixed(6));

            const categoryCounts = {};
            const subcategoryCounts = {};
            const deptSet = new Set();
            let criticalCount = 0;
            let highPriorityCount = 0;
            let unresolvedCount = 0;
            let slaBreachedCount = 0;

            cluster.complaints.forEach((comp) => {
                const cat = comp.category || 'Other';
                categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

                if (comp.subcategory) {
                    subcategoryCounts[comp.subcategory] = (subcategoryCounts[comp.subcategory] || 0) + 1;
                }

                if (comp.assignedDepartment) {
                    deptSet.add(comp.assignedDepartment);
                }

                if (comp.priority === 'Critical' || comp.severity === 'Critical') {
                    criticalCount++;
                }

                if (comp.priority === 'High' || comp.severity === 'High') {
                    highPriorityCount++;
                }

                if (['Submitted', 'Verified', 'Assigned', 'In Progress', 'Reopened', 'Pending'].includes(comp.status)) {
                    unresolvedCount++;
                }

                if (comp.sla && comp.sla.status === 'breached') {
                    slaBreachedCount++;
                }
            });

            // Determine dominant category
            let dominantCategory = 'Other';
            let maxCatCount = 0;
            Object.keys(categoryCounts).forEach((cat) => {
                if (categoryCounts[cat] > maxCatCount) {
                    maxCatCount = categoryCounts[cat];
                    dominantCategory = cat;
                }
            });

            // Top subcategories
            const topSubcategories = Object.keys(subcategoryCounts)
                .map((sub) => ({ subcategory: sub, count: subcategoryCounts[sub] }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 3);

            hotspots.push({
                hotspotId: `HS-${cellKey}`,
                center: {
                    latitude: avgLat,
                    longitude: avgLng,
                },
                complaintCount: count,
                dominantCategory,
                topSubcategories,
                criticalCount,
                highPriorityCount,
                unresolvedCount,
                slaBreachedCount,
                affectedDepartments: Array.from(deptSet),
            });
        }
    });

    // Sort hotspots by complaint count descending
    hotspots.sort((a, b) => b.complaintCount - a.complaintCount);

    return {
        totalHotspots: hotspots.length,
        hotspots,
    };
};

module.exports = {
    detectHotspots,
};
