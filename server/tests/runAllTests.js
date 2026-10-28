/**
 * Master Test Suite Runner for CivicFix
 * Executes unit, integration, and security test suites sequentially.
 */
const { spawnSync } = require('child_process');
const path = require('path');

const testFiles = [
    // Unit Tests
    { category: 'Unit', name: 'Phase 2 Architecture & Roles', path: 'tests/unit/phase2Architecture.test.js' },
    { category: 'Unit', name: 'Phase 3 Dept Head -> Verifier Workflow', path: 'tests/unit/phase3Assignment.test.js' },
    { category: 'Unit', name: 'Phase 4 Verifier Investigation & Report Workflow', path: 'tests/unit/phase4Verification.test.js' },
    { category: 'Unit', name: 'Phase 5 Dept Head Resolution & Citizen Confirmation', path: 'tests/unit/phase5Resolution.test.js' },
    { category: 'Unit', name: 'Phase 6 Super Admin Monitoring & Analytics', path: 'tests/unit/phase6SuperAdmin.test.js' },
    { category: 'Unit', name: 'Phase 7 Notification & Communication System', path: 'tests/unit/phase7Notifications.test.js' },
    { category: 'Unit', name: 'Phase 8 Production Readiness & Hardening', path: 'tests/unit/phase8ProductionHardening.test.js' },
    { category: 'Unit', name: 'Citizen OTP Auth & Phone Privacy', path: 'tests/unit/otpAuth.test.js' },
    { category: 'Unit', name: 'Demo Citizen Bypass & Security', path: 'tests/unit/demoCitizenAuth.test.js' },
    { category: 'Unit', name: 'Classification System', path: 'tests/unit/classification.test.js' },
    { category: 'Unit', name: 'Duplicate Detection Engine', path: 'tests/unit/duplicateDetection.test.js' },
    { category: 'Unit', name: 'Semantic Vector Similarity', path: 'tests/unit/semanticDuplicates.test.js' },
    
    // Integration Tests
    { category: 'Integration', name: 'Complaint Lifecycle & SLA', path: 'tests/integration/complaintLifecycle.test.js' },
    { category: 'Integration', name: 'Department Role Authorization', path: 'tests/integration/departmentAuthorization.test.js' },
    { category: 'Integration', name: 'Analytics Overview', path: 'tests/integration/analyticsOverview.test.js' },
    { category: 'Integration', name: 'Analytics Hotspots & Trends', path: 'tests/integration/analyticsHotspots.test.js' },

    // Security Tests
    { category: 'Security', name: 'RBAC Security Boundary', path: 'tests/security/securityBoundary.test.js' },
    { category: 'Security', name: 'Access Control & Ownership', path: 'tests/security/accessControl.test.js' }
];

console.log('================================================================');
console.log('CIVICFIX AUTOMATED MASTER TEST SUITE RUNNER');
console.log('================================================================\n');

let passedSuites = 0;

testFiles.forEach((test, idx) => {
    console.log(`[${idx + 1}/${testFiles.length}] Executing ${test.category} Test: ${test.name}...`);
    const fullPath = path.resolve(__dirname, '..', test.path);
    const result = spawnSync('node', [fullPath], { stdio: 'inherit', cwd: path.resolve(__dirname, '..') });
    
    if (result.status === 0) {
        passedSuites++;
    } else {
        console.error(`❌ Suite Failed: ${test.name}`);
    }
    console.log('\n----------------------------------------------------------------\n');
});

console.log('================================================================');
console.log(`MASTER TEST RUNNER SUMMARY: ${passedSuites} / ${testFiles.length} SUITES PASSED`);
console.log('================================================================');

if (passedSuites !== testFiles.length) {
    process.exit(1);
}
