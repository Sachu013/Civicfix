/**
 * Phase 7: Notification & Communication System Test Suite
 * Validates in-app notification dispatching, role-based recipient routing, SLA alert deduplication,
 * read/unread persistence, strict IDOR protection, phone privacy, and Super Admin monitor-only compliance.
 */
const assert = require('assert');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const User = require('../../models/User');
const Complaint = require('../../models/Complaint');
const Department = require('../../models/Department');
const Notification = require('../../models/Notification');
const { NOTIFICATION_TYPES } = require('../../config/notificationTypes');

const notificationController = require('../../controllers/notificationController');
const notificationService = require('../../services/notificationService');
const complaintService = require('../../services/complaintService');
const adminController = require('../../controllers/adminController');
const departmentDashboardController = require('../../controllers/departmentDashboardController');
const verificationController = require('../../controllers/verificationController');
const { DEFAULT_DEPARTMENTS } = require('../../config/departmentConfig');
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

const runPhase7NotificationTests = async () => {
    console.log('================================================================');
    console.log('STARTING PHASE 7: NOTIFICATION & COMMUNICATION SYSTEM TEST SUITE');
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

        for (const dept of DEFAULT_DEPARTMENTS) {
            await Department.findOneAndUpdate(
                { code: dept.code },
                { ...dept },
                { upsert: true, new: true }
            );
        }

        const timestamp = Date.now();

        // 1. Setup Test Users
        const citizen1 = await User.create({
            name: `P7 Citizen 1 ${timestamp}`,
            email: `p7citizen1_${timestamp}@civicfix.org`,
            phone: `+9198765${timestamp.toString().slice(-5)}`,
            password: 'Password123!',
            role: 'citizen',
        });

        const citizen2 = await User.create({
            name: `P7 Citizen 2 ${timestamp}`,
            email: `p7citizen2_${timestamp}@civicfix.org`,
            phone: `+9198764${timestamp.toString().slice(-5)}`,
            password: 'Password123!',
            role: 'citizen',
        });

        const roadsHead = await User.create({
            name: `P7 Roads Head ${timestamp}`,
            email: `p7roadshead_${timestamp}@civicfix.org`,
            password: 'Password123!',
            role: 'department_head',
            departmentCode: 'ROADS',
        });

        const waterHead = await User.create({
            name: `P7 Water Head ${timestamp}`,
            email: `p7waterhead_${timestamp}@civicfix.org`,
            password: 'Password123!',
            role: 'department_head',
            departmentCode: 'WATER',
        });

        const roadsVerifier1 = await User.create({
            name: `P7 Roads Verifier 1 ${timestamp}`,
            email: `p7verifier1_${timestamp}@civicfix.org`,
            password: 'Password123!',
            role: 'verifier',
            departmentCode: 'ROADS',
        });

        const roadsVerifier2 = await User.create({
            name: `P7 Roads Verifier 2 ${timestamp}`,
            email: `p7verifier2_${timestamp}@civicfix.org`,
            password: 'Password123!',
            role: 'verifier',
            departmentCode: 'ROADS',
        });

        const waterVerifier = await User.create({
            name: `P7 Water Verifier ${timestamp}`,
            email: `p7waterverifier_${timestamp}@civicfix.org`,
            password: 'Password123!',
            role: 'verifier',
            departmentCode: 'WATER',
        });

        const superAdmin = await User.create({
            name: `P7 SuperAdmin ${timestamp}`,
            email: `p7superadmin_${timestamp}@civicfix.org`,
            password: 'Password123!',
            role: 'super_admin',
        });

        // 2. Setup Complaint
        const complaint = await complaintService.createComplaint({
            userId: citizen1._id,
            title: 'Deep Pothole on Sector 5 Main Road',
            description: 'Severe pothole on the main road causing severe traffic congestion and vehicle damage.',
            category: 'Roads & Transportation',
            subcategory: 'Pothole',
            severity: 'High',
            latitude: 28.6139,
            longitude: 77.2090,
            location: 'Sector 5, Main Avenue',
        });

        // Test 1: Citizen receives complaint submission notification
        console.log('Test 1: Citizen receives complaint submission notification');
        const notifs1 = await Notification.find({ recipient: citizen1._id, type: NOTIFICATION_TYPES.COMPLAINT_SUBMITTED });
        assert.strictEqual(notifs1.length, 1);
        assert.strictEqual(notifs1[0].complaintId, complaint.complaintId);
        assert.strictEqual(notifs1[0].title.includes(complaint.complaintId), true);
        console.log('✔ Passed Scenario 1\n');
        passedCount++;

        // Test 2: Citizen cannot access another user\'s notification (IDOR Protection)
        console.log('Test 2: Citizen cannot access another user\'s notification (IDOR Protection)');
        const citizen2Req = { user: citizen2, params: { id: notifs1[0]._id } };
        const res2 = await executeController(notificationController.markAsRead, citizen2Req);
        assert.strictEqual(res2.status, 404); // Forbidden / Not found for another user
        console.log('✔ Passed Scenario 2\n');
        passedCount++;

        // Test 3: Department Head receives new department complaint notification
        console.log('Test 3: Department Head receives new department complaint notification');
        const notifs3 = await Notification.find({ recipient: roadsHead._id, type: NOTIFICATION_TYPES.COMPLAINT_ROUTED });
        assert.strictEqual(notifs3.length, 1);
        assert.strictEqual(notifs3[0].departmentCode, 'ROADS');

        const waterNotifs = await Notification.find({ recipient: waterHead._id, complaint: complaint._id });
        assert.strictEqual(waterNotifs.length, 0); // Water head received no notification for ROADS complaint
        console.log('✔ Passed Scenario 3\n');
        passedCount++;

        // Test 4: Verifier receives assignment notification
        console.log('Test 4: Verifier receives assignment notification');
        const res4 = await executeController(departmentDashboardController.assignComplaintToStaff, {
            user: roadsHead,
            body: { complaintId: complaint._id, staffId: roadsVerifier1._id, reason: 'Assigned for field inspection' },
        });
        assert.strictEqual(res4.status, 200);

        const verifierNotifs = await Notification.find({ recipient: roadsVerifier1._id, type: NOTIFICATION_TYPES.VERIFIER_ASSIGNED });
        assert.strictEqual(verifierNotifs.length, 1);
        assert.strictEqual(verifierNotifs[0].complaintId, complaint.complaintId);
        console.log('✔ Passed Scenario 4\n');
        passedCount++;

        // Test 5: Verifier 2 does NOT receive Verifier 1\'s notification
        console.log('Test 5: Verifier 2 does not receive Verifier 1\'s assignment notification');
        const verifier2Notifs = await Notification.find({ recipient: roadsVerifier2._id, complaint: complaint._id });
        assert.strictEqual(verifier2Notifs.length, 0);
        console.log('✔ Passed Scenario 5\n');
        passedCount++;

        // Test 6: Department Head receives verifier report notification
        console.log('Test 6: Department Head receives verifier field report notification');
        const reportData = {
            findings: 'Verified broken bulb hardware on site.',
            outcome: 'VERIFIED_CONFIRMED',
            contactWithCitizen: true,
            locationVerified: true,
            evidence: [],
        };
        await notificationService.notifyOnVerificationReport({ complaint, verifierId: roadsVerifier1._id, report: reportData });

        const headReportNotifs = await Notification.find({ recipient: roadsHead._id, type: NOTIFICATION_TYPES.VERIFICATION_REPORT_SUBMITTED });
        assert.strictEqual(headReportNotifs.length, 1);
        assert.strictEqual(headReportNotifs[0].message.includes('VERIFIED CONFIRMED'), true);
        console.log('✔ Passed Scenario 6\n');
        passedCount++;

        // Test 7: Citizen receives resolution notification
        console.log('Test 7: Citizen receives resolution notification');
        await adminServiceUpdateStatus(complaint._id, roadsHead._id, 'Resolved', 'Issue repaired by electrical team.');
        const citizenResolutionNotifs = await Notification.find({ recipient: citizen1._id, type: NOTIFICATION_TYPES.STATUS_RESOLVED });
        assert.strictEqual(citizenResolutionNotifs.length, 1);
        assert.strictEqual(citizenResolutionNotifs[0].title.includes('Resolved'), true);
        console.log('✔ Passed Scenario 7\n');
        passedCount++;

        // Test 8: Citizen confirmation generates appropriate Closed notification
        console.log('Test 8: Citizen confirmation generates Closed notification for Department Head');
        await complaintService.verifyResolution(complaint._id, citizen1._id, { verified: true, feedback: 'Great job repairing the light!' });
        const closedNotifs = await Notification.find({ recipient: roadsHead._id, type: NOTIFICATION_TYPES.CITIZEN_CONFIRMED_CLOSED });
        assert.strictEqual(closedNotifs.length, 1);
        console.log('✔ Passed Scenario 8\n');
        passedCount++;

        // Test 9: Citizen reopening generates Department Head & Verifier notification
        console.log('Test 9: Citizen reopening generates Reopened notification for Department Head & Verifier');
        const complaint2 = await complaintService.createComplaint({
            userId: citizen1._id,
            title: 'Water Pipe Leakage',
            description: 'Water leaking heavily.',
            category: 'Water Supply',
            severity: 'High',
            latitude: 28.6139,
            longitude: 77.2090,
            location: 'Sector 5',
        });
        await executeController(departmentDashboardController.assignComplaintToStaff, {
            user: waterHead,
            body: { complaintId: complaint2._id, staffId: waterVerifier._id },
        });
        await complaintService.reopenComplaint(complaint2._id, citizen1._id, 'Still leaking.');

        const reopenHeadNotifs = await Notification.find({ recipient: waterHead._id, complaint: complaint2._id, type: NOTIFICATION_TYPES.CITIZEN_REJECTED_REOPENED });
        assert.strictEqual(reopenHeadNotifs.length, 1);
        assert.strictEqual(reopenHeadNotifs[0].message.includes('Still leaking'), true);
        console.log('✔ Passed Scenario 9\n');
        passedCount++;

        // Test 10: SLA warning notification generated correctly
        console.log('Test 10: SLA warning notification generated correctly');
        await notificationService.notifyOnSLAEvent({ complaint, slaType: 'due_soon' });
        const slaWarnNotifs = await Notification.find({ recipient: roadsHead._id, type: NOTIFICATION_TYPES.SLA_WARNING });
        assert.strictEqual(slaWarnNotifs.length, 1);
        console.log('✔ Passed Scenario 10\n');
        passedCount++;

        // Test 11: SLA breach notification generated correctly
        console.log('Test 11: SLA breach notification generated correctly');
        await notificationService.notifyOnSLAEvent({ complaint, slaType: 'breached' });
        const slaBreachNotifs = await Notification.find({ recipient: roadsHead._id, type: NOTIFICATION_TYPES.SLA_BREACHED });
        assert.strictEqual(slaBreachNotifs.length, 1);
        console.log('✔ Passed Scenario 11\n');
        passedCount++;

        // Test 12: Duplicate SLA notification is prevented
        console.log('Test 12: Duplicate SLA notification is prevented');
        await notificationService.notifyOnSLAEvent({ complaint, slaType: 'breached' });
        const slaBreachNotifsAfter = await Notification.find({ recipient: roadsHead._id, type: NOTIFICATION_TYPES.SLA_BREACHED });
        assert.strictEqual(slaBreachNotifsAfter.length, 1); // Length remains 1, no duplicate created!
        console.log('✔ Passed Scenario 12\n');
        passedCount++;

        // Test 13: Super Admin remains monitor-only
        console.log('Test 13: Super Admin notification actions cannot bypass write blocks');
        const res13 = await executeController(adminController.updateComplaintStatus, {
            user: superAdmin,
            params: { id: complaint._id },
            body: { status: 'Resolved' },
        });
        assert.strictEqual(res13.status, 403);
        console.log('✔ Passed Scenario 13\n');
        passedCount++;

        // Test 14: Notification does not expose citizen phone number
        console.log('Test 14: Notification title/message does not expose citizen phone number');
        const citizenNotifDoc = await Notification.findOne({ recipient: citizen1._id });
        const sanitized = sanitizePhonePrivacy(citizenNotifDoc.toObject(), superAdmin);
        assert.strictEqual(sanitized.message.includes(citizen1.phone), false);
        console.log('✔ Passed Scenario 14\n');
        passedCount++;

        // Test 15: Notification read state persists in MongoDB
        console.log('Test 15: Notification read state persists in MongoDB');
        const unreadNotif = await Notification.findOne({ recipient: citizen1._id, isRead: false });
        assert.strictEqual(!!unreadNotif, true);

        const res15 = await executeController(notificationController.markAsRead, {
            user: citizen1,
            params: { id: unreadNotif._id },
        });
        assert.strictEqual(res15.status, 200);
        assert.strictEqual(res15.data.isRead, true);

        const dbNotif = await Notification.findById(unreadNotif._id);
        assert.strictEqual(dbNotif.isRead, true);
        assert.strictEqual(!!dbNotif.readAt, true);
        console.log('✔ Passed Scenario 15\n');
        passedCount++;

        // Test 16: Mark all read works correctly
        console.log('Test 16: Mark all read updates all unread notifications for recipient');
        const res16 = await executeController(notificationController.markAllAsRead, {
            user: roadsHead,
        });
        assert.strictEqual(res16.status, 200);

        const remainingUnreadHead = await Notification.countDocuments({ recipient: roadsHead._id, isRead: false });
        assert.strictEqual(remainingUnreadHead, 0);
        console.log('✔ Passed Scenario 16\n');
        passedCount++;

        // Test 17: Unauthorized notification access returns 404/403
        console.log('Test 17: Unauthorized notification read request rejected');
        const waterNotif = await Notification.findOne({ recipient: waterHead._id });
        if (waterNotif) {
            const res17 = await executeController(notificationController.markAsRead, {
                user: citizen1,
                params: { id: waterNotif._id },
            });
            assert.strictEqual(res17.status, 404);
        }
        console.log('✔ Passed Scenario 17\n');
        passedCount++;

        // Test 18: Complaint-linked notification respects complaint access control
        console.log('Test 18: Complaint-linked notification respects complaint access control');
        const { verifyComplaintDepartmentAccess } = require('../../controllers/adminController');
        let accessDenied = false;
        try {
            verifyComplaintDepartmentAccess({ user: roadsVerifier2 }, complaint2); // complaint2 belongs to WATER
        } catch (err) {
            if (err.statusCode === 403 || err.status === 403) {
                accessDenied = true;
            }
        }
        assert.strictEqual(accessDenied, true);
        console.log('✔ Passed Scenario 18\n');
        passedCount++;

        // Cleanup
        await Complaint.deleteMany({ _id: { $in: [complaint._id, complaint2._id] } });
        await Notification.deleteMany({ recipient: { $in: [citizen1._id, citizen2._id, roadsHead._id, waterHead._id, roadsVerifier1._id, roadsVerifier2._id, superAdmin._id] } });
        await User.deleteMany({ _id: { $in: [citizen1._id, citizen2._id, roadsHead._id, waterHead._id, roadsVerifier1._id, roadsVerifier2._id, superAdmin._id] } });

        console.log('================================================================');
        console.log(`PHASE 7 NOTIFICATION TEST SUITE COMPLETED: ${passedCount}/18 SCENARIOS PASSED`);
        console.log('================================================================\n');

        return true;
    } catch (err) {
        console.error('❌ PHASE 7 NOTIFICATION TEST SUITE FAILED:', err);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
};

// Helper for status update in test
const adminServiceUpdateStatus = async (complaintId, adminId, status, note) => {
    const adminService = require('../../services/adminService');
    return await adminService.updateComplaintStatus(complaintId, adminId, { status, note });
};

if (require.main === module) {
    runPhase7NotificationTests();
}

module.exports = runPhase7NotificationTests;
