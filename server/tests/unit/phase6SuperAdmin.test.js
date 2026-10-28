/**
 * Phase 6: Super Admin Monitoring, Analytics & Operational Intelligence Test Suite
 * Verifies global read-only monitoring, analytics endpoints, SLA & ageing, verifier monitoring,
 * lifecycle accumulation, citizen confirmation & reopen analytics, strict 403 write protection for Super Admin,
 * phone privacy enforcement, and role-based analytics access isolation.
 */
const assert = require('assert');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const User = require('../../models/User');
const Complaint = require('../../models/Complaint');
const Department = require('../../models/Department');
const { DEFAULT_DEPARTMENTS } = require('../../config/departmentConfig');

const adminController = require('../../controllers/adminController');
const analyticsController = require('../../controllers/analyticsController');
const departmentDashboardController = require('../../controllers/departmentDashboardController');
const verificationController = require('../../controllers/verificationController');
const complaintController = require('../../controllers/complaintController');
const { sanitizePhonePrivacy } = require('../../middleware/phonePrivacyMiddleware');

const executeController = (controllerFn, req) => {
    return new Promise((resolve) => {
        let resStatus = 200;
        let resData = null;
        let res = {
            status: (code) => { resStatus = code; return res; },
            json: (data) => {
                resData = data;
                resolve({ status: resStatus, data: resData });
                return res;
            }
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

const runPhase6SuperAdminTests = async () => {
    console.log('================================================================');
    console.log('STARTING PHASE 6: SUPER ADMIN MONITORING & ANALYTICS TEST SUITE');
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
                await new Promise(r => setTimeout(r, 2000));
            }
        }
        if (!connected) {
            throw new Error('Failed to connect to MongoDB Atlas after 3 attempts');
        }

        // Setup Test Users
        const timestamp = Date.now();

        // 1. Super Admin User
        const superAdminUser = await User.create({
            name: `Phase6 SuperAdmin ${timestamp}`,
            email: `p6superadmin_${timestamp}@civicfix.org`,
            password: 'Password123!',
            role: 'super_admin',
        });

        // 2. Department Head Users
        const roadsHead = await User.create({
            name: `Phase6 Roads Head ${timestamp}`,
            email: `p6roadshead_${timestamp}@civicfix.org`,
            password: 'Password123!',
            role: 'department_head',
            departmentCode: 'ROADS',
        });

        const waterHead = await User.create({
            name: `Phase6 Water Head ${timestamp}`,
            email: `p6waterhead_${timestamp}@civicfix.org`,
            password: 'Password123!',
            role: 'department_head',
            departmentCode: 'WATER',
        });

        // 3. Verifier User
        const roadsVerifier = await User.create({
            name: `Phase6 Roads Verifier ${timestamp}`,
            email: `p6roadsverifier_${timestamp}@civicfix.org`,
            password: 'Password123!',
            role: 'verifier',
            departmentCode: 'ROADS',
        });

        // 4. Citizen User with Phone Number
        const citizenUser = await User.create({
            name: `Phase6 Citizen ${timestamp}`,
            email: `p6citizen_${timestamp}@civicfix.org`,
            phone: `+9198765${timestamp.toString().slice(-5)}`,
            password: 'Password123!',
            role: 'citizen',
        });

        // Setup Test Complaints across departments
        const complaint1 = await Complaint.create({
            complaintId: `CMP6A${timestamp.toString().slice(-5)}`,
            user: citizenUser._id,
            title: 'Deep Pothole on Main Street',
            description: 'Hazardous deep pothole causing traffic slowdown.',
            category: 'Roads & Footpaths',
            subcategory: 'Pothole',
            severity: 'High',
            priority: 'High',
            departmentCode: 'ROADS',
            assignedDepartment: 'Roads & Footpaths',
            status: 'Assigned',
            assignedTo: roadsVerifier._id,
            assignedBy: roadsHead._id,
            assignedAt: new Date(),
            latitude: 28.6139,
            longitude: 77.2090,
            location: 'Main Street, Block A',
        });

        const complaint2 = await Complaint.create({
            complaintId: `CMP6B${timestamp.toString().slice(-5)}`,
            user: citizenUser._id,
            title: 'Water Pipe Leakage at Sector 4',
            description: 'Major water pipeline leak flooding the road.',
            category: 'Water Supply',
            subcategory: 'Pipe Leakage',
            severity: 'Critical',
            priority: 'Critical',
            departmentCode: 'WATER',
            assignedDepartment: 'Water Supply',
            status: 'Resolved',
            assignedBy: waterHead._id,
            assignedAt: new Date(),
            reopenCount: 1,
            citizenVerification: {
                verified: false,
                feedback: 'Leak still leaking after repair.',
                verifiedAt: new Date(),
            },
            latitude: 28.6200,
            longitude: 77.2100,
            location: 'Sector 4 Junction',
        });

        // Test 1: Super Admin can access global overview analytics
        console.log('Test 1: Super Admin can access global overview analytics');
        const res1 = await executeController(analyticsController.getOverview, {
            user: superAdminUser,
            query: {},
        });
        assert.strictEqual(res1.status, 200);
        assert.strictEqual(typeof res1.data.total, 'number');
        assert.strictEqual(typeof res1.data.open, 'number');
        assert.strictEqual(typeof res1.data.resolutionRate, 'number');
        assert.strictEqual(typeof res1.data.reopenRate, 'number');
        console.log('✔ Passed Scenario 1\n');
        passedCount++;

        // Test 2: Super Admin can access department analytics
        console.log('Test 2: Super Admin can access department performance matrix');
        const res2 = await executeController(analyticsController.getDepartments, {
            user: superAdminUser,
            query: {},
        });
        assert.strictEqual(res2.status, 200);
        assert.strictEqual(Array.isArray(res2.data), true);
        assert.strictEqual(res2.data.length, 6); // All 6 departments present
        console.log('✔ Passed Scenario 2\n');
        passedCount++;

        // Test 3: Super Admin can access lifecycle analytics
        console.log('Test 3: Super Admin can access complaint lifecycle analytics');
        const res3 = await executeController(analyticsController.getLifecycle, {
            user: superAdminUser,
            query: {},
        });
        assert.strictEqual(res3.status, 200);
        assert.strictEqual(typeof res3.data.counts, 'object');
        assert.strictEqual(Array.isArray(res3.data.stages), true);
        console.log('✔ Passed Scenario 3\n');
        passedCount++;

        // Test 4: Super Admin can access reopen analytics
        console.log('Test 4: Super Admin can access reopen analytics');
        const res4 = await executeController(analyticsController.getReopen, {
            user: superAdminUser,
            query: {},
        });
        assert.strictEqual(res4.status, 200);
        assert.strictEqual(typeof res4.data.reopenedCount, 'number');
        assert.strictEqual(typeof res4.data.reopenRate, 'number');
        console.log('✔ Passed Scenario 4\n');
        passedCount++;

        // Test 5: Super Admin can access verifier monitoring
        console.log('Test 5: Super Admin can access verifier operations monitoring');
        const res5 = await executeController(analyticsController.getVerifiers, {
            user: superAdminUser,
            query: {},
        });
        assert.strictEqual(res5.status, 200);
        assert.strictEqual(typeof res5.data.totalActiveVerifiers, 'number');
        assert.strictEqual(Array.isArray(res5.data.verifiers), true);
        console.log('✔ Passed Scenario 5\n');
        passedCount++;

        // Test 6: Super Admin can access trend analytics
        console.log('Test 6: Super Admin can access time-series trend analytics');
        const res6 = await executeController(analyticsController.getTrends, {
            user: superAdminUser,
            query: { interval: 'daily' },
        });
        assert.strictEqual(res6.status, 200);
        assert.strictEqual(Array.isArray(res6.data.timeSeries), true);
        console.log('✔ Passed Scenario 6\n');
        passedCount++;

        // Test 7: Super Admin can inspect complaints globally
        console.log('Test 7: Super Admin can inspect all complaints globally');
        const res7 = await executeController(adminController.getAllComplaints, {
            user: superAdminUser,
            query: {},
        });
        assert.strictEqual(res7.status, 200);
        assert.strictEqual(Array.isArray(res7.data), true);
        assert.strictEqual(res7.data.length >= 2, true);
        console.log('✔ Passed Scenario 7\n');
        passedCount++;

        // Test 8: Super Admin CANNOT change complaint status (returns 403)
        console.log('Test 8: Super Admin cannot change complaint status');
        const res8 = await executeController(adminController.updateComplaintStatus, {
            user: superAdminUser,
            params: { id: complaint1._id },
            body: { status: 'Resolved', note: 'Attempt by Super Admin' },
        });
        assert.strictEqual(res8.status, 403);
        assert.strictEqual(res8.data.message.includes('Super Admin is monitor-only'), true);
        console.log('✔ Passed Scenario 8\n');
        passedCount++;

        // Test 9: Super Admin CANNOT assign verifier (returns 403)
        console.log('Test 9: Super Admin cannot assign verifier');
        const res9 = await executeController(departmentDashboardController.assignComplaintToStaff, {
            user: superAdminUser,
            body: { complaintId: complaint1._id, staffId: roadsVerifier._id },
        });
        assert.strictEqual(res9.status, 403);
        assert.strictEqual(res9.data.message.includes('Super Admin is monitor-only'), true);
        console.log('✔ Passed Scenario 9\n');
        passedCount++;

        // Test 10: Super Admin CANNOT reassign verifier (returns 403)
        console.log('Test 10: Super Admin cannot reassign verifier');
        const res10 = await executeController(departmentDashboardController.assignComplaintToStaff, {
            user: superAdminUser,
            body: { complaintId: complaint1._id, staffId: roadsVerifier._id, reason: 'Reassign attempt' },
        });
        assert.strictEqual(res10.status, 403);
        assert.strictEqual(res10.data.message.includes('Super Admin is monitor-only'), true);
        console.log('✔ Passed Scenario 10\n');
        passedCount++;

        // Test 11: Super Admin CANNOT unassign verifier (returns 403)
        console.log('Test 11: Super Admin cannot unassign verifier');
        const res11 = await executeController(departmentDashboardController.assignComplaintToStaff, {
            user: superAdminUser,
            body: { complaintId: complaint1._id, action: 'unassign' },
        });
        assert.strictEqual(res11.status, 403);
        assert.strictEqual(res11.data.message.includes('Super Admin is monitor-only'), true);
        console.log('✔ Passed Scenario 11\n');
        passedCount++;

        // Test 12: Super Admin CANNOT modify verifier report (returns 403)
        console.log('Test 12: Super Admin cannot submit/modify verifier report');
        const res12 = await executeController(verificationController.submitVerificationReport, {
            user: superAdminUser,
            params: { id: complaint1._id },
            body: { findings: 'Attempted report by super admin', outcome: 'VERIFIED_CONFIRMED' },
        });
        assert.strictEqual(res12.status, 403);
        assert.strictEqual(res12.data.message.includes('Super Admin is monitor-only'), true);
        console.log('✔ Passed Scenario 12\n');
        passedCount++;

        // Test 13: Super Admin CANNOT reopen complaint (returns 403)
        console.log('Test 13: Super Admin cannot reopen complaint');
        const res13 = await executeController(complaintController.reopenComplaint, {
            user: superAdminUser,
            params: { id: complaint2._id },
            body: { reason: 'Super Admin reopen attempt' },
        });
        assert.strictEqual(res13.status, 403);
        assert.strictEqual(res13.data.message.includes('Super Admin is monitor-only'), true);
        console.log('✔ Passed Scenario 13\n');
        passedCount++;

        // Test 14: Super Admin CANNOT close complaint directly via status change (returns 403)
        console.log('Test 14: Super Admin cannot close complaint');
        const res14 = await executeController(adminController.updateComplaintStatus, {
            user: superAdminUser,
            params: { id: complaint1._id },
            body: { status: 'Closed' },
        });
        assert.strictEqual(res14.status, 403);
        assert.strictEqual(res14.data.message.includes('Super Admin is monitor-only'), true);
        console.log('✔ Passed Scenario 14\n');
        passedCount++;

        // Test 15: Super Admin CANNOT modify citizen confirmation (returns 403)
        console.log('Test 15: Super Admin cannot modify citizen confirmation');
        const res15 = await executeController(complaintController.verifyResolution, {
            user: superAdminUser,
            params: { id: complaint2._id },
            body: { verified: true, feedback: 'Super admin confirmation attempt' },
        });
        assert.strictEqual(res15.status, 403);
        assert.strictEqual(res15.data.message.includes('Super Admin is monitor-only'), true);
        console.log('✔ Passed Scenario 15\n');
        passedCount++;

        // Test 16: Super Admin CANNOT modify complaint data (returns 403)
        console.log('Test 16: Super Admin cannot edit complaint parameters');
        const res16 = await executeController(adminController.updateComplaint, {
            user: superAdminUser,
            params: { id: complaint1._id },
            body: { title: 'Modified by Super Admin' },
        });
        assert.strictEqual(res16.status, 403);
        assert.strictEqual(res16.data.message.includes('Super Admin is monitor-only'), true);
        console.log('✔ Passed Scenario 16\n');
        passedCount++;

        // Test 17: Super Admin CANNOT receive citizen phone numbers (phone is stripped)
        console.log('Test 17: Super Admin cannot receive citizen phone numbers');
        const citizenDoc = await User.findById(citizenUser._id).lean();
        assert.strictEqual(!!citizenDoc.phone, true); // Phone exists in DB

        const sanitizedForSuperAdmin = sanitizePhonePrivacy({ user: citizenDoc }, superAdminUser);
        assert.strictEqual(sanitizedForSuperAdmin.user.phone, undefined); // Phone stripped for Super Admin

        const sanitizedForCitizen = sanitizePhonePrivacy(citizenDoc, citizenUser);
        assert.strictEqual(sanitizedForCitizen.phone, citizenUser.phone); // Citizen sees own phone
        console.log('✔ Passed Scenario 17\n');
        passedCount++;

        // Test 18: Citizen CANNOT access Super Admin global analytics
        console.log('Test 18: Citizen cannot access Super Admin analytics');
        const { requireRoles } = require('../../middleware/roleMiddleware');
        let citizenAccessBlocked = false;
        const fakeReq = { user: citizenUser };
        const fakeRes = {
            status: (code) => {
                if (code === 403) citizenAccessBlocked = true;
                return fakeRes;
            },
            json: () => {},
        };
        const roleChecker = requireRoles('super_admin', 'admin');
        roleChecker(fakeReq, fakeRes, (err) => {
            if (err && (err.statusCode === 403 || err.status === 403)) {
                citizenAccessBlocked = true;
            }
        });
        assert.strictEqual(citizenAccessBlocked, true);
        console.log('✔ Passed Scenario 18\n');
        passedCount++;

        // Test 19: Verifier CANNOT access Super Admin global analytics
        console.log('Test 19: Verifier cannot access Super Admin analytics');
        let verifierAccessBlocked = false;
        const fakeReqVerifier = { user: roadsVerifier };
        const fakeResVerifier = {
            status: (code) => {
                if (code === 403) verifierAccessBlocked = true;
                return fakeResVerifier;
            },
            json: () => {},
        };
        roleChecker(fakeReqVerifier, fakeResVerifier, (err) => {
            if (err && (err.statusCode === 403 || err.status === 403)) {
                verifierAccessBlocked = true;
            }
        });
        assert.strictEqual(verifierAccessBlocked, true);
        console.log('✔ Passed Scenario 19\n');
        passedCount++;

        // Test 20: Department Head CANNOT access unrestricted global analytics (scoped by department)
        console.log('Test 20: Department Head is scoped and cannot access global analytics outside their department');
        const { enforceDepartmentScope } = require('../../middleware/roleMiddleware');
        const fakeReqDeptHead = { user: roadsHead, query: { departmentCode: 'WATER' } };
        let scopeEnforced = false;
        enforceDepartmentScope(fakeReqDeptHead, {}, () => {
            if (fakeReqDeptHead.query.departmentCode === 'ROADS') {
                scopeEnforced = true;
            }
        });
        assert.strictEqual(scopeEnforced, true);
        console.log('✔ Passed Scenario 20\n');
        passedCount++;

        // Test 21: Super Admin can access SLA & Ageing analytics
        console.log('Test 21: Super Admin can access SLA & Ageing analytics');
        const res21 = await executeController(analyticsController.getAgeing, {
            user: superAdminUser,
            query: {},
        });
        assert.strictEqual(res21.status, 200);
        assert.strictEqual(typeof res21.data.ageingBuckets, 'object');
        assert.strictEqual(Array.isArray(res21.data.longestPendingComplaints), true);
        console.log('✔ Passed Scenario 21\n');
        passedCount++;

        // Test 22: Super Admin cannot escalate complaint (returns 403)
        console.log('Test 22: Super Admin cannot manually escalate complaint');
        const res22 = await executeController(adminController.escalateComplaint, {
            user: superAdminUser,
            params: { id: complaint1._id },
            body: { reason: 'Escalation attempt by super admin' },
        });
        assert.strictEqual(res22.status, 403);
        assert.strictEqual(res22.data.message.includes('Super Admin is monitor-only'), true);
        console.log('✔ Passed Scenario 22\n');
        passedCount++;

        // Cleanup
        await Complaint.deleteMany({ _id: { $in: [complaint1._id, complaint2._id] } });
        await User.deleteMany({ _id: { $in: [superAdminUser._id, roadsHead._id, waterHead._id, roadsVerifier._id, citizenUser._id] } });

        console.log('================================================================');
        console.log(`PHASE 6 SUPER ADMIN TEST SUITE COMPLETED: ${passedCount}/22 SCENARIOS PASSED`);
        console.log('================================================================\n');

        return true;
    } catch (err) {
        console.error('❌ PHASE 6 SUPER ADMIN TEST SUITE FAILED:', err);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
};

if (require.main === module) {
    runPhase6SuperAdminTests();
}

module.exports = runPhase6SuperAdminTests;
