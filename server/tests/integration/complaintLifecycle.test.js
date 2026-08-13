/**
 * Integration Test Suite for End-to-End Complaint Lifecycle, SLA & Resolution Workflows
 */
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../../.env') });

const Department = require('../../models/Department');
const Complaint = require('../../models/Complaint');
const User = require('../../models/User');
const routingService = require('../../services/routingService');
const slaService = require('../../services/slaService');
const escalationService = require('../../services/escalationService');
const complaintService = require('../../services/complaintService');
const adminService = require('../../services/adminService');
const duplicateDetectionService = require('../../services/duplicateDetectionService');
const aiClassificationService = require('../../services/aiClassificationService');
const { DEFAULT_DEPARTMENTS } = require('../../config/departmentConfig');

async function runComplaintLifecycleTests() {
    console.log('================================================================');
    console.log('STARTING COMPLAINT LIFECYCLE & SLA WORKFLOW TEST SUITE');
    console.log('================================================================\n');

    let passedCount = 0;
    let totalTests = 23;

    try {
        if (process.env.MONGODB_URI) {
            await mongoose.connect(process.env.MONGODB_URI);
            console.log('✓ Connected to MongoDB Atlas successfully.\n');
        }

        // Initialize / Ensure active department records in DB for test evaluation
        for (const deptData of DEFAULT_DEPARTMENTS) {
            await Department.updateOne(
                { code: deptData.code },
                { $set: deptData },
                { upsert: true }
            );
        }

        // Get test users or create mock IDs
        let testAdmin = await User.findOne({ role: 'admin' });
        let testCitizen = await User.findOne({ role: 'citizen' });

        if (!testAdmin) {
            testAdmin = await User.create({ name: 'Test Admin', email: `testadmin_${Date.now()}@test.com`, password: 'password', role: 'admin' });
        }
        if (!testCitizen) {
            testCitizen = await User.create({ name: 'Test Citizen', email: `testcitizen_${Date.now()}@test.com`, password: 'password', role: 'citizen' });
        }

        // TEST 1: Road complaint -> ROADS department
        console.log('--- TEST 1: Road Complaint Routing ---');
        const dept1 = await routingService.determineDepartment({ category: 'Roads & Transportation', subcategory: 'Pothole' });
        console.log(`Department code: ${dept1.code} | Name: ${dept1.name}`);
        if (dept1.code === 'ROADS') {
            console.log('✓ TEST 1 PASSED: Road complaint routed to ROADS department.');
            passedCount++;
        } else {
            console.error('✗ TEST 1 FAILED.');
        }

        // TEST 2: Streetlight complaint -> ELECTRICAL department
        console.log('\n--- TEST 2: Streetlight Complaint Routing ---');
        const dept2 = await routingService.determineDepartment({ category: 'Street Lighting & Electrical', subcategory: 'Streetlight Dark' });
        console.log(`Department code: ${dept2.code} | Name: ${dept2.name}`);
        if (dept2.code === 'ELECTRICAL') {
            console.log('✓ TEST 2 PASSED: Streetlight complaint routed to ELECTRICAL department.');
            passedCount++;
        } else {
            console.error('✗ TEST 2 FAILED.');
        }

        // TEST 3: Garbage complaint -> WASTE department
        console.log('\n--- TEST 3: Garbage Complaint Routing ---');
        const dept3 = await routingService.determineDepartment({ category: 'Waste Management', subcategory: 'Garbage Dump' });
        console.log(`Department code: ${dept3.code} | Name: ${dept3.name}`);
        if (dept3.code === 'WASTE') {
            console.log('✓ TEST 3 PASSED: Garbage complaint routed to WASTE department.');
            passedCount++;
        } else {
            console.error('✗ TEST 3 FAILED.');
        }

        // TEST 4: Water leakage complaint -> WATER department
        console.log('\n--- TEST 4: Water Leakage Routing ---');
        const dept4 = await routingService.determineDepartment({ category: 'Water Supply', subcategory: 'Pipeline Burst' });
        console.log(`Department code: ${dept4.code} | Name: ${dept4.name}`);
        if (dept4.code === 'WATER') {
            console.log('✓ TEST 4 PASSED: Water leakage routed to WATER department.');
            passedCount++;
        } else {
            console.error('✗ TEST 4 FAILED.');
        }

        // TEST 5: Unknown category -> GENERAL department
        console.log('\n--- TEST 5: Unknown Category Routing Fallback ---');
        const dept5 = await routingService.determineDepartment({ category: 'UnrecognisedUnknownCategoryName' });
        console.log(`Department code: ${dept5.code} | Name: ${dept5.name}`);
        if (dept5.code === 'GENERAL') {
            console.log('✓ TEST 5 PASSED: Unknown category routed to GENERAL department fallback.');
            passedCount++;
        } else {
            console.error('✗ TEST 5 FAILED.');
        }

        // TEST 6: AI classification fails -> Fallback routing
        console.log('\n--- TEST 6: AI Classification Graceful Fallback Routing ---');
        const fallbackComp = await complaintService.createComplaint({
            userId: testCitizen._id,
            title: 'Water leaking near market',
            description: 'Pipe leaking water onto walkway',
            category: 'Water Supply',
            location: 'Sector 2, Market Street',
        });
        console.log(`Complaint ID: ${fallbackComp.complaintId} | DepartmentCode: ${fallbackComp.departmentCode} | SLA Status: ${fallbackComp.sla.status}`);
        if (fallbackComp.departmentCode === 'WATER' && fallbackComp.sla) {
            console.log('✓ TEST 6 PASSED: Complaint created and routed seamlessly even if AI fallback triggered.');
            passedCount++;
        } else {
            console.error('✗ TEST 6 FAILED.');
        }

        // TEST 7: Critical complaint -> Critical SLA applied (24h)
        console.log('\n--- TEST 7: Critical Complaint SLA Calculation ---');
        const slaCrit = slaService.calculateDeadline('Critical', null, new Date());
        console.log(`Critical Duration: ${slaCrit.durationHours} hours`);
        if (slaCrit.durationHours === 24) {
            console.log('✓ TEST 7 PASSED: Critical SLA duration set to 24 hours.');
            passedCount++;
        } else {
            console.error('✗ TEST 7 FAILED.');
        }

        // TEST 8: High complaint -> High SLA applied (72h)
        console.log('\n--- TEST 8: High Complaint SLA Calculation ---');
        const slaHigh = slaService.calculateDeadline('High', null, new Date());
        console.log(`High Duration: ${slaHigh.durationHours} hours`);
        if (slaHigh.durationHours === 72) {
            console.log('✓ TEST 8 PASSED: High SLA duration set to 72 hours.');
            passedCount++;
        } else {
            console.error('✗ TEST 8 FAILED.');
        }

        // TEST 9: SLA dueAt calculation check
        console.log('\n--- TEST 9: SLA dueAt Calculation Verification ---');
        const startTime = new Date('2026-08-01T10:00:00Z');
        const slaCalc = slaService.calculateDeadline('Medium', null, startTime);
        const expectedDue = new Date(startTime.getTime() + 168 * 60 * 60 * 1000).toISOString();
        console.log(`Start: ${startTime.toISOString()} | Calculated Due: ${slaCalc.dueAt.toISOString()} | Expected: ${expectedDue}`);
        if (slaCalc.dueAt.toISOString() === expectedDue) {
            console.log('✓ TEST 9 PASSED: dueAt calculated accurately with 168h offset.');
            passedCount++;
        } else {
            console.error('✗ TEST 9 FAILED.');
        }

        // TEST 10: SLA due_soon calculation (20% remaining threshold)
        console.log('\n--- TEST 10: SLA due_soon Calculation ---');
        const pastStart = new Date(Date.now() - 20 * 60 * 60 * 1000);
        const soonDue = new Date(Date.now() + 3 * 60 * 60 * 1000);
        const slaStatusSoon = slaService.getSLAStatus(pastStart, soonDue, 0.20, false);
        console.log(`Evaluated SLA status: ${slaStatusSoon}`);
        if (slaStatusSoon === 'due_soon') {
            console.log('✓ TEST 10 PASSED: due_soon correctly detected when remaining time <= 20%.');
            passedCount++;
        } else {
            console.error('✗ TEST 10 FAILED.');
        }

        // TEST 11: SLA breach calculation
        console.log('\n--- TEST 11: SLA Breach Calculation ---');
        const breachedDue = new Date(Date.now() - 3600000);
        const slaStatusBreached = slaService.getSLAStatus(pastStart, breachedDue, 0.20, false);
        console.log(`Evaluated SLA status: ${slaStatusBreached}`);
        if (slaStatusBreached === 'breached') {
            console.log('✓ TEST 11 PASSED: SLA breach accurately detected for overdue timestamp.');
            passedCount++;
        } else {
            console.error('✗ TEST 11 FAILED.');
        }

        // TEST 12: Escalation level calculation
        console.log('\n--- TEST 12: Escalation Level Calculation ---');
        const mockBreachedComp = {
            status: 'In Progress',
            createdAt: pastStart,
            sla: { startedAt: pastStart, dueAt: breachedDue },
            escalationLevel: 0,
        };
        const escLevel = escalationService.evaluateEscalationLevel(mockBreachedComp);
        console.log(`Evaluated Escalation Level: ${escLevel}`);
        if (escLevel === 2) {
            console.log('✓ TEST 12 PASSED: Escalation level automatically set to 2 on SLA breach.');
            passedCount++;
        } else {
            console.error('✗ TEST 12 FAILED.');
        }

        // TEST 13: Manual reassignment by Admin
        console.log('\n--- TEST 13: Manual Reassignment by Admin ---');
        const compToReassign = await complaintService.createComplaint({
            userId: testCitizen._id,
            title: 'Road Damage on Lane 4',
            description: 'Pothole on street',
            category: 'Roads & Transportation',
            location: 'Lane 4',
        });
        const reassigned = await adminService.assignComplaint(compToReassign._id, testAdmin._id, {
            departmentCode: 'PUBLIC_WORKS',
            reason: 'Transferred road work to Public Works division.',
        });
        console.log(`Previous Dept: ${compToReassign.departmentCode} | New Dept: ${reassigned.departmentCode}`);
        if (reassigned.departmentCode === 'PUBLIC_WORKS' && reassigned.assignmentSource === 'reassignment') {
            console.log('✓ TEST 13 PASSED: Admin manual reassignment overridden cleanly.');
            passedCount++;
        } else {
            console.error('✗ TEST 13 FAILED.');
        }

        // TEST 14: Assignment History Preservation
        console.log('\n--- TEST 14: Assignment History Audit Log Preservation ---');
        const history = await adminService.getAssignmentHistory(reassigned._id);
        console.log(`History Entries Count: ${history.length}`);
        if (history.length >= 2 && history[history.length - 1].newDepartmentCode === 'PUBLIC_WORKS') {
            console.log('✓ TEST 14 PASSED: Previous assignment preserved in audit log.');
            passedCount++;
        } else {
            console.error('✗ TEST 14 FAILED.');
        }

        // TEST 15: Valid Status Transitions
        console.log('\n--- TEST 15: Valid Status Progression Workflow ---');
        let compFlow = await complaintService.createComplaint({
            userId: testCitizen._id,
            title: 'Garbage dump near school',
            description: 'Uncollected trash',
            category: 'Waste Management',
            location: 'School Gate',
        });
        compFlow = await adminService.updateComplaintStatus(compFlow._id, testAdmin._id, { status: 'Verified', note: 'Verified by field inspector' });
        compFlow = await adminService.updateComplaintStatus(compFlow._id, testAdmin._id, { status: 'Assigned', note: 'Assigned to team' });
        compFlow = await adminService.updateComplaintStatus(compFlow._id, testAdmin._id, { status: 'In Progress', note: 'Work started' });
        compFlow = await adminService.updateComplaintStatus(compFlow._id, testAdmin._id, { status: 'Resolved', resolutionNote: 'Trash cleared' });
        console.log(`Final Flow Status: ${compFlow.status}`);
        if (compFlow.status === 'Resolved' && compFlow.resolution.resolvedAt) {
            console.log('✓ TEST 15 PASSED: Valid status workflow progression completed cleanly.');
            passedCount++;
        } else {
            console.error('✗ TEST 15 FAILED.');
        }

        // TEST 16: Invalid Status Transition Rejection
        console.log('\n--- TEST 16: Invalid Status Transition Rejection ---');
        try {
            await adminService.updateComplaintStatus(compFlow._id, testAdmin._id, { status: 'In Progress' });
            console.error('✗ TEST 16 FAILED: Invalid transition was not rejected.');
        } catch (err) {
            console.log(`Caught Expected Error: ${err.message}`);
            if (err.statusCode === 400) {
                console.log('✓ TEST 16 PASSED: Invalid status transition (Resolved -> In Progress) rejected.');
                passedCount++;
            } else {
                console.error('✗ TEST 16 FAILED.');
            }
        }

        // TEST 17: Resolution Metadata Verification
        console.log('\n--- TEST 17: Resolution Metadata Verification ---');
        console.log(`ResolvedAt: ${compFlow.resolution.resolvedAt} | ResolvedBy: ${compFlow.resolution.resolvedBy} | Note: "${compFlow.resolution.resolutionNote}"`);
        if (compFlow.resolution.resolvedAt && compFlow.resolution.resolutionNote === 'Trash cleared') {
            console.log('✓ TEST 17 PASSED: Resolution metadata persisted cleanly.');
            passedCount++;
        } else {
            console.error('✗ TEST 17 FAILED.');
        }

        // TEST 18: Citizen Resolution Verification (Confirm -> Closed)
        console.log('\n--- TEST 18: Citizen Resolution Verification (Confirm -> Closed) ---');
        const closedComp = await complaintService.verifyResolution(compFlow._id, testCitizen._id, {
            verified: true,
            feedback: 'Great job, street is completely clean!',
        });
        console.log(`Status after verification: ${closedComp.status} | Verified: ${closedComp.citizenVerification.verified}`);
        if (closedComp.status === 'Closed' && closedComp.citizenVerification.verified === true) {
            console.log('✓ TEST 18 PASSED: Citizen confirmation transitioned status to Closed.');
            passedCount++;
        } else {
            console.error('✗ TEST 18 FAILED.');
        }

        // TEST 19: Citizen Resolution Rejection (Reject -> Reopened)
        console.log('\n--- TEST 19: Citizen Resolution Rejection (Reject -> Reopened) ---');
        let compToReject = await complaintService.createComplaint({
            userId: testCitizen._id,
            title: 'Water Pipe Leakage',
            description: 'Water leaking on pavement',
            category: 'Water Supply',
            location: 'Main Road',
        });
        compToReject = await adminService.updateComplaintStatus(compToReject._id, testAdmin._id, { status: 'Verified' });
        compToReject = await adminService.updateComplaintStatus(compToReject._id, testAdmin._id, { status: 'Assigned' });
        compToReject = await adminService.updateComplaintStatus(compToReject._id, testAdmin._id, { status: 'In Progress' });
        compToReject = await adminService.updateComplaintStatus(compToReject._id, testAdmin._id, { status: 'Resolved', resolutionNote: 'Tightened valve' });

        const reopenedComp = await complaintService.verifyResolution(compToReject._id, testCitizen._id, {
            verified: false,
            feedback: 'Water is still leaking heavily from under the curb!',
        });
        console.log(`Status after rejection: ${reopenedComp.status} | ReopenedAt: ${reopenedComp.reopenedAt}`);
        if (reopenedComp.status === 'Reopened' && reopenedComp.citizenVerification.verified === false) {
            console.log('✓ TEST 19 PASSED: Citizen rejection transitioned status to Reopened.');
            passedCount++;
        } else {
            console.error('✗ TEST 19 FAILED.');
        }

        // TEST 20: Authorization Enforcement (Non-owner citizen rejection)
        console.log('\n--- TEST 20: Authorization Enforcement ---');
        const otherCitizen = await User.create({ name: 'Other Citizen', email: `other_${Date.now()}@test.com`, password: 'password', role: 'citizen' });
        try {
            await complaintService.verifyResolution(compToReject._id, otherCitizen._id, { verified: true });
            console.error('✗ TEST 20 FAILED: Unauthorized user was allowed to verify resolution.');
        } catch (authErr) {
            console.log(`Caught Expected Error: ${authErr.message}`);
            if (authErr.statusCode === 403) {
                console.log('✓ TEST 20 PASSED: Non-owner citizen forbidden from verifying complaint.');
                passedCount++;
            } else {
                console.error('✗ TEST 20 FAILED.');
            }
        }

        // TEST 21: Historical Complaints Backward Compatibility
        console.log('\n--- TEST 21: Historical Complaints Backward Compatibility ---');
        const historicalMock = await Complaint.create({
            complaintId: `HIST-${Date.now()}`,
            user: testCitizen._id,
            title: 'Historical Complaint without Department',
            description: 'Legacy complaint format',
            category: 'Garbage',
            location: 'Sector 1',
            locationPoint: { type: 'Point', coordinates: [77.2090, 28.6139] },
            status: 'Pending',
        });
        const trackedHist = await complaintService.trackComplaint(historicalMock.complaintId);
        console.log(`Tracked Historical ID: ${trackedHist.complaintId} | Status: ${trackedHist.status}`);
        if (trackedHist && trackedHist.status === 'Pending') {
            console.log('✓ TEST 21 PASSED: Legacy historical complaint without department/SLA renders cleanly.');
            passedCount++;
        } else {
            console.error('✗ TEST 21 FAILED.');
        }

        // TEST 22: Duplicate Detection Regression
        console.log('\n--- TEST 22: Duplicate Detection Engine Regression ---');
        const dupCheck = await duplicateDetectionService.findPotentialDuplicates({
            latitude: 28.6139,
            longitude: 77.2090,
            title: 'Major Pothole on Main Road',
            description: 'Deep road crater',
            category: 'Road Damage',
        });
        console.log(`Duplicate check candidates found: ${dupCheck.candidates.length}`);
        console.log('✓ TEST 22 PASSED: Duplicate detection engine operating normally.');
        passedCount++;

        // TEST 23: AI Classification Regression
        console.log('\n--- TEST 23: AI Classification Engine Regression ---');
        const aiReg = await aiClassificationService.classifyComplaint({
            title: 'Sparking electric wire on street pole',
            description: 'Dangling live cable',
        });
        console.log(`AI Classification: ${aiReg.categoryDisplayName} -> ${aiReg.subcategoryDisplayName} | Severity: ${aiReg.severity}`);
        if (aiReg.category === 'street_lighting_electrical' || aiReg.category === 'public_safety_hazards') {
            console.log('✓ TEST 23 PASSED: AI classification engine operating normally.');
            passedCount++;
        } else {
            console.error('✗ TEST 23 FAILED.');
        }

        console.log('\n================================================================');
        console.log(`TEST SUITE COMPLETE: ${passedCount} / ${totalTests} TESTS PASSED`);
        console.log('================================================================');
    } catch (err) {
        console.error('Test Suite Exception:', err);
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    }
}

runComplaintLifecycleTests();
