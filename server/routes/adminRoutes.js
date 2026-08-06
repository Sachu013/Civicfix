const express = require('express');
const router = express.Router();
const { getAllComplaints, updateComplaint, getDashboardMetrics } = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/complaints', protect, admin, getAllComplaints);
router.put('/complaints/:id', protect, admin, updateComplaint);
router.get('/metrics', protect, admin, getDashboardMetrics);

module.exports = router;
