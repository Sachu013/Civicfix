const mongoose = require('mongoose');

const otpVerificationSchema = new mongoose.Schema(
    {
        phone: {
            type: String,
            required: true,
            index: true,
            trim: true,
        },
        otpHash: {
            type: String,
            required: true,
        },
        expiresAt: {
            type: Date,
            required: true,
            index: { expires: '0s' }, // Automatic TTL cleanup in MongoDB
        },
        resendAvailableAt: {
            type: Date,
            required: true,
        },
        attempts: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

const OtpVerification = mongoose.model('OtpVerification', otpVerificationSchema);

module.exports = OtpVerification;
