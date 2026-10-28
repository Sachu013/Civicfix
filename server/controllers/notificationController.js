const notificationService = require('../services/notificationService');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get logged-in user's notifications
// @route   GET /api/notifications
const getNotifications = asyncHandler(async (req, res) => {
    const data = await notificationService.getUserNotifications(req.user._id, req.query);
    res.json(data);
});

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
const getUnreadCount = asyncHandler(async (req, res) => {
    const unreadCount = await notificationService.getUnreadCount(req.user._id);
    res.json({ unreadCount });
});

// @desc    Mark single notification as read
// @route   PUT /api/notifications/:id/read
const markAsRead = asyncHandler(async (req, res) => {
    const notification = await notificationService.markAsRead(req.params.id, req.user._id);
    if (!notification) {
        throw new ErrorResponse('Notification not found or unauthorized', 404);
    }
    res.json(notification);
});

// @desc    Mark all notifications as read for logged-in user
// @route   PUT /api/notifications/read-all
const markAllAsRead = asyncHandler(async (req, res) => {
    const result = await notificationService.markAllAsRead(req.user._id);
    res.json({
        success: true,
        message: 'All notifications marked as read',
        modifiedCount: result.modifiedCount || 0,
    });
});

module.exports = {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
};
