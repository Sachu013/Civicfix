const express = require('express');
const router = express.Router();
const { submitComplaint, getMyComplaints, trackComplaint } = require('../controllers/complaintController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, submitComplaint);
router.get('/my', protect, getMyComplaints);
router.get('/track/:id', trackComplaint);

module.exports = router;
