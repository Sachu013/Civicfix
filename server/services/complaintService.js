const Complaint = require('../models/Complaint');
const ErrorResponse = require('../utils/errorResponse');
const geoService = require('./geoService');
const uploadService = require('./uploadService');
const imageSimilarityService = require('./imageSimilarityService');
const textSimilarityService = require('./textSimilarityService');
const semanticEmbeddingService = require('./semanticEmbeddingService');
const taxonomy = require('../config/complaintCategories');
const aiClassificationService = require('./aiClassificationService');
const priorityService = require('./priorityService');
const routingService = require('./routingService');
const slaService = require('./slaService');
const notificationService = require('./notificationService');

const createComplaint = async ({
    userId,
    title,
    description,
    category,
    subcategory,
    location,
    imageUrl,
    imageFile,
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
    // Normalize citizen selected category & subcategory against taxonomy
    const norm = taxonomy.normalizeCategory(category, subcategory);

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

    // Process Image Upload or Legacy URL & Generate Perceptual Hash Fingerprint
    let imageMetadata = null;
    let finalImageUrl = imageUrl || '';

    if (imageFile) {
        imageMetadata = await uploadService.uploadImage(imageFile);
        finalImageUrl = imageMetadata.url;
        // Generate perceptual hash fingerprint from image file buffer
        const fingerprint = await imageSimilarityService.generateImageFingerprint(imageFile.buffer);
        if (fingerprint) {
            imageMetadata.fingerprint = fingerprint;
        }
    } else if (imageUrl) {
        const fingerprint = await imageSimilarityService.generateImageFingerprint(imageUrl);
        imageMetadata = {
            url: imageUrl,
            originalFilename: 'legacy_url',
            mimeType: 'image/jpeg',
            fileSize: 0,
            uploadedAt: new Date(),
            fingerprint: fingerprint || undefined,
        };
    }

    // Generate semantic text embedding for canonical text representation
    let textEmbedding = undefined;
    try {
        const canonicalText = textSimilarityService.prepareCanonicalText(title, description);
        const embedding = await semanticEmbeddingService.generateEmbedding(canonicalText);
        if (embedding && Array.isArray(embedding)) {
            textEmbedding = embedding;
        }
    } catch (embErr) {
        console.error('[ComplaintService] Embedding generation warning during creation:', embErr.message || embErr);
    }

    // Run Sprint 6 AI-Assisted Classification & Severity Prediction
    let aiResult = null;
    let aiStatus = 'pending';
    let assignedSeverity = 'Medium';
    let assignedPriority = 'Medium';

    try {
        aiResult = await aiClassificationService.classifyComplaint({
            title,
            description,
            citizenCategory: norm.displayName,
            citizenSubcategory: norm.subcategoryDisplayName,
            imageUrl: finalImageUrl,
            imageBuffer: imageFile ? imageFile.buffer : null,
        });

        if (aiResult) {
            aiStatus = 'completed';
            assignedSeverity = aiResult.severity || 'Medium';
            assignedPriority = aiResult.priority || priorityService.calculatePriority({ severity: assignedSeverity, title, description });
        }
    } catch (aiErr) {
        console.error('[ComplaintService] AI Classification failed gracefully:', aiErr.message || aiErr);
        aiStatus = 'failed';
        assignedPriority = priorityService.calculatePriority({ severity: assignedSeverity, title, description });
    }

    // Sprint 7 Automated Department Routing
    const deptRouting = await routingService.determineDepartment({
        category: norm.displayName,
        subcategory: norm.subcategoryDisplayName,
        aiClassification: aiResult ? {
            category: aiResult.categoryDisplayName || aiResult.category,
            subcategory: aiResult.subcategoryDisplayName || aiResult.subcategory,
        } : null,
    });

    // Sprint 7 Authoritative SLA Calculation
    const sla = slaService.calculateSLAForComplaint(
        assignedSeverity,
        deptRouting.departmentDoc,
        new Date()
    );

    // Simple unique ID generator
    const complaintId = 'CMP' + Date.now().toString().slice(-8);

    const now = new Date();

    const complaintData = {
        complaintId,
        user: userId,
        title,
        description,
        category: norm.displayName,
        subcategory: norm.subcategoryDisplayName,
        severity: assignedSeverity,
        priority: assignedPriority,
        imageUrl: finalImageUrl,
        image: imageMetadata,
        urgency: assignedPriority === 'Critical' ? 'Urgent' : assignedPriority === 'High' ? 'High' : 'Medium',

        // Department & Assignment Architecture
        department: deptRouting.departmentId,
        departmentCode: deptRouting.code,
        assignedDepartment: deptRouting.name,
        assignedAt: now,
        assignmentSource: 'automatic',
        assignmentHistory: [
            {
                previousDepartmentCode: null,
                newDepartmentCode: deptRouting.code,
                previousDepartmentName: null,
                newDepartmentName: deptRouting.name,
                reason: 'Automated AI/Category Department Routing on creation.',
                assignmentSource: 'automatic',
                timestamp: now,
            },
        ],

        // SLA Infrastructure
        sla,

        // Escalation System
        escalationLevel: 0,
        escalationHistory: [
            {
                level: 0,
                reason: 'Initial complaint creation - SLA on track.',
                timestamp: now,
            },
        ],

        // Status Workflow
        status: 'Submitted',
        statusHistory: [
            {
                previousStatus: null,
                newStatus: 'Submitted',
                note: 'Complaint submitted by citizen.',
                timestamp: now,
            },
        ],

        textEmbedding,
        aiClassification: aiResult ? {
            category: aiResult.categoryDisplayName || aiResult.category,
            subcategory: aiResult.subcategoryDisplayName || aiResult.subcategory,
            severity: aiResult.severity,
            priority: aiResult.priority,
            confidence: aiResult.confidence,
            reasoning: aiResult.reasoning,
            model: aiResult.model,
            generatedAt: aiResult.generatedAt,
        } : undefined,
        aiClassificationStatus: aiStatus,
        ...formattedGeo,
    };

    const complaint = await Complaint.create(complaintData);

    // Send assignment notification
    notificationService.notifyAssignment({
        complaint,
        department: deptRouting.departmentDoc,
    }).catch(() => {});

    return complaint;
};

const getUserComplaints = async (userId) => {
    const complaints = await Complaint.find({ user: userId })
        .populate('department', 'name code slaConfig contactInformation')
        .sort({ createdAt: -1 });

    // Dynamic SLA status check on fetch
    return complaints.map((comp) => updateLiveSLAAndEscalation(comp));
};

const trackComplaint = async (complaintId) => {
    const complaint = await Complaint.findOne({ complaintId })
        .populate('user', 'name email')
        .populate('department', 'name code slaConfig contactInformation')
        .populate('assignedTo', 'name email')
        .populate('assignmentHistory.changedBy', 'name email')
        .populate('statusHistory.changedBy', 'name email');

    if (!complaint) {
        throw new ErrorResponse('Complaint not found', 404);
    }
    return updateLiveSLAAndEscalation(complaint);
};

const getNearbyComplaints = async ({ latitude, longitude, radiusInMeters = 500 }) => {
    const lat = Number(latitude);
    const lng = Number(longitude);

    if (isNaN(lat) || isNaN(lng)) {
        return [];
    }

    const radius = Number(radiusInMeters) || 500;

    return await Complaint.find({
        locationPoint: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [lng, lat],
                },
                $maxDistance: radius,
            },
        },
    }).limit(50);
};

const supportComplaint = async (complaintId, userId) => {
    const complaint = await Complaint.findOne({ complaintId });
    if (!complaint) {
        throw new ErrorResponse('Complaint not found', 404);
    }
    return {
        success: true,
        complaintId: complaint.complaintId,
        title: complaint.title,
        status: complaint.status,
        message: `Successfully supported existing complaint #${complaint.complaintId}.`,
    };
};

const verifyResolution = async (complaintId, userId, { verified, feedback }) => {
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
        throw new ErrorResponse('Complaint not found', 404);
    }

    if (complaint.user.toString() !== userId.toString()) {
        throw new ErrorResponse('Not authorized to verify this complaint', 403);
    }

    const previousStatus = complaint.status;
    const now = new Date();

    if (verified) {
        complaint.status = 'Closed';
        if (complaint.sla) {
            complaint.sla.status = 'completed';
        }
        complaint.citizenVerification = {
            verified: true,
            verifiedAt: now,
            feedback: feedback || 'Citizen confirmed resolution.',
        };
        complaint.statusHistory.push({
            previousStatus,
            newStatus: 'Closed',
            changedBy: userId,
            note: feedback ? `Citizen verified: ${feedback}` : 'Citizen confirmed issue resolution.',
            timestamp: now,
        });
    } else {
        complaint.status = 'Reopened';
        complaint.reopenedAt = now;
        complaint.reopenCount = (complaint.reopenCount || 0) + 1;
        complaint.citizenVerification = {
            verified: false,
            verifiedAt: now,
            feedback: feedback || 'Citizen reported issue is still unresolved.',
        };
        complaint.statusHistory.push({
            previousStatus,
            newStatus: 'Reopened',
            changedBy: userId,
            note: feedback ? `Citizen rejected resolution: ${feedback}` : 'Citizen reported issue remains unresolved.',
            timestamp: now,
        });
    }

    await complaint.save();
    return complaint;
};

const reopenComplaint = async (complaintId, userId, reason) => {
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
        throw new ErrorResponse('Complaint not found', 404);
    }

    if (complaint.user.toString() !== userId.toString()) {
        throw new ErrorResponse('Not authorized to reopen this complaint', 403);
    }

    const previousStatus = complaint.status;
    const now = new Date();

    complaint.status = 'Reopened';
    complaint.reopenedAt = now;
    complaint.reopenCount = (complaint.reopenCount || 0) + 1;
    complaint.statusHistory.push({
        previousStatus,
        newStatus: 'Reopened',
        changedBy: userId,
        note: reason ? `Reopened by citizen: ${reason}` : 'Reopened by citizen.',
        timestamp: now,
    });

    await complaint.save();
    return complaint;
};

/**
 * Dynamically computes SLA status & escalation level on complaint retrieval
 */
const updateLiveSLAAndEscalation = (complaint) => {
    if (!complaint || !complaint.sla) return complaint;

    const isCompleted = complaint.status === 'Resolved' || complaint.status === 'Closed';
    const liveSLAStatus = slaService.getSLAStatus(
        complaint.sla.startedAt,
        complaint.sla.dueAt,
        0.20,
        isCompleted
    );

    if (complaint.sla.status !== liveSLAStatus) {
        complaint.sla.status = liveSLAStatus;
        if (liveSLAStatus === 'breached' && !complaint.sla.breachedAt) {
            complaint.sla.breachedAt = new Date();
        }
    }

    if (!isCompleted && complaint.escalationLevel !== 3) {
        if (liveSLAStatus === 'breached') {
            complaint.escalationLevel = 2;
        } else if (liveSLAStatus === 'due_soon') {
            complaint.escalationLevel = 1;
        }
    }

    return complaint;
};

module.exports = {
    createComplaint,
    getUserComplaints,
    trackComplaint,
    getNearbyComplaints,
    supportComplaint,
    verifyResolution,
    reopenComplaint,
    updateLiveSLAAndEscalation,
};
