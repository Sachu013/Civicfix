/**
 * CivicFix End-to-End Workflow Audit & Security Verification Test
 * Tests against live HTTP server on http://localhost:5000/api
 */
const assert = require('assert');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const API_BASE = 'http://localhost:5000/api';

const client = {
    get: async (url, options = {}) => {
        const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;
        const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
        const res = await fetch(fullUrl, { method: 'GET', headers });
        let data = null;
        try { data = await res.json(); } catch (e) { data = null; }
        return { status: res.status, data };
    },
    post: async (url, body = {}, options = {}) => {
        const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;
        const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
        const res = await fetch(fullUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        });
        let data = null;
        try { data = await res.json(); } catch (e) { data = null; }
        return { status: res.status, data };
    },
    put: async (url, body = {}, options = {}) => {
        const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;
        const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
        const res = await fetch(fullUrl, {
            method: 'PUT',
            headers,
            body: JSON.stringify(body),
        });
        let data = null;
        try { data = await res.json(); } catch (e) { data = null; }
        return { status: res.status, data };
    },
};

const runAudit = async () => {
    console.log('================================================================');
    console.log('CIVICFIX COMPLETE END-TO-END WORKFLOW AUDIT BEFORE HOSTING');
    console.log('Testing against running server:', API_BASE);
    console.log('================================================================\n');

    let allPassed = true;
    const results = [];

    const recordStep = (stepNumber, description, passed, details = '') => {
        results.push({ stepNumber, description, passed, details });
        console.log(`[Step ${stepNumber}] ${description}: ${passed ? '✓ PASSED' : '❌ FAILED'} ${details ? `(${details})` : ''}`);
        if (!passed) allPassed = false;
    };

    try {
        // --- STEP 1: Demo Citizen Login ---
        const demoAuthRes = await client.post('/auth/demo-citizen');
        const citizenToken = demoAuthRes.data.token;
        const citizenUser = demoAuthRes.data.user || demoAuthRes.data;
        const citizenHeaders = { Authorization: `Bearer ${citizenToken}` };

        recordStep(
            1,
            'Demo Citizen logs in without OTP',
            demoAuthRes.status === 200 && citizenToken && citizenUser.role === 'citizen',
            `User: ${citizenUser.name}, Token received`
        );

        // --- STEP 2: Citizen Submits New Complaint ---
        const testTitle = `Audit Road Pothole ${Date.now()}`;
        const complaintPayload = {
            title: testTitle,
            description: 'Major hazardous pothole causing vehicular damage near Sector 21 market.',
            category: 'Roads & Infrastructure',
            subcategory: 'Pothole',
            location: 'Sector 21 Market Central Road',
            latitude: 28.6139,
            longitude: 77.2090,
            formattedAddress: 'Sector 21 Market Central Road, New Delhi, India',
        };

        const submitRes = await client.post('/complaints', complaintPayload, { headers: citizenHeaders });
        const createdComplaint = submitRes.data;
        const complaintDbId = createdComplaint._id;
        const complaintPublicId = createdComplaint.complaintId;

        recordStep(
            2,
            'Complaint created & saved with status Submitted',
            submitRes.status === 201 && createdComplaint.status === 'Submitted' && createdComplaint.departmentCode === 'ROADS',
            `ID: ${complaintPublicId}, Status: ${createdComplaint.status}`
        );

        // --- STEP 3: Complaint Appears in Citizen Dashboard ---
        const myComplaintsRes = await client.get('/complaints/my', { headers: citizenHeaders });
        const foundInMy = myComplaintsRes.data.some(c => c.complaintId === complaintPublicId || c._id === complaintDbId);

        recordStep(
            3,
            'Complaint appears in Citizen Dashboard',
            myComplaintsRes.status === 200 && foundInMy,
            `Total Citizen Complaints: ${myComplaintsRes.data.length}`
        );

        // --- STEP 4: Department Head Login & Sees New Complaint ---
        const roadsHeadLoginRes = await client.post('/auth/login', {
            email: 'roads_head@smartcity.gov',
            password: 'head123',
        });
        const roadsHeadToken = roadsHeadLoginRes.data.token;
        const roadsHeadHeaders = { Authorization: `Bearer ${roadsHeadToken}` };

        const deptComplaintsRes = await client.get('/department/complaints', { headers: roadsHeadHeaders });
        const deptList = deptComplaintsRes.data?.complaints || (Array.isArray(deptComplaintsRes.data) ? deptComplaintsRes.data : []);
        const foundInDept = deptList.some(c => c.complaintId === complaintPublicId || c._id === complaintDbId);

        recordStep(
            4,
            'Roads Department Head logs in & sees complaint in queue',
            roadsHeadLoginRes.status === 200 && foundInDept,
            `Role: ${roadsHeadLoginRes.data.role}, Dept: ${roadsHeadLoginRes.data.departmentCode}`
        );

        // --- STEP 5: Department Head Assigns Verifier ---
        // Fetch eligible staff
        const staffRes = await client.get('/department/staff', { headers: roadsHeadHeaders });
        const staffList = staffRes.data?.staffMembers || [];
        assert.ok(staffList.length > 0, 'Roads department must have registered verifiers');

        // Prefer the canonical lead verifier
        const verifierA = staffList.find(s => s.email === 'roads_verifier@smartcity.gov') || staffList[0];
        const verifierIdA = typeof verifierA._id === 'string' ? verifierA._id : String(verifierA._id);
        assert.ok(!verifierIdA.includes('[object'), 'Verifier ID must not be malformed string');

        const assignRes = await client.post(
            '/department/assign',
            {
                complaintId: complaintPublicId,
                verifierId: verifierIdA,
                reason: 'Field inspection assigned to lead verifier',
            },
            { headers: roadsHeadHeaders }
        );

        recordStep(
            5,
            'Department Head assigns eligible Verifier',
            assignRes.status === 200 && (assignRes.data.success || assignRes.data.complaint?.status === 'Assigned'),
            `Assigned to: ${verifierA.name} (${verifierA.email})`
        );

        // --- STEP 6: Assigned Verifier Logs in & Sees Complaint ---
        const verifierPassA = verifierA.email.includes('staff') ? 'staff123' : 'verifier123';
        const verifierLoginRes = await client.post('/auth/login', {
            email: verifierA.email,
            password: verifierPassA,
        });
        const verifierTokenA = verifierLoginRes.data?.token;
        assert.ok(verifierTokenA, `Verifier login failed for ${verifierA.email}: ${JSON.stringify(verifierLoginRes.data)}`);
        const verifierHeadersA = { Authorization: `Bearer ${verifierTokenA}` };

        const assignedQueueRes = await client.get('/complaints/assigned-to-me', { headers: verifierHeadersA });
        const assignedQueue = Array.isArray(assignedQueueRes.data) ? assignedQueueRes.data : [];
        const foundInAssignedQueue = assignedQueue.some(c => c.complaintId === complaintPublicId || c._id === complaintDbId);

        recordStep(
            6,
            'Assigned Verifier logs in & sees complaint in assigned queue',
            verifierLoginRes.status === 200 && foundInAssignedQueue,
            `Queue count: ${assignedQueue.length}`
        );

        // --- STEP 7: Cross-Verifier Isolation (Verifier B Cannot Submit Report) ---
        let verifierB = staffList.find(s => s.email === 'roads_verifier2@smartcity.gov') || staffList.find(s => String(s._id) !== String(verifierA._id)) || { email: 'roads_verifier2@smartcity.gov' };
        const verifierPassB = verifierB.email.includes('staff') ? 'staff123' : 'verifier123';
        const verifierBLogin = await client.post('/auth/login', {
            email: verifierB.email,
            password: verifierPassB,
        });
        const verifierHeadersB = { Authorization: `Bearer ${verifierBLogin.data?.token}` };

        const unauthorizedReportRes = await client.post(
            `/complaints/${complaintPublicId}/verification`,
            {
                findings: 'Unauthorized inspection attempt by another verifier.',
                outcome: 'VERIFIED_CONFIRMED',
            },
            { headers: verifierHeadersB }
        );

        recordStep(
            7,
            'Cross-Verifier report submission blocked with 403 Forbidden',
            unauthorizedReportRes.status === 403,
            `HTTP ${unauthorizedReportRes.status}: ${unauthorizedReportRes.data?.message}`
        );

        // --- STEP 8: Assigned Verifier Submits Verification Report ---
        const reportPayload = {
            findings: 'Inspected physical site at 10:15 AM. Verified deep pothole dimensions 1.8m x 1.2m x 14cm. Urgent asphalt patching required.',
            outcome: 'VERIFIED_CONFIRMED',
            locationVerified: true,
            contactWithCitizen: true,
            citizenContactNotes: 'Spoke with complainant on-site, confirmed landmark location.',
            evidence: [
                {
                    url: 'https://res.cloudinary.com/demo/image/upload/sample_pothole.jpg',
                    publicId: 'sample_pothole_1',
                    caption: 'Site photo of pothole',
                },
            ],
        };

        const submitReportRes = await client.post(
            `/complaints/${complaintPublicId}/verification`,
            reportPayload,
            { headers: verifierHeadersA }
        );

        recordStep(
            8,
            'Assigned Verifier records findings & submits verification report',
            submitReportRes.status === 200 && submitReportRes.data.success,
            `Verification State: ${submitReportRes.data.complaint?.verificationState}`
        );

        // Duplicate report submission attempt by same verifier rejected
        const dupReportRes = await client.post(
            `/complaints/${complaintPublicId}/verification`,
            reportPayload,
            { headers: verifierHeadersA }
        );
        recordStep(
            '8b',
            'Duplicate verification report submission rejected with 400',
            dupReportRes.status === 400,
            `HTTP ${dupReportRes.status}: ${dupReportRes.data?.message}`
        );

        // --- STEP 9: Department Head Reviews Report & Approves Resolution ---
        const reviewReportRes = await client.get(`/complaints/${complaintPublicId}/verification`, { headers: roadsHeadHeaders });
        const reportContent = reviewReportRes.data.verificationReport;

        // Department Head transitions status to 'Resolved'
        const resolveRes = await client.put(
            `/admin/complaints/${complaintPublicId}/status`,
            {
                status: 'Resolved',
                note: 'Field verification reviewed and confirmed. Repair crew deployed and asphalt overlay completed.',
                resolutionNote: 'Pothole excavated, filled with hot-mix bitumen, compacted, and leveled.',
            },
            { headers: roadsHeadHeaders }
        );

        recordStep(
            9,
            'Department Head reviews report & transitions status to Resolved',
            resolveRes.status === 200 && resolveRes.data.status === 'Resolved',
            `Status: ${resolveRes.data.status}, Verification Outcome: ${reportContent?.outcome}`
        );

        // --- STEP 10: Demo Citizen Confirms Resolution -> Status Transitions to Closed ---
        // Demo citizen tracks complaint and sees Resolved status
        const trackRes = await client.get(`/complaints/track/${complaintPublicId}`);
        const citizenSeesResolved = trackRes.status === 200 && trackRes.data.status === 'Resolved';

        // Citizen confirms resolution
        const confirmRes = await client.post(
            `/complaints/${complaintPublicId}/verify-resolution`,
            {
                verified: true,
                feedback: 'Road surface is smooth and completely repaired. Excellent job!',
            },
            { headers: citizenHeaders }
        );

        const isClosed = confirmRes.status === 200 && (confirmRes.data.status === 'Closed' || confirmRes.data.complaint?.status === 'Closed');

        recordStep(
            10,
            'Demo Citizen confirms resolution & status reaches Closed',
            citizenSeesResolved && isClosed,
            `Final Status: Closed, Confirmed by citizen`
        );

        // --- STEP 11: Data Consistency & Persistence Check Across Dashboards ---
        const finalTrack = await client.get(`/complaints/track/${complaintPublicId}`);
        const finalCitizen = await client.get('/complaints/my', { headers: citizenHeaders });
        const finalDept = await client.get('/department/complaints', { headers: roadsHeadHeaders });

        const citizenComp = finalCitizen.data.find(c => c.complaintId === complaintPublicId);
        const deptComp = (finalDept.data?.complaints || finalDept.data).find(c => c.complaintId === complaintPublicId);

        const consistentAcrossAll = finalTrack.data.status === 'Closed' &&
            citizenComp?.status === 'Closed' &&
            deptComp?.status === 'Closed';

        recordStep(
            11,
            'Status Closed is consistent across all dashboards & persistent',
            consistentAcrossAll,
            `Public Track: ${finalTrack.data.status}, Citizen: ${citizenComp?.status}, Dept: ${deptComp?.status}`
        );

        // --- STEP 12: Security & Authorization Boundary Checks ---
        // A. Citizen cannot access staff dashboard or assign verifier
        const citizenAssignAttempt = await client.post(
            '/department/assign',
            { complaintId: complaintPublicId, verifierId: verifierIdA },
            { headers: citizenHeaders }
        );
        // B. Other department head (Water Head) cannot assign Roads complaint
        const waterHeadLogin = await client.post('/auth/login', { email: 'water_head@smartcity.gov', password: 'head123' });
        const waterHeadHeaders = { Authorization: `Bearer ${waterHeadLogin.data.token}` };
        const crossDeptAssign = await client.post(
            '/department/assign',
            { complaintId: complaintPublicId, verifierId: verifierIdA },
            { headers: waterHeadHeaders }
        );
        // C. Super Admin cannot change official status (monitor only)
        const superAdminLogin = await client.post('/auth/login', { email: 'admin@smartcity.gov', password: 'admin123' });
        const superAdminHeaders = { Authorization: `Bearer ${superAdminLogin.data.token}` };
        const superAdminStatusAttempt = await client.put(
            `/admin/complaints/${complaintPublicId}/status`,
            { status: 'In Progress' },
            { headers: superAdminHeaders }
        );

        const rbacSecure = citizenAssignAttempt.status === 403 &&
            crossDeptAssign.status === 403 &&
            superAdminStatusAttempt.status === 403;

        recordStep(
            12,
            'RBAC boundaries enforced (Citizen, Cross-Dept, Super Admin monitor-only)',
            rbacSecure,
            `Citizen: ${citizenAssignAttempt.status}, Cross-Dept: ${crossDeptAssign.status}, Super Admin: ${superAdminStatusAttempt.status}`
        );

        // --- STEP 13: Error Handling & Input Validation ---
        // A. Malformed ID
        const malformedIdRes = await client.get('/complaints/track/INVALID_NON_EXISTENT_ID_999999');
        // B. Missing required fields on complaint creation
        const missingFieldsRes = await client.post('/complaints', { title: '' }, { headers: citizenHeaders });
        // C. Invalid authentication token
        const invalidTokenRes = await client.get('/complaints/my', { headers: { Authorization: 'Bearer INVALID_EXPIRED_JWT' } });

        const errorHandlingOk = (malformedIdRes.status === 404 || malformedIdRes.status === 400) &&
            missingFieldsRes.status === 400 &&
            invalidTokenRes.status === 401;

        recordStep(
            13,
            'Error handling for invalid IDs (404/400), missing fields (400), and invalid tokens (401)',
            errorHandlingOk,
            `Invalid ID: ${malformedIdRes.status}, Missing Fields: ${missingFieldsRes.status}, Bad Token: ${invalidTokenRes.status}`
        );

        // --- SUMMARY ---
        console.log('\n================================================================');
        console.log(`AUDIT COMPLETE: ${results.filter(r => r.passed).length} / ${results.length} CHECKS PASSED`);
        console.log('================================================================\n');

        if (!allPassed) {
            process.exit(1);
        }
        process.exit(0);
    } catch (err) {
        console.error('❌ Audit execution failed with unexpected error:', err.message);
        if (err.response) {
            console.error('Response status:', err.response.status);
            console.error('Response data:', err.response.data);
        }
        process.exit(1);
    }
};

runAudit();
