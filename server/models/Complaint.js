const mongoose = require('mongoose');

const complaintSchema = mongoose.Schema(
    {
        complaintId: { type: String, required: true, unique: true },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        title: { type: String, required: true },
        description: { type: String, required: true },
        category: {
            type: String,
            required: true,
            enum: ['Garbage', 'Road Damage', 'Water Leakage', 'Electricity', 'Street Light', 'Other'],
        },
        imageUrl: { type: String },
        
        // Backward-compatible location string representation
        location: { type: String, required: true },

        // Structured Geospatial Architecture
        locationPoint: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point',
            },
            coordinates: {
                type: [Number], // Format: [longitude, latitude]
            },
        },
        latitude: { type: Number },
        longitude: { type: Number },
        formattedAddress: { type: String },
        landmark: { type: String },
        locality: { type: String },
        city: { type: String },
        district: { type: String },
        state: { type: String },
        pincode: { type: String },
        country: { type: String, default: 'India' },

        status: {
            type: String,
            required: true,
            enum: ['Pending', 'In Progress', 'Resolved'],
            default: 'Pending',
        },
        adminResponse: { type: String },
        assignedDepartment: { type: String },
        urgency: {
            type: String,
            enum: ['Low', 'Medium', 'High', 'Urgent'],
            default: 'Medium',
        },
    },
    { timestamps: true }
);

// Create 2dsphere index on locationPoint for spatial queries
complaintSchema.index({ locationPoint: '2dsphere' });

const Complaint = mongoose.model('Complaint', complaintSchema);
module.exports = Complaint;
