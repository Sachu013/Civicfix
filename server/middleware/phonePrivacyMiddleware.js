const { normalizeDepartmentCode } = require('../config/departmentConfig');

/**
 * Recursively sanitizes user phone numbers based on strict role-based access rules:
 * - Citizen: Can see own phone number
 * - Department Head: Can see phone number of citizens whose complaints belong to their department
 * - Verifier: Can see phone number of citizens assigned to their department/complaints
 * - Super Admin: MUST NOT see citizen phone numbers under any circumstances (phone field is stripped)
 */
const sanitizePhonePrivacy = (data, reqUser) => {
    if (!data) return data;

    const userRole = reqUser ? reqUser.role : null;
    const isSuperAdmin = reqUser && (userRole === 'super_admin' || userRole === 'admin');

    const sanitizeObject = (item, parentComplaint = null) => {
        if (!item || typeof item !== 'object') return item;

        // Convert Mongoose document or Buffer/Date objects safely
        if (item instanceof Date || Buffer.isBuffer(item)) return item;

        let rawObj = typeof item.toObject === 'function' ? item.toObject() : item;

        if (Array.isArray(rawObj)) {
            return rawObj.map((el) => sanitizeObject(el, parentComplaint));
        }

        // Clone object to prevent mutating source objects in memory
        let obj = { ...rawObj };

        // Determine if current object context represents a complaint
        const currentComplaint = (obj.complaintId || (obj._id && (obj.departmentCode || obj.category))) ? obj : parentComplaint;

        // Check if current object contains a phone property
        if (Object.prototype.hasOwnProperty.call(obj, 'phone') && obj.phone !== undefined && obj.phone !== null) {
            let canSeePhone = false;

            if (reqUser) {
                if (!isSuperAdmin) {
                    if (userRole === 'citizen') {
                        // Citizen can see own phone number
                        if (obj._id && reqUser._id && obj._id.toString() === reqUser._id.toString()) {
                            canSeePhone = true;
                        } else if (!obj._id && !obj.complaintId) {
                            canSeePhone = true;
                        }
                    } else if (userRole === 'department_head') {
                        // Department Head can see phone of citizens whose complaints belong to their department
                        if (currentComplaint && currentComplaint.departmentCode && reqUser.departmentCode) {
                            const compDept = normalizeDepartmentCode(currentComplaint.departmentCode);
                            const userDept = normalizeDepartmentCode(reqUser.departmentCode);
                            if (compDept === userDept) {
                                canSeePhone = true;
                            }
                        } else if (!obj._id && !obj.complaintId) {
                            canSeePhone = true;
                        }
                    } else if (userRole === 'verifier' || userRole === 'department_staff') {
                        // Verifier can see phone ONLY for complaints assigned to them in their department
                        if (currentComplaint && currentComplaint.departmentCode && reqUser.departmentCode) {
                            const compDept = normalizeDepartmentCode(currentComplaint.departmentCode);
                            const userDept = normalizeDepartmentCode(reqUser.departmentCode);
                            if (compDept === userDept) {
                                const assignedId = currentComplaint.assignedTo
                                    ? (currentComplaint.assignedTo._id || currentComplaint.assignedTo).toString()
                                    : null;
                                if (assignedId && reqUser._id && assignedId === reqUser._id.toString()) {
                                    canSeePhone = true;
                                }
                            }
                        } else if (!obj._id && !obj.complaintId) {
                            canSeePhone = true;
                        }
                    }
                }
            } else {
                // Unauthenticated response (e.g., login, request-otp, verify-otp)
                // If it's an auth response payload rather than a public complaint record, preserve phone
                if (!obj.complaintId && (!obj._id || obj.token || obj.role || obj.success !== undefined)) {
                    canSeePhone = true;
                }
            }

            if (!canSeePhone) {
                delete obj.phone;
            }
        }

        // Recursively sanitize all nested properties
        for (const key of Object.keys(obj)) {
            if (obj[key] && typeof obj[key] === 'object') {
                obj[key] = sanitizeObject(obj[key], currentComplaint);
            }
        }

        return obj;
    };

    return sanitizeObject(data);
};

/**
 * Express middleware that intercepts res.json to automatically enforce phone privacy
 */
const phonePrivacyMiddleware = (req, res, next) => {
    const originalJson = res.json;

    res.json = function (data) {
        try {
            const sanitizedData = sanitizePhonePrivacy(data, req.user);
            return originalJson.call(this, sanitizedData);
        } catch (err) {
            console.error('[PHONE PRIVACY MIDDLEWARE] Error during response sanitization:', err);
            return originalJson.call(this, data);
        }
    };

    next();
};

module.exports = {
    sanitizePhonePrivacy,
    phonePrivacyMiddleware,
};
