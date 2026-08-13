/**
 * Explainable & Modular Text Similarity Service
 * Provides token Jaccard and character n-gram cosine similarity algorithms.
 * Isolated interface ready for future Sentence-BERT / LLM embedding replacements.
 */

/**
 * Normalizes input text by lowercasing, stripping accents, special chars, and extra spaces.
 * @param {string} text - Input raw text
 * @returns {string} Normalized string
 */
const normalizeText = (text = '') => {
    if (!text || typeof text !== 'string') return '';
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Strip diacritics / accents
        .replace(/[^a-z0-9\s]/g, ' ')   // Keep alphanumerics and space
        .replace(/\s+/g, ' ')           // Collapse consecutive spaces
        .trim();
};

/**
 * Computes Jaccard similarity between two arrays of tokens.
 * @param {Array<string>} tokensA
 * @param {Array<string>} tokensB
 * @returns {number} Normalized score between 0.0 and 1.0
 */
const computeTokenJaccard = (tokensA = [], tokensB = []) => {
    if (!tokensA.length || !tokensB.length) return 0.0;

    const setA = new Set(tokensA);
    const setB = new Set(tokensB);

    let intersectionCount = 0;
    for (const token of setA) {
        if (setB.has(token)) {
            intersectionCount++;
        }
    }

    const unionSize = new Set([...tokensA, ...tokensB]).size;
    return unionSize === 0 ? 0.0 : intersectionCount / unionSize;
};

/**
 * Generates character n-grams from a string.
 * @param {string} text
 * @param {number} n
 * @returns {Map<string, number>} Map of n-gram frequencies
 */
const generateNGramFrequencies = (text, n = 3) => {
    const freqs = new Map();
    if (text.length < n) {
        freqs.set(text, 1);
        return freqs;
    }

    for (let i = 0; i <= text.length - n; i++) {
        const gram = text.substring(i, i + n);
        freqs.set(gram, (freqs.get(gram) || 0) + 1);
    }
    return freqs;
};

/**
 * Computes Cosine similarity over character n-gram frequency vectors.
 * @param {string} textA
 * @param {string} textB
 * @param {number} n
 * @returns {number} Normalized similarity from 0.0 to 1.0
 */
const computeNGramCosine = (textA, textB, n = 3) => {
    if (!textA || !textB) return 0.0;
    if (textA === textB) return 1.0;

    const mapA = generateNGramFrequencies(textA, n);
    const mapB = generateNGramFrequencies(textB, n);

    let dotProduct = 0.0;
    let normA = 0.0;
    let normB = 0.0;

    for (const val of mapA.values()) {
        normA += val * val;
    }
    for (const val of mapB.values()) {
        normB += val * val;
    }

    for (const [gram, countA] of mapA.entries()) {
        if (mapB.has(gram)) {
            dotProduct += countA * mapB.get(gram);
        }
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0.0 : dotProduct / denominator;
};

/**
 * Computes normalized overall text similarity between two texts or complaint titles/descriptions.
 * Combined score = 50% Token Jaccard + 50% Character Trigram Cosine.
 * 
 * @param {string} textA - First text string
 * @param {string} textB - Second text string
 * @returns {number} Similarity score normalized between 0.0 and 1.0
 */
const computeTextSimilarity = (textA = '', textB = '') => {
    const normA = normalizeText(textA);
    const normB = normalizeText(textB);

    if (!normA || !normB) return 0.0;
    if (normA === normB) return 1.0;

    const tokensA = normA.split(' ').filter(Boolean);
    const tokensB = normB.split(' ').filter(Boolean);

    const jaccardScore = computeTokenJaccard(tokensA, tokensB);
    const ngramScore = computeNGramCosine(normA, normB, 3);

    // Weighted combination of token-level and character n-gram level similarity
    const combinedScore = (jaccardScore * 0.5) + (ngramScore * 0.5);
    return Number(Math.min(1.0, Math.max(0.0, combinedScore)).toFixed(4));
};

const config = require('../config/duplicateConfig');
const semanticEmbeddingService = require('./semanticEmbeddingService');

/**
 * Creates canonical text representation for a complaint by combining title and description.
 * Ensures proper punctuation separation between title and description while preserving context.
 * @param {string} title
 * @param {string} description
 * @returns {string} Combined canonical text
 */
const prepareCanonicalText = (title = '', description = '') => {
    const cleanTitle = (title || '').trim();
    const cleanDesc = (description || '').trim();

    if (cleanTitle && cleanDesc) {
        const titleEndsWithPunct = /[.!?]$/.test(cleanTitle);
        return `${cleanTitle}${titleEndsWithPunct ? '' : '.'} ${cleanDesc}`;
    }
    return cleanTitle || cleanDesc || '';
};

/**
 * Computes hybrid text similarity combining lexical (Jaccard + n-gram) and semantic (embedding) similarity.
 * Uses LEXICAL_TEXT_WEIGHT (default 0.35) and SEMANTIC_TEXT_WEIGHT (default 0.65) from duplicateConfig.
 * Falls back to 100% lexical score if semantic vectors are unavailable or embedding fails.
 * 
 * @param {string} textA - First text string
 * @param {string} textB - Second text string
 * @param {Array<number>|null} [vectorA] - Optional pre-computed embedding for textA
 * @param {Array<number>|null} [vectorB] - Optional pre-computed embedding for textB
 * @returns {Promise<{ combinedScore: number, lexicalScore: number, semanticScore: number|null }>}
 */
const computeHybridTextSimilarity = async (textA = '', textB = '', vectorA = null, vectorB = null) => {
    const lexicalScore = computeTextSimilarity(textA, textB);

    let semanticScore = null;
    let vecA = vectorA;
    let vecB = vectorB;

    try {
        if (!vecA && textA) {
            vecA = await semanticEmbeddingService.generateEmbedding(textA);
        }
        if (!vecB && textB) {
            vecB = await semanticEmbeddingService.generateEmbedding(textB);
        }

        if (vecA && vecB) {
            semanticScore = semanticEmbeddingService.computeCosineSimilarity(vecA, vecB);
        }
    } catch (err) {
        console.error('[TextSimilarityService] Semantic similarity calculation failed (falling back to lexical):', err.message || err);
        semanticScore = null;
    }

    const lexicalWeight = config.LEXICAL_TEXT_WEIGHT ?? 0.35;
    const semanticWeight = config.SEMANTIC_TEXT_WEIGHT ?? 0.65;

    let combinedScore;
    if (semanticScore !== null && !isNaN(semanticScore)) {
        combinedScore = (lexicalScore * lexicalWeight) + (semanticScore * semanticWeight);
    } else {
        // Fallback to 100% lexical score
        combinedScore = lexicalScore;
    }

    combinedScore = Number(Math.min(1.0, Math.max(0.0, combinedScore)).toFixed(4));

    return {
        combinedScore,
        lexicalScore,
        semanticScore,
    };
};

module.exports = {
    normalizeText,
    computeTokenJaccard,
    computeNGramCosine,
    computeTextSimilarity,
    prepareCanonicalText,
    computeHybridTextSimilarity,
};
