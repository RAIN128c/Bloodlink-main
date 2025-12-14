/**
 * Authentication Middleware
 * Provides route protection based on user authentication and roles
 */

/**
 * Require user to be authenticated
 * Redirects to login page if not authenticated
 */
function requireAuth(req, res, next) {
    if (req.session && req.session.user) {
        // User is authenticated
        return next();
    }

    // Not authenticated - redirect to login
    return res.redirect('/');
}

/**
 * Require user to have admin or doctor role
 * Returns 403 Forbidden if user doesn't have required role
 */
function requireAdmin(req, res, next) {
    if (!req.session || !req.session.user) {
        // Not authenticated - redirect to login
        return res.redirect('/');
    }

    const userRole = req.session.user.role;
    const allowedRoles = ['admin', 'doctor', 'แพทย์', 'Admin'];

    if (allowedRoles.some(role => userRole && userRole.toLowerCase().includes(role.toLowerCase()))) {
        // User has admin/doctor role
        return next();
    }

    // User doesn't have required role
    return res.status(403).send('Access Denied: Admin privileges required');
}

/**
 * Flexible role-based access control
 * @param {string[]} allowedRoles - Array of allowed roles
 */
function requireRole(allowedRoles) {
    return (req, res, next) => {
        if (!req.session || !req.session.user) {
            return res.redirect('/');
        }

        const userRole = req.session.user.role;

        if (allowedRoles.some(role => userRole && userRole.toLowerCase().includes(role.toLowerCase()))) {
            return next();
        }

        return res.status(403).send('Access Denied: Insufficient privileges');
    };
}

/**
 * Check if user can edit (Admin or Lab)
 * @param {object} user - User object from session
 * @returns {boolean}
 */
function canEdit(user) {
    if (!user || !user.role) return false;

    // Admin and Lab can edit patient data
    const editRoles = ['admin', 'ผู้ดูแลระบบ', 'Admin', 'lab', 'แลป', 'Lab'];
    return editRoles.some(role => user.role.toLowerCase().includes(role.toLowerCase()));
}

/**
 * Check if user is true admin (not Lab)
 * @param {object} user - User object from session
 * @returns {boolean}
 */
function isAdmin(user) {
    if (!user || !user.role) return false;

    const adminRoles = ['admin', 'ผู้ดูแลระบบ', 'Admin'];
    return adminRoles.some(role => user.role.toLowerCase().includes(role.toLowerCase()));
}

/**
 * Check if user is Lab role
 * @param {object} user - User object from session
 * @returns {boolean}
 */
function isLab(user) {
    if (!user || !user.role) return false;

    const labRoles = ['lab', 'แลป', 'Lab'];
    return labRoles.some(role => user.role.toLowerCase().includes(role.toLowerCase()));
}

/**
 * Check if user can edit patient information (not Lab)
 * Lab can update test status but cannot edit patient basic info
 * @param {object} user - User object from session
 * @returns {boolean}
 */
function canEditPatientInfo(user) {
    if (!user || !user.role) return false;

    // Everyone except Lab can edit patient info
    return !isLab(user);
}

/**
 * Require edit permission (Admin or Lab)
 * For editing patient data
 */
function requireEditPermission(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.redirect('/');
    }

    if (canEdit(req.session.user)) {
        return next();
    }

    return res.status(403).send('Access Denied: Edit privileges required');
}

/**
 * Require user to NOT be Lab
 * Used for features Lab shouldn't access (e.g., adding patients)
 */
function requireNotLab(req, res, next) {
    if (!req.session || !req.session.user) {
        return res.redirect('/');
    }

    if (isLab(req.session.user)) {
        return res.status(403).send('Access Denied: Lab users cannot access this feature');
    }

    return next();
}

/**
 * Middleware to attach user data to res.locals for use in templates
 * Makes user data available to all EJS templates
 */
function attachUserToLocals(req, res, next) {
    if (req.session && req.session.user) {
        res.locals.user = req.session.user;
        res.locals.isAdmin = isAdmin(req.session.user); // True admin only
        res.locals.canEdit = canEdit(req.session.user);  // Admin or Lab (for test status)
        res.locals.canEditPatientInfo = canEditPatientInfo(req.session.user); // Everyone except Lab
        res.locals.isLab = isLab(req.session.user); // Check if user is Lab
    } else {
        res.locals.user = null;
        res.locals.isAdmin = false;
        res.locals.canEdit = false;
        res.locals.canEditPatientInfo = false;
        res.locals.isLab = false;
    }
    next();
}

/**
 * Middleware to revalidate user role from Google Sheets
 * Fetches the latest role and updates session if changed
 * Uses caching to minimize API calls
 */
async function revalidateUserRole(req, res, next) {
    // Only revalidate if user is logged in
    if (!req.session || !req.session.user) {
        return next();
    }

    try {
        const { getUserRoleFromSheets } = require('../services/authService');
        const latestRole = await getUserRoleFromSheets(req.session.user.email);

        if (latestRole && latestRole !== req.session.user.role) {
            // Role changed! Update session
            console.log(`Role updated for ${req.session.user.email}: ${req.session.user.role} → ${latestRole}`);
            req.session.user.role = latestRole;

            // Force update of res.locals for this request
            const { isAdmin, canEdit } = require('../middleware/authMiddleware');
            res.locals.isAdmin = isAdmin(req.session.user);
            res.locals.canEdit = canEdit(req.session.user);
        }
    } catch (error) {
        // Don't block request if revalidation fails
        console.error('Error revalidating user role:', error);
    }

    next();
}

module.exports = {
    requireAuth,
    requireAdmin,
    requireRole,
    requireEditPermission,
    requireNotLab,
    isAdmin,
    canEdit,
    isLab,
    canEditPatientInfo,
    attachUserToLocals,
    revalidateUserRole
};
