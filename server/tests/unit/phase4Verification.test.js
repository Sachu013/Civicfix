/**
 * Phase 4: Verifier Investigation + Evidence + Verification Report Workflow Test Suite
 * Tests 4 roles, 6 operational departments, 4-tier authorization checks,
 * status protection ("VERIFIER REPORTS. DEPARTMENT HEAD DECIDES."),
 * report submission, evidence upload, duplicate report prevention,
 * Department Head review, Super Admin monitor-only, and phone privacy compliance.
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
const verificationController = require('../../controllers/verificationController');
const adminController = require('../../controllers/adminController');
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

const runPhase4VerificationTests = async () => {
    console.log('================================================================');
    console.log('STARTING PHASE 4: VERIFIER INVESTIGATION & REPORT WORKFLOW TEST SUITE');
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
        if (!connected) throw new Error('Failed to connect to MongoDB Atlas after 3 retries');
        console.log('✓ Connected to MongoDB Atlas successfully.\n');

        const ts = Date.now().toString().slice(-6);

        // Cleanup test data
        await User.deleteMany({ email: { $regex: /@phase4test\.com$/ } });
        await Complaint.deleteMany({ title: { $regex: /^Phase4 Test/ } });

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
            name: 'Roads Dept Head',
            email: `roads_head_${ts}@phase4test.com`,
            phone: `+917000${ts}1`,
            role: 'department_head',
            departmentCode: 'ROADS',
            isPhoneVerified: true
        });

        const assignedVerifier = await User.create({
            name: 'Assigned Roads Verifier',
            email: `verifier_assigned_${ts}@phase4test.com`,
            phone: `+917000${ts}2`,
            role: 'verifier',
            departmentCode: 'ROADS',
            isPhoneVerified: true
        });

        const unassignedVerifier = await User.create({
            name: 'Unassigned Roads Verifier',
            email: `verifier_unassigned_${ts}@phase4test.com`,
            phone: `+917000${ts}3`,
            role: 'verifier',
            departmentCode: 'ROADS',
            isPhoneVerified: true
        });

        const waterVerifier = await User.create({
            name: 'Water Dept Verifier',
            email: `verifier_water_${ts}@phase4test.com`,
            phone: `+917000${ts}4`,
            role: 'verifier',
            departmentCode: 'WATER',
            isPhoneVerified: true
        });

        const superAdmin = await User.create({
            name: 'Super Admin Oversight',
            email: `superadmin_${ts}@phase4test.com`,
            phone: `+917000${ts}5`,
            role: 'super_admin',
            isPhoneVerified: true
        });

        const citizen = await User.create({
            name: 'Phase 4 Citizen Reporter',
            email: `citizen_${ts}@phase4test.com`,
            phone: `+917000${ts}6`,
            role: 'citizen',
            isPhoneVerified: true
        });

        // Create Test Complaint assigned to assignedVerifier
        const testComplaint = await Complaint.create({
            complaintId: `P4-${ts}-1`,
            user: citizen._id,
            title: 'Phase4 Test Street Lighting Outage',
            description: 'Street light broken on Main Street corner',
            category: 'electrical_lighting',
            subcategory: 'street_light_outage',
            assignedDepartment: 'Roads & Infrastructure',
            departmentCode: 'ROADS',
            assignedTo: assignedVerifier._id,
            assignedBy: roadsHead._id,
            assignedAt: new Date(),
            location: 'Main St & 4th Ave',
            status: 'Assigned',
            priority: 'High',
            severity: 'High',
            verificationState: 'UNVERIFIED'
        });

        // --- TEST 1: Evidence Upload by Assigned Verifier ---
        console.log('--- TEST 1: Evidence Upload by Assigned Verifier ---');
        let req = {
            params: { id: testComplaint._id.toString() },
            user: { _id: assignedVerifier._id, role: 'verifier', departmentCode: 'ROADS' },
            files: [
                { buffer: Buffer.from('mock img 1'), path: '/mock/path/photo1.jpg', originalname: 'site_photo1.jpg', mimetype: 'image/jpeg', size: 102400 },
                { buffer: Buffer.from('mock img 2'), path: '/mock/path/photo2.jpg', originalname: 'site_photo2.jpg', mimetype: 'image/jpeg', size: 102400 }
            ]
        };

        let result = await executeController(verificationController.uploadEvidence, req);
        assert.strictEqual(result.status, 200, 'Evidence upload should return HTTP 200 OK');
        assert.strictEqual(result.data.success, true);
        assert.strictEqual(result.data.evidence.length, 2);
        console.log('✓ TEST 1 PASSED: Assigned Verifier successfully uploaded 2 evidence images.');
        passedCount++;

        // --- TEST 2: Evidence Upload Authorization Block (Unassigned Verifier) ---
        console.log('\n--- TEST 2: Evidence Upload Blocked for Unassigned Verifier ---');
        req = {
            params: { id: testComplaint._id.toString() },
            user: { _id: unassignedVerifier._id, role: 'verifier', departmentCode: 'ROADS' },
            files: [{ buffer: Buffer.from('mock img 3'), path: '/mock/path/photo3.jpg', originalname: 'photo3.jpg', mimetype: 'image/jpeg' }]
        };

        result = await executeController(verificationController.uploadEvidence, req);
        assert.strictEqual(result.status, 403, 'Unassigned verifier must be blocked with 403');
        assert.strictEqual(result.data.message, 'Forbidden: You can only upload evidence for complaints assigned to you');
        console.log('✓ TEST 2 PASSED: Evidence upload blocked with 403 Forbidden for unassigned verifier.');
        passedCount++;

        // --- TEST 3: Verification Report Submission by Assigned Verifier ---
        console.log('\n--- TEST 3: Verification Report Submission by Assigned Verifier ---');
        req = {
            params: { id: testComplaint._id.toString() },
            user: { _id: assignedVerifier._id, role: 'verifier', departmentCode: 'ROADS' },
            body: {
                findings: 'On-site inspection verified broken fixture and severed cable.',
                outcome: 'VERIFIED_CONFIRMED',
                contactWithCitizen: true,
                citizenContactNotes: 'Contacted citizen at 10 AM, confirmed exact lamp pole number #42.',
                locationVerified: true,
                evidence: [
                    { url: 'https://res.cloudinary.com/mock/image/upload/v1/evidence1.jpg', caption: 'Broken Fixture' }
                ]
            }
        };

        result = await executeController(verificationController.submitVerificationReport, req);
        assert.strictEqual(result.status, 200, 'Report submission should return HTTP 200 OK');
        assert.strictEqual(result.data.success, true);
        assert.strictEqual(result.data.complaint.verificationState, 'VERIFIED_CONFIRMED');
        assert.strictEqual(result.data.complaint.verificationReport.outcome, 'VERIFIED_CONFIRMED');
        assert.strictEqual(result.data.complaint.verificationReport.findings, req.body.findings);
        // Verify official complaint status remains unchanged ('Assigned')
        assert.strictEqual(result.data.complaint.status, 'Assigned', 'Official complaint status MUST remain Assigned');
        console.log('✓ TEST 3 PASSED: Report submitted; verificationState = VERIFIED_CONFIRMED; official status unchanged (Assigned).');
        passedCount++;

        // --- TEST 4: Duplicate Verification Report Submission Rejection ---
        console.log('\n--- TEST 4: Re-submitting Report Returns 400 Bad Request ---');
        result = await executeController(verificationController.submitVerificationReport, req);
        assert.strictEqual(result.status, 400, 'Re-submitting report should return 400');
        assert.strictEqual(result.data.message, 'Verification report has already been submitted for this complaint. Duplicate submission rejected.');
        console.log('✓ TEST 4 PASSED: Duplicate report submission blocked with 400 Bad Request.');
        passedCount++;

        // --- TEST 5: Status Protection ("VERIFIER REPORTS. DEPARTMENT HEAD DECIDES.") ---
        console.log('\n--- TEST 5: Verifier Direct Status Modification Blocked ---');
        req = {
            params: { id: testComplaint._id.toString() },
            user: { _id: assignedVerifier._id, role: 'verifier', departmentCode: 'ROADS' },
            body: { status: 'Resolved', note: 'Verifier attempting to resolve complaint directly' }
        };

        result = await executeController(adminController.updateComplaintStatus, req);
        assert.strictEqual(result.status, 403, 'Verifier updating status must return 403');
        assert.strictEqual(result.data.message, 'Forbidden: Verifiers are not authorized to update official complaint status');
        console.log('✓ TEST 5 PASSED: Verifier status update blocked with 403 Forbidden.');
        passedCount++;

        // --- TEST 6: Report Retrieval Endpoint Authorization ---
        console.log('\n--- TEST 6: Verification Report Retrieval Endpoint ---');
        // Assigned Verifier GET
        req = {
            params: { id: testComplaint._id.toString() },
            user: { _id: assignedVerifier._id, role: 'verifier', departmentCode: 'ROADS' }
        };
        result = await executeController(verificationController.getVerificationReport, req);
        assert.strictEqual(result.status, 200);
        assert.strictEqual(result.data.verificationState, 'VERIFIED_CONFIRMED');
        assert.strictEqual(result.data.verificationReport.findings, 'On-site inspection verified broken fixture and severed cable.');

        // Department Head GET
        req = {
            params: { id: testComplaint._id.toString() },
            user: { _id: roadsHead._id, role: 'department_head', departmentCode: 'ROADS' }
        };
        result = await executeController(verificationController.getVerificationReport, req);
        assert.strictEqual(result.status, 200);
        assert.strictEqual(result.data.verificationState, 'VERIFIED_CONFIRMED');

        // Super Admin GET
        req = {
            params: { id: testComplaint._id.toString() },
            user: { _id: superAdmin._id, role: 'super_admin' }
        };
        result = await executeController(verificationController.getVerificationReport, req);
        assert.strictEqual(result.status, 200);
        console.log('✓ TEST 6 PASSED: Report retrieval authorized for assigned verifier, dept head, and super admin.');
        passedCount++;

        // --- TEST 7: Cross-Department Verifier Report Access Blocked ---
        console.log('\n--- TEST 7: Cross-Department Verifier Report Access Blocked ---');
        req = {
            params: { id: testComplaint._id.toString() },
            user: { _id: waterVerifier._id, role: 'verifier', departmentCode: 'WATER' }
        };
        result = await executeController(verificationController.getVerificationReport, req);
        assert.strictEqual(result.status, 403);
        assert.strictEqual(result.data.message, 'Forbidden: You can only view complaints in your department');
        console.log('✓ TEST 7 PASSED: Cross-department verifier report access blocked with 403 Forbidden.');
        passedCount++;

        // --- TEST 8: Phone Privacy Rule for Verifier ---
        console.log('\n--- TEST 8: Phone Privacy Rule for Assigned vs Unassigned Requests ---');
        // Retrieve complaint populated with user phone
        const fetchedWithUser = await Complaint.findById(testComplaint._id).populate('user', 'name phone email role');
        
        // Simulating phonePrivacyMiddleware for assigned verifier
        let mockReq = { user: { _id: assignedVerifier._id, role: 'verifier', departmentCode: 'ROADS' } };
        let mockData = JSON.parse(JSON.stringify(fetchedWithUser));
        mockData = phonePrivacyMiddleware.sanitizePhonePrivacy(mockData, mockReq.user);
        assert.ok(mockData.user && mockData.user.phone, 'Assigned verifier MUST be able to see citizen phone for assigned complaint');

        // Simulating phonePrivacyMiddleware for unassigned verifier
        mockReq = { user: { _id: unassignedVerifier._id, role: 'verifier', departmentCode: 'ROADS' } };
        mockData = JSON.parse(JSON.stringify(fetchedWithUser));
        mockData = phonePrivacyMiddleware.sanitizePhonePrivacy(mockData, mockReq.user);
        assert.strictEqual(mockData.user ? mockData.user.phone : undefined, undefined, 'Unassigned verifier MUST NOT see citizen phone');

        // Simulating phonePrivacyMiddleware for Super Admin
        mockReq = { user: { _id: superAdmin._id, role: 'super_admin' } };
        mockData = JSON.parse(JSON.stringify(fetchedWithUser));
        mockData = phonePrivacyMiddleware.sanitizePhonePrivacy(mockData, mockReq.user);
        assert.strictEqual(mockData.user ? mockData.user.phone : undefined, undefined, 'Super Admin MUST NOT see citizen phone (stripped by privacy rule)');
        console.log('✓ TEST 8 PASSED: Phone privacy rules strictly enforced for assigned verifier vs unassigned / super admin.');
        passedCount++;

        // --- TEST 9: Department Head Official Status Transition ---
        console.log('\n--- TEST 9: Department Head Official Status Transition ---');
        req = {
            params: { id: testComplaint._id.toString() },
            user: { _id: roadsHead._id, role: 'department_head', departmentCode: 'ROADS' },
            body: { status: 'In Progress', note: 'Dept Head advancing status after reviewing verifier report' }
        };
        result = await executeController(adminController.updateComplaintStatus, req);
        assert.strictEqual(result.status, 200, 'Dept Head status transition should return HTTP 200 OK');
        assert.strictEqual(result.data.status, 'In Progress');
        console.log('✓ TEST 9 PASSED: Department Head successfully transitioned official status to In Progress.');
        passedCount++;

        // --- TEST 10: Department Head Cross-Department Modification Blocked ---
        console.log('\n--- TEST 10: Department Head Cross-Department Modification Blocked ---');
        const waterHead = await User.create({
            name: 'Water Dept Head',
            email: `water_head_${ts}@phase4test.com`,
            phone: `+917000${ts}7`,
            role: 'department_head',
            departmentCode: 'WATER',
            isPhoneVerified: true
        });

        req = {
            params: { id: testComplaint._id.toString() },
            user: { _id: waterHead._id, role: 'department_head', departmentCode: 'WATER' },
            body: { status: 'Resolved', note: 'Water Head attempting cross-department status edit' }
        };
        result = await executeController(adminController.updateComplaintStatus, req);
        assert.strictEqual(result.status, 403, 'Cross-department status change must return 403 Forbidden');
        console.log('✓ TEST 10 PASSED: Cross-department status modification blocked with 403 Forbidden.');
        passedCount++;

        // --- TEST 11: Citizen Resolution Confirmation (Confirm -> Closed) ---
        console.log('\n--- TEST 11: Citizen Resolution Confirmation (Confirm -> Closed) ---');
        // First Dept Head sets status to Resolved
        req = {
            params: { id: testComplaint._id.toString() },
            user: { _id: roadsHead._id, role: 'department_head', departmentCode: 'ROADS' },
            body: { status: 'Resolved', note: 'Work completed by field team', resolutionNote: 'Pothole filled and street light repaired' }
        };
        await executeController(adminController.updateComplaintStatus, req);

        // Citizen confirms resolution
        const complaintService = require('../../services/complaintService');
        const confirmedComplaint = await complaintService.verifyResolution(testComplaint._id, citizen._id, {
            verified: true,
            feedback: 'Issue completely resolved. Great work!'
        });
        assert.strictEqual(confirmedComplaint.status, 'Closed');
        assert.strictEqual(confirmedComplaint.citizenVerification.verified, true);
        console.log('✓ TEST 11 PASSED: Citizen confirmation successfully transitioned status to Closed.');
        passedCount++;

        // --- TEST 12: Citizen Resolution Rejection & History Preservation ---
        console.log('\n--- TEST 12: Citizen Resolution Rejection & History Preservation ---');
        const rejectedComplaint = await complaintService.verifyResolution(testComplaint._id, citizen._id, {
            verified: false,
            feedback: 'Light turned off again after 1 hour.'
        });
        assert.strictEqual(rejectedComplaint.status, 'Reopened');
        assert.strictEqual(rejectedComplaint.citizenVerification.verified, false);
        assert.strictEqual(rejectedComplaint.reopenCount, 1);
        assert.ok(rejectedComplaint.statusHistory.length >= 3, 'Status history audit trail MUST be preserved');
        console.log('✓ TEST 12 PASSED: Citizen rejection transitioned status to Reopened and preserved complete audit trail.');
        passedCount++;

        // --- TEST 13: Super Admin Monitor-Only Rule Enforcement ---
        console.log('\n--- TEST 13: Super Admin Monitor-Only Rule Enforcement ---');
        const { assignComplaintToStaff } = require('../../controllers/departmentDashboardController');
        req = {
            user: { _id: superAdmin._id, role: 'super_admin' },
            body: { complaintId: testComplaint._id.toString(), verifierId: assignedVerifier._id.toString() }
        };
        result = await executeController(assignComplaintToStaff, req);
        assert.strictEqual(result.status, 403, 'Super Admin assignment attempt must be blocked with 403 Forbidden');
        assert.strictEqual(result.data.message, 'Super Admin is monitor-only. Only Department Heads can assign or manage verifiers.');
        console.log('✓ TEST 13 PASSED: Super Admin monitor-only rule enforced (assignment blocked).');
        passedCount++;

        // Cleanup test data
        await User.deleteMany({ email: { $regex: /@phase4test\.com$/ } });
        await Complaint.deleteMany({ title: { $regex: /^Phase4 Test/ } });

        console.log('\n================================================================');
        console.log(`PHASE 4 VERIFICATION TEST SUITE PASSED: ${passedCount} / 13 SCENARIOS OK`);
        console.log('================================================================\n');

    } catch (err) {
        console.error('❌ PHASE 4 VERIFICATION TEST FAILED:', err);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
};

runPhase4VerificationTests();

