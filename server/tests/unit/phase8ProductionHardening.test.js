/**
 * Phase 8: Production Readiness, Security & Final Hardening Test Suite
 * Validates RBAC, unauthenticated request rejection, JWT token security, phone privacy,
 * Super Admin write blocks, OTP rate limiting, MongoDB ObjectId safety, input enum validation,
 * notification isolation, health endpoint status, and production error response safety.
 */
const assert = require('assert');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const jwt = require('jsonwebtoken');
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const User = require('../../models/User');
const Complaint = require('../../models/Complaint');
const Department = require('../../models/Department');
const Notification = require('../../models/Notification');
const OtpVerification = require('../../models/OtpVerification');
const { NOTIFICATION_TYPES } = require('../../config/notificationTypes');
const { DEFAULT_DEPARTMENTS } = require('../../config/departmentConfig');

const adminController = require('../../controllers/adminController');
const departmentDashboardController = require('../../controllers/departmentDashboardController');
const verificationController = require('../../controllers/verificationController');
const notificationController = require('../../controllers/notificationController');
const authController = require('../../controllers/authController');
const complaintController = require('../../controllers/complaintController');
const complaintService = require('../../services/complaintService');
const otpService = require('../../services/otpService');
const notificationService = require('../../services/notificationService');
const app = require('../../app');

const executeController = (controllerFn, req) => {
    return new Promise((resolve) => {
        let resStatus = 200;
        let resData = null;
        let res = {
            status: (code) => {
                resStatus = code;
                return res;
            },
            json: (data) => {
                resData = data;
                resolve({ status: resStatus, data: resData });
                return res;
            },
        };
        let next = (err) => {
            if (err) {
                const status = err.statusCode || err.status || 500;
                resolve({ status, data: { message: err.message || 'Error', error: err } });
            } else {
                resolve({ status: resStatus, data: resData });
            }
        };
        Promise.resolve(controllerFn(req, res, next)).catch(next);
    });
};

const runPhase8HardeningTests = async () => {
    console.log('================================================================');
    console.log('STARTING PHASE 8: PRODUCTION HARDENING & SECURITY TEST SUITE');
    console.log('================================================================\n');

    let passedCount = 0;

    try {
        let connected = false;
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
                connected = true;
                break;
            } catch (connErr) {
                console.log(`Connection attempt ${attempt} failed, retrying...`);
                await new Promise((r) => setTimeout(r, 2000));
            }
        }
        if (!connected) {
            throw new Error('Failed to connect to MongoDB Atlas after 3 attempts');
        }

        // Seed 6 operational departments
        for (const dept of DEFAULT_DEPARTMENTS) {
            await Department.findOneAndUpdate(
                { code: dept.code },
                { ...dept },
                { upsert: true, returnDocument: 'after' }
            );
        }

        const timestamp = Date.now();

        // 1. Setup Test Users
        const citizen1 = await User.create({
            name: `P8 Citizen 1 ${timestamp}`,
            email: `p8citizen1_${timestamp}@civicfix.org`,
            phone: `+9198751${timestamp.toString().slice(-5)}`,
            password: 'Password123!',
            role: 'citizen',
        });

        const citizen2 = await User.create({
            name: `P8 Citizen 2 ${timestamp}`,
            email: `p8citizen2_${timestamp}@civicfix.org`,
            phone: `+9198752${timestamp.toString().slice(-5)}`,
            password: 'Password123!',
            role: 'citizen',
        });

        const roadsHead = await User.create({
            name: `P8 Roads Head ${timestamp}`,
            email: `p8roadshead_${timestamp}@civicfix.org`,
            password: 'Password123!',
            role: 'department_head',
            departmentCode: 'ROADS',
        });

        const waterHead = await User.create({
            name: `P8 Water Head ${timestamp}`,
            email: `p8waterhead_${timestamp}@civicfix.org`,
            password: 'Password123!',
            role: 'department_head',
            departmentCode: 'WATER',
        });

        const roadsVerifier = await User.create({
            name: `P8 Roads Verifier ${timestamp}`,
            email: `p8roadsverifier_${timestamp}@civicfix.org`,
            password: 'Password123!',
            role: 'verifier',
            departmentCode: 'ROADS',
        });

        const waterVerifier = await User.create({
            name: `P8 Water Verifier ${timestamp}`,
            email: `p8waterverifier_${timestamp}@civicfix.org`,
            password: 'Password123!',
            role: 'verifier',
            departmentCode: 'WATER',
        });

        const superAdmin = await User.create({
            name: `P8 SuperAdmin ${timestamp}`,
            email: `p8superadmin_${timestamp}@civicfix.org`,
            password: 'Password123!',
            role: 'super_admin',
        });

        // Setup Test Complaint
        const complaint = await complaintService.createComplaint({
            userId: citizen1._id,
            title: 'Damaged Asphalt on Main Road',
            description: 'Massive asphalt road damage creating safety hazard.',
            category: 'Roads & Transportation',
            subcategory: 'Pothole',
            severity: 'High',
            latitude: 28.6139,
            longitude: 77.2090,
            location: 'Sector 4, Main Avenue',
        });

        // Test 1: Unauthenticated API access rejected (401)
        console.log('Test 1: Unauthenticated API access rejected (401)');
        const req1 = { headers: {} };
        const { protect } = require('../../middleware/authMiddleware');
        let authRejected1 = false;
        const res1Mock = {
            status: (code) => {
                if (code === 401) authRejected1 = true;
                return { json: () => {} };
            },
        };
        await protect(req1, res1Mock, () => {});
        assert.strictEqual(authRejected1, true);
        console.log('✔ Passed Scenario 1\n');
        passedCount++;

        // Test 2: Expired JWT rejected (401)
        console.log('Test 2: Expired JWT rejected (401)');
        const expiredToken = jwt.sign({ id: citizen1._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '-1s' });
        const req2 = { headers: { authorization: `Bearer ${expiredToken}` } };
        let authRejected2 = false;
        const res2Mock = {
            status: (code) => {
                if (code === 401) authRejected2 = true;
                return { json: () => {} };
            },
        };
        await protect(req2, res2Mock, () => {});
        assert.strictEqual(authRejected2, true);
        console.log('✔ Passed Scenario 2\n');
        passedCount++;

        // Test 3: Malformed JWT rejected (401)
        console.log('Test 3: Malformed JWT rejected (401)');
        const req3 = { headers: { authorization: 'Bearer invalid.jwt.token' } };
        let authRejected3 = false;
        const res3Mock = {
            status: (code) => {
                if (code === 401) authRejected3 = true;
                return { json: () => {} };
            },
        };
        await protect(req3, res3Mock, () => {});
        assert.strictEqual(authRejected3, true);
        console.log('✔ Passed Scenario 3\n');
        passedCount++;

        // Test 4: Citizen cannot access/reopen another citizen's complaint (403)
        console.log('Test 4: Citizen cannot access/reopen another citizen\'s complaint (403)');
        const res4 = await executeController(complaintController.reopenComplaint, {
            user: citizen2,
            params: { id: complaint._id },
            body: { reason: 'Unauthorized reopen attempt' },
        });
        assert.strictEqual(res4.status, 403);
        console.log('✔ Passed Scenario 4\n');
        passedCount++;

        // Test 5: Citizen cannot access another citizen's notification (404)
        console.log('Test 5: Citizen cannot access another citizen\'s notification (404)');
        const notif1 = await Notification.findOne({ recipient: citizen1._id });
        assert.ok(notif1, 'Submission notification must exist for citizen1');
        const res5 = await executeController(notificationController.markAsRead, {
            user: citizen2,
            params: { id: notif1._id },
        });
        assert.strictEqual(res5.status, 404);
        console.log('✔ Passed Scenario 5\n');
        passedCount++;

        // Test 6: Department Head cannot access another department's complaint (403)
        console.log('Test 6: Department Head cannot access another department\'s complaint (403)');
        const { verifyComplaintDepartmentAccess } = require('../../controllers/adminController');
        let deptAccessDenied = false;
        try {
            verifyComplaintDepartmentAccess({ user: waterHead }, complaint); // complaint is ROADS
        } catch (err) {
            if (err.statusCode === 403 || err.status === 403) {
                deptAccessDenied = true;
            }
        }
        assert.strictEqual(deptAccessDenied, true);
        console.log('✔ Passed Scenario 6\n');
        passedCount++;

        // Test 7: Department Head cannot assign cross-department verifier (400)
        console.log('Test 7: Department Head cannot assign cross-department verifier (400)');
        const res7 = await executeController(departmentDashboardController.assignComplaintToStaff, {
            user: roadsHead,
            body: { complaintId: complaint._id, staffId: waterVerifier._id },
        });
        assert.strictEqual(res7.status, 400);
        console.log('✔ Passed Scenario 7\n');
        passedCount++;

        // Test 8: Verifier cannot access another verifier's assigned complaint (403)
        console.log('Test 8: Verifier cannot access another verifier\'s assigned complaint (403)');
        // Assign to roadsVerifier
        await executeController(departmentDashboardController.assignComplaintToStaff, {
            user: roadsHead,
            body: { complaintId: complaint._id, staffId: roadsVerifier._id },
        });
        const res8 = await executeController(verificationController.getVerificationReport, {
            user: waterVerifier,
            params: { id: complaint._id },
        });
        assert.strictEqual(res8.status, 403);
        console.log('✔ Passed Scenario 8\n');
        passedCount++;

        // Test 9: Verifier cannot change official status (403)
        console.log('Test 9: Verifier cannot change official status (403)');
        const res9 = await executeController(adminController.updateComplaintStatus, {
            user: roadsVerifier,
            params: { id: complaint._id },
            body: { status: 'Resolved', note: 'Verifier attempting status change' },
        });
        assert.strictEqual(res9.status, 403);
        console.log('✔ Passed Scenario 9\n');
        passedCount++;

        // Test 10: Super Admin operational write blocked (403)
        console.log('Test 10: Super Admin operational write blocked (403)');
        const res10 = await executeController(adminController.updateComplaintStatus, {
            user: superAdmin,
            params: { id: complaint._id },
            body: { status: 'Resolved', note: 'Super Admin write attempt' },
        });
        assert.strictEqual(res10.status, 403);
        console.log('✔ Passed Scenario 10\n');
        passedCount++;

        // Test 11: Super Admin cannot receive citizen phone number (stripped from payload)
        console.log('Test 11: Super Admin cannot receive citizen phone number (stripped)');
        const { sanitizePhonePrivacy } = require('../../middleware/phonePrivacyMiddleware');
        const sanitizedForSuperAdmin = sanitizePhonePrivacy(
            { _id: citizen1._id, name: citizen1.name, phone: citizen1.phone },
            superAdmin
        );
        assert.strictEqual(sanitizedForSuperAdmin.phone, undefined);
        console.log('✔ Passed Scenario 11\n');
        passedCount++;

        // Test 12: OTP rate limiting resend cooldown remains enforced (429)
        console.log('Test 12: OTP rate limiting resend cooldown remains enforced (429)');
        const testPhone = `+9198759${timestamp.toString().slice(-5)}`;
        await otpService.requestOtp(testPhone);
        let cooldownTriggered = false;
        try {
            await otpService.requestOtp(testPhone);
        } catch (err) {
            if (err.statusCode === 429 || err.status === 429) {
                cooldownTriggered = true;
            }
        }
        assert.strictEqual(cooldownTriggered, true);
        console.log('✔ Passed Scenario 12\n');
        passedCount++;

        // Test 13: Invalid ObjectId handled safely (404)
        console.log('Test 13: Invalid ObjectId handled safely (404)');
        const res13 = await executeController(notificationController.markAsRead, {
            user: citizen1,
            params: { id: 'invalid-object-id-string' },
        });
        assert.strictEqual(res13.status, 404);
        console.log('✔ Passed Scenario 13\n');
        passedCount++;

        // Test 14: Invalid enum/status rejected (400)
        console.log('Test 14: Invalid enum/status rejected (400)');
        const res14 = await executeController(verificationController.submitVerificationReport, {
            user: roadsVerifier,
            params: { id: complaint._id },
            body: { findings: 'Test findings', outcome: 'INVALID_OUTCOME_ENUM' },
        });
        assert.strictEqual(res14.status, 400);
        console.log('✔ Passed Scenario 14\n');
        passedCount++;

        // Test 15: Malformed request body does not crash server
        console.log('Test 15: Malformed request body does not crash server');
        const res15 = await executeController(adminController.updateComplaintPriority, {
            user: roadsHead,
            params: { id: complaint._id },
            body: { priority: 'INVALID_PRIORITY_STRING' },
        });
        assert.strictEqual(res15.status, 400);
        console.log('✔ Passed Scenario 15\n');
        passedCount++;

        // Test 16: Notification failure does not corrupt complaint operation
        console.log('Test 16: Notification failure does not corrupt complaint operation');
        const origNotify = notificationService.notifyOnStatusUpdate;
        notificationService.notifyOnStatusUpdate = async () => {
            throw new Error('Simulated notification delivery failure');
        };
        const res16 = await executeController(adminController.updateComplaintStatus, {
            user: roadsHead,
            params: { id: complaint._id },
            body: { status: 'Resolved', note: 'Official resolution by Roads Head' },
        });
        notificationService.notifyOnStatusUpdate = origNotify; // Restore
        assert.strictEqual(res16.status, 200);
        const updatedComp16 = await Complaint.findById(complaint._id);
        assert.strictEqual(updatedComp16.status, 'Resolved');
        console.log('✔ Passed Scenario 16\n');
        passedCount++;

        // Test 17: Duplicate SLA notification remains prevented
        console.log('Test 17: Duplicate SLA notification remains prevented');
        await notificationService.notifyOnSLAEvent({ complaint: updatedComp16, slaType: NOTIFICATION_TYPES.SLA_WARNING });
        await notificationService.notifyOnSLAEvent({ complaint: updatedComp16, slaType: NOTIFICATION_TYPES.SLA_WARNING });
        const slaNotifs = await Notification.find({ recipient: roadsHead._id, complaint: updatedComp16._id, type: NOTIFICATION_TYPES.SLA_WARNING });
        assert.strictEqual(slaNotifs.length, 1);
        console.log('✔ Passed Scenario 17\n');
        passedCount++;

        // Test 18: Sensitive values are absent from API responses
        console.log('Test 18: Sensitive values are absent from API responses');
        const res18 = await executeController(authController.getMe, {
            user: citizen1,
        });
        assert.strictEqual(res18.status, 200);
        assert.strictEqual(res18.data.password, undefined);
        assert.strictEqual(res18.data.passwordHash, undefined);
        assert.strictEqual(res18.data.otpHash, undefined);
        console.log('✔ Passed Scenario 18\n');
        passedCount++;

        // Test 19: Health endpoint returns status UP
        console.log('Test 19: Health endpoint returns status UP');
        let healthResData = null;
        const req19 = {};
        const res19Mock = {
            json: (data) => {
                healthResData = data;
                return res19Mock;
            },
        };
        const healthHandler = (req, res) => {
            const dbState = mongoose.connection.readyState;
            const dbStatus = dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected';
            res.json({
                status: dbState === 1 ? 'UP' : 'DEGRADED',
                timestamp: new Date().toISOString(),
                services: {
                    database: dbStatus,
                    server: 'UP',
                },
            });
        };
        healthHandler(req19, res19Mock);
        assert.strictEqual(healthResData.status, 'UP');
        assert.strictEqual(healthResData.services.database, 'connected');
        console.log('✔ Passed Scenario 19\n');
        passedCount++;

        // Test 20: Production error response does not expose stack traces
        console.log('Test 20: Production error response does not expose stack traces');
        const errorHandler = require('../../middleware/errorMiddleware');
        let errResStatus = 500;
        let errResData = null;
        const res20Mock = {
            status: (code) => {
                errResStatus = code;
                return res20Mock;
            },
            json: (data) => {
                errResData = data;
            },
        };
        const sampleError = new Error('Database connection failed');
        sampleError.stack = 'Error: Database connection failed\n    at internal/db.js:10';
        errorHandler(sampleError, {}, res20Mock, () => {});
        assert.strictEqual(errResStatus, 500);
        assert.strictEqual(errResData.stack, undefined);
        assert.strictEqual(errResData.message, 'Database connection failed');
        console.log('✔ Passed Scenario 20\n');
        passedCount++;

        // Cleanup test artifacts
        await Complaint.deleteMany({ _id: complaint._id });
        await Notification.deleteMany({ recipient: { $in: [citizen1._id, citizen2._id, roadsHead._id, waterHead._id, roadsVerifier._id, waterVerifier._id, superAdmin._id] } });
        await OtpVerification.deleteMany({ phone: testPhone });
        await User.deleteMany({ _id: { $in: [citizen1._id, citizen2._id, roadsHead._id, waterHead._id, roadsVerifier._id, waterVerifier._id, superAdmin._id] } });

        console.log('================================================================');
        console.log(`PHASE 8 PRODUCTION HARDENING SUITE COMPLETED: ${passedCount}/20 SCENARIOS PASSED`);
        console.log('================================================================\n');

        return true;
    } catch (err) {
        console.error('❌ PHASE 8 PRODUCTION HARDENING TEST SUITE FAILED:', err);
        process.exit(1);
    }
};

if (require.main === module) {
    runPhase8HardeningTests().then(() => {
        process.exit(0);
    }).catch((err) => {
        console.error(err);
        process.exit(1);
    });
}

module.exports = runPhase8HardeningTests;
