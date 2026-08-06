const express = require('express');
const router = express.Router();
const { getAllFeedback, submitFeedback } = require('../controllers/feedbackController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', protect, admin, getAllFeedback);
router.post('/', protect, submitFeedback);

module.exports = router;
