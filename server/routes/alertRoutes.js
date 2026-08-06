const express = require('express');
const router = express.Router();
const { getAlerts, createAlert } = require('../controllers/alertController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', protect, getAlerts);
router.post('/', protect, admin, createAlert);

module.exports = router;
