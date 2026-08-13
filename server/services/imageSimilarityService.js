/**
 * Perceptual Image Hashing & Similarity Service (Sprint 5)
 * Uses Jimp for deterministic difference hashing (dHash) and Hamming distance comparison.
 * Tolerates resizing, recompression, and minor modifications.
 */

const { Jimp } = require('jimp');

/**
 * Computes gray intensity of a 32-bit RGBA color int.
 * @param {number} rgbaHex
 * @returns {number} Greyscale value (0-255)
 */
const getPixelLuminance = (rgbaHex) => {
    // Jimp getPixelColor returns 32-bit RGBA integer
    const r = (rgbaHex >> 24) & 0xff;
    const g = (rgbaHex >> 16) & 0xff;
    const b = (rgbaHex >> 8) & 0xff;
    return Math.round(0.299 * r + 0.587 * g + 0.114 * b);
};

/**
 * Generates a 64-bit perceptual difference hash (dHash) hex string for an image buffer or URL.
 * @param {Buffer|string} input - Image Buffer or URL
 * @returns {Promise<string|null>} 16-character hex fingerprint or null if invalid
 */
const generateImageFingerprint = async (input) => {
    if (!input) return null;

    try {
        let image;
        if (Buffer.isBuffer(input)) {
            image = await Jimp.read(input);
        } else if (typeof input === 'string' && (input.startsWith('http://') || input.startsWith('https://') || input.startsWith('data:image'))) {
            image = await Jimp.read(input);
        } else {
            return null;
        }

        // Resize image to 9x8 and convert to grayscale for 64-bit dHash
        image.resize({ w: 9, h: 8 }).greyscale();

        let binaryBits = '';
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                const leftColor = image.getPixelColor(x, y);
                const rightColor = image.getPixelColor(x + 1, y);

                const leftLum = getPixelLuminance(leftColor);
                const rightLum = getPixelLuminance(rightColor);

                binaryBits += leftLum > rightLum ? '1' : '0';
            }
        }

        // Convert 64 binary bits to 16 hex characters
        let hexFingerprint = '';
        for (let i = 0; i < 64; i += 4) {
            const nibble = binaryBits.substring(i, i + 4);
            hexFingerprint += parseInt(nibble, 2).toString(16);
        }

        return hexFingerprint.toLowerCase();
    } catch (error) {
        console.warn('Perceptual Image Hash Warning:', error.message);
        return null;
    }
};

/**
 * Computes Hamming distance (number of differing bits) between two hex fingerprints.
 * @param {string} hash1 - 16-char hex fingerprint
 * @param {string} hash2 - 16-char hex fingerprint
 * @returns {number|null} Hamming distance (0 to 64) or null if invalid
 */
const computeHammingDistance = (hash1, hash2) => {
    if (!hash1 || !hash2 || hash1.length !== hash2.length) return null;

    let distance = 0;
    for (let i = 0; i < hash1.length; i++) {
        const val1 = parseInt(hash1[i], 16);
        const val2 = parseInt(hash2[i], 16);
        let xor = val1 ^ val2;

        while (xor > 0) {
            distance += xor & 1;
            xor >>= 1;
        }
    }
    return distance;
};

/**
 * Computes normalized image similarity score between two perceptual hash fingerprints.
 * @param {string} hash1 - First image hex fingerprint
 * @param {string} hash2 - Second image hex fingerprint
 * @returns {number|null} Normalized similarity between 0.0 and 1.0, or null if signal is unavailable
 */
const computeImageSimilarity = (hash1, hash2) => {
    if (!hash1 || !hash2) return null;

    const distance = computeHammingDistance(hash1, hash2);
    if (distance === null) return null;

    // 64 total bits. Similarity = 1.0 - (distance / 64)
    const similarity = 1.0 - (distance / 64.0);
    return Number(Math.min(1.0, Math.max(0.0, similarity)).toFixed(4));
};

module.exports = {
    generateImageFingerprint,
    computeHammingDistance,
    computeImageSimilarity,
};
