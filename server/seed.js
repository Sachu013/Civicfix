/**
 * DEMO / LOCAL DEVELOPMENT SEED SCRIPT ONLY - NOT FOR PRODUCTION USE
 * Seeds initial database data with local development demo accounts across 6 municipal departments.
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Complaint = require('./models/Complaint');
const Department = require('./models/Department');
const Alert = require('./models/Alert');
const Announcement = require('./models/Announcement');
const { DEFAULT_DEPARTMENTS, CATEGORY_TO_DEPARTMENT_CODE, LEGACY_CATEGORY_TO_DEPARTMENT_CODE, normalizeDepartmentCode } = require('./config/departmentConfig');
const slaService = require('./services/slaService');

dotenv.config();

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB...');

        // Clear existing data
        await User.deleteMany();
        await Complaint.deleteMany();
        await Department.deleteMany();
        await Alert.deleteMany();
        await Announcement.deleteMany();
        console.log('Purged existing data...');

        // Seed 6 Operational Departments
        const seededDepts = await Department.create(DEFAULT_DEPARTMENTS);
        console.log(`Seeded ${seededDepts.length} active operational departments...`);

        // Create Department Map for quick lookups
        const deptMap = {};
        seededDepts.forEach((d) => {
            deptMap[d.code] = d;
        });

        // Create Super Admins, Department Heads, and Department Verifiers for ALL 6 Departments
        const departmentUsers = [
            { name: 'Hackathon Admin', email: 'admin@test.com', password: '123456', role: 'super_admin' },
            { name: 'Sanju Admin', email: 'admin@smartcity.gov', password: 'admin123', role: 'super_admin' },
            { name: 'City Commissioner', email: 'commissioner@smartcity.gov', password: 'admin123', role: 'super_admin' },
        ];

        DEFAULT_DEPARTMENTS.forEach((dept) => {
            let prefix = dept.code.toLowerCase();
            if (dept.code === 'PUBLIC_WORKS') prefix = 'publicworks';

            departmentUsers.push({
                name: `${dept.name} Head`,
                email: `${prefix}_head@smartcity.gov`,
                password: 'head123',
                role: 'department_head',
                departmentCode: dept.code,
                department: deptMap[dept.code]?._id,
            });
            departmentUsers.push({
                name: `${dept.name} Lead Verifier`,
                email: `${prefix}_verifier@smartcity.gov`,
                password: 'verifier123',
                role: 'verifier',
                departmentCode: dept.code,
                department: deptMap[dept.code]?._id,
            });
            departmentUsers.push({
                name: `${dept.name} Senior Inspector`,
                email: `${prefix}_verifier2@smartcity.gov`,
                password: 'verifier123',
                role: 'verifier',
                departmentCode: dept.code,
                department: deptMap[dept.code]?._id,
            });
            departmentUsers.push({
                name: `${dept.name} Field Officer`,
                email: `${prefix}_staff1@smartcity.gov`,
                password: 'staff123',
                role: 'department_staff',
                departmentCode: dept.code,
                department: deptMap[dept.code]?._id,
            });
        });

        const admins = await User.create(departmentUsers);

        // Create Citizens
        const citizens = [];
        const testCitizen = await User.create({
            name: 'Demo Citizen',
            email: 'citizen@demo.com',
            phone: '+919876543210',
            password: 'citizen123',
            role: 'citizen',
        });
        citizens.push(testCitizen);

        for (let i = 1; i <= 9; i++) {
            const citizen = await User.create({
                name: `Citizen Node ${i}`,
                email: `citizen${i}@gmail.com`,
                phone: `+91987654321${i}`,
                password: 'password123',
                role: 'citizen',
            });
            citizens.push(citizen);
        }
        console.log(`Created ${admins.length + citizens.length} users across 6 departments...`);

        // Base coordinates around SmartCity central area (28.6139° N, 77.2090° E)
        const baseLat = 28.6139;
        const baseLng = 77.2090;

        // Sample Complaints Data with geospatial details & routing metadata for 6 departments
        const complaintSamples = [
            { title: 'Major Pothole on Main Road', category: 'Roads & Infrastructure', subcategory: 'Pothole', severity: 'High', priority: 'High', urgency: 'High', latOffset: 0.005, lngOffset: 0.003 },
            { title: 'Garbage Overflow near Park', category: 'Waste Management & Sanitation', subcategory: 'Garbage Dumping', severity: 'Medium', priority: 'Medium', urgency: 'Medium', latOffset: -0.004, lngOffset: 0.008 },
            { title: 'Water Leakage from High-Press Pipe', category: 'Water Supply', subcategory: 'Water Leakage', severity: 'Critical', priority: 'Critical', urgency: 'Urgent', latOffset: 0.012, lngOffset: -0.005 },
            { title: 'Street Lights Not Functional', category: 'Streetlights & Electricity', subcategory: 'Streetlight Not Working', severity: 'Low', priority: 'Low', urgency: 'Low', latOffset: -0.008, lngOffset: -0.010 },
            { title: 'Power Transformer Sparking', category: 'Streetlights & Electricity', subcategory: 'Electrical Hazard', severity: 'Critical', priority: 'Critical', urgency: 'Urgent', latOffset: 0.002, lngOffset: 0.001 },
            { title: 'Uncollected Waste in Market Line', category: 'Waste Management & Sanitation', subcategory: 'Missed Garbage Collection', severity: 'Medium', priority: 'Medium', urgency: 'Medium', latOffset: -0.002, lngOffset: 0.004 },
            { title: 'Broken Footpath Tiles', category: 'Roads & Infrastructure', subcategory: 'Damaged Sidewalk', severity: 'Low', priority: 'Low', urgency: 'Low', latOffset: 0.009, lngOffset: 0.007 },
            { title: 'Low Water Pressure in Morning', category: 'Water Supply', subcategory: 'Low Water Pressure', severity: 'Medium', priority: 'Medium', urgency: 'Medium', latOffset: -0.015, lngOffset: 0.002 },
            { title: 'Dangerous Fallen Tree Branch', category: 'Public Safety & Other Civic Hazards', subcategory: 'Dangerous Branch', severity: 'High', priority: 'High', urgency: 'High', latOffset: 0.007, lngOffset: -0.008 },
            { title: 'Damaged Public Bus Shelter', category: 'Public Safety & Other Civic Hazards', subcategory: 'Damaged Public Building', severity: 'Low', priority: 'Low', urgency: 'Low', latOffset: -0.011, lngOffset: 0.014 },
            { title: 'Open Manhole Hazard', category: 'Drainage & Sewerage', subcategory: 'Open Sewage', severity: 'Critical', priority: 'Critical', urgency: 'Urgent', latOffset: 0.003, lngOffset: -0.002 },
            { title: 'Illegal Dumping Site near Sector 7', category: 'Waste Management & Sanitation', subcategory: 'Illegal Dumping', severity: 'High', priority: 'High', urgency: 'High', latOffset: -0.006, lngOffset: 0.009 },
            { title: 'Unmaintained City Park Fountain', category: 'Public Safety & Other Civic Hazards', subcategory: 'Damaged Park Equipment', severity: 'Low', priority: 'Low', urgency: 'Low', latOffset: 0.001, lngOffset: -0.004 },
            { title: 'Stagnant Water Drainage Block', category: 'Drainage & Sewerage', subcategory: 'Blocked Drain', severity: 'High', priority: 'High', urgency: 'High', latOffset: 0.014, lngOffset: -0.012 },
            { title: 'Flickering Street Lamps', category: 'Streetlights & Electricity', subcategory: 'Streetlight Not Working', severity: 'Low', priority: 'Low', urgency: 'Low', latOffset: -0.010, lngOffset: -0.003 },
            { title: 'Exposed Electrical Wires', category: 'Streetlights & Electricity', subcategory: 'Exposed Wiring', severity: 'Critical', priority: 'Critical', urgency: 'Urgent', latOffset: 0.004, lngOffset: 0.006 },
            { title: 'Cracked Surface on Bridge', category: 'Roads & Infrastructure', subcategory: 'Damaged Bridge', severity: 'High', priority: 'High', urgency: 'High', latOffset: -0.007, lngOffset: -0.006 },
            { title: 'Foul Smell from Sewage Leakage', category: 'Drainage & Sewerage', subcategory: 'Sewage Leakage', severity: 'Medium', priority: 'Medium', urgency: 'Medium', latOffset: 0.008, lngOffset: 0.011 },
            { title: 'Hydrant Pipe Leakage', category: 'Water Supply', subcategory: 'Water Leakage', severity: 'Medium', priority: 'Medium', urgency: 'Medium', latOffset: -0.003, lngOffset: -0.007 },
            { title: 'Damaged Ramp Access at Community Center', category: 'Public Safety & Other Civic Hazards', subcategory: 'Accessibility Ramp Issue', severity: 'Medium', priority: 'Medium', urgency: 'Medium', latOffset: 0.016, lngOffset: 0.005 },
        ];

        const workflowStatuses = ['Submitted', 'Assigned', 'In Progress', 'Resolved', 'Closed'];
        const images = [
            'https://images.unsplash.com/photo-1594498257602-32638e982f9e?q=80&w=1000', // Pothole
            'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=1000', // Garbage
            'https://images.unsplash.com/photo-1542013936693-884638332954?q=80&w=1000', // Water
            'https://images.unsplash.com/photo-1470058869958-2a77a679efbe?q=80&w=1000', // Electricity
        ];

        const now = new Date();

        for (let i = 0; i < 20; i++) {
            const sample = complaintSamples[i];
            const lat = Number((baseLat + sample.latOffset).toFixed(6));
            const lng = Number((baseLng + sample.lngOffset).toFixed(6));

            const deptCode = normalizeDepartmentCode(LEGACY_CATEGORY_TO_DEPARTMENT_CODE[sample.category] || 'PUBLIC_WORKS');
            const deptObj = deptMap[deptCode] || deptMap['PUBLIC_WORKS'];

            const createdTime = new Date(now.getTime() - (i * 12 * 60 * 60 * 1000));
            const sla = slaService.calculateSLAForComplaint(sample.severity, deptObj, createdTime);
            const status = workflowStatuses[i % workflowStatuses.length];

            await Complaint.create({
                complaintId: `CMP-${Date.now()}-${i}`,
                user: citizens[i % 10]._id,
                title: sample.title,
                description: `Synthetic documentation for ${sample.title}. Immediate intervention required to restore city-state coherence and ensure public safety protocols.`,
                category: sample.category,
                subcategory: sample.subcategory,
                severity: sample.severity,
                priority: sample.priority,
                department: deptObj ? deptObj._id : null,
                departmentCode: deptCode,
                assignedDepartment: deptObj ? deptObj.name : 'Public Works & Infrastructure',
                assignedAt: createdTime,
                assignmentSource: 'automatic',
                assignmentHistory: [
                    {
                        previousDepartmentCode: null,
                        newDepartmentCode: deptCode,
                        previousDepartmentName: null,
                        newDepartmentName: deptObj ? deptObj.name : 'Public Infrastructure & Safety',
                        reason: 'Automated initial routing on complaint submission.',
                        assignmentSource: 'automatic',
                        timestamp: createdTime,
                    },
                ],
                sla,
                escalationLevel: sample.severity === 'Critical' ? 2 : 0,
                status,
                statusHistory: [
                    {
                        previousStatus: null,
                        newStatus: 'Submitted',
                        note: 'Complaint submitted by citizen.',
                        timestamp: createdTime,
                    },
                    {
                        previousStatus: 'Submitted',
                        newStatus: status,
                        changedBy: admins[0]._id,
                        note: `System initialized workflow state to ${status}.`,
                        timestamp: new Date(createdTime.getTime() + 3600000),
                    },
                ],
                resolution: status === 'Resolved' || status === 'Closed' ? {
                    resolvedAt: new Date(createdTime.getTime() + 14400000),
                    resolvedBy: admins[0]._id,
                    resolutionNote: 'Field unit repaired defect and verified operational compliance.',
                } : undefined,
                citizenVerification: status === 'Closed' ? {
                    verified: true,
                    verifiedAt: new Date(createdTime.getTime() + 18000000),
                    feedback: 'Confirmed issue resolved cleanly by response unit.',
                } : undefined,
                imageUrl: images[i % 4],
                location: `Sector ${(i % 10) + 1}, SmartCity`,
                formattedAddress: `Sector ${(i % 10) + 1}, SmartCity, Delhi NCR 110001`,
                locality: `Sector ${(i % 10) + 1}`,
                city: 'SmartCity',
                pincode: '110001',
                state: 'Delhi NCR',
                country: 'India',
                latitude: lat,
                longitude: lng,
                locationPoint: {
                    type: 'Point',
                    coordinates: [lng, lat],
                },
                urgency: sample.urgency,
                adminResponse: status === 'Resolved' || status === 'Closed' ? 'Incident addressed. Resolution deployed and verified by field units.' : '',
                createdAt: createdTime,
            });
        }
        console.log('Seeded 20 complaints across 6 operational departments...');

        // Seed Alerts
        await Alert.create([
            { title: 'Power Shutdown: Sector 4', description: 'Scheduled maintenance for electrical grids. Power will be toggled off for 4 hours.', type: 'Warning', severity: 'Moderate', area: 'Sector 4', postedBy: admins[0]._id },
            { title: 'Flash Flood Warning', description: 'High intensity precipitation detected. Avoid basement parking and low lying sectors.', type: 'Emergency', severity: 'Critical', area: 'City-Wide', postedBy: admins[0]._id },
        ]);

        // Seed Announcements
        await Announcement.create([
            { title: 'Smart City Hackathon 2026', content: 'Join the revolution! Build modules for the next-gen governance portal.', category: 'Event', postedBy: admins[0]._id },
            { title: 'New Garbage Collection Timing', content: 'Morning pick-up window shifted to 0700-0900 hrs globally.', category: 'Public Service', postedBy: admins[0]._id },
        ]);

        console.log('Seeding process complete. System ready for demo.');
        process.exit();
    } catch (error) {
        console.error('Seeding Failure:', error);
        process.exit(1);
    }
};

seedData();

