/**
 * Centralized Configuration for Intelligent Duplicate Complaint Detection (Sprint 5)
 */
module.exports = {
    // Default search radius in meters for initial candidate retrieval via MongoDB 2dsphere $near
    RADIUS_METERS: process.env.DUPLICATE_RADIUS_METERS ? Number(process.env.DUPLICATE_RADIUS_METERS) : 500,

    // Signal Weights (Sum to 1.0)
    SIGNAL_WEIGHTS: {
        LOCATION: 0.35,
        TEXT: 0.30,
        IMAGE: 0.25,
        CATEGORY: 0.10,
    },

    // Confidence Level Thresholds (0 - 100 scale)
    CONFIDENCE_THRESHOLDS: {
        POSSIBLE: 50,
        LIKELY: 75,
        VERY_LIKELY: 90,
    },

    // Maximum number of top candidate complaints to return
    MAX_CANDIDATES: process.env.DUPLICATE_MAX_CANDIDATES ? Number(process.env.DUPLICATE_MAX_CANDIDATES) : 5,

    // Text Similarity Signal Breakdown (Lexical + Semantic)
    LEXICAL_TEXT_WEIGHT: process.env.LEXICAL_TEXT_WEIGHT ? Number(process.env.LEXICAL_TEXT_WEIGHT) : 0.35,
    SEMANTIC_TEXT_WEIGHT: process.env.SEMANTIC_TEXT_WEIGHT ? Number(process.env.SEMANTIC_TEXT_WEIGHT) : 0.65,

    // Embedding Configuration
    EMBEDDING_PROVIDER: process.env.EMBEDDING_PROVIDER || 'local',
    EMBEDDING_MODEL: process.env.EMBEDDING_MODEL || 'Xenova/all-MiniLM-L6-v2',

    // Distance decay bounds for normalized location similarity
    DISTANCE_BOUNDS: [
        { maxMeters: 50, score: 1.0 },    // 0 - 50m: Very High
        { maxMeters: 100, score: 0.85 },  // 50 - 100m: High
        { maxMeters: 250, score: 0.60 },  // 100 - 250m: Moderate
        { maxMeters: 500, score: 0.30 },  // 250 - 500m: Low
    ],
};
