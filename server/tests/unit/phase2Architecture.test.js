/**
 * Phase 2 Architecture & Role/Department Verification Suite
 * Verifies 6 operational departments, 4 active application roles, strict scoping, and routing.
 */
const assert = require('assert');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const User = require('../../models/User');
const Complaint = require('../../models/Complaint');
const Department = require('../../models/Department');
const { DEFAULT_DEPARTMENTS, normalizeDepartmentCode } = require('../../config/departmentConfig');
const routingService = require('../../services/routingService');
const { requireRoles, enforceDepartmentScope } = require('../../middleware/roleMiddleware');

const runPhase2ArchitectureTests = async () => {
    console.log('================================================================');
    console.log('STARTING PHASE 2 ARCHITECTURE & ROLE/DEPARTMENT TEST SUITE');
    console.log('================================================================\n');

    let passedCount = 0;

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB Atlas successfully.\n');

        // --- TEST 1: Exactly 6 Active Operational Departments ---
        console.log('--- TEST 1: Exactly 6 Active Operational Departments ---');
        assert.strictEqual(DEFAULT_DEPARTMENTS.length, 6, 'Must be exactly 6 default departments');
        const expectedCodes = ['ROADS', 'WATER', 'WASTE', 'SANITATION', 'ELECTRICAL', 'PUBLIC_WORKS'];
        const actualCodes = DEFAULT_DEPARTMENTS.map(d => d.code);
        assert.deepStrictEqual(actualCodes.sort(), expectedCodes.sort(), 'Codes must match the 6 official operational department codes');
        console.log('✓ TEST 1 PASSED: Exactly 6 active operational departments defined centrally.');
        passedCount++;

        // --- TEST 2: Role Enum Validation & Legacy Role Migration ---
        console.log('\n--- TEST 2: Role Enum Validation & Legacy Role Migration ---');
        const citizenUser = new User({ name: 'Role Citizen', role: 'citizen' });
        const superAdminUser = new User({ name: 'Role SuperAdmin', role: 'super_admin' });
        const deptHeadUser = new User({ name: 'Role Head', role: 'department_head', departmentCode: 'ROADS' });
        const verifierUser = new User({ name: 'Role Verifier', role: 'verifier', departmentCode: 'WATER' });
        const legacyStaffUser = new User({ name: 'Role LegacyStaff', role: 'department_staff', departmentCode: 'WASTE' });

        await citizenUser.validate();
        await superAdminUser.validate();
        await deptHeadUser.validate();
        await verifierUser.validate();
        await legacyStaffUser.validate();

        assert.strictEqual(legacyStaffUser.role, 'verifier', 'Legacy department_staff role MUST be migrated to verifier');
        assert.strictEqual(citizenUser.departmentCode, undefined, 'Citizen cannot have a departmentCode');
        assert.strictEqual(superAdminUser.departmentCode, undefined, 'Super Admin cannot have a departmentCode');
        assert.strictEqual(deptHeadUser.departmentCode, 'ROADS', 'Dept Head retains assigned departmentCode');
        assert.strictEqual(verifierUser.departmentCode, 'WATER', 'Verifier retains assigned departmentCode');
        console.log('✓ TEST 2 PASSED: 4 application roles validated; legacy department_staff converted to verifier.');
        passedCount++;

        // --- TEST 3: Department Scope Rules in User Model ---
        console.log('\n--- TEST 3: Department Scope Rules in User Model ---');
        const invalidRoleUser = new User({ name: 'Invalid Role', role: 'invalid_role' });
        let roleError = null;
        try {
            await invalidRoleUser.validate();
        } catch (err) {
            roleError = err;
        }
        assert.ok(roleError, 'Arbitrary invalid roles must be rejected');
        console.log('✓ TEST 3 PASSED: Invalid roles rejected cleanly by schema validation.');
        passedCount++;

        // --- TEST 4: Department Code Normalization & Fallback ---
        console.log('\n--- TEST 4: Department Code Normalization & Fallback ---');
        assert.strictEqual(normalizeDepartmentCode('ROADS'), 'ROADS');
        assert.strictEqual(normalizeDepartmentCode('WATER_DRAINAGE'), 'WATER');
        assert.strictEqual(normalizeDepartmentCode('WASTE_SANITATION'), 'WASTE');
        assert.strictEqual(normalizeDepartmentCode('PARKS_ENVIRONMENT'), 'PUBLIC_WORKS');
        assert.strictEqual(normalizeDepartmentCode('INFRASTRUCTURE_SAFETY'), 'PUBLIC_WORKS');
        assert.strictEqual(normalizeDepartmentCode('UNKNOWN_CODE'), 'PUBLIC_WORKS');
        console.log('✓ TEST 4 PASSED: Legacy and invalid department strings normalize cleanly to the 6 official codes.');
        passedCount++;

        // --- TEST 5: Routing Service Resolution ---
        console.log('\n--- TEST 5: Routing Service Resolution ---');
        const roadCode = routingService.determineDepartmentCode({ category: 'roads_transportation', subcategory: 'pothole' });
        const waterCode = routingService.determineDepartmentCode({ category: 'water_supply', subcategory: 'water_leakage' });
        const wasteCode = routingService.determineDepartmentCode({ category: 'waste_management', subcategory: 'garbage_dumping' });
        const sanitationCode = routingService.determineDepartmentCode({ category: 'drainage_flooding', subcategory: 'blocked_drain' });
        const electricalCode = routingService.determineDepartmentCode({ category: 'street_lighting_electrical', subcategory: 'streetlight_not_working' });
        const publicWorksCode = routingService.determineDepartmentCode({ category: 'parks_public_spaces', subcategory: 'broken_bench' });

        assert.strictEqual(roadCode, 'ROADS');
        assert.strictEqual(waterCode, 'WATER');
        assert.strictEqual(wasteCode, 'WASTE');
        assert.strictEqual(sanitationCode, 'SANITATION');
        assert.strictEqual(electricalCode, 'ELECTRICAL');
        assert.strictEqual(publicWorksCode, 'PUBLIC_WORKS');
        console.log('✓ TEST 5 PASSED: Category/subcategory taxonomy routes accurately to the 6 operational departments.');
        passedCount++;

        // --- TEST 6: Backend Scope Enforcement Middleware ---
        console.log('\n--- TEST 6: Backend Scope Enforcement Middleware ---');
        const mockSuperReq = { user: { role: 'super_admin' }, query: {} };
        const mockHeadReq = { user: { role: 'department_head', departmentCode: 'ROADS' }, query: { departmentCode: 'WATER' } };
        const mockCitizenReq = { user: { role: 'citizen' }, query: {} };

        let nextCalled = false;
        enforceDepartmentScope(mockSuperReq, {}, () => { nextCalled = true; });
        assert.strictEqual(mockSuperReq.isGlobalScope, true, 'Super Admin retains global scope');

        nextCalled = false;
        enforceDepartmentScope(mockHeadReq, {}, () => { nextCalled = true; });
        assert.strictEqual(mockHeadReq.query.departmentCode, 'ROADS', 'Dept Head query parameter overridden by assigned department');
        assert.strictEqual(mockHeadReq.isGlobalScope, false);

        let citizenForbidden = false;
        const mockRes = {
            status: (code) => {
                if (code === 403) citizenForbidden = true;
                return { json: () => {} };
            }
        };
        enforceDepartmentScope(mockCitizenReq, mockRes, () => {});
        assert.strictEqual(citizenForbidden, true, 'Citizen blocked from department administrative scope');
        console.log('✓ TEST 6 PASSED: Backend department scope middleware enforces strict isolation and prevents tampering.');
        passedCount++;

        console.log('================================================================');
        console.log(`PHASE 2 ARCHITECTURE TEST SUITE SUMMARY: ${passedCount} / 6 TESTS PASSED`);
        console.log('================================================================\n');

    } catch (err) {
        console.error('❌ Phase 2 Architecture Test Exception:', err);
        process.exit(1);
    }
};

if (require.main === module) {
    runPhase2ArchitectureTests().then(() => process.exit(0));
}

module.exports = { runPhase2ArchitectureTests };
