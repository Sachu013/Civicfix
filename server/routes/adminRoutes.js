const express = require('express');
const router = express.Router();
const {
    getAllComplaints,
    updateComplaint,
    assignComplaint,
    reassignComplaint,
    getAssignmentHistory,
    updateComplaintStatus,
    escalateComplaint,
    getComplaintSLA,
    getComplaintEscalation,
    updateComplaintClassification,
    updateComplaintPriority,
    getDashboardMetrics,
    createDepartmentUser,
    getDepartmentUsers,
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { requireRoles } = require('../middleware/roleMiddleware');
const { uploadSingleImage } = require('../middleware/uploadMiddleware');

const adminOrDeptAuth = [
    protect,
    requireRoles('super_admin', 'admin', 'department_head', 'department_staff'),
];

const superAdminOnly = [
    protect,
    requireRoles('super_admin', 'admin'),
];

router.get('/complaints', adminOrDeptAuth, getAllComplaints);
router.put('/complaints/:id', adminOrDeptAuth, updateComplaint);

router.post('/complaints/:id/assign', adminOrDeptAuth, assignComplaint);
router.post('/complaints/:id/reassign', adminOrDeptAuth, reassignComplaint);
router.get('/complaints/:id/assignment-history', adminOrDeptAuth, getAssignmentHistory);

router.put('/complaints/:id/status', adminOrDeptAuth, uploadSingleImage, updateComplaintStatus);
router.patch('/complaints/:id/status', adminOrDeptAuth, uploadSingleImage, updateComplaintStatus);

router.post('/complaints/:id/escalate', adminOrDeptAuth, escalateComplaint);
router.get('/complaints/:id/sla', adminOrDeptAuth, getComplaintSLA);
router.get('/complaints/:id/escalation', adminOrDeptAuth, getComplaintEscalation);

router.put('/complaints/:id/classification', adminOrDeptAuth, updateComplaintClassification);
router.patch('/complaints/:id/priority', adminOrDeptAuth, updateComplaintPriority);
router.put('/complaints/:id/priority', adminOrDeptAuth, updateComplaintPriority);
router.get('/metrics', adminOrDeptAuth, getDashboardMetrics);

// Super Admin Department User Management
router.post('/department-users', superAdminOnly, createDepartmentUser);
router.get('/department-users', superAdminOnly, getDepartmentUsers);

module.exports = router;
