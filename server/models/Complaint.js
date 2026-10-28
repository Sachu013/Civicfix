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

        // Department & Assignment Architecture (Phase 3)
        department: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Department',
        },
        departmentCode: {
            type: String,
            default: 'PUBLIC_WORKS',
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
            enum: ['automatic', 'admin', 'escalation', 'reassignment', 'department_head', 'unassigned'],
            default: 'automatic',
        },
        assignmentHistory: [
            {
                verifier: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                assignedAt: { type: Date, default: Date.now },
                action: { type: String, enum: ['assigned', 'reassigned', 'unassigned'] },
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
        // Phase 4: Field Verifier Investigation & Verification Report
        verificationState: {
            type: String,
            enum: ['UNVERIFIED', 'AWAITING_REVIEW', 'VERIFIED_CONFIRMED', 'VERIFIED_NOT_FOUND', 'VERIFIED_RESOLVED', 'VERIFIED_INSUFFICIENT'],
            default: 'UNVERIFIED',
        },
        verificationReport: {
            verifier: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
            submittedAt: { type: Date },
            findings: { type: String },
            outcome: {
                type: String,
                enum: ['VERIFIED_CONFIRMED', 'VERIFIED_NOT_FOUND', 'VERIFIED_RESOLVED', 'VERIFIED_INSUFFICIENT', 'ISSUE_CONFIRMED', 'ISSUE_NOT_FOUND', 'ISSUE_ALREADY_RESOLVED', 'INSUFFICIENT_EVIDENCE', 'NEEDS_FURTHER_INSPECTION'],
            },
            contactWithCitizen: { type: Boolean, default: false },
            citizenContactNotes: { type: String, default: '' },
            locationVerified: { type: Boolean, default: false },
            status: { type: String, enum: ['draft', 'submitted'], default: 'submitted' },
            evidence: [
                {
                    url: { type: String, required: true },
                    publicId: { type: String },
                    originalName: { type: String },
                    mimeType: { type: String },
                    size: { type: Number },
                    uploadedAt: { type: Date, default: Date.now },
                },
            ],
        },
        verificationHistory: [
            {
                verifier: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                action: { type: String, required: true },
                outcome: { type: String, required: true },
                findings: { type: String },
                evidenceCount: { type: Number, default: 0 },
                contactWithCitizen: { type: Boolean },
                citizenContactNotes: { type: String },
                locationVerified: { type: Boolean },
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
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

complaintSchema.virtual('assignedVerifier')
    .get(function () {
        return this.assignedTo;
    })
    .set(function (val) {
        this.assignedTo = val;
    });

// Pre-save hook to ensure 2dsphere index compatibility and departmentCode normalization
complaintSchema.pre('save', function () {
    if (!this.locationPoint || !Array.isArray(this.locationPoint.coordinates) || this.locationPoint.coordinates.length < 2) {
        this.locationPoint = undefined;
    }
    if (this.departmentCode) {
        const { normalizeDepartmentCode } = require('../config/departmentConfig');
        this.departmentCode = normalizeDepartmentCode(this.departmentCode);
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
