/**
 * CivicFix Full End-to-End Workflow & 20-Scenario Integration Test Suite
 */
const assert = require('assert');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const User = require('../../models/User');
const Complaint = require('../../models/Complaint');
const Department = require('../../models/Department');
const { DEFAULT_DEPARTMENTS, CATEGORY_TO_DEPARTMENT_CODE, normalizeDepartmentCode } = require('../../config/departmentConfig');
const { CATEGORIES, normalizeCategory, isValidCategory } = require('../../config/complaintCategories');

const complaintService = require('../../services/complaintService');
const verificationController = require('../../controllers/verificationController');
const { assignComplaintToStaff, getDepartmentComplaints } = require('../../controllers/departmentDashboardController');
const adminController = require('../../controllers/adminController');
const { getAssignedToMe } = require('../../controllers/complaintController');

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

const runE2EWorkflowTests = async () => {
    console.log('================================================================');
    console.log('STARTING CIVICFIX COMPLETE END-TO-END WORKFLOW & 20-SCENARIO TEST');
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
        await User.deleteMany({ email: { $regex: /@e2etest\.com$/ } });
        await Complaint.deleteMany({ title: { $regex: /^E2E Test/ } });

        // Seed/ensure 6 official departments
        for (const deptData of DEFAULT_DEPARTMENTS) {
            await Department.findOneAndUpdate(
                { code: deptData.code },
                { $set: deptData },
                { upsert: true, new: true }
            );
        }

        // Create Demo Role Accounts
        const citizen = await User.create({
            name: 'E2E Demo Citizen',
            email: `citizen_${ts}@e2etest.com`,
            phone: `+919000${ts}1`,
            role: 'citizen',
            isPhoneVerified: true
        });

        const roadsHead = await User.create({
            name: 'E2E Roads Dept Head',
            email: `roads_head_${ts}@e2etest.com`,
            phone: `+919000${ts}2`,
            role: 'department_head',
            departmentCode: 'ROADS',
            isPhoneVerified: true
        });

        const roadsVerifierA = await User.create({
            name: 'E2E Roads Verifier A',
            email: `verifierA_${ts}@e2etest.com`,
            phone: `+919000${ts}3`,
            role: 'verifier',
            departmentCode: 'ROADS',
            isPhoneVerified: true
        });

        const roadsVerifierB = await User.create({
            name: 'E2E Roads Verifier B',
            email: `verifierB_${ts}@e2etest.com`,
            phone: `+919000${ts}4`,
            role: 'verifier',
            departmentCode: 'ROADS',
            isPhoneVerified: true
        });

        const waterHead = await User.create({
            name: 'E2E Water Dept Head',
            email: `water_head_${ts}@e2etest.com`,
            phone: `+919000${ts}5`,
            role: 'department_head',
            departmentCode: 'WATER',
            isPhoneVerified: true
        });

        const superAdmin = await User.create({
            name: 'E2E Super Admin',
            email: `superadmin_${ts}@e2etest.com`,
            phone: `+919000${ts}6`,
            role: 'super_admin',
            isPhoneVerified: true
        });

        // --- SCENARIO 15: All six categories validate and route correctly ---
        console.log('--- SCENARIO 15: Six Canonical Categories Routing Validation ---');
        assert.strictEqual(CATEGORIES.length, 6, 'Taxonomy must have exactly 6 canonical categories');
        const testCatNames = [
            'Roads & Infrastructure',
            'Water Supply',
            'Waste Management & Sanitation',
            'Drainage & Sewerage',
            'Streetlights & Electricity',
            'Public Safety & Other Civic Hazards'
        ];
        for (const catName of testCatNames) {
            assert.ok(isValidCategory(catName), `Category '${catName}' must be valid`);
            const norm = normalizeCategory(catName);
            assert.ok(norm.id, `Normalized category id for ${catName} must exist`);
        }
        console.log('✓ SCENARIO 15 PASSED: All 6 canonical categories validated and routed.');
        passedCount++;

        // --- SCENARIO 1: Citizen submits a new complaint ---
        console.log('\n--- SCENARIO 1: Citizen Submits a New Complaint ---');
        const submittedComplaint = await complaintService.createComplaint({
            userId: citizen._id,
            title: 'E2E Test Deep Pothole Hazard',
            description: 'Massive pothole near central bus stand endangering commuters',
            category: 'Roads & Infrastructure',
            subcategory: 'Pothole',
            location: 'Central Bus Stand, Sector 4',
            latitude: 28.6139,
            longitude: 77.2090
        });

        assert.ok(submittedComplaint._id, 'Submitted complaint must have database _id');
        assert.ok(submittedComplaint.complaintId.startsWith('CMP'), 'Complaint must have CMP prefix ID');
        assert.strictEqual(submittedComplaint.departmentCode, 'ROADS');
        assert.strictEqual(submittedComplaint.status, 'Submitted');
        console.log(`✓ SCENARIO 1 PASSED: Complaint created (${submittedComplaint.complaintId}), initial status = Submitted.`);
        passedCount++;

        // --- SCENARIO 2: Complaint appears in citizen's dashboard ---
        console.log('\n--- SCENARIO 2: Complaint Appears in Citizen Dashboard ---');
        const citizenComplaints = await complaintService.getUserComplaints(citizen._id);
        const foundInCitizen = citizenComplaints.some(c => c._id.toString() === submittedComplaint._id.toString());
        assert.ok(foundInCitizen, 'Complaint must be listed in citizen dashboard');
        console.log('✓ SCENARIO 2 PASSED: Complaint visible in complainant dashboard.');
        passedCount++;

        // --- SCENARIO 3: Department Head can see the complaint in department view ---
        console.log('\n--- SCENARIO 3: Department Head Sees Complaint in Department View ---');
        let req = {
            user: { _id: roadsHead._id, role: 'department_head', departmentCode: 'ROADS' },
            departmentCode: 'ROADS',
            query: {}
        };
        let res = await executeController(getDepartmentComplaints, req);
        assert.strictEqual(res.status, 200);
        const deptComplaints = res.data.complaints || res.data;
        const foundInDept = deptComplaints.some(c => c._id.toString() === submittedComplaint._id.toString());
        assert.ok(foundInDept, 'Complaint must appear in Department Head dashboard list');
        console.log('✓ SCENARIO 3 PASSED: Department Head retrieved complaint in department queue.');
        passedCount++;

        // --- SCENARIO 4: Department Head assigns a valid verifier ---
        console.log('\n--- SCENARIO 4: Department Head Assigns Verifier ---');
        req = {
            user: { _id: roadsHead._id, role: 'department_head', departmentCode: 'ROADS' },
            body: {
                complaintId: submittedComplaint.complaintId,
                verifierId: roadsVerifierA._id.toString(),
                reason: 'Field inspection assigned to Verifier A',
                action: 'assign'
            }
        };
        res = await executeController(assignComplaintToStaff, req);
        assert.strictEqual(res.status, 200, 'Assignment should return 200');
        assert.strictEqual(res.data.success, true);
        assert.strictEqual(res.data.complaint.status, 'Assigned');
        const assignedIdStr = (res.data.complaint.assignedTo._id || res.data.complaint.assignedTo).toString();
        assert.strictEqual(assignedIdStr, roadsVerifierA._id.toString());
        console.log('✓ SCENARIO 4 PASSED: Verifier A assigned successfully, status updated to Assigned.');
        passedCount++;

        // --- SCENARIO 5: Assignment persists after refetching ---
        console.log('\n--- SCENARIO 5: Assignment Persists After Refetching ---');
        const fetchedAssigned = await Complaint.findById(submittedComplaint._id);
        assert.strictEqual(fetchedAssigned.assignedTo.toString(), roadsVerifierA._id.toString());
        assert.strictEqual(fetchedAssigned.status, 'Assigned');
        console.log('✓ SCENARIO 5 PASSED: Assignment persisted in MongoDB after refetching.');
        passedCount++;

        // --- SCENARIO 6: Assigned verifier sees the complaint in their queue ---
        console.log('\n--- SCENARIO 6: Assigned Verifier Sees Complaint in Work Queue ---');
        req = {
            user: { _id: roadsVerifierA._id, role: 'verifier', departmentCode: 'ROADS' }
        };
        res = await executeController(getAssignedToMe, req);
        assert.strictEqual(res.status, 200);
        const verifierQueue = res.data;
        const foundInVerifier = verifierQueue.some(c => c._id.toString() === submittedComplaint._id.toString());
        assert.ok(foundInVerifier, 'Assigned complaint must appear in Verifier A queue');
        console.log('✓ SCENARIO 6 PASSED: Verifier A retrieved complaint in work queue.');
        passedCount++;

        // --- SCENARIO 7: Another verifier cannot submit report or access actionable details ---
        console.log('\n--- SCENARIO 7: Cross-Verifier Access & Report Submission Denied ---');
        req = {
            params: { id: submittedComplaint._id.toString() },
            user: { _id: roadsVerifierB._id, role: 'verifier', departmentCode: 'ROADS' },
            body: {
                findings: 'Verifier B attempting unauthorized report',
                outcome: 'VERIFIED_CONFIRMED'
            }
        };
        res = await executeController(verificationController.submitVerificationReport, req);
        assert.strictEqual(res.status, 403, 'Verifier B must be denied with 403');
        console.log('✓ SCENARIO 7 PASSED: Verifier B report submission blocked with 403 Forbidden.');
        passedCount++;

        // --- SCENARIO 8: Assigned verifier submits valid report ---
        console.log('\n--- SCENARIO 8: Assigned Verifier Submits Report ---');
        req = {
            params: { id: submittedComplaint._id.toString() },
            user: { _id: roadsVerifierA._id, role: 'verifier', departmentCode: 'ROADS' },
            body: {
                findings: 'Inspected location. Confirmed 2m wide pothole near corner.',
                outcome: 'VERIFIED_CONFIRMED',
                contactWithCitizen: true,
                citizenContactNotes: 'Contacted citizen on site.',
                locationVerified: true,
                evidence: [{ url: 'https://res.cloudinary.com/demo/image/upload/v1/pothole.jpg' }]
            }
        };
        res = await executeController(verificationController.submitVerificationReport, req);
        assert.strictEqual(res.status, 200, 'Report submission should succeed');
        assert.strictEqual(res.data.success, true);
        assert.strictEqual(res.data.complaint.verificationState, 'VERIFIED_CONFIRMED');
        console.log('✓ SCENARIO 8 PASSED: Verifier A submitted report; verificationState = VERIFIED_CONFIRMED.');
        passedCount++;

        // --- SCENARIO 9: Report persists and appears in Department Head view ---
        console.log('\n--- SCENARIO 9: Report Persists & Appears in Department Head View ---');
        req = {
            params: { id: submittedComplaint._id.toString() },
            user: { _id: roadsHead._id, role: 'department_head', departmentCode: 'ROADS' }
        };
        res = await executeController(verificationController.getVerificationReport, req);
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.verificationState, 'VERIFIED_CONFIRMED');
        assert.strictEqual(res.data.verificationReport.findings, 'Inspected location. Confirmed 2m wide pothole near corner.');
        console.log('✓ SCENARIO 9 PASSED: Report retrieved by Department Head with complete findings.');
        passedCount++;

        // --- SCENARIO 10: Department Head reviews report & completes departmental work ---
        console.log('\n--- SCENARIO 10: Department Head Completes Departmental Work (Status -> Resolved) ---');
        req = {
            params: { id: submittedComplaint._id.toString() },
            user: { _id: roadsHead._id, role: 'department_head', departmentCode: 'ROADS' },
            body: {
                status: 'Resolved',
                note: 'Field crew filled pothole with asphalt patch and compacted surface.',
                resolutionNote: 'Pothole fully repaired by roads crew.'
            }
        };
        res = await executeController(adminController.updateComplaintStatus, req);
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.status, 'Resolved');
        console.log('✓ SCENARIO 10 PASSED: Department Head marked status as Resolved (Awaiting Citizen Confirmation).');
        passedCount++;

        // --- SCENARIO 11 & 12: Citizen sees resolution and confirms resolution ---
        console.log('\n--- SCENARIO 11 & 12: Citizen Confirms Resolution (Confirm -> Closed) ---');
        const confirmedComp = await complaintService.verifyResolution(submittedComplaint._id, citizen._id, {
            verified: true,
            feedback: 'Inspected the road. Pothole is completely filled. Great job!'
        });
        assert.strictEqual(confirmedComp.status, 'Closed');
        assert.strictEqual(confirmedComp.citizenVerification.verified, true);
        console.log('✓ SCENARIO 11 & 12 PASSED: Complainant confirmed resolution; final status transitioned to Closed.');
        passedCount++;

        // --- SCENARIO 13: Final Closed status persists after refresh ---
        console.log('\n--- SCENARIO 13: Final Closed Status Persists ---');
        const finalPersistedComp = await Complaint.findById(submittedComplaint._id);
        assert.strictEqual(finalPersistedComp.status, 'Closed');
        assert.strictEqual(finalPersistedComp.citizenVerification.verified, true);
        console.log('✓ SCENARIO 13 PASSED: Final Closed status persisted in MongoDB.');
        passedCount++;

        // --- SCENARIO 14: Malformed, object-valued, or invalid IDs return controlled 400/404 ---
        console.log('\n--- SCENARIO 14: Malformed ID Input Handling ---');
        req = {
            params: { id: '[object Object]' },
            user: { _id: roadsVerifierA._id, role: 'verifier', departmentCode: 'ROADS' },
            body: { findings: 'Test malformed ID', outcome: 'VERIFIED_CONFIRMED' }
        };
        res = await executeController(verificationController.submitVerificationReport, req);
        assert.strictEqual(res.status, 400);

        req = {
            params: { id: 'undefined' },
            user: { _id: roadsVerifierA._id, role: 'verifier', departmentCode: 'ROADS' },
            body: { findings: 'Test undefined ID', outcome: 'VERIFIED_CONFIRMED' }
        };
        res = await executeController(verificationController.submitVerificationReport, req);
        assert.strictEqual(res.status, 400);
        console.log('✓ SCENARIO 14 PASSED: Malformed IDs return 400 Bad Request safely.');
        passedCount++;

        // --- SCENARIO 16: Seeding idempotency check ---
        console.log('\n--- SCENARIO 16: Safe & Repeatable Department Seeding ---');
        for (const deptData of DEFAULT_DEPARTMENTS) {
            await Department.findOneAndUpdate(
                { code: deptData.code },
                { $set: deptData },
                { upsert: true, new: true }
            );
        }
        const deptCount = await Department.countDocuments();
        assert.strictEqual(deptCount, 6, 'Total department count must remain exactly 6 after re-seeding');
        console.log('✓ SCENARIO 16 PASSED: Seeding is safe and idempotent (exactly 6 departments).');
        passedCount++;

        // --- SCENARIO 17 & 18 & 19: Dashboard Detailed Analysis & Key Integrity ---
        console.log('\n--- SCENARIO 17-19: Detailed Analysis & Record Key Integrity ---');
        const tracked = await complaintService.trackComplaint(submittedComplaint.complaintId);
        assert.ok(tracked && tracked.title);
        const trackedByObjId = await complaintService.trackComplaint(submittedComplaint._id.toString());
        assert.ok(trackedByObjId && trackedByObjId.title);
        console.log('✓ SCENARIO 17-19 PASSED: Track complaint retrieves details by ObjectId and complaintId.');
        passedCount++;

        // --- SCENARIO 20: Direct Endpoint Bypass Protection ---
        console.log('\n--- SCENARIO 20: Direct Endpoint Bypass Protection ---');
        req = {
            params: { id: submittedComplaint._id.toString() },
            user: { _id: citizen._id, role: 'citizen' },
            body: { status: 'Closed', note: 'Citizen trying to bypass admin endpoint' }
        };
        res = await executeController(adminController.updateComplaintStatus, req);
        assert.strictEqual(res.status, 403, 'Citizen updating official status must return 403');
        console.log('✓ SCENARIO 20 PASSED: Direct endpoint status modification blocked for citizen role.');
        passedCount++;

        // Cleanup test data
        await User.deleteMany({ email: { $regex: /@e2etest\.com$/ } });
        await Complaint.deleteMany({ title: { $regex: /^E2E Test/ } });

        console.log('\n================================================================');
        console.log(`CIVICFIX END-TO-END WORKFLOW SUITE PASSED (${passedCount}/16 SCENARIO BLOCKS OK)`);
        console.log('================================================================\n');

    } catch (err) {
        console.error('❌ E2E WORKFLOW TEST FAILED:', err);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
};

runE2EWorkflowTests();
