/**
 * Native OTP input validator functions for validate middleware
 */

const requestOtpValidator = (data = {}) => {
    let error = '';
    let isValid = true;

    if (!data.phone) {
        error = 'Phone number is required';
        isValid = false;
    } else {
        const cleaned = data.phone.toString().trim().replace(/[\s\-\(\)]/g, '');
        if (!/^\+?\d{10,15}$/.test(cleaned)) {
            error = 'Please enter a valid 10-digit phone number';
            isValid = false;
        }
    }

    return { error, isValid };
};

const verifyOtpValidator = (data = {}) => {
    let error = '';
    let isValid = true;

    if (!data.phone) {
        error = 'Phone number is required';
        isValid = false;
    } else if (!data.otp) {
        error = 'OTP code is required';
        isValid = false;
    } else {
        const trimmedOtp = data.otp.toString().trim();
        if (!/^\d{6}$/.test(trimmedOtp)) {
            error = 'OTP must be exactly 6 numeric digits';
            isValid = false;
        }
    }

    return { error, isValid };
};

module.exports = {
    requestOtpValidator,
    verifyOtpValidator,
};
