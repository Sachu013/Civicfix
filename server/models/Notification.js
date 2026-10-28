const mongoose = require('mongoose');
const { NOTIFICATION_TYPES } = require('../config/notificationTypes');

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        recipientRole: {
            type: String,
            enum: ['citizen', 'department_head', 'verifier', 'super_admin'],
            required: true,
        },
        type: {
            type: String,
            required: true,
            enum: Object.values(NOTIFICATION_TYPES),
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        message: {
            type: String,
            required: true,
            trim: true,
        },
        complaint: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Complaint',
            index: true,
        },
        complaintId: {
            type: String,
            index: true,
        },
        departmentCode: {
            type: String,
            uppercase: true,
            trim: true,
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high', 'urgent'],
            default: 'medium',
        },
        isRead: {
            type: Boolean,
            default: false,
            index: true,
        },
        readAt: {
            type: Date,
            default: null,
        },
        metadata: {
            type: Object,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
