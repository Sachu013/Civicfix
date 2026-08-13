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
        },
        subcategory: { type: String },

        severity: {
            type: String,
            enum: ['Low', 'Medium', 'High', 'Critical'],
            default: 'Medium',
        },
        priority: {
            type: String,
            enum: ['Low', 'Medium', 'High', 'Critical'],
            default: 'Medium',
        },

        // Department & Assignment Architecture (Sprint 7)
        department: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Department',
        },
        departmentCode: {
            type: String,
            default: 'GENERAL',
        },
        assignedDepartment: {
            type: String, // String representation for backward compatibility
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        assignedAt: {
            type: Date,
        },
        assignedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        assignmentSource: {
            type: String,
            enum: ['automatic', 'admin', 'escalation', 'reassignment'],
            default: 'automatic',
        },
        assignmentHistory: [
            {
                previousDepartmentCode: String,
                newDepartmentCode: String,
                previousDepartmentName: String,
                newDepartmentName: String,
                previousAssignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                newAssignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                reason: String,
                assignmentSource: String,
                timestamp: { type: Date, default: Date.now },
            },
        ],

        // SLA Infrastructure (Sprint 7)
        sla: {
            startedAt: { type: Date },
            dueAt: { type: Date },
            durationHours: { type: Number, default: 168 },
            status: {
                type: String,
                enum: ['not_started', 'on_track', 'due_soon', 'breached', 'completed'],
                default: 'on_track',
            },
            warningThresholdHours: { type: Number },
            breachedAt: { type: Date },
        },

        // Escalation System (Sprint 7)
        escalationLevel: {
            type: Number,
            enum: [0, 1, 2, 3],
            default: 0,
        },
        escalatedAt: { type: Date },
        escalatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        escalationReason: { type: String },
        escalationHistory: [
            {
                level: { type: Number, enum: [0, 1, 2, 3] },
                reason: String,
                escalatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                timestamp: { type: Date, default: Date.now },
            },
        ],

        // Comprehensive Status Workflow (Sprint 7)
        status: {
            type: String,
            required: true,
            enum: [
                'Submitted',
                'Verified',
                'Assigned',
                'In Progress',
                'Resolved',
                'Citizen Verification',
                'Closed',
                'Rejected',
                'Reopened',
                'Pending', // Retained for backward compatibility with historical complaints
            ],
            default: 'Submitted',
        },
        statusHistory: [
            {
                previousStatus: String,
                newStatus: String,
                changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                note: String,
                timestamp: { type: Date, default: Date.now },
            },
        ],

        // Resolution Workflow (Sprint 7)
        resolution: {
            resolvedAt: { type: Date },
            resolvedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
            resolutionNote: { type: String },
            resolutionImage: {
                url: { type: String },
                publicId: { type: String },
                originalFilename: { type: String },
                mimeType: { type: String },
                fileSize: { type: Number },
                uploadedAt: { type: Date },
            },
        },

        // Citizen Resolution Verification (Sprint 7)
        citizenVerification: {
            verified: { type: Boolean },
            verifiedAt: { type: Date },
            feedback: { type: String },
        },
        reopenedAt: { type: Date },
        reopenCount: { type: Number, default: 0 },

        // Sprint 6 AI-Assisted Classification Metadata
        aiClassification: {
            category: { type: String },
            subcategory: { type: String },
            severity: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'] },
            priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'] },
            confidence: { type: Number, min: 0, max: 1 },
            reasoning: { type: String },
            model: { type: String },
            generatedAt: { type: Date },
        },
        aiClassificationStatus: {
            type: String,
            enum: ['pending', 'completed', 'failed', 'manually_reviewed'],
            default: 'pending',
        },
        finalClassification: {
            category: { type: String },
            subcategory: { type: String },
            severity: { type: String },
            priority: { type: String },
        },
        reviewedByAdmin: { type: Boolean, default: false },
        reviewedAt: { type: Date },
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        // Legacy image URL string field for backward compatibility
        imageUrl: { type: String },

        // Production Cloudinary Media Metadata Schema
        image: {
            url: { type: String },
            publicId: { type: String },
            originalFilename: { type: String },
            mimeType: { type: String },
            fileSize: { type: Number },
            uploadedAt: { type: Date, default: Date.now },
            fingerprint: { type: String },
        },

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

        adminResponse: { type: String },
        urgency: {
            type: String,
            enum: ['Low', 'Medium', 'High', 'Urgent'],
            default: 'Medium',
        },
        textEmbedding: {
            type: [Number],
            default: undefined,
        },
    },
    { timestamps: true }
);

// Pre-save hook to ensure 2dsphere index compatibility for text-only complaints
complaintSchema.pre('save', function () {
    if (!this.locationPoint || !Array.isArray(this.locationPoint.coordinates) || this.locationPoint.coordinates.length < 2) {
        this.locationPoint = undefined;
    }
});

// Indexes
complaintSchema.index({ locationPoint: '2dsphere' }, { sparse: true });
complaintSchema.index({ departmentCode: 1 });
complaintSchema.index({ status: 1 });
complaintSchema.index({ 'sla.dueAt': 1 });
complaintSchema.index({ 'sla.status': 1 });
complaintSchema.index({ escalationLevel: 1 });
complaintSchema.index({ user: 1 });

const Complaint = mongoose.model('Complaint', complaintSchema);
module.exports = Complaint;
