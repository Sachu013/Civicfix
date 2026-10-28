/**
 * Phase 5: Department Head Resolution Decision & Citizen Confirmation Test Suite
 * Validates complete resolution lifecycle, status history auditability, citizen confirmation/reopening,
 * multi-cycle reopening, intact verifier report retention, and strict 4-role RBAC boundaries.
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
const verificationController = require('../../controllers/verificationController');
const complaintService = require('../../services/complaintService');
const phonePrivacyMiddleware = require('../../middleware/phonePrivacyMiddleware');

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

const runPhase5ResolutionTests = async () => {
    console.log('================================================================');
    console.log('STARTING PHASE 5: DEPT HEAD RESOLUTION & CITIZEN CONFIRMATION SUITE');
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
                await new Promise(res => setTimeout(res, 2000));
            }
        }
        if (!connected) throw new Error('Failed to connect to MongoDB Atlas');
        console.log('✓ Connected to MongoDB Atlas successfully.\n');

        const ts = Date.now().toString().slice(-6);

        // Cleanup test accounts & complaints
        await User.deleteMany({ email: { $regex: /@phase5test\.com$/ } });
        await Complaint.deleteMany({ title: { $regex: /^Phase5 Test/ } });

        // Ensure 6 official departments exist
        for (const deptData of DEFAULT_DEPARTMENTS) {
            await Department.findOneAndUpdate(
                { code: deptData.code },
                { $set: deptData },
                { upsert: true, new: true }
            );
        }

        // Create Test Accounts
        const roadsHead = await User.create({
            name: 'Roads Head Phase5',
            email: `roads_head_${ts}@phase5test.com`,
            phone: `+918000${ts}1`,
            role: 'department_head',
            departmentCode: 'ROADS',
            isPhoneVerified: true
        });

        const waterHead = await User.create({
            name: 'Water Head Phase5',
            email: `water_head_${ts}@phase5test.com`,
            phone: `+918000${ts}2`,
            role: 'department_head',
            departmentCode: 'WATER',
            isPhoneVerified: true
        });

        const verifier = await User.create({
            name: 'Roads Verifier Phase5',
            email: `verifier_${ts}@phase5test.com`,
            phone: `+918000${ts}3`,
            role: 'verifier',
            departmentCode: 'ROADS',
            isPhoneVerified: true
        });

        const superAdmin = await User.create({
            name: 'Super Admin Phase5',
            email: `superadmin_${ts}@phase5test.com`,
            phone: `+918000${ts}4`,
            role: 'super_admin',
            isPhoneVerified: true
        });

        const citizen1 = await User.create({
            name: 'Citizen 1 Owner',
            email: `citizen1_${ts}@phase5test.com`,
            phone: `+918000${ts}5`,
            role: 'citizen',
            isPhoneVerified: true
        });

        const citizen2 = await User.create({
            name: 'Citizen 2 Intruder',
            email: `citizen2_${ts}@phase5test.com`,
            phone: `+918000${ts}6`,
            role: 'citizen',
            isPhoneVerified: true
        });

        // Create Test Complaint
        let testComplaint = await Complaint.create({
            complaintId: `P5-${ts}-1`,
            user: citizen1._id,
            title: 'Phase5 Test Road Damage Pothole',
            description: 'Severe pothole damaging vehicles on 5th avenue.',
            category: 'roads_transportation',
            subcategory: 'pothole',
            assignedDepartment: 'Roads & Infrastructure',
            departmentCode: 'ROADS',
            assignedTo: verifier._id,
            assignedBy: roadsHead._id,
            assignedAt: new Date(),
            location: '5th Ave & Market St',
            status: 'Assigned',
            priority: 'High',
            severity: 'High',
            verificationState: 'UNVERIFIED'
        });

        // Verifier submits field report
        let req = {
            params: { id: testComplaint._id.toString() },
            user: { _id: verifier._id, role: 'verifier', departmentCode: 'ROADS' },
            body: {
                findings: 'Inspected 5th Ave pothole. Depth is ~12cm across 1.5m area.',
                outcome: 'VERIFIED_CONFIRMED',
                contactWithCitizen: true,
                citizenContactNotes: 'Called citizen, confirmed exact location near bank.',
                locationVerified: true,
                evidence: [{ url: 'https://res.cloudinary.com/mock/pothole.jpg', caption: 'Field photo' }]
            }
        };
        let res = await executeController(verificationController.submitVerificationReport, req);
        assert.strictEqual(res.status, 200);

        // --- TEST 1: Department Head can move complaint to In Progress ---
        console.log('--- TEST 1: Department Head can move complaint to In Progress ---');
        req = {
            params: { id: testComplaint._id.toString() },
            user: { _id: roadsHead._id, role: 'department_head', departmentCode: 'ROADS' },
            body: { status: 'In Progress', note: 'Road repair team dispatched with asphalt truck.' }
        };
        res = await executeController(adminController.updateComplaintStatus, req);
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.status, 'In Progress');
        console.log('✓ TEST 1 PASSED: Department Head moved complaint to In Progress.');
        passedCount++;

        // --- TEST 2 & 3: Department Head marks complaint Resolved -> Enters Citizen Verification ---
        console.log('\n--- TEST 2 & 3: Dept Head marks Resolved -> Complaint Enters Citizen Verification ---');
        req = {
            params: { id: testComplaint._id.toString() },
            user: { _id: roadsHead._id, role: 'department_head', departmentCode: 'ROADS' },
            body: { status: 'Resolved', note: 'Asphalt paving completed', resolutionNote: 'Pothole filled and sealed.' }
        };
        res = await executeController(adminController.updateComplaintStatus, req);
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.status, 'Resolved');
        assert.strictEqual(res.data.resolution.resolutionNote, 'Pothole filled and sealed.');
        console.log('✓ TEST 2 & 3 PASSED: Dept Head set status to Resolved (awaiting citizen confirmation).');
        passedCount++;

        // --- TEST 4: Citizen can see pending resolution ---
        console.log('\n--- TEST 4: Citizen can see pending resolution on track endpoint ---');
        const tracked = await complaintService.trackComplaint(testComplaint.complaintId);
        assert.strictEqual(tracked.status, 'Resolved');
        assert.ok(tracked.resolution.resolutionNote);
        console.log('✓ TEST 4 PASSED: Citizen sees pending resolution details.');
        passedCount++;

        // --- TEST 5, 6 & 7: Citizen confirms resolution -> Status becomes Closed ---
        console.log('\n--- TEST 5, 6 & 7: Citizen confirms resolution -> Status becomes Closed & logged ---');
        let confirmed = await complaintService.verifyResolution(testComplaint._id, citizen1._id, {
            verified: true,
            feedback: 'Road is completely smooth now. Excellent job!'
        });
        assert.strictEqual(confirmed.status, 'Closed');
        assert.strictEqual(confirmed.citizenVerification.verified, true);
        assert.strictEqual(confirmed.citizenVerification.feedback, 'Road is completely smooth now. Excellent job!');
        const lastHist = confirmed.statusHistory[confirmed.statusHistory.length - 1];
        assert.strictEqual(lastHist.newStatus, 'Closed');
        assert.strictEqual(lastHist.changedBy.toString(), citizen1._id.toString());
        console.log('✓ TEST 5, 6 & 7 PASSED: Citizen confirmation closed complaint and logged history entry.');
        passedCount++;

        // --- TEST 8, 9, 10 & 11: Citizen rejects/reopens resolution ---
        console.log('\n--- TEST 8, 9, 10 & 11: Citizen rejects resolution -> Status becomes Reopened ---');
        let reopened = await complaintService.verifyResolution(testComplaint._id, citizen1._id, {
            verified: false,
            feedback: 'Asphalt cracked again after rain overnight.'
        });
        assert.strictEqual(reopened.status, 'Reopened');
        assert.strictEqual(reopened.citizenVerification.verified, false);
        assert.strictEqual(reopened.reopenCount, 1);
        assert.ok(reopened.statusHistory.length >= 4, 'Full status history must be preserved');
        assert.strictEqual(reopened.citizenVerification.feedback, 'Asphalt cracked again after rain overnight.');
        console.log('✓ TEST 8, 9, 10 & 11 PASSED: Reopening incremented reopenCount, preserved history, and stored feedback.');
        passedCount++;

        // --- TEST 12: Reopened complaint returns to Department Head workflow ---
        console.log('\n--- TEST 12: Reopened complaint returns to Department Head workflow ---');
        const deptQueue = await Complaint.find({ _id: testComplaint._id, departmentCode: 'ROADS', status: 'Reopened' });
        assert.strictEqual(deptQueue.length, 1);
        assert.strictEqual(deptQueue[0]._id.toString(), testComplaint._id.toString());
        console.log('✓ TEST 12 PASSED: Reopened complaint visible in Department Head queue.');
        passedCount++;

        // --- TEST 13: Verifier cannot change official status ---
        console.log('\n--- TEST 13: Verifier cannot change official status ---');
        req = {
            params: { id: testComplaint._id.toString() },
            user: { _id: verifier._id, role: 'verifier', departmentCode: 'ROADS' },
            body: { status: 'Resolved' }
        };
        res = await executeController(adminController.updateComplaintStatus, req);
        assert.strictEqual(res.status, 403);
        assert.strictEqual(res.data.message, 'Forbidden: Verifiers are not authorized to update official complaint status');
        console.log('✓ TEST 13 PASSED: Verifier status update blocked with 403 Forbidden.');
        passedCount++;

        // --- TEST 14: Super Admin cannot change official status ---
        console.log('\n--- TEST 14: Super Admin cannot change official status ---');
        req = {
            params: { id: testComplaint._id.toString() },
            user: { _id: superAdmin._id, role: 'super_admin' },
            body: { status: 'Resolved' }
        };
        res = await executeController(adminController.updateComplaintStatus, req);
        assert.strictEqual(res.status, 403);
        assert.strictEqual(res.data.message, 'Super Admin is monitor-only. Super Admin cannot change official complaint status.');
        console.log('✓ TEST 14 PASSED: Super Admin status update blocked with 403 Forbidden.');
        passedCount++;

        // --- TEST 15: Citizen cannot modify another citizen's complaint ---
        console.log('\n--- TEST 15: Citizen cannot modify another citizen\'s complaint ---');
        try {
            await complaintService.verifyResolution(testComplaint._id, citizen2._id, { verified: true });
            assert.fail('Intruder citizen should have been blocked');
        } catch (err) {
            assert.strictEqual(err.statusCode, 403);
            assert.strictEqual(err.message, 'Not authorized to verify this complaint');
        }
        console.log('✓ TEST 15 PASSED: Cross-citizen verification attempt blocked with 403 Forbidden.');
        passedCount++;

        // --- TEST 16: Department Head cannot modify another department\'s complaint ---
        console.log('\n--- TEST 16: Dept Head cannot modify another department\'s complaint ---');
        req = {
            params: { id: testComplaint._id.toString() },
            user: { _id: waterHead._id, role: 'department_head', departmentCode: 'WATER' },
            body: { status: 'In Progress' }
        };
        res = await executeController(adminController.updateComplaintStatus, req);
        assert.strictEqual(res.status, 403);
        console.log('✓ TEST 16 PASSED: Cross-department status change blocked with 403 Forbidden.');
        passedCount++;

        // --- TEST 17: Previous verifier reports remain intact after reopening ---
        console.log('\n--- TEST 17: Previous verifier reports remain intact after reopening ---');
        const recheckComplaint = await Complaint.findById(testComplaint._id);
        assert.ok(recheckComplaint.verificationReport);
        assert.strictEqual(recheckComplaint.verificationReport.outcome, 'VERIFIED_CONFIRMED');
        assert.strictEqual(recheckComplaint.verificationReport.findings, 'Inspected 5th Ave pothole. Depth is ~12cm across 1.5m area.');
        assert.strictEqual(recheckComplaint.verificationReport.evidence.length, 1);
        console.log('✓ TEST 17 PASSED: Verification report and evidence remains 100% intact after reopening.');
        passedCount++;

        // --- TEST 18: Multiple reopen cycles work correctly ---
        console.log('\n--- TEST 18: Multiple reopen cycles work correctly ---');
        // Cycle 2: Dept Head moves to In Progress -> Resolved -> Citizen rejects again
        req = {
            params: { id: testComplaint._id.toString() },
            user: { _id: roadsHead._id, role: 'department_head', departmentCode: 'ROADS' },
            body: { status: 'In Progress', note: 'Second repair attempt' }
        };
        await executeController(adminController.updateComplaintStatus, req);

        req = {
            params: { id: testComplaint._id.toString() },
            user: { _id: roadsHead._id, role: 'department_head', departmentCode: 'ROADS' },
            body: { status: 'Resolved', note: 'Second repair completed' }
        };
        await executeController(adminController.updateComplaintStatus, req);

        const cycle2Reopened = await complaintService.verifyResolution(testComplaint._id, citizen1._id, {
            verified: false,
            feedback: 'Cycle 2 rejection: Heavy truck caused hole to sink again.'
        });
        assert.strictEqual(cycle2Reopened.status, 'Reopened');
        assert.strictEqual(cycle2Reopened.reopenCount, 2);
        assert.ok(cycle2Reopened.statusHistory.length >= 7, 'All status history entries across cycles must accumulate');

        // Cycle 3: Dept Head moves to Resolved -> Citizen confirms final fix
        req = {
            params: { id: testComplaint._id.toString() },
            user: { _id: roadsHead._id, role: 'department_head', departmentCode: 'ROADS' },
            body: { status: 'Resolved', note: 'Final heavy-duty concrete repair' }
        };
        await executeController(adminController.updateComplaintStatus, req);

        const cycle3Closed = await complaintService.verifyResolution(testComplaint._id, citizen1._id, {
            verified: true,
            feedback: 'Final concrete repair holds strong. Approved.'
        });
        assert.strictEqual(cycle3Closed.status, 'Closed');
        assert.strictEqual(cycle3Closed.reopenCount, 2);
        assert.strictEqual(cycle3Closed.citizenVerification.verified, true);
        console.log('✓ TEST 18 PASSED: Multiple reopen cycles (3 cycles) executed cleanly without data corruption.');
        passedCount++;

        // Cleanup test data
        await User.deleteMany({ email: { $regex: /@phase5test\.com$/ } });
        await Complaint.deleteMany({ title: { $regex: /^Phase5 Test/ } });

        console.log('\n================================================================');
        console.log(`PHASE 5 RESOLUTION TEST SUITE PASSED: ${passedCount} / 18 SCENARIOS OK`);
        console.log('================================================================\n');

    } catch (err) {
        console.error('❌ PHASE 5 RESOLUTION TEST FAILED:', err);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
};

runPhase5ResolutionTests();
