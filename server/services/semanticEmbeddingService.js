/**
 * Semantic Embedding Service
 * Provides text vector embeddings and cosine similarity computations.
 * Isolated interface supporting local Transformers.js (Xenova/all-MiniLM-L6-v2)
 * with graceful error handling and fallback capabilities.
 */

const config = require('../config/duplicateConfig');

// Singleton feature-extraction pipeline instance (lazy loaded)
let pipelineInstance = null;
let pipelineLoadingPromise = null;

/**
 * Initializes and retrieves the local sentence-transformer pipeline.
 * @returns {Promise<Function|null>} Pipeline extractor function or null if initialization fails
 */
const getPipelineInstance = async () => {
    if (pipelineInstance) return pipelineInstance;

    if (pipelineLoadingPromise) {
        return await pipelineLoadingPromise;
    }

    pipelineLoadingPromise = (async () => {
        try {
            // Dynamically import @xenova/transformers
            const { pipeline, env } = await import('@xenova/transformers');

            // Configure cache & environment settings if needed
            env.allowRemoteModels = true;

            const modelName = config.EMBEDDING_MODEL || 'Xenova/all-MiniLM-L6-v2';
            if (process.env.NODE_ENV === 'development') {
                console.log(`[SemanticEmbedding] Loading feature extraction model: ${modelName}...`);
            }

            const extractor = await pipeline('feature-extraction', modelName, {
                quantized: true,
            });

            pipelineInstance = extractor;
            if (process.env.NODE_ENV === 'development') {
                console.log(`[SemanticEmbedding] Model ${modelName} loaded successfully.`);
            }
            return pipelineInstance;
        } catch (err) {
            console.error('[SemanticEmbedding] Failed to load embedding pipeline:', err.message || err);
            pipelineInstance = null;
            return null;
        } finally {
            pipelineLoadingPromise = null;
        }
    })();

    return await pipelineLoadingPromise;
};

/**
 * Generates a normalized numeric vector embedding for the input text.
 * @param {string} text - Canonical complaint text string
 * @returns {Promise<Array<number>|null>} Embedding vector as array of floats, or null on failure
 */
const generateEmbedding = async (text = '') => {
    if (!text || typeof text !== 'string' || !text.trim()) {
        return null;
    }

    try {
        const extractor = await getPipelineInstance();
        if (!extractor) {
            return null;
        }

        // Feature extraction with mean pooling and L2 normalization
        const output = await extractor(text.trim(), {
            pooling: 'mean',
            normalize: true,
        });

        if (!output || !output.data) {
            return null;
        }

        // Convert Float32Array to standard JavaScript Array of Numbers
        const vector = Array.from(output.data);
        return vector;
    } catch (err) {
        console.error('[SemanticEmbedding] Exception generating embedding:', err.message || err);
        return null; // Graceful fallback on any model / execution failure
    }
};

/**
 * Calculates Cosine Similarity between two embedding vectors.
 * Score is normalized between 0.0 (unrelated) and 1.0 (semantically identical).
 * 
 * @param {Array<number>} vectorA - First vector
 * @param {Array<number>} vectorB - Second vector
 * @returns {number|null} Similarity score (0.0 - 1.0) or null if vectors are invalid
 */
const computeCosineSimilarity = (vectorA, vectorB) => {
    if (!Array.isArray(vectorA) || !Array.isArray(vectorB)) {
        return null;
    }

    if (vectorA.length === 0 || vectorB.length === 0 || vectorA.length !== vectorB.length) {
        return null;
    }

    let dotProduct = 0.0;
    let normA = 0.0;
    let normB = 0.0;

    for (let i = 0; i < vectorA.length; i++) {
        const valA = vectorA[i];
        const valB = vectorB[i];
        dotProduct += valA * valB;
        normA += valA * valA;
        normB += valB * valB;
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    if (denominator === 0) return 0.0;

    const rawSimilarity = dotProduct / denominator;

    // Clamp score to [0.0, 1.0] and round to 4 decimal places
    const clampedScore = Math.min(1.0, Math.max(0.0, rawSimilarity));
    return Number(clampedScore.toFixed(4));
};

module.exports = {
    generateEmbedding,
    computeCosineSimilarity,
};
