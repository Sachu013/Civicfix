/**
 * Intelligent Duplicate Complaint Detection Service (Sprint 5)
 * Orchestrates multi-signal scoring (Geographic, Text, Image, Category) with dynamic weight re-normalization.
 */

const Complaint = require('../models/Complaint');
const config = require('../config/duplicateConfig');
const textSimilarityService = require('./textSimilarityService');
const imageSimilarityService = require('./imageSimilarityService');
const semanticEmbeddingService = require('./semanticEmbeddingService');

/**
 * Calculates Haversine distance in meters between two lat/lng pairs.
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} Distance in meters
 */
const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Earth radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
};

/**
 * Maps distance in meters to a normalized location similarity score (0.0 to 1.0).
 * @param {number} distanceMeters
 * @returns {number} Normalized location similarity
 */
const calculateLocationScore = (distanceMeters) => {
    for (const bound of config.DISTANCE_BOUNDS) {
        if (distanceMeters <= bound.maxMeters) {
            return bound.score;
        }
    }
    return 0.0;
};

/**
 * Maps an overall score (0-100) to a human-readable confidence label.
 * @param {number} score
 * @returns {string} Confidence string
 */
const getConfidenceLabel = (score) => {
    if (score >= config.CONFIDENCE_THRESHOLDS.VERY_LIKELY) {
        return 'Very likely duplicate';
    }
    if (score >= config.CONFIDENCE_THRESHOLDS.LIKELY) {
        return 'Likely duplicate';
    }
    if (score >= config.CONFIDENCE_THRESHOLDS.POSSIBLE) {
        return 'Possible duplicate';
    }
    return 'No significant similarity';
};

/**
 * Searches for potential duplicate complaints within search radius.
 * Evaluates geographic, text (lexical + semantic embedding), image, and category signals.
 * Dynamically normalizes signal weights for missing attributes.
 * 
 * @param {Object} params
 * @param {number} params.latitude
 * @param {number} params.longitude
 * @param {string} params.title
 * @param {string} params.description
 * @param {string} params.category
 * @param {Buffer} [params.imageBuffer] - Uploaded evidence file buffer
 * @param {string} [params.imageUrl] - Direct image URL
 * @param {Object} [params.imageFile] - Express file object containing buffer
 * @returns {Promise<Object>} Object with { hasPotentialDuplicates, candidates }
 */
const findPotentialDuplicates = async ({
    latitude,
    longitude,
    title = '',
    description = '',
    category = '',
    imageBuffer = null,
    imageUrl = null,
    imageFile = null,
}) => {
    try {
        const lat = Number(latitude);
        const lng = Number(longitude);

        // 1. Validate coordinates
        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return { hasPotentialDuplicates: false, candidates: [] };
        }

        // 2. Query nearby candidate complaints within RADIUS_METERS using 2dsphere $near
        const searchRadius = config.RADIUS_METERS || 500;
        const candidatesFromDb = await Complaint.find({
            locationPoint: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [lng, lat],
                    },
                    $maxDistance: searchRadius,
                },
            },
        }).limit(30); // Pre-fetch reasonable candidate set for ranking

        if (!candidatesFromDb || candidatesFromDb.length === 0) {
            return { hasPotentialDuplicates: false, candidates: [] };
        }

        // 3. Temporary in-memory image fingerprint generation for incoming new complaint (NO Cloudinary upload yet)
        let newImageFingerprint = null;
        const targetBuffer = imageBuffer || (imageFile && imageFile.buffer);

        if (targetBuffer) {
            newImageFingerprint = await imageSimilarityService.generateImageFingerprint(targetBuffer);
        } else if (imageUrl) {
            newImageFingerprint = await imageSimilarityService.generateImageFingerprint(imageUrl);
        }

        // Generate canonical text and semantic embedding for the new complaint
        const newCanonicalText = textSimilarityService.prepareCanonicalText(title, description);
        let newEmbedding = null;
        try {
            newEmbedding = await semanticEmbeddingService.generateEmbedding(newCanonicalText);
        } catch (embErr) {
            console.error('[DuplicateDetector] Failed to generate embedding for input complaint:', embErr.message || embErr);
        }

        // 4. Multi-signal scoring for each candidate
        const scoredCandidates = [];

        for (const candidate of candidatesFromDb) {
            const candLat = candidate.latitude || candidate.locationPoint?.coordinates?.[1];
            const candLng = candidate.longitude || candidate.locationPoint?.coordinates?.[0];

            if (!candLat || !candLng) continue;

            const distanceMeters = calculateHaversineDistance(lat, lng, candLat, candLng);
            const locationScore = calculateLocationScore(distanceMeters);

            const candCanonicalText = textSimilarityService.prepareCanonicalText(candidate.title, candidate.description);
            let candEmbedding = candidate.textEmbedding;

            // Option B: Generate and cache embedding on first use for historical complaints
            if (!candEmbedding || !Array.isArray(candEmbedding) || candEmbedding.length === 0) {
                try {
                    candEmbedding = await semanticEmbeddingService.generateEmbedding(candCanonicalText);
                    if (candEmbedding && candidate._id) {
                        // Asynchronously persist cached embedding to MongoDB
                        Complaint.updateOne({ _id: candidate._id }, { textEmbedding: candEmbedding }).catch((err) => {
                            console.warn('[DuplicateDetector] Could not cache embedding for complaint:', candidate.complaintId, err.message);
                        });
                    }
                } catch (candEmbErr) {
                    candEmbedding = null;
                }
            }

            // Compute hybrid text score combining Lexical (35%) and Semantic (65%)
            const hybridTextResult = await textSimilarityService.computeHybridTextSimilarity(
                newCanonicalText,
                candCanonicalText,
                newEmbedding,
                candEmbedding
            );

            const textScore = hybridTextResult.combinedScore;

            // Category Similarity
            let categoryScore = null;
            if (category && candidate.category) {
                categoryScore = category.toLowerCase() === candidate.category.toLowerCase() ? 1.0 : 0.0;
            }

            // Image Similarity
            let imageScore = null;
            const candFingerprint = candidate.image?.fingerprint;
            if (newImageFingerprint && candFingerprint) {
                imageScore = imageSimilarityService.computeImageSimilarity(newImageFingerprint, candFingerprint);
            }

            // 5. Dynamic Weight Re-Normalization for missing signals
            const weights = config.SIGNAL_WEIGHTS;
            let totalAvailableWeight = 0;
            let weightedSum = 0;

            // Location signal (always present)
            totalAvailableWeight += weights.LOCATION;
            weightedSum += locationScore * weights.LOCATION;

            // Text signal (always present)
            totalAvailableWeight += weights.TEXT;
            weightedSum += textScore * weights.TEXT;

            // Category signal (if present)
            if (categoryScore !== null) {
                totalAvailableWeight += weights.CATEGORY;
                weightedSum += categoryScore * weights.CATEGORY;
            }

            // Image signal (if present)
            if (imageScore !== null) {
                totalAvailableWeight += weights.IMAGE;
                weightedSum += imageScore * weights.IMAGE;
            }

            // Re-normalize score to 0-100 scale
            const overallScore = Math.round((weightedSum / totalAvailableWeight) * 100);
            const confidence = getConfidenceLabel(overallScore);

            scoredCandidates.push({
                complaintId: candidate.complaintId,
                title: candidate.title,
                category: candidate.category,
                status: candidate.status,
                distance: distanceMeters,
                overallScore,
                locationScore: Math.round(locationScore * 100),
                textScore: Math.round(textScore * 100),
                lexicalTextScore: Math.round(hybridTextResult.lexicalScore * 100),
                semanticTextScore: hybridTextResult.semanticScore !== null ? Math.round(hybridTextResult.semanticScore * 100) : null,
                combinedTextScore: Math.round(textScore * 100),
                imageScore: imageScore !== null ? Math.round(imageScore * 100) : null,
                categoryScore: categoryScore !== null ? Math.round(categoryScore * 100) : null,
                confidence,
                formattedAddress: candidate.formattedAddress || candidate.location,
                imageUrl: candidate.image?.url || candidate.imageUrl || null,
                createdAt: candidate.createdAt,
            });
        }

        // 6. Filter by minimum confidence threshold (50) & rank top N candidates
        const filteredCandidates = scoredCandidates
            .filter((c) => c.overallScore >= config.CONFIDENCE_THRESHOLDS.POSSIBLE)
            .sort((a, b) => b.overallScore - a.overallScore)
            .slice(0, config.MAX_CANDIDATES || 5);

        // Development log output for debugging
        if (process.env.NODE_ENV === 'development') {
            console.log(`[DuplicateDetector] Analyzed ${candidatesFromDb.length} candidates.`);
            if (filteredCandidates.length > 0) {
                const top = filteredCandidates[0];
                console.log(
                    `[DuplicateDetector] Top match: ${top.complaintId} | Dist: ${top.distance}m | Text: ${top.textScore}% | Image: ${top.imageScore}% | Score: ${top.overallScore}%`
                );
            }
        }

        return {
            hasPotentialDuplicates: filteredCandidates.length > 0,
            candidates: filteredCandidates,
        };
    } catch (error) {
        console.error('Duplicate Detection Service Error:', error);
        // Fallback gracefully on exception - do NOT crash complaint workflow
        return { hasPotentialDuplicates: false, candidates: [] };
    }
};

module.exports = {
    findPotentialDuplicates,
    calculateHaversineDistance,
    calculateLocationScore,
    getConfidenceLabel,
};
