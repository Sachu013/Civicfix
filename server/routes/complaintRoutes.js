const express = require('express');
const router = express.Router();
const {
    submitComplaint,
    checkDuplicates,
    supportComplaint,
    getMyComplaints,
    trackComplaint,
    getNearbyComplaints,
    verifyResolution,
    reopenComplaint,
} = require('../controllers/complaintController');
const { protect } = require('../middleware/authMiddleware');
const { uploadSingleImage } = require('../middleware/uploadMiddleware');

router.post('/', protect, uploadSingleImage, submitComplaint);
router.post('/check-duplicates', protect, uploadSingleImage, checkDuplicates);
router.post('/:id/support', protect, supportComplaint);
router.get('/my', protect, getMyComplaints);
router.get('/nearby', getNearbyComplaints);
router.get('/track/:id', trackComplaint);

// Sprint 7 Citizen Resolution & Reopening routes
router.post('/:id/verify-resolution', protect, verifyResolution);
router.post('/:id/reopen', protect, reopenComplaint);

module.exports = router;
