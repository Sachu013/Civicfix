const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');
const { requireRoles, enforceDepartmentScope } = require('../middleware/roleMiddleware');

const adminOrDeptAuth = [
    protect,
    requireRoles('super_admin', 'admin', 'department_head', 'department_staff'),
    enforceDepartmentScope,
];

const superAdminOnly = [
    protect,
    requireRoles('super_admin', 'admin'),
];

router.get('/overview', adminOrDeptAuth, getOverview);
router.get('/categories', adminOrDeptAuth, getCategories);
router.get('/severity', adminOrDeptAuth, getSeverityPriority);
router.get('/severity-priority', adminOrDeptAuth, getSeverityPriority);
router.get('/priority', adminOrDeptAuth, getSeverityPriority);
router.get('/departments', adminOrDeptAuth, getDepartments);
router.get('/sla', adminOrDeptAuth, getSLA);
router.get('/trends', adminOrDeptAuth, getTrends);
router.get('/geographic', adminOrDeptAuth, getGeospatial);
router.get('/geospatial', adminOrDeptAuth, getGeospatial);
router.get('/hotspots', adminOrDeptAuth, getHotspots);
router.get('/regional', adminOrDeptAuth, getRegional);
router.get('/anomalies', adminOrDeptAuth, getAnomalies);
router.get('/insights', adminOrDeptAuth, getInsights);

module.exports = router;
