const Complaint = require('../models/Complaint');
const ErrorResponse = require('../utils/errorResponse');
const geoService = require('./geoService');

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

const createComplaint = async ({
    userId,
    title,
    description,
    location,
    imageUrl,
    latitude,
    longitude,
    formattedAddress,
    landmark,
    locality,
    city,
    district,
    state,
    pincode,
    country,
}) => {
    const analysis = analyzeComplaint(title + ' ' + description);

    // Normalize location input using geoService
    const rawLocationInput = typeof location === 'object' && location !== null
        ? location
        : {
            location: typeof location === 'string' ? location : undefined,
            latitude,
            longitude,
            formattedAddress,
            landmark,
            locality,
            city,
            district,
            state,
            pincode,
            country,
        };

    const formattedGeo = geoService.formatLocationData(rawLocationInput);

    // Simple ID generator
    const complaintId = 'CMP' + Date.now().toString().slice(-8);

    const complaintData = {
        complaintId,
        user: userId,
        title,
        description,
        imageUrl,
        category: analysis.category,
        urgency: analysis.urgency,
        assignedDepartment: analysis.assignedDepartment,
        ...formattedGeo,
    };

    const complaint = await Complaint.create(complaintData);

    return complaint;
};

const getUserComplaints = async (userId) => {
    return await Complaint.find({ user: userId }).sort({ createdAt: -1 });
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
