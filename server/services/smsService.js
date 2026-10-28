const otpConfig = require('../config/otpConfig');

/**
 * SMS Provider Service Abstraction
 * Handles dispatching OTP messages through configured SMS provider.
 */
const sendSMS = async (phone, message, meta = {}) => {
    const provider = otpConfig.OTP_PROVIDER.toLowerCase();

    if (process.env.NODE_ENV !== 'production' || provider === 'console' || otpConfig.OTP_DEV_MODE) {
        // Safe development provider: log dispatch details
        console.log(`\n====================================================`);
        console.log(`[SMS DISPATCH - ${provider.toUpperCase()}]`);
        console.log(`To: ${phone}`);
        console.log(`Message: ${message}`);
        if (meta.rawOtp) {
            console.log(`[DEV ONLY OTP CODE]: ${meta.rawOtp}`);
        }
        console.log(`====================================================\n`);
        return { success: true, provider: 'console', messageId: `DEV-${Date.now()}` };
    }

    if (provider === 'twilio') {
        // Twilio SMS provider integration template
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const fromNumber = process.env.TWILIO_PHONE_NUMBER;

        if (!accountSid || !authToken || !fromNumber) {
            console.error('[SMS SERVICE] Missing Twilio environment credentials');
            throw new Error('SMS service configuration error');
        }

        // Lazy load twilio if installed
        try {
            const twilio = require('twilio');
            const client = twilio(accountSid, authToken);
            const result = await client.messages.create({
                body: message,
                from: fromNumber,
                to: phone,
            });
            return { success: true, provider: 'twilio', messageId: result.sid };
        } catch (err) {
            console.error('[SMS SERVICE] Twilio dispatch failure:', err.message);
            throw new Error('Failed to deliver SMS notification');
        }
    }

    // Default fallback provider
    console.log(`[SMS DISPATCH - MOCK] Simulated SMS to ${phone}`);
    return { success: true, provider: 'mock', messageId: `MOCK-${Date.now()}` };
};

module.exports = {
    sendSMS,
};
