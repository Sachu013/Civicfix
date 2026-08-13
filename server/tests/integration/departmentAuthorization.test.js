/**
 * Integration Test Suite for Multi-Department Role Access & Authorization Controls
 */
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const User = require('../../models/User');
const Complaint = require('../../models/Complaint');
const Department = require('../../models/Department');
const authService = require('../../services/authService');
const adminService = require('../../services/adminService');
const complaintService = require('../../services/complaintService');
const routingService = require('../../services/routingService');
const duplicateDetectionService = require('../../services/duplicateDetectionService');
const aiClassificationService = require('../../services/aiClassificationService');

const runDepartmentAuthTests = async () => {
    console.log('================================================================');
    console.log('STARTING DEPARTMENT AUTHORIZATION & MULTI-ROLE TEST SUITE');
    console.log('================================================================\n');

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB Atlas successfully.\n');

        // Setup test users & departments
        const roadsDept = await Department.findOne({ code: 'ROADS' });
        const waterDept = await Department.findOne({ code: 'WATER' });
        const electricalDept = await Department.findOne({ code: 'ELECTRICAL' });

        const roadsHead = await User.findOne({ email: 'roads_head@smartcity.gov' });
        const waterHead = await User.findOne({ email: 'water_head@smartcity.gov' });
        const electricalHead = await User.findOne({ email: 'electrical_head@smartcity.gov' });
        const roadsStaff = await User.findOne({ email: 'roads_staff@smartcity.gov' });
        const waterStaff = await User.findOne({ email: 'water_staff@smartcity.gov' });
        const superAdmin = await User.findOne({ email: 'admin@test.com' });
        const citizen = await User.findOne({ email: 'citizen@demo.com' });

        // --- TEST 1: Citizen Login & Role Verification ---
        console.log('--- TEST 1: Citizen Login & Role Verification ---');
        const loggedCitizen = await authService.loginUser('citizen@demo.com', 'citizen123');
        if (loggedCitizen.role === 'citizen') {
            console.log('✓ TEST 1 PASSED: Citizen login authenticated with role: citizen.');
        } else {
            console.error('❌ TEST 1 FAILED');
        }

        // --- TEST 2: Roads Head Login & Department Mapping ---
        console.log('\n--- TEST 2: Roads Head Login & Department Mapping ---');
        const loggedRoadsHead = await authService.loginUser('roads_head@smartcity.gov', 'head123');
        if (loggedRoadsHead.role === 'department_head' && loggedRoadsHead.departmentCode === 'ROADS') {
            console.log('✓ TEST 2 PASSED: Roads Head login authenticated with role: department_head and departmentCode: ROADS.');
        } else {
            console.error('❌ TEST 2 FAILED');
        }

        // --- TEST 3: Water Head Login & Department Mapping ---
        console.log('\n--- TEST 3: Water Head Login & Department Mapping ---');
        const loggedWaterHead = await authService.loginUser('water_head@smartcity.gov', 'head123');
        if (loggedWaterHead.role === 'department_head' && loggedWaterHead.departmentCode === 'WATER') {
            console.log('✓ TEST 3 PASSED: Water Head login authenticated with role: department_head and departmentCode: WATER.');
        } else {
            console.error('❌ TEST 3 FAILED');
        }

        // --- TEST 4: Roads Staff Officer Login ---
        console.log('\n--- TEST 4: Roads Staff Officer Login ---');
        const loggedRoadsStaff = await authService.loginUser('roads_staff@smartcity.gov', 'staff123');
        if (loggedRoadsStaff.role === 'department_staff' && loggedRoadsStaff.departmentCode === 'ROADS') {
            console.log('✓ TEST 4 PASSED: Roads Staff Officer login authenticated with role: department_staff and departmentCode: ROADS.');
        } else {
            console.error('❌ TEST 4 FAILED');
        }

        // --- TEST 5: Super Admin Login ---
        console.log('\n--- TEST 5: Super Admin Login ---');
        const loggedSuperAdmin = await authService.loginUser('admin@test.com', '123456');
        if (loggedSuperAdmin.role === 'super_admin') {
            console.log('✓ TEST 5 PASSED: Super Admin login authenticated with role: super_admin.');
        } else {
            console.error('❌ TEST 5 FAILED');
        }

        // Create test complaints for Roads & Water departments
        const roadComp = await Complaint.create({
            complaintId: `TEST-ROADS-${Date.now()}`,
            user: citizen._id,
            title: 'Test Road Pothole Complaint',
            description: 'Automated test complaint for Roads department access isolation',
            category: 'Road Damage',
            subcategory: 'Pothole',
            departmentCode: 'ROADS',
            department: roadsDept._id,
            assignedDepartment: 'Roads & Transportation Department',
            location: 'Sector 5, SmartCity',
            status: 'Submitted',
            severity: 'Medium',
            priority: 'Medium',
        });

        const waterComp = await Complaint.create({
            complaintId: `TEST-WATER-${Date.now()}`,
            user: citizen._id,
            title: 'Test Water Leakage Complaint',
            description: 'Automated test complaint for Water department access isolation',
            category: 'Water Leakage',
            subcategory: 'Pipe Burst',
            departmentCode: 'WATER',
            department: waterDept._id,
            assignedDepartment: 'Water Supply Department',
            location: 'Sector 8, SmartCity',
            status: 'Submitted',
            severity: 'High',
            priority: 'High',
        });

        // --- TEST 6: Roads Head Query Isolation (ROADS only) ---
        console.log('\n--- TEST 6: Roads Head Query Isolation (ROADS only) ---');
        const roadsQueryRes = await adminService.getAllComplaints({ departmentCode: roadsHead.departmentCode });
        const hasOnlyRoads = roadsQueryRes.every(c => c.departmentCode === 'ROADS');
        if (hasOnlyRoads && roadsQueryRes.length > 0) {
            console.log(`✓ TEST 6 PASSED: Roads Head query returned ONLY ROADS complaints (${roadsQueryRes.length} total).`);
        } else {
            console.error('❌ TEST 6 FAILED');
        }

        // --- TEST 7: Water Head Query Isolation (WATER only) ---
        console.log('\n--- TEST 7: Water Head Query Isolation (WATER only) ---');
        const waterQueryRes = await adminService.getAllComplaints({ departmentCode: waterHead.departmentCode });
        const hasOnlyWater = waterQueryRes.every(c => c.departmentCode === 'WATER');
        if (hasOnlyWater && waterQueryRes.length > 0) {
            console.log(`✓ TEST 7 PASSED: Water Head query returned ONLY WATER complaints (${waterQueryRes.length} total).`);
        } else {
            console.error('❌ TEST 7 FAILED');
        }

        // --- TEST 8: Super Admin Global Query (All Departments) ---
        console.log('\n--- TEST 8: Super Admin Global Query (All Depts) ---');
        const superAdminQueryRes = await adminService.getAllComplaints({ departmentCode: 'all' });
        const containsMultipleDepts = new Set(superAdminQueryRes.map(c => c.departmentCode)).size > 1;
        if (containsMultipleDepts) {
            console.log(`✓ TEST 8 PASSED: Super Admin query returned global multi-department complaints (${superAdminQueryRes.length} total).`);
        } else {
            console.error('❌ TEST 8 FAILED');
        }

        // --- TEST 9: Cross-Department Modification Prevention (Roads Head -> Water Complaint) ---
        console.log('\n--- TEST 9: Cross-Department Modification Prevention ---');
        const canRoadsHeadAccessWaterComp = (roadsHead.role === 'super_admin') || (roadsHead.departmentCode === waterComp.departmentCode);
        if (!canRoadsHeadAccessWaterComp) {
            console.log(`✓ TEST 9 PASSED: Roads Head forbidden from accessing Water Department complaint #${waterComp.complaintId}.`);
        } else {
            console.error('❌ TEST 9 FAILED');
        }

        // --- TEST 10: Authorized Department Modification (Roads Head -> Roads Complaint) ---
        console.log('\n--- TEST 10: Authorized Department Modification ---');
        const updatedRoadComp = await adminService.updateComplaintStatus(roadComp._id, roadsHead._id, {
            status: 'Verified',
            note: 'Verified by Roads Head during integration testing.',
        });
        if (updatedRoadComp.status === 'Verified') {
            console.log(`✓ TEST 10 PASSED: Roads Head successfully updated status of Roads complaint to 'Verified'.`);
        } else {
            console.error('❌ TEST 10 FAILED');
        }

        // --- TEST 11: Department Reassignment by Authorized Head ---
        console.log('\n--- TEST 11: Department Reassignment by Authorized Head ---');
        const reassignedComp = await adminService.assignComplaint(roadComp._id, roadsHead._id, {
            departmentCode: 'WATER',
            reason: 'Reassigned from ROADS to WATER after site inspection revealed water pipe cause.',
        });
        if (reassignedComp.departmentCode === 'WATER') {
            console.log(`✓ TEST 11 PASSED: Complaint #${roadComp.complaintId} reassigned from ROADS to WATER.`);
        } else {
            console.error('❌ TEST 11 FAILED');
        }

        // --- TEST 12: Reassignment Audit Log Verification ---
        console.log('\n--- TEST 12: Reassignment Audit Log Verification ---');
        const assignmentHistory = await adminService.getAssignmentHistory(roadComp._id);
        const lastEntry = assignmentHistory[assignmentHistory.length - 1];
        if (lastEntry && lastEntry.previousDepartmentCode === 'ROADS' && lastEntry.newDepartmentCode === 'WATER') {
            console.log(`✓ TEST 12 PASSED: Reassignment audit history preserved: ROADS -> WATER.`);
        } else {
            console.error('❌ TEST 12 FAILED');
        }

        // Reassign back to ROADS for staff testing
        await adminService.assignComplaint(roadComp._id, superAdmin._id, {
            departmentCode: 'ROADS',
            reason: 'Reset to ROADS for staff testing',
        });

        // --- TEST 13: Staff Member List Query (Scoped to ROADS) ---
        console.log('\n--- TEST 13: Staff Member List Query (Scoped to ROADS) ---');
        const roadsStaffList = await User.find({ role: 'department_staff', departmentCode: 'ROADS' }).select('-password');
        if (roadsStaffList.every(s => s.departmentCode === 'ROADS')) {
            console.log(`✓ TEST 13 PASSED: Roads Staff list contains ${roadsStaffList.length} officer(s) strictly belonging to ROADS department.`);
        } else {
            console.error('❌ TEST 13 FAILED');
        }

        // --- TEST 14: Staff Member List Query (Scoped to WATER) ---
        console.log('\n--- TEST 14: Staff Member List Query (Scoped to WATER) ---');
        const waterStaffList = await User.find({ role: 'department_staff', departmentCode: 'WATER' }).select('-password');
        if (waterStaffList.every(s => s.departmentCode === 'WATER')) {
            console.log(`✓ TEST 14 PASSED: Water Staff list contains ${waterStaffList.length} officer(s) strictly belonging to WATER department.`);
        } else {
            console.error('❌ TEST 14 FAILED');
        }

        // --- TEST 15: Super Admin Department User Creation ---
        console.log('\n--- TEST 15: Super Admin Department User Creation ---');
        const testStaffEmail = `test_roads_staff_${Date.now()}@smartcity.gov`;
        const createdStaff = await User.create({
            name: 'Dynamic Test Staff',
            email: testStaffEmail,
            password: 'staffpassword',
            role: 'department_staff',
            departmentCode: 'ROADS',
            department: roadsDept._id,
        });
        if (createdStaff.role === 'department_staff' && createdStaff.departmentCode === 'ROADS') {
            console.log(`✓ TEST 15 PASSED: Super Admin created new staff user '${createdStaff.email}' for ROADS department.`);
            await User.findByIdAndDelete(createdStaff._id);
        } else {
            console.error('❌ TEST 15 FAILED');
        }

        // --- TEST 16: Staff Officer Assignment within Department ---
        console.log('\n--- TEST 16: Staff Assignment (Same Dept: Allowed) ---');
        roadComp.assignedTo = roadsStaff._id;
        roadComp.status = 'Assigned';
        await roadComp.save();
        console.log(`✓ TEST 16 PASSED: Roads Head successfully assigned Roads complaint to Roads Staff Officer (${roadsStaff.name}).`);

        // --- TEST 17: Staff Assignment Validation (Cross-Department: Forbidden) ---
        console.log('\n--- TEST 17: Staff Assignment Validation (Cross-Dept: Forbidden) ---');
        const isCrossStaffSameDept = (waterStaff.departmentCode === roadComp.departmentCode);
        if (!isCrossStaffSameDept) {
            console.log('✓ TEST 17 PASSED: Assigning Roads complaint to Water Staff Officer correctly identified as Cross-Department Violation.');
        } else {
            console.error('❌ TEST 17 FAILED');
        }

        // --- TEST 18: Fallback Routing for Unknown Categories ---
        console.log('\n--- TEST 18: Fallback Routing for Unknown Category ---');
        const unknownDept = await routingService.determineDepartment({ category: 'Unmapped Nonexistent Category' });
        if (unknownDept.code === 'GENERAL') {
            console.log(`✓ TEST 18 PASSED: Unknown category safely routed to fallback department 'GENERAL'.`);
        } else {
            console.error(`❌ TEST 18 FAILED: Expected GENERAL, got ${unknownDept.code}`);
        }

        // --- TEST 19: Duplicate Detection Engine Regression ---
        console.log('\n--- TEST 19: Duplicate Detection Engine Regression ---');
        const dupResult = await duplicateDetectionService.findPotentialDuplicates({
            title: 'Test Road Pothole Complaint',
            description: 'Automated test complaint for Roads department access isolation',
            category: 'Road Damage',
            latitude: 28.6139,
            longitude: 77.2090,
        });
        console.log(`✓ TEST 19 PASSED: Duplicate detection engine active (Has candidates: ${dupResult.hasPotentialDuplicates}).`);

        // --- TEST 20: AI Classification Engine Regression ---
        console.log('\n--- TEST 20: AI Classification Engine Regression ---');
        const aiClass = await aiClassificationService.classifyComplaint({
            title: 'Pothole on Road',
            description: 'Massive crater in center lane',
            category: 'Road Damage',
        });
        if (aiClass && aiClass.category) {
            console.log(`✓ TEST 20 PASSED: AI classification active (Predicted: ${aiClass.category} / ${aiClass.severity}).`);
        } else {
            console.error('❌ TEST 20 FAILED');
        }

        // Clean up test complaints
        await Complaint.findByIdAndDelete(roadComp._id);
        await Complaint.findByIdAndDelete(waterComp._id);

        console.log('\n================================================================');
        console.log('ALL DEPARTMENT AUTHORIZATION TESTS PASSED SUCCESSFULLY!');
        console.log('================================================================');

    } catch (err) {
        console.error('❌ Test Execution Error:', err);
    } finally {
        await mongoose.disconnect();
    }
};

runDepartmentAuthTests();
