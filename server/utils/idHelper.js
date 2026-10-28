const mongoose = require('mongoose');

/**
 * Safely extracts a clean string representation from an ID parameter.
 * Handles strings, numbers, Mongoose ObjectIds, or objects containing _id/complaintId/buffer.
 * Rejects invalid, non-convertible, or malformed objects with null.
 * 
 * @param {any} val - Raw identifier input
 * @returns {string|null} Sanitized string identifier or null if invalid
 */
const sanitizeIdString = (val) => {
    if (val === null || val === undefined) return null;
    
    if (typeof val === 'string') {
        const trimmed = val.trim();
        if (trimmed === '[object Object]' || trimmed === 'undefined' || trimmed === 'null' || trimmed.length === 0) return null;
        return trimmed;
    }
    if (typeof val === 'number') return String(val);

    if (val instanceof mongoose.Types.ObjectId) {
        return val.toString();
    }

    if (Buffer.isBuffer(val)) {
        return val.toString('hex');
    }

    if (typeof val === 'object') {
        if (val._id) return sanitizeIdString(val._id);
        if (val.complaintId) return sanitizeIdString(val.complaintId);
        if (val.buffer) {
            if (Buffer.isBuffer(val.buffer)) return val.buffer.toString('hex');
            if (val.buffer.data && Array.isArray(val.buffer.data)) {
                return Buffer.from(val.buffer.data).toString('hex');
            }
        }
        if (val.data && Array.isArray(val.data)) {
            return Buffer.from(val.data).toString('hex');
        }
        if (typeof val.toString === 'function') {
            const str = val.toString();
            if (str && str !== '[object Object]') return str;
        }
    }
    return null;
};

/**
 * Helper to find a complaint by MongoDB _id or custom string complaintId.
 * Guarantees that only valid primitive strings are passed into Mongoose queries,
 * preventing CastError exceptions.
 * 
 * @param {any} id - Identifier string or object
 * @param {Object} [ComplaintModel] - Optional Mongoose Complaint model reference
 * @returns {Promise<Object|null>} Complaint document or null
 */
const findComplaintByIdOrCode = async (id, ComplaintModel) => {
    const cleanId = sanitizeIdString(id);
    if (!cleanId) return null;

    const Complaint = ComplaintModel || require('../models/Complaint');
    let complaint = null;

    if (mongoose.Types.ObjectId.isValid(cleanId)) {
        complaint = await Complaint.findById(cleanId);
    }
    if (!complaint) {
        complaint = await Complaint.findOne({ complaintId: cleanId });
    }
    return complaint;
};

module.exports = {
    sanitizeIdString,
    findComplaintByIdOrCode,
};
