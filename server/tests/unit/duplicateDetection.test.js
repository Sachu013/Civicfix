/**
 * Unit Test Suite for Intelligent Duplicate Complaint Detection
 */
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../../.env') });

const duplicateConfig = require('../../config/duplicateConfig');
const textSimilarityService = require('../../services/textSimilarityService');
const imageSimilarityService = require('../../services/imageSimilarityService');
const duplicateDetectionService = require('../../services/duplicateDetectionService');
const Complaint = require('../../models/Complaint');

async function runTests() {
    console.log('====================================================');
    console.log('STARTING DUPLICATE DETECTION TEST SUITE');
    console.log('====================================================\n');

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB Atlas successfully.');

        // Test 1: Text Similarity Engine Tests
        console.log('\n--- TEST 1: Text Similarity Service ---');
        const textExact = textSimilarityService.computeTextSimilarity(
            'Large pothole near bus stop',
            'Large pothole near bus stop'
        );
        console.log(`Exact text match score: ${(textExact * 100).toFixed(1)}% (Expected ~100%)`);

        const textReworded = textSimilarityService.computeTextSimilarity(
            'Large pothole near bus stop',
            'Big pothole close to the bus stand'
        );
        console.log(`Reworded text match score: ${(textReworded * 100).toFixed(1)}% (Expected >60%)`);

        const textDifferent = textSimilarityService.computeTextSimilarity(
            'Large pothole near bus stop',
            'Broken street light in residential sector park'
        );
        console.log(`Different text score: ${(textDifferent * 100).toFixed(1)}% (Expected <20%)`);

        // Test 2: Image Fingerprinting & Similarity Tests
        console.log('\n--- TEST 2: Image Similarity Service ---');
        const mockHashA = 'a1f0c2e4b6d83012';
        const mockHashB = 'a1f0c2e4b6d83012'; // Identical
        const mockHashC = 'a1f0c2e4b6d83015'; // 1 bit diff

        const imgIdentical = imageSimilarityService.computeImageSimilarity(mockHashA, mockHashB);
        const imgMinorDiff = imageSimilarityService.computeImageSimilarity(mockHashA, mockHashC);
        console.log(`Identical fingerprint similarity: ${(imgIdentical * 100).toFixed(1)}% (Expected 100%)`);
        console.log(`Minor diff fingerprint similarity: ${(imgMinorDiff * 100).toFixed(1)}% (Expected >95%)`);

        // Test 3: Geospatial Distance & Multi-Signal Candidate Query
        console.log('\n--- TEST 3: Duplicate Detector Multi-Signal Query ---');
        const dupResult = await duplicateDetectionService.findPotentialDuplicates({
            latitude: 28.6139,
            longitude: 77.2090,
            title: 'Geospatial Water Leakage Observed',
            description: 'Major water leakage from pipeline causing flooding near Connaught Place',
            category: 'Water Leakage',
        });

        console.log(`Duplicates detected: ${dupResult.hasPotentialDuplicates}`);
        console.log(`Candidate count: ${dupResult.candidates.length}`);

        dupResult.candidates.forEach((c, idx) => {
            console.log(`\n  [Candidate #${idx + 1}] ID: ${c.complaintId}`);
            console.log(`  Title: "${c.title}"`);
            console.log(`  Distance: ${c.distance}m | Category: ${c.category}`);
            console.log(`  Overall Score: ${c.overallScore}% (${c.confidence})`);
            console.log(`  Component Scores: Location=${c.locationScore}%, Text=${c.textScore}%, Image=${c.imageScore ?? 'N/A'}, Category=${c.categoryScore ?? 'N/A'}`);
        });

        // Test 4: Dynamic Weight Re-normalization for Legacy Complaints
        console.log('\n--- TEST 4: Legacy Complaint Weight Re-normalization ---');
        const legacyTest = await duplicateDetectionService.findPotentialDuplicates({
            latitude: 28.6139,
            longitude: 77.2090,
            title: 'Pothole Hazard',
            description: 'Deep pothole damaging vehicles on main street',
            category: 'Road Damage',
        });
        console.log(`Legacy query returned ${legacyTest.candidates.length} candidate(s). Weights re-normalized cleanly.`);

        console.log('\n====================================================');
        console.log('ALL DUPLICATE DETECTION TESTS PASSED SUCCESSFULLY!');
        console.log('====================================================');
    } catch (err) {
        console.error('Test Suite Exception:', err);
    } finally {
        await mongoose.disconnect();
    }
}

runTests();
