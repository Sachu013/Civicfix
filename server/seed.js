const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Complaint = require('./models/Complaint');
const Alert = require('./models/Alert');
const Announcement = require('./models/Announcement');

dotenv.config();

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB...');

        // Clear existing data
        await User.deleteMany();
        await Complaint.deleteMany();
        await Alert.deleteMany();
        await Announcement.deleteMany();
        console.log('Purged existing data...');

        // Create Admins
        const admins = await User.create([
            { name: 'Hackathon Admin', email: 'admin@test.com', password: '123456', role: 'admin' },
            { name: 'Sanju Admin', email: 'admin@smartcity.gov', password: 'admin123', role: 'admin' },
            { name: 'City Commissioner', email: 'commissioner@smartcity.gov', password: 'admin123', role: 'admin' },
        ]);

        // Create Citizens
        const citizens = [];
        // Specific Test Citizen
        const testCitizen = await User.create({
            name: 'Demo Citizen',
            email: 'citizen@demo.com',
            password: 'citizen123',
            role: 'citizen'
        });
        citizens.push(testCitizen);

        for (let i = 1; i <= 9; i++) {
            const citizen = await User.create({
                name: `Citizen Node ${i}`,
                email: `citizen${i}@gmail.com`,
                password: 'password123',
                role: 'citizen'
            });
            citizens.push(citizen);
        }
        console.log('Created 13 users...');

        // Sample Complaints Data
        const complaintSamples = [
            { title: 'Major Pothole on Main Road', category: 'Road Damage', location: 'Sector 4, MG Road', urgency: 'High' },
            { title: 'Garbage Overflow near Park', category: 'Garbage', location: 'Green View Colony', urgency: 'Medium' },
            { title: 'Water Leakage from High-Press Pipe', category: 'Water Leakage', location: 'Industrial Area Phase 2', urgency: 'High' },
            { title: 'Street Lights Not Functional', category: 'Street Light', location: 'Lane 7, Sector 12', urgency: 'Low' },
            { title: 'Power Transformer Sparking', category: 'Electricity', location: 'Near Community Center', urgency: 'Urgent' },
            { title: 'Uncollected Waste in Market Line', category: 'Garbage', location: 'Central Market', urgency: 'Medium' },
            { title: 'Broken Footpath Tiles', category: 'Road Damage', location: 'Mall Road', urgency: 'Low' },
            { title: 'Low Water Pressure in Morning', category: 'Water Leakage', location: 'Sunrise Apartments', urgency: 'Medium' },
            { title: 'Frequent Power Surges', category: 'Electricity', location: 'Block B, Sector 5', urgency: 'High' },
            { title: 'Abandoned Vehicle Blocking Way', category: 'Other', location: 'East Side bypass', urgency: 'Low' },
            { title: 'Open Manhole Hazard', category: 'Road Damage', location: 'Primary School Gate', urgency: 'Urgent' },
            { title: 'Illegal Dumping Site', category: 'Garbage', location: 'Behind Metro Station', urgency: 'High' },
            { title: 'Damaged Bus Shelter', category: 'Other', location: 'City Center Stop', urgency: 'Low' },
            { title: 'Stagnant Water Drainage Block', category: 'Water Leakage', location: 'Sector 9 slum area', urgency: 'High' },
            { title: 'Flickering Street Lamps', category: 'Street Light', location: 'Heritage Walkway', urgency: 'Low' },
            { title: 'Exposed Electrical Wires', category: 'Electricity', location: 'Park Street intersection', urgency: 'Urgent' },
            { title: 'Cracked Surface on Bridge', category: 'Road Damage', location: 'Old City Bridge', urgency: 'High' },
            { title: 'Foul Smell from Sewage', category: 'Garbage', location: 'Near Fish Market', urgency: 'Medium' },
            { title: 'Hydrant Leakage', category: 'Water Leakage', location: 'Fire Station Road', urgency: 'Medium' },
            { title: 'New Area Street Light Request', category: 'Street Light', location: 'Ext-3 Colony', urgency: 'Low' },
        ];

        const statuses = ['Pending', 'In Progress', 'Resolved'];
        const images = [
            'https://images.unsplash.com/photo-1594498257602-32638e982f9e?q=80&w=1000', // Pothole
            'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=1000', // Garbage
            'https://images.unsplash.com/photo-1542013936693-884638332954?q=80&w=1000', // Water
            'https://images.unsplash.com/photo-1470058869958-2a77a679efbe?q=80&w=1000', // Electricity
        ];

        for (let i = 0; i < 20; i++) {
            const sample = complaintSamples[i];
            await Complaint.create({
                complaintId: `CMP-${Date.now()}-${i}`,
                user: citizens[i % 10]._id,
                title: sample.title,
                description: `Synthetic documentation for ${sample.title}. Immediate intervention required to restore city-state coherence and ensure public safety protocols.`,
                category: sample.category,
                imageUrl: images[i % 4],
                location: sample.location,
                status: statuses[i % 3], // Cycle through statuses
                urgency: sample.urgency,
                adminResponse: i % 3 === 2 ? 'Incident addressed. Resolution deployed and verified by field units.' : '',
                assignedDepartment: `${sample.category} Unit`
            });
        }
        console.log('Seeded 20 complaints...');

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
