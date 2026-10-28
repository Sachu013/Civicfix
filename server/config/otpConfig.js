/**
 * OTP Configuration module
 */
module.exports = {
    OTP_PROVIDER: process.env.OTP_PROVIDER || 'console',
    OTP_EXPIRY_MINUTES: Number(process.env.OTP_EXPIRY_MINUTES) || 5,
    OTP_RESEND_COOLDOWN: Number(process.env.OTP_RESEND_COOLDOWN) || 60, // in seconds
    OTP_MAX_ATTEMPTS: Number(process.env.OTP_MAX_ATTEMPTS) || 5,
    OTP_DEV_MODE: process.env.NODE_ENV === 'development' || process.env.OTP_DEV_MODE === 'true',
};
