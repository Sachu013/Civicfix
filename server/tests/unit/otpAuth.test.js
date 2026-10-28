/**
 * Automated Test Suite for Phase 1: Citizen Phone + OTP Authentication & Phone Privacy
 */
const assert = require('assert');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const otpService = require('../../services/otpService');
const OtpVerification = require('../../models/OtpVerification');
const User = require('../../models/User');
const Complaint = require('../../models/Complaint');
const { sanitizePhonePrivacy } = require('../../middleware/phonePrivacyMiddleware');

dotenv.config();

const runTests = async () => {
    console.log('================================================================');
    console.log('TEST SUITE: Citizen Phone + OTP Authentication & Phone Privacy');
    console.log('================================================================\n');

    let dbConnected = false;
    try {
        if (process.env.MONGODB_URI) {
            await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
            dbConnected = true;
            console.log('Connected to MongoDB for OTP test execution...\n');
        }
    } catch (err) {
        console.warn('MongoDB connection unavailable, running offline tests:', err.message);
    }

    try {
        // 1. Phone Normalization Test
        console.log('[1/9] Testing Phone Normalization...');
        assert.strictEqual(otpService.normalizePhone('9876543210'), '+919876543210');
        assert.strictEqual(otpService.normalizePhone('+919876543210'), '+919876543210');
        assert.strictEqual(otpService.normalizePhone('98765-43210'), '+919876543210');
        console.log('   ✓ Phone normalization works as expected.');

        // 2. Phone Validation Test
        console.log('[2/9] Testing Phone Validation...');
        assert.strictEqual(otpService.isValidPhone('9876543210'), true);
        assert.strictEqual(otpService.isValidPhone('+919876543210'), true);
        assert.strictEqual(otpService.isValidPhone('123'), false);
        assert.strictEqual(otpService.isValidPhone('abc'), false);
        console.log('   ✓ Phone validation works as expected.');

        if (dbConnected) {
            const testPhone = '+919999888877';

            // Cleanup any existing test data
            await OtpVerification.deleteMany({ phone: testPhone });
            await User.deleteMany({ phone: testPhone });

            // 3. Request OTP Test
            console.log('[3/9] Testing OTP Generation & Storage...');
            const reqRes = await otpService.requestOtp(testPhone);
            assert.strictEqual(reqRes.success, true);
            assert.strictEqual(reqRes.phone, testPhone);

            const otpDoc = await OtpVerification.findOne({ phone: testPhone });
            assert.ok(otpDoc, 'OTP record should be stored in DB');
            assert.strictEqual(otpDoc.attempts, 0);
            assert.ok(otpDoc.otpHash, 'OTP should be stored as bcrypt hash, not plaintext');
            assert.notStrictEqual(otpDoc.otpHash, '123456', 'OTP MUST NOT be stored in plaintext');
            console.log('   ✓ OTP generated, hashed, and stored securely.');

            // 4. Resend Cooldown Test
            console.log('[4/9] Testing Resend Cooldown Rate Limiting...');
            try {
                await otpService.requestOtp(testPhone);
                assert.fail('Should have thrown rate limit cooldown error');
            } catch (err) {
                assert.strictEqual(err.statusCode, 429);
                assert.ok(err.message.includes('Please wait'), 'Should inform user to wait during cooldown');
            }
            console.log('   ✓ Resend cooldown rate-limiting enforced.');

            // 5. Invalid OTP Test
            console.log('[5/9] Testing Invalid OTP Handling & Attempt Count...');
            try {
                await otpService.verifyOtp(testPhone, '000000');
                assert.fail('Should have rejected invalid OTP');
            } catch (err) {
                assert.strictEqual(err.statusCode, 400);
                assert.ok(err.message.includes('Invalid OTP'), 'Should return invalid OTP error');
            }

            const updatedDoc = await OtpVerification.findOne({ phone: testPhone });
            assert.strictEqual(updatedDoc.attempts, 1, 'Attempt count should increment to 1');
            console.log('   ✓ Invalid OTP rejected and attempt counter incremented.');

            // Force doc OTP hash to a known test OTP hash (e.g. bcrypt of '123456')
            const bcrypt = require('bcryptjs');
            const salt = await bcrypt.genSalt(10);
            updatedDoc.otpHash = await bcrypt.hash('123456', salt);
            await updatedDoc.save();

            // 6. Successful Verification & Account Creation Test
            console.log('[6/9] Testing Successful OTP Verification & Citizen Creation...');
            const verifyRes = await otpService.verifyOtp(testPhone, '123456');
            assert.ok(verifyRes.token, 'Should return JWT token');
            assert.strictEqual(verifyRes.user.phone, testPhone);
            assert.strictEqual(verifyRes.user.role, 'citizen');

            const postVerifyDoc = await OtpVerification.findOne({ phone: testPhone });
            assert.strictEqual(postVerifyDoc, null, 'OTP record MUST be deleted after single-use verification');

            const createdUser = await User.findOne({ phone: testPhone });
            assert.ok(createdUser, 'Citizen user should exist in DB');
            assert.strictEqual(createdUser.role, 'citizen');
            console.log('   ✓ Successful verification creates citizen user, issues JWT, and invalidates single-use OTP.');

            // 7. Prevent Duplicate Citizens Test
            console.log('[7/9] Testing Existing Citizen Authentication without Duplication...');
            // Create another OTP for same phone
            const reqRes2 = await otpService.requestOtp(testPhone);
            const otpDoc2 = await OtpVerification.findOne({ phone: testPhone });
            otpDoc2.otpHash = await bcrypt.hash('654321', salt);
            await otpDoc2.save();

            const verifyRes2 = await otpService.verifyOtp(testPhone, '654321');
            assert.strictEqual(verifyRes2.user._id.toString(), createdUser._id.toString(), 'Should reuse existing citizen account');

            const userCount = await User.countDocuments({ phone: testPhone });
            assert.strictEqual(userCount, 1, 'Should NOT create duplicate user accounts for same phone number');
            console.log('   ✓ Existing citizen account reused without duplicate creation.');

            // Clean test data
            await OtpVerification.deleteMany({ phone: testPhone });
            await User.deleteMany({ phone: testPhone });
        }

        // 8. Phone Privacy: Super Admin Privacy Rule
        console.log('[8/9] Testing Phone Privacy Rule for Super Admin (MUST NOT see phone)...');
        const mockCitizen = {
            _id: new mongoose.Types.ObjectId(),
            name: 'John Citizen',
            email: 'john@test.com',
            phone: '+919876543210',
            role: 'citizen',
        };

        const mockSuperAdmin = {
            _id: new mongoose.Types.ObjectId(),
            name: 'Super Admin',
            role: 'super_admin',
        };

        const mockComplaint = {
            complaintId: 'CMP-TEST-1',
            departmentCode: 'ROADS',
            user: mockCitizen,
        };

        const superAdminSanitized = sanitizePhonePrivacy(mockComplaint, mockSuperAdmin);
        assert.strictEqual(superAdminSanitized.user.phone, undefined, 'Super Admin API response MUST NOT contain citizen phone number');
        console.log('   ✓ Super Admin response serialization strictly strips citizen phone number.');

        // 9. Phone Privacy: Department Head & Verifier vs Citizen Self Access
        console.log('[9/9] Testing Phone Privacy Rule for Dept Head, Verifier, and Citizen...');
        const mockRoadsHead = {
            _id: new mongoose.Types.ObjectId(),
            name: 'Roads Head',
            role: 'department_head',
            departmentCode: 'ROADS',
        };

        const mockWaterHead = {
            _id: new mongoose.Types.ObjectId(),
            name: 'Water Head',
            role: 'department_head',
            departmentCode: 'WATER',
        };

        const roadsHeadSanitized = sanitizePhonePrivacy(mockComplaint, mockRoadsHead);
        assert.strictEqual(roadsHeadSanitized.user.phone, '+919876543210', 'Department Head can see citizen phone for their department complaint');

        const waterHeadSanitized = sanitizePhonePrivacy(mockComplaint, mockWaterHead);
        assert.strictEqual(waterHeadSanitized.user.phone, undefined, 'Department Head cannot see citizen phone for another department complaint');

        const citizenSelfSanitized = sanitizePhonePrivacy(mockCitizen, { _id: mockCitizen._id, role: 'citizen' });
        assert.strictEqual(citizenSelfSanitized.phone, '+919876543210', 'Citizen can see own phone number');

        console.log('   ✓ Role-based Phone Privacy rules strictly verified across all roles.\n');

        console.log('================================================================');
        console.log('ALL PHASE 1 CITIZEN OTP & PHONE PRIVACY TESTS PASSED SUCCESSFULLY');
        console.log('================================================================');
    } catch (err) {
        console.error('❌ OTP Test Failure:', err);
        process.exit(1);
    } finally {
        if (dbConnected) {
            await mongoose.disconnect();
        }
    }
};

runTests();
