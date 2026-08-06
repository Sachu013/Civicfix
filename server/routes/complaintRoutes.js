const express = require('express');
const router = express.Router();
const { submitComplaint, getMyComplaints, trackComplaint } = require('../controllers/complaintController');
const { protect } = require('../middleware/authMiddleware');
const { uploadSingleImage } = require('../middleware/uploadMiddleware');

router.post('/', protect, uploadSingleImage, submitComplaint);
router.get('/my', protect, getMyComplaints);
router.get('/track/:id', trackComplaint);

module.exports = router;
