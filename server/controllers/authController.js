const authService = require('../services/authService');
const otpService = require('../services/otpService');
const generateToken = require('../utils/generateToken');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Register a new user (Legacy Email/Password Citizen Registration)
// @route   POST /api/auth/register
const register = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    const user = await authService.registerUser({ name, email, password });

    res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || null,
        role: user.role,
        departmentCode: user.departmentCode || null,
        department: user.department || null,
        token: generateToken(user._id),
    });
});

// @desc    Auth user & get token (Admin & Email/Password Login)
// @route   POST /api/auth/login
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await authService.loginUser(email, password);

    res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || null,
        role: user.role,
        departmentCode: user.departmentCode,
        department: user.department,
        token: generateToken(user._id),
    });
});

// @desc    Request OTP for Citizen Phone Authentication
// @route   POST /api/auth/citizen/request-otp
const requestCitizenOtp = asyncHandler(async (req, res) => {
    const { phone } = req.body;
    const result = await otpService.requestOtp(phone);
    res.json(result);
});

// @desc    Verify OTP for Citizen Phone Authentication & return JWT token
// @route   POST /api/auth/citizen/verify-otp
const verifyCitizenOtp = asyncHandler(async (req, res) => {
    const { phone, otp } = req.body;
    const result = await otpService.verifyOtp(phone, otp);
    res.json(result);
});

const User = require('../models/User');

// @desc    Get current authenticated user profile
// @route   GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Not authorized' });
    }

    res.json({
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email || null,
        phone: req.user.phone || null,
        role: req.user.role,
        departmentCode: req.user.departmentCode || null,
        department: req.user.department || null,
    });
});

// @desc    Demo Citizen Bypass Login (strictly enabled via DEMO_AUTH_ENABLED=true)
// @route   POST /api/auth/demo-citizen, POST /api/auth/citizen/demo-login
const demoCitizenLogin = asyncHandler(async (req, res) => {
    // 1. Enforce server-side environment flag
    if (process.env.DEMO_AUTH_ENABLED !== 'true') {
        return res.status(403).json({
            message: 'Demo authentication is disabled. Set DEMO_AUTH_ENABLED=true to enable.',
        });
    }

    // 2. Predefined Demo Citizen account constants (strictly enforced server-side)
    const DEMO_PHONE = '+919876543210';
    const DEMO_EMAIL = 'citizen@demo.com';

    // Disregard any client-supplied identity, phone, or role parameters to prevent impersonation
    let user = await User.findOne({
        $or: [{ phone: DEMO_PHONE }, { email: DEMO_EMAIL }],
    });

    if (!user) {
        // Auto-provision predefined demo citizen if not already seeded
        user = await User.create({
            name: 'Demo Citizen',
            email: DEMO_EMAIL,
            phone: DEMO_PHONE,
            role: 'citizen',
        });
    }

    // 3. Strict security check: Ensure account has citizen role only
    if (user.role !== 'citizen') {
        return res.status(403).json({
            message: 'Access denied: Demo login is only permitted for Citizen role.',
        });
    }

    // 4. Generate standard JWT token using existing token mechanism
    const token = generateToken(user._id);

    const userPayload = {
        _id: user._id,
        name: user.name,
        email: user.email || null,
        phone: user.phone || null,
        role: 'citizen',
        departmentCode: null,
        department: null,
    };

    res.json({
        ...userPayload,
        token,
        user: userPayload,
    });
});

module.exports = {
    register,
    login,
    requestCitizenOtp,
    verifyCitizenOtp,
    getMe,
    demoCitizenLogin,
};
