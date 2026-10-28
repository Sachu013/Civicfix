const { protect } = require('./authMiddleware');
const { normalizeDepartmentCode } = require('../config/departmentConfig');

/**
 * Ensures user has one of the required roles.
 * Treats 'admin' as 'super_admin' for full backward compatibility.
 * Treats 'department_staff' as 'verifier' for backward compatibility.
 */
const requireRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized, user missing' });
        }

        const userRole = req.user.role;
        const isSuperAdmin = userRole === 'super_admin' || userRole === 'admin';

        const roles = allowedRoles.flat();
        const effectiveRoles = roles.map(r => r === 'verifier' ? ['verifier', 'department_staff'] : r).flat();

        if (isSuperAdmin || effectiveRoles.includes(userRole)) {
            return next();
        }

        return res.status(403).json({
            message: `Forbidden: User role '${userRole}' is not authorized to access this resource`,
        });
    };
};

/**
 * Mandatory backend department isolation middleware.
 * Guarantees that Department Heads and Verifiers ONLY query their assigned department.
 * Prevents parameter tampering (e.g. Roads Head passing ?departmentCode=WATER_DRAINAGE).
 */
const enforceDepartmentScope = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user missing' });
    }

    const userRole = req.user.role;

    // Super Admins retain global city-wide access
    if (userRole === 'super_admin' || userRole === 'admin') {
        req.isGlobalScope = true;
        return next();
    }

    // Department Heads & Verifiers are strictly bound to their assigned departmentCode
    if (['department_head', 'verifier', 'department_staff'].includes(userRole)) {
        if (!req.user.departmentCode) {
            return res.status(403).json({
                message: 'Forbidden: User is missing an assigned department code',
            });
        }

        const normalizedCode = normalizeDepartmentCode(req.user.departmentCode);
        req.departmentCode = normalizedCode;
        req.query = req.query || {};
        req.query.departmentCode = normalizedCode;
        req.isGlobalScope = false;

        return next();
    }

    // Citizens cannot access department administrative endpoints
    return res.status(403).json({
        message: 'Forbidden: Citizen role cannot access department administrative endpoints',
    });
};

module.exports = {
    requireAuth: protect,
    requireRoles,
    requireRole: requireRoles,
    enforceDepartmentScope,
    requireDepartment: enforceDepartmentScope,
    requireDepartmentAccess: enforceDepartmentScope,
};

