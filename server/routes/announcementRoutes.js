const express = require('express');
const router = express.Router();
const { getAnnouncements, createAnnouncement } = require('../controllers/announcementController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', protect, getAnnouncements);
router.post('/', protect, admin, createAnnouncement);

module.exports = router;
