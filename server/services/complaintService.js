const Complaint = require('../models/Complaint');
const ErrorResponse = require('../utils/errorResponse');

// Keywords for auto-categorization and urgency
const categories = {
    'Garbage': ['trash', 'garbage', 'waste', 'dump', 'smell'],
    'Road Damage': ['pothole', 'street', 'road', 'asphalt', 'sidewalk'],
    'Water Leakage': ['leak', 'pipe', 'water', 'sewage', 'drain'],
    'Electricity': ['power', 'outage', 'blackout', 'transformer'],
    'Street Light': ['street light', 'lamp', 'dark', 'bulb'],
};

const departments = {
    'Garbage': 'Sanitation Department',
    'Road Damage': 'Public Works Department',
    'Water Leakage': 'Water Supply Department',
    'Electricity': 'Power Department',
    'Street Light': 'Electrical Department',
    'Other': 'General Administration',
};

const urgencyKeywords = ['urgent', 'danger', 'immediate', 'emergency', 'dying', 'accident'];

const analyzeComplaint = (text) => {
    const content = text.toLowerCase();
    let category = 'Other';
    let urgency = 'Medium';

    for (const [cat, keywords] of Object.entries(categories)) {
        if (keywords.some((kw) => content.includes(kw))) {
            category = cat;
            break;
        }
    }

    if (urgencyKeywords.some((kw) => content.includes(kw))) {
        urgency = 'Urgent';
    }

    return { category, urgency, assignedDepartment: departments[category] };
};

const createComplaint = async ({ userId, title, description, location, imageUrl }) => {
    const analysis = analyzeComplaint(title + ' ' + description);

    // Simple ID generator
    const complaintId = 'CMP' + Date.now().toString().slice(-8);

    const complaint = await Complaint.create({
        complaintId,
        user: userId,
        title,
        description,
        location,
        imageUrl,
        category: analysis.category,
        urgency: analysis.urgency,
        assignedDepartment: analysis.assignedDepartment,
    });

    return complaint;
};

const getUserComplaints = async (userId) => {
    return await Complaint.find({ user: userId });
};

const trackComplaint = async (complaintId) => {
    const complaint = await Complaint.findOne({ complaintId }).populate('user', 'name');
    if (!complaint) {
        throw new ErrorResponse('Complaint not found', 404);
    }
    return complaint;
};

module.exports = {
    createComplaint,
    getUserComplaints,
    trackComplaint,
};
