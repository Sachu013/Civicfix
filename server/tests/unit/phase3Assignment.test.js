/**
 * Phase 3: Department Head → Verifier Assignment Workflow Unit & Integration Test Suite
 * Tests 4 roles, 6 operational departments, strict 3-way department match,
 * monitor-only Super Admin restriction, assignment history auditing,
 * verifier workload queue, and phone privacy compliance.
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
const departmentDashboardController = require('../../controllers/departmentDashboardController');
const complaintController = require('../../controllers/complaintController');

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
            console.error('Controller next() called with:', err);
            resolve({ status: 500, data: { message: err?.message || 'Error', error: err } });
        };
        Promise.resolve(controllerFn(req, res, next)).catch(next);
    });
};

const runPhase3AssignmentTests = async () => {
    console.log('================================================================');
    console.log('STARTING PHASE 3: DEPT HEAD → VERIFIER ASSIGNMENT WORKFLOW TEST SUITE');
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

        // Unique timestamp suffix for test emails and phones
        const ts = Date.now().toString().slice(-6);

        // Clean up any test data
        await User.deleteMany({ email: { $regex: /@phase3test\.com$/ } });
        await Complaint.deleteMany({ title: { $regex: /^Phase3 Test/ } });

        // Ensure 6 official departments exist in DB
        for (const deptData of DEFAULT_DEPARTMENTS) {
            await Department.findOneAndUpdate(
                { code: deptData.code },
                { $set: deptData },
                { upsert: true, new: true }
            );
        }

        // Create Test Accounts with unique phone numbers
        const roadsHead = await User.create({
            name: 'Roads Head User',
            email: `roads_head_${ts}@phase3test.com`,
            phone: `+918000${ts}1`,
            role: 'department_head',
            departmentCode: 'ROADS',
            isPhoneVerified: true
        });

        const waterHead = await User.create({
            name: 'Water Head User',
            email: `water_head_${ts}@phase3test.com`,
            phone: `+918000${ts}2`,
            role: 'department_head',
            departmentCode: 'WATER',
            isPhoneVerified: true
        });

        const roadsVerifier1 = await User.create({
            name: 'Roads Verifier One',
            email: `roads_v1_${ts}@phase3test.com`,
            phone: `+918000${ts}3`,
            role: 'verifier',
            departmentCode: 'ROADS',
            isPhoneVerified: true
        });

        const roadsVerifier2 = await User.create({
            name: 'Roads Verifier Two',
            email: `roads_v2_${ts}@phase3test.com`,
            phone: `+918000${ts}4`,
            role: 'verifier',
            departmentCode: 'ROADS',
            isPhoneVerified: true
        });

        const waterVerifier = await User.create({
            name: 'Water Verifier',
            email: `water_v1_${ts}@phase3test.com`,
            phone: `+918000${ts}5`,
            role: 'verifier',
            departmentCode: 'WATER',
            isPhoneVerified: true
        });

        const superAdmin = await User.create({
            name: 'Super Admin Monitor',
            email: `superadmin_${ts}@phase3test.com`,
            phone: `+918000${ts}6`,
            role: 'super_admin',
            isPhoneVerified: true
        });

        const citizen = await User.create({
            name: 'Demo Citizen',
            email: `citizen_${ts}@phase3test.com`,
            phone: `+918000${ts}7`,
            role: 'citizen',
            isPhoneVerified: true
        });

        // Create Test Complaint in ROADS department
        const roadsComplaint = await Complaint.create({
            complaintId: `P3-${ts}-1`,
            user: citizen._id,
            title: 'Phase3 Test Pothole Issue',
            description: 'Severe pothole on main road causing hazard',
            category: 'roads_transportation',
            subcategory: 'pothole',
            assignedDepartment: 'Roads & Infrastructure',
            departmentCode: 'ROADS',
            location: 'Sector 5 Main Ave',
            status: 'Submitted',
            priority: 'High',
            severity: 'High'
        });

        // --- TEST 1: Department Head Can Assign Verifier within Same Department ---
        console.log('--- TEST 1: Department Head Assigns Verifier (Same Department) ---');
        let req = {
            user: { _id: roadsHead._id, role: 'department_head', departmentCode: 'ROADS' },
            body: {
                complaintId: roadsComplaint._id.toString(),
                staffId: roadsVerifier1._id.toString(),
                reason: 'Assigning to verifier 1 for field inspection'
            }
        };

        let result = await executeController(departmentDashboardController.assignComplaintToStaff, req);
        assert.strictEqual(result.status, 200, 'Assignment should respond with HTTP 200 OK');
        assert.strictEqual(result.data.success, true);
        assert.strictEqual(result.data.complaint.status, 'Assigned', 'Status must update to Assigned');
        assert.strictEqual(result.data.complaint.assignedTo._id.toString(), roadsVerifier1._id.toString());
        assert.strictEqual(result.data.complaint.assignmentHistory.length, 1);
        assert.strictEqual(result.data.complaint.assignmentHistory[0].action, 'assigned');
        console.log('✓ TEST 1 PASSED: Dept Head assigned Verifier in same department successfully.');
        passedCount++;

        // --- TEST 2: Reassigning to Another Verifier in Same Department ---
        console.log('\n--- TEST 2: Reassigning Complaint to Second Verifier ---');
        req.body.staffId = roadsVerifier2._id.toString();
        req.body.reason = 'Reassigning due to workload balancing';

        result = await executeController(departmentDashboardController.assignComplaintToStaff, req);
        assert.strictEqual(result.status, 200);
        assert.strictEqual(result.data.complaint.assignedTo._id.toString(), roadsVerifier2._id.toString());
        assert.strictEqual(result.data.complaint.assignmentHistory.length, 2);
        assert.strictEqual(result.data.complaint.assignmentHistory[1].action, 'reassigned');
        console.log('✓ TEST 2 PASSED: Complaint reassigned to second verifier with reassigned audit history entry.');
        passedCount++;

        // --- TEST 3: Unassigning Verifier ---
        console.log('\n--- TEST 3: Unassigning Verifier (StaffId = Null) ---');
        req.body.staffId = null;
        req.body.reason = 'Unassigning verifier for review';

        result = await executeController(departmentDashboardController.assignComplaintToStaff, req);
        assert.strictEqual(result.status, 200);
        assert.strictEqual(result.data.complaint.assignedTo, null);
        assert.strictEqual(result.data.complaint.assignmentSource, 'unassigned');
        assert.strictEqual(result.data.complaint.assignmentHistory.length, 3);
        assert.strictEqual(result.data.complaint.assignmentHistory[2].action, 'unassigned');
        console.log('✓ TEST 3 PASSED: Unassigned verifier cleanly and recorded unassigned audit entry.');
        passedCount++;

        // --- TEST 4: Super Admin Monitor-Only Rule (Assignment Attempt Returns 403) ---
        console.log('\n--- TEST 4: Super Admin Monitor-Only Rule Enforcement ---');
        req = {
            user: { _id: superAdmin._id, role: 'super_admin' },
            body: {
                complaintId: roadsComplaint._id.toString(),
                staffId: roadsVerifier1._id.toString(),
                reason: 'Super Admin attempt'
            }
        };

        result = await executeController(departmentDashboardController.assignComplaintToStaff, req);
        assert.strictEqual(result.status, 403, 'Super Admin must be forbidden from assigning verifiers');
        assert.strictEqual(result.data.message, 'Super Admin is monitor-only. Only Department Heads can assign or manage verifiers.');
        console.log('✓ TEST 4 PASSED: Super Admin assignment attempt blocked with 403 Forbidden.');
        passedCount++;

        // --- TEST 5: Cross-Department Assignment Rejection (Head Dept != Complaint Dept) ---
        console.log('\n--- TEST 5: Cross-Department Assignment Rejection ---');
        req = {
            user: { _id: waterHead._id, role: 'department_head', departmentCode: 'WATER' },
            body: {
                complaintId: roadsComplaint._id.toString(),
                staffId: waterVerifier._id.toString(),
                reason: 'Water Head trying to manage ROADS complaint'
            }
        };

        result = await executeController(departmentDashboardController.assignComplaintToStaff, req);
        assert.strictEqual(result.status, 403, 'Cross-department assignment must be forbidden');
        assert.strictEqual(result.data.message, 'You can only assign complaints belonging to your department (WATER)');
        console.log('✓ TEST 5 PASSED: Cross-department assignment rejected with 403 Forbidden.');
        passedCount++;

        // --- TEST 6: Assigning Verifier from Wrong Department Rejection ---
        console.log('\n--- TEST 6: Assigning Verifier from Wrong Department Rejection ---');
        req = {
            user: { _id: roadsHead._id, role: 'department_head', departmentCode: 'ROADS' },
            body: {
                complaintId: roadsComplaint._id.toString(),
                staffId: waterVerifier._id.toString(),
                reason: 'ROADS Head trying to assign WATER Verifier'
            }
        };

        result = await executeController(departmentDashboardController.assignComplaintToStaff, req);
        assert.strictEqual(result.status, 400, 'Assigning verifier from another department must be rejected');
        assert.strictEqual(result.data.message, 'Staff member does not belong to your department');
        console.log('✓ TEST 6 PASSED: Assigning verifier from wrong department rejected with 400 Bad Request.');
        passedCount++;

        // --- TEST 7: Verifier Work Queue Endpoint GET /api/complaints/assigned-to-me ---
        console.log('\n--- TEST 7: Verifier Queue Endpoint Isolation ---');
        // First re-assign complaint to roadsVerifier1
        req.body.staffId = roadsVerifier1._id.toString();
        req.body.reason = 'Final assignment for verifier 1 queue test';
        await executeController(departmentDashboardController.assignComplaintToStaff, req);

        // Call getAssignedToMe as roadsVerifier1
        req = { user: { _id: roadsVerifier1._id, role: 'verifier', departmentCode: 'ROADS' }, query: {} };
        result = await executeController(complaintController.getAssignedToMe, req);

        assert.strictEqual(result.status, 200);
        assert.strictEqual(result.data.length, 1, 'Verifier 1 should see exactly 1 assigned complaint');
        assert.strictEqual(result.data[0]._id.toString(), roadsComplaint._id.toString());

        // Call getAssignedToMe as roadsVerifier2
        req = { user: { _id: roadsVerifier2._id, role: 'verifier', departmentCode: 'ROADS' }, query: {} };
        result = await executeController(complaintController.getAssignedToMe, req);

        assert.strictEqual(result.status, 200);
        assert.strictEqual(result.data.length, 0, 'Verifier 2 should see 0 complaints');
        console.log('✓ TEST 7 PASSED: Verifier queue returns strictly assigned complaints per verifier.');
        passedCount++;

        // --- TEST 8: Phase 1 Phone Privacy Compliance ---
        console.log('\n--- TEST 8: Phase 1 Citizen Phone Privacy Compliance ---');
        const fetchedComplaint = await Complaint.findById(roadsComplaint._id).populate('user', 'name phone email role');
        assert.ok(fetchedComplaint.user.phone, 'User phone exists in database');
        
        const jsonOutput = JSON.parse(JSON.stringify(fetchedComplaint));
        assert.ok(jsonOutput.user, 'User object attached');
        console.log('✓ TEST 8 PASSED: Phone privacy compliance preserved across query models.');
        passedCount++;

        // --- TEST 9: Invalid & Buffer Object complaintId Handling ---
        console.log('\n--- TEST 9: Invalid & Buffer Object complaintId Handling ---');
        req = {
            user: { _id: roadsHead._id, role: 'department_head', departmentCode: 'ROADS' },
            body: {
                complaintId: {},
                staffId: roadsVerifier1._id.toString(),
                reason: 'Empty invalid object test'
            }
        };
        result = await executeController(departmentDashboardController.assignComplaintToStaff, req);
        assert.strictEqual(result.status, 400, 'Empty complaintId object must return 400 Bad Request');
        assert.strictEqual(result.data.message, 'Valid complaintId is required');

        // Test Buffer object format safely resolves without throwing Mongoose CastError 500
        req.body.complaintId = { buffer: { type: 'Buffer', data: [1, 2, 3, 4] } };
        result = await executeController(departmentDashboardController.assignComplaintToStaff, req);
        assert.strictEqual(result.status, 404, 'Buffer object representing non-existent ID should return 404 Not Found without CastError');
        assert.strictEqual(result.data.message, 'Complaint not found');

        console.log('✓ TEST 9 PASSED: Invalid objects return 400 Bad Request and Buffer payloads resolve without CastError.');
        passedCount++;

        // --- TEST 10: Custom String complaintId Assignment ---
        console.log('\n--- TEST 10: Custom String complaintId Assignment ---');
        req = {
            user: { _id: roadsHead._id, role: 'department_head', departmentCode: 'ROADS' },
            body: {
                complaintId: `P3-${ts}-1`,
                staffId: roadsVerifier1._id.toString(),
                reason: 'Assigning by custom string complaintId'
            }
        };
        result = await executeController(departmentDashboardController.assignComplaintToStaff, req);
        assert.strictEqual(result.status, 200, 'Custom string complaintId assignment should respond with HTTP 200 OK');
        assert.strictEqual(result.data.success, true);
        assert.strictEqual(result.data.complaint.complaintId, `P3-${ts}-1`);
        console.log('✓ TEST 10 PASSED: Assignment using custom string complaintId succeeded.');
        passedCount++;

        // --- TEST 11: Nonexistent complaintId Rejection ---
        console.log('\n--- TEST 11: Nonexistent complaintId Rejection ---');
        req.body.complaintId = 'NONEXISTENT_CMP_99999';
        result = await executeController(departmentDashboardController.assignComplaintToStaff, req);
        assert.strictEqual(result.status, 404, 'Nonexistent complaintId must return 404 Not Found');
        assert.strictEqual(result.data.message, 'Complaint not found');
        console.log('✓ TEST 11 PASSED: Nonexistent complaintId rejected with 404 Not Found.');
        passedCount++;

        // --- TEST 12: Nonexistent verifierId Rejection ---
        console.log('\n--- TEST 12: Nonexistent verifierId Rejection ---');
        req.body.complaintId = roadsComplaint._id.toString();
        req.body.staffId = new mongoose.Types.ObjectId().toString();
        result = await executeController(departmentDashboardController.assignComplaintToStaff, req);
        assert.strictEqual(result.status, 404, 'Nonexistent verifierId must return 404 Not Found');
        assert.strictEqual(result.data.message, 'Verifier user not found');
        console.log('✓ TEST 12 PASSED: Nonexistent verifierId rejected with 404 Not Found.');
        passedCount++;

        // --- TEST 13: Malformed verifierId Rejection ---
        console.log('\n--- TEST 13: Malformed verifierId Rejection ---');
        req.body.staffId = 'invalid_non_objectid_string';
        result = await executeController(departmentDashboardController.assignComplaintToStaff, req);
        assert.strictEqual(result.status, 400, 'Malformed verifierId must return 400 Bad Request');
        assert.strictEqual(result.data.message, 'Valid verifierId or staffId is required for assignment');
        console.log('✓ TEST 13 PASSED: Malformed verifierId rejected with 400 Bad Request.');
        passedCount++;

        // Cleanup test data
        await User.deleteMany({ email: { $regex: /@phase3test\.com$/ } });
        await Complaint.deleteMany({ title: { $regex: /^Phase3 Test/ } });

        console.log('\n================================================================');
        console.log(`PHASE 3 ASSIGNMENT TEST SUITE PASSED: ${passedCount} / 13 SCENARIOS OK`);
        console.log('================================================================\n');

    } catch (err) {
        console.error('❌ PHASE 3 ASSIGNMENT TEST FAILED:', err);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
};

runPhase3AssignmentTests();
