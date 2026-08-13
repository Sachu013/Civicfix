/**
 * Role-Based Access Control (RBAC) & Department Scoping Middleware
 */

/**
 * Ensures user has one of the required roles.
 * Treats 'admin' as 'super_admin' for full backward compatibility.
 */
const requireRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized, user missing' });
        }

        const userRole = req.user.role;
        const isSuperAdmin = userRole === 'super_admin' || userRole === 'admin';

        if (isSuperAdmin || allowedRoles.includes(userRole)) {
            return next();
        }

        return res.status(403).json({
            message: `Forbidden: User role '${userRole}' is not authorized to access this resource`,
        });
    };
};

/**
 * Mandatory backend department isolation middleware.
 * Guarantees that Department Heads and Staff ONLY query their assigned department.
 * Prevents parameter tampering (e.g. Roads Head passing ?departmentCode=WATER).
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

    // Department Heads & Staff are strictly bound to their assigned departmentCode
    if (userRole === 'department_head' || userRole === 'department_staff') {
        if (!req.user.departmentCode) {
            return res.status(403).json({
                message: 'Forbidden: User is missing an assigned department code',
            });
        }

        // Force backend department code scope; override client-provided tampering
        req.departmentCode = req.user.departmentCode.toUpperCase();
        req.query = req.query || {};
        req.query.departmentCode = req.departmentCode;
        req.isGlobalScope = false;

        return next();
    }

    // Citizens cannot access department administrative endpoints
    return res.status(403).json({
        message: 'Forbidden: Citizen role cannot access department administrative endpoints',
    });
};

module.exports = {
    requireRoles,
    enforceDepartmentScope,
};
