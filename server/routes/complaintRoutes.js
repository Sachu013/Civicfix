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
    getAssignedToMe,
    assignVerifier,
} = require('../controllers/complaintController');
const { protect } = require('../middleware/authMiddleware');
const { requireRoles } = require('../middleware/roleMiddleware');
const { phonePrivacyMiddleware } = require('../middleware/phonePrivacyMiddleware');
const { uploadSingleImage, uploadMultipleImages } = require('../middleware/uploadMiddleware');
const {
    getVerificationReport,
    uploadEvidence,
    submitVerificationReport,
} = require('../controllers/verificationController');

router.post('/', protect, uploadSingleImage, submitComplaint);
router.post('/check-duplicates', protect, uploadSingleImage, checkDuplicates);
router.post('/:id/support', protect, supportComplaint);
router.get('/my', protect, phonePrivacyMiddleware, getMyComplaints);
router.get('/assigned-to-me', protect, phonePrivacyMiddleware, getAssignedToMe);
router.get('/nearby', getNearbyComplaints);
router.get('/track/:id', trackComplaint);

// Phase 3 Assignment routes (Department Head only)
router.put('/:id/assign-verifier', protect, requireRoles('department_head'), assignVerifier);
router.post('/:id/assign-verifier', protect, requireRoles('department_head'), assignVerifier);

// Phase 4 Field Verification routes
router.get('/:id/verification', protect, phonePrivacyMiddleware, getVerificationReport);
router.post('/:id/verification/evidence', protect, requireRoles('verifier', 'department_staff'), uploadMultipleImages, uploadEvidence);
router.post('/:id/verification', protect, requireRoles('verifier', 'department_staff'), submitVerificationReport);

// Citizen Resolution & Reopening routes
router.post('/:id/verify-resolution', protect, verifyResolution);
router.post('/:id/reopen', protect, reopenComplaint);

module.exports = router;
