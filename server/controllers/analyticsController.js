const analyticsService = require('../services/analyticsService');
const hotspotService = require('../services/hotspotService');
const analyticsInsightService = require('../services/analyticsInsightService');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get executive overview analytics metrics
// @route   GET /api/admin/analytics/overview
const getOverview = asyncHandler(async (req, res) => {
    const data = await analyticsService.getOverviewMetrics(req.query);
    res.json(data);
});

// @desc    Get category & subcategory breakdown
// @route   GET /api/admin/analytics/categories
const getCategories = asyncHandler(async (req, res) => {
    const data = await analyticsService.getCategoryAnalytics(req.query);
    res.json(data);
});

// @desc    Get severity & priority breakdowns
// @route   GET /api/admin/analytics/severity-priority
const getSeverityPriority = asyncHandler(async (req, res) => {
    const data = await analyticsService.getSeverityPriorityAnalytics(req.query);
    res.json(data);
});

// @desc    Get department performance matrix
// @route   GET /api/admin/analytics/departments
const getDepartments = asyncHandler(async (req, res) => {
    const data = await analyticsService.getDepartmentAnalytics(req.query);
    res.json(data);
});

// @desc    Get SLA & breach analytics
// @route   GET /api/admin/analytics/sla
const getSLA = asyncHandler(async (req, res) => {
    const data = await analyticsService.getSLAAnalytics(req.query);
    res.json(data);
});

// @desc    Get time-series trends and period-over-period % changes
// @route   GET /api/admin/analytics/trends
const getTrends = asyncHandler(async (req, res) => {
    const interval = req.query.interval || 'daily';
    const data = await analyticsService.getTrendAnalytics(req.query, interval);
    res.json(data);
});

// @desc    Get complaint GeoJSON feature collection for map heatmap
// @route   GET /api/admin/analytics/geospatial
const getGeospatial = asyncHandler(async (req, res) => {
    const data = await analyticsService.getGeospatialAnalytics(req.query);
    res.json(data);
});

// @desc    Get geographic hotspots
// @route   GET /api/admin/analytics/hotspots
const getHotspots = asyncHandler(async (req, res) => {
    const data = await hotspotService.detectHotspots(req.query);
    res.json(data);
});

// @desc    Get regional distribution (locality, pincode)
// @route   GET /api/admin/analytics/regional
const getRegional = asyncHandler(async (req, res) => {
    const data = await analyticsService.getRegionalAnalytics(req.query);
    res.json(data);
});

// @desc    Get volume anomalies
// @route   GET /api/admin/analytics/anomalies
const getAnomalies = asyncHandler(async (req, res) => {
    const data = await analyticsService.getAnomalies(req.query);
    res.json(data);
});

// @desc    Get fact-based AI executive insights summary
// @route   GET /api/admin/analytics/insights
const getInsights = asyncHandler(async (req, res) => {
    const data = await analyticsInsightService.generateInsights(req.query);
    res.json(data);
});

module.exports = {
    getOverview,
    getCategories,
    getSeverityPriority,
    getDepartments,
    getSLA,
    getTrends,
    getGeospatial,
    getHotspots,
    getRegional,
    getAnomalies,
    getInsights,
};
