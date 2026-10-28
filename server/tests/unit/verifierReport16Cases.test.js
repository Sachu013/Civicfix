/**
 * Verifier Report Submission & Assignment Authorization 16-Case Test Suite
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
const { assignVerifier } = require('../../controllers/complaintController');

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

const run16CasesVerificationTests = async () => {
    console.log('================================================================');
    console.log('STARTING 16-CASE VERIFIER REPORT SUBMISSION & AUTHORIZATION TEST');
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
        console.log('✓ Connected to MongoDB Atlas.\n');

        const ts = Date.now().toString().slice(-6);

        // Cleanup previous test data
        await User.deleteMany({ email: { $regex: /@v16test\.com$/ } });
        await Complaint.deleteMany({ title: { $regex: /^V16 Test/ } });

        // Ensure default departments exist
        for (const deptData of DEFAULT_DEPARTMENTS) {
            await Department.findOneAndUpdate(
                { code: deptData.code },
                { $set: deptData },
                { upsert: true, new: true }
            );
        }

        // Setup Test Users
        const deptHead = await User.create({
            name: 'V16 Dept Head',
            email: `head_${ts}@v16test.com`,
            phone: `+918000${ts}1`,
            role: 'department_head',
            departmentCode: 'ROADS',
            isPhoneVerified: true
        });

        const verifierA = await User.create({
            name: 'V16 Verifier A',
            email: `verifierA_${ts}@v16test.com`,
            phone: `+918000${ts}2`,
            role: 'verifier',
            departmentCode: 'ROADS',
            isPhoneVerified: true
        });

        const verifierB = await User.create({
            name: 'V16 Verifier B',
            email: `verifierB_${ts}@v16test.com`,
            phone: `+918000${ts}3`,
            role: 'verifier',
            departmentCode: 'ROADS',
            isPhoneVerified: true
        });

        const unassignedVerifier = await User.create({
            name: 'V16 Unassigned Verifier',
            email: `verifierUnassigned_${ts}@v16test.com`,
            phone: `+918000${ts}4`,
            role: 'verifier',
            departmentCode: 'ROADS',
            isPhoneVerified: true
        });

        const citizen = await User.create({
            name: 'V16 Citizen',
            email: `citizen_${ts}@v16test.com`,
            phone: `+918000${ts}5`,
            role: 'citizen',
            isPhoneVerified: true
        });

        const superAdmin = await User.create({
            name: 'V16 Super Admin',
            email: `superadmin_${ts}@v16test.com`,
            phone: `+918000${ts}6`,
            role: 'super_admin',
            isPhoneVerified: true
        });

        // 16. Existing complaint submission and assignment functionality continue working
        console.log('--- TEST 16: Existing complaint submission and assignment functionality ---');
        const assignedComplaint = await Complaint.create({
            complaintId: `CMP16-${ts}`,
            user: citizen._id,
            title: 'V16 Test Assigned Complaint',
            description: 'Pothole on 5th Avenue requiring verification',
            category: 'road_maintenance',
            subcategory: 'pothole',
            assignedDepartment: 'Roads & Infrastructure',
            departmentCode: 'ROADS',
            assignedTo: verifierA._id,
            assignedBy: deptHead._id,
            assignedAt: new Date(),
            location: '5th Avenue & Main St',
            status: 'Assigned',
            verificationState: 'UNVERIFIED'
        });

        const unassignedComplaint = await Complaint.create({
            complaintId: `CMP16-UN-${ts}`,
            user: citizen._id,
            title: 'V16 Test Unassigned Complaint',
            description: 'Broken streetlight unassigned',
            category: 'electrical_lighting',
            assignedDepartment: 'Roads & Infrastructure',
            departmentCode: 'ROADS',
            location: '6th Avenue',
            status: 'Submitted',
            verificationState: 'UNVERIFIED'
        });
        assert.ok(assignedComplaint._id, 'Assigned complaint created');
        assert.strictEqual(assignedComplaint.assignedTo.toString(), verifierA._id.toString());
        console.log('✓ TEST 16 PASSED: Complaint submission and assignment structure verified.');
        passedCount++;

        // 1. Assigned verifier submits a valid report successfully
        console.log('\n--- TEST 1: Assigned verifier submits a valid report successfully ---');
        let req = {
            params: { id: assignedComplaint._id.toString() },
            user: { _id: verifierA._id, role: 'verifier', departmentCode: 'ROADS' },
            body: {
                findings: 'Inspected site at 10 AM. Verified 1.5 meter wide pothole.',
                outcome: 'VERIFIED_CONFIRMED',
                contactWithCitizen: true,
                citizenContactNotes: 'Met citizen at location.',
                locationVerified: true
            }
        };
        let res = await executeController(verificationController.submitVerificationReport, req);
        assert.strictEqual(res.status, 200, 'Valid report submission should return 200');
        assert.strictEqual(res.data.success, true);
        assert.strictEqual(res.data.complaint.verificationReport.outcome, 'VERIFIED_CONFIRMED');
        console.log('✓ TEST 1 PASSED: Assigned verifier submitted report successfully.');
        passedCount++;

        // 2. The report is saved against the correct complaint
        console.log('\n--- TEST 2: The report is saved against the correct complaint ---');
        assert.strictEqual(res.data.complaint.complaintId, assignedComplaint.complaintId);
        assert.strictEqual(res.data.complaint.verificationReport.findings, 'Inspected site at 10 AM. Verified 1.5 meter wide pothole.');
        console.log('✓ TEST 2 PASSED: Report saved against the correct complaint document.');
        passedCount++;

        // 3. The report persists after fetching the complaint again
        console.log('\n--- TEST 3: The report persists after fetching the complaint again ---');
        const fetchedComp = await Complaint.findById(assignedComplaint._id);
        assert.ok(fetchedComp.verificationReport);
        assert.strictEqual(fetchedComp.verificationReport.findings, 'Inspected site at 10 AM. Verified 1.5 meter wide pothole.');
        assert.strictEqual(fetchedComp.verificationState, 'VERIFIED_CONFIRMED');
        console.log('✓ TEST 3 PASSED: Report persists in DB upon refetching.');
        passedCount++;

        // 4. An unassigned verifier is denied (403)
        console.log('\n--- TEST 4: An unassigned verifier is denied ---');
        req = {
            params: { id: unassignedComplaint._id.toString() },
            user: { _id: unassignedVerifier._id, role: 'verifier', departmentCode: 'ROADS' },
            body: {
                findings: 'Attempting to submit on unassigned complaint',
                outcome: 'VERIFIED_CONFIRMED'
            }
        };
        res = await executeController(verificationController.submitVerificationReport, req);
        assert.strictEqual(res.status, 403, 'Unassigned complaint submission should return 403');
        console.log('✓ TEST 4 PASSED: Unassigned verifier denied with 403 Forbidden.');
        passedCount++;

        // 5. A different verifier is denied (403)
        console.log('\n--- TEST 5: A different verifier is denied ---');
        const compForA = await Complaint.create({
            complaintId: `CMP16-A-${ts}`,
            user: citizen._id,
            title: 'V16 Test Complaint for Verifier A',
            description: 'For Verifier A only',
            category: 'road_maintenance',
            departmentCode: 'ROADS',
            assignedTo: verifierA._id,
            location: '7th Avenue',
            status: 'Assigned',
            verificationState: 'UNVERIFIED'
        });

        req = {
            params: { id: compForA._id.toString() },
            user: { _id: verifierB._id, role: 'verifier', departmentCode: 'ROADS' },
            body: {
                findings: 'Verifier B attempting to submit on Verifier A complaint',
                outcome: 'VERIFIED_CONFIRMED'
            }
        };
        res = await executeController(verificationController.submitVerificationReport, req);
        assert.strictEqual(res.status, 403, 'Submitting on another verifier complaint should return 403');
        console.log('✓ TEST 5 PASSED: Different verifier denied with 403 Forbidden.');
        passedCount++;

        // 6. A citizen cannot submit a verifier report
        console.log('\n--- TEST 6: A citizen cannot submit a verifier report ---');
        req = {
            params: { id: compForA._id.toString() },
            user: { _id: citizen._id, role: 'citizen' },
            body: {
                findings: 'Citizen attempting verifier report',
                outcome: 'VERIFIED_CONFIRMED'
            }
        };
        res = await executeController(verificationController.submitVerificationReport, req);
        assert.strictEqual(res.status, 403, 'Citizen report submission should return 403');
        console.log('✓ TEST 6 PASSED: Citizen denied with 403 Forbidden.');
        passedCount++;

        // 7. A department head cannot submit a verifier report
        console.log('\n--- TEST 7: A department head cannot submit a verifier report ---');
        req = {
            params: { id: compForA._id.toString() },
            user: { _id: deptHead._id, role: 'department_head', departmentCode: 'ROADS' },
            body: {
                findings: 'Dept Head attempting verifier report',
                outcome: 'VERIFIED_CONFIRMED'
            }
        };
        res = await executeController(verificationController.submitVerificationReport, req);
        assert.strictEqual(res.status, 403, 'Dept Head report submission should return 403');
        console.log('✓ TEST 7 PASSED: Department head denied with 403 Forbidden.');
        passedCount++;

        // 8. A super admin cannot submit a verifier report through the verifier endpoint
        console.log('\n--- TEST 8: A super admin cannot submit a verifier report ---');
        req = {
            params: { id: compForA._id.toString() },
            user: { _id: superAdmin._id, role: 'super_admin' },
            body: {
                findings: 'Super admin attempting verifier report',
                outcome: 'VERIFIED_CONFIRMED'
            }
        };
        res = await executeController(verificationController.submitVerificationReport, req);
        assert.strictEqual(res.status, 403, 'Super admin report submission should return 403');
        console.log('✓ TEST 8 PASSED: Super admin denied with 403 Forbidden.');
        passedCount++;

        // 9. A nonexistent complaint returns 404
        console.log('\n--- TEST 9: A nonexistent complaint returns 404 ---');
        const nonExistentId = new mongoose.Types.ObjectId().toString();
        req = {
            params: { id: nonExistentId },
            user: { _id: verifierA._id, role: 'verifier', departmentCode: 'ROADS' },
            body: {
                findings: 'Testing nonexistent complaint ID',
                outcome: 'VERIFIED_CONFIRMED'
            }
        };
        res = await executeController(verificationController.submitVerificationReport, req);
        assert.strictEqual(res.status, 404, 'Nonexistent complaint should return 404');
        console.log('✓ TEST 9 PASSED: Nonexistent complaint returned 404 Not Found.');
        passedCount++;

        // 10. A missing complaint ID returns 400
        console.log('\n--- TEST 10: A missing complaint ID returns 400 ---');
        req = {
            params: { id: '' },
            user: { _id: verifierA._id, role: 'verifier', departmentCode: 'ROADS' },
            body: {
                findings: 'Testing missing complaint ID',
                outcome: 'VERIFIED_CONFIRMED'
            }
        };
        res = await executeController(verificationController.submitVerificationReport, req);
        assert.strictEqual(res.status, 400, 'Missing complaint ID should return 400');
        console.log('✓ TEST 10 PASSED: Missing complaint ID returned 400 Bad Request.');
        passedCount++;

        // 11. A malformed complaint ID returns 400 without an unhandled server error
        console.log('\n--- TEST 11: A malformed complaint ID returns 400 safely ---');
        req = {
            params: { id: '[object Object]' },
            user: { _id: verifierA._id, role: 'verifier', departmentCode: 'ROADS' },
            body: {
                findings: 'Testing malformed complaint ID',
                outcome: 'VERIFIED_CONFIRMED'
            }
        };
        res = await executeController(verificationController.submitVerificationReport, req);
        assert.strictEqual(res.status, 400, 'Malformed complaint ID [object Object] should return 400');

        req = {
            params: { id: 'undefined' },
            user: { _id: verifierA._id, role: 'verifier', departmentCode: 'ROADS' },
            body: {
                findings: 'Testing string undefined complaint ID',
                outcome: 'VERIFIED_CONFIRMED'
            }
        };
        res = await executeController(verificationController.submitVerificationReport, req);
        assert.strictEqual(res.status, 400, 'Malformed complaint ID undefined should return 400');
        console.log('✓ TEST 11 PASSED: Malformed complaint IDs return 400 Bad Request without server crash.');
        passedCount++;

        // 12. Missing mandatory report fields return 400
        console.log('\n--- TEST 12: Missing mandatory report fields return 400 ---');
        req = {
            params: { id: compForA._id.toString() },
            user: { _id: verifierA._id, role: 'verifier', departmentCode: 'ROADS' },
            body: {
                findings: '', // empty findings
                outcome: 'VERIFIED_CONFIRMED'
            }
        };
        res = await executeController(verificationController.submitVerificationReport, req);
        assert.strictEqual(res.status, 400, 'Empty findings should return 400');

        req = {
            params: { id: compForA._id.toString() },
            user: { _id: verifierA._id, role: 'verifier', departmentCode: 'ROADS' },
            body: {
                findings: 'Valid findings description text.',
                outcome: 'INVALID_OUTCOME_NAME' // invalid outcome
            }
        };
        res = await executeController(verificationController.submitVerificationReport, req);
        assert.strictEqual(res.status, 400, 'Invalid outcome should return 400');
        console.log('✓ TEST 12 PASSED: Missing/invalid report fields return 400 Bad Request.');
        passedCount++;

        // 13. Reassignment prevents the former verifier from submitting a new report
        console.log('\n--- TEST 13 & 14: Reassignment prevents former verifier and allows new verifier ---');
        // Reassign compForA from verifierA to verifierB
        compForA.assignedTo = verifierB._id;
        compForA.assignmentHistory.push({
            verifier: verifierB._id,
            assignedBy: deptHead._id,
            action: 'reassigned',
            reason: 'Reassigned for workload balancing'
        });
        await compForA.save();

        // Former verifier (Verifier A) attempts submission -> Denied 403
        req = {
            params: { id: compForA._id.toString() },
            user: { _id: verifierA._id, role: 'verifier', departmentCode: 'ROADS' },
            body: {
                findings: 'Former verifier A attempting to submit after reassignment',
                outcome: 'VERIFIED_CONFIRMED'
            }
        };
        res = await executeController(verificationController.submitVerificationReport, req);
        assert.strictEqual(res.status, 403, 'Former verifier should be denied with 403 after reassignment');
        console.log('✓ TEST 13 PASSED: Former verifier denied after reassignment.');
        passedCount++;

        // 14. The newly assigned verifier can submit the report
        req = {
            params: { id: compForA._id.toString() },
            user: { _id: verifierB._id, role: 'verifier', departmentCode: 'ROADS' },
            body: {
                findings: 'Newly assigned verifier B performing field inspection and submitting report.',
                outcome: 'VERIFIED_CONFIRMED',
                contactWithCitizen: true,
                locationVerified: true
            }
        };
        res = await executeController(verificationController.submitVerificationReport, req);
        assert.strictEqual(res.status, 200, 'Newly assigned verifier B submission should succeed with 200');
        assert.strictEqual(res.data.success, true);
        assert.strictEqual(res.data.complaint.verificationReport.findings, 'Newly assigned verifier B performing field inspection and submitting report.');
        console.log('✓ TEST 14 PASSED: Newly assigned verifier B submitted report successfully.');
        passedCount++;

        // 15. The department head can retrieve the saved report
        console.log('\n--- TEST 15: The department head can retrieve the saved report ---');
        req = {
            params: { id: compForA._id.toString() },
            user: { _id: deptHead._id, role: 'department_head', departmentCode: 'ROADS' }
        };
        res = await executeController(verificationController.getVerificationReport, req);
        assert.strictEqual(res.status, 200, 'Dept Head retrieving report should return 200');
        assert.strictEqual(res.data.verificationState, 'VERIFIED_CONFIRMED');
        assert.strictEqual(res.data.verificationReport.findings, 'Newly assigned verifier B performing field inspection and submitting report.');
        console.log('✓ TEST 15 PASSED: Department head successfully retrieved submitted verification report.');
        passedCount++;

        // Cleanup test data
        await User.deleteMany({ email: { $regex: /@v16test\.com$/ } });
        await Complaint.deleteMany({ title: { $regex: /^V16 Test/ } });

        console.log('\n================================================================');
        console.log(`ALL 16 VERIFICATION AUTHORIZATION & WORKFLOW TESTS PASSED (${passedCount}/16 OK)`);
        console.log('================================================================\n');

    } catch (err) {
        console.error('❌ VERIFICATION TEST FAILED:', err);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
};

run16CasesVerificationTests();
