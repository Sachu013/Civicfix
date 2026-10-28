const express = require('express');
const router = express.Router();
const {
    register,
    login,
    requestCitizenOtp,
    verifyCitizenOtp,
    getMe,
    demoCitizenLogin,
} = require('../controllers/authController');
const validate = require('../validators/validate');
const { registerValidator, loginValidator } = require('../validators/authValidator');
const { requestOtpValidator, verifyOtpValidator } = require('../validators/otpValidator');
const { protect } = require('../middleware/authMiddleware');

// Dedicated Demo Citizen login endpoint (skips OTP safely when DEMO_AUTH_ENABLED=true)
router.post('/demo-citizen', demoCitizenLogin);
router.post('/citizen/demo-login', demoCitizenLogin);

// Existing Admin & Citizen email/password routes (preserved)
router.post('/register', validate(registerValidator), register);
router.post('/login', validate(loginValidator), login);

// New Citizen Phone + OTP authentication routes
router.post('/citizen/request-otp', validate(requestOtpValidator), requestCitizenOtp);
router.post('/citizen/verify-otp', validate(verifyOtpValidator), verifyCitizenOtp);

// Authenticated user profile route
router.get('/me', protect, getMe);

module.exports = router;
