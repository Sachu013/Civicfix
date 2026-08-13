const express = require('express');
const router = express.Router();
const {
    getDepartmentDashboard,
    getDepartmentComplaints,
    getDepartmentAnalytics,
    getDepartmentHotspots,
    getDepartmentSLA,
    getDepartmentEscalations,
    getDepartmentStaff,
    assignComplaintToStaff,
} = require('../controllers/departmentDashboardController');
const { protect } = require('../middleware/authMiddleware');
const { requireRoles, enforceDepartmentScope } = require('../middleware/roleMiddleware');

const departmentAuth = [
    protect,
    requireRoles('department_head', 'department_staff', 'super_admin', 'admin'),
    enforceDepartmentScope,
];

router.get('/dashboard', departmentAuth, getDepartmentDashboard);
router.get('/complaints', departmentAuth, getDepartmentComplaints);
router.get('/analytics', departmentAuth, getDepartmentAnalytics);
router.get('/hotspots', departmentAuth, getDepartmentHotspots);
router.get('/sla', departmentAuth, getDepartmentSLA);
router.get('/escalations', departmentAuth, getDepartmentEscalations);
router.get('/staff', departmentAuth, getDepartmentStaff);
router.post('/assign', departmentAuth, assignComplaintToStaff);

module.exports = router;
