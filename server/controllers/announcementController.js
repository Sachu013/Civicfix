const announcementService = require('../services/announcementService');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all announcements
// @route   GET /api/announcements
const getAnnouncements = asyncHandler(async (req, res) => {
    const announcements = await announcementService.getAllAnnouncements();
    res.json(announcements);
});

// @desc    Create announcement (Admin only)
// @route   POST /api/announcements
const createAnnouncement = asyncHandler(async (req, res) => {
    const announcement = await announcementService.createAnnouncement({
        ...req.body,
        postedBy: req.user._id,
    });
    res.status(201).json(announcement);
});

module.exports = {
    getAnnouncements,
    createAnnouncement,
};
