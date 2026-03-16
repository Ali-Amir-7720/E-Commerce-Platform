
const ROLES = Object.freeze({
    ADMIN: 1,
    CUSTOMER: 2,
    COURIER: 3,
    VENDOR: 4,
});

const ROLE_LABELS = Object.freeze({
    1: 'Admin',
    2: 'Customer',
    3: 'Courier',
    4: 'Vendor',
});

const authorize = (...allowedRoles) => {
    const validIds = Object.values(ROLES);
    for (const r of allowedRoles) {
        if (!validIds.includes(r)) {
            throw new Error(
                `rbacMiddleware.authorize() received unknown role_id: ${r}. ` +
                `Valid values: ${validIds.join(', ')}`
            );
        }
    }

    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        if (!allowedRoles.includes(req.user.role_id)) {
            const userRole = ROLE_LABELS[req.user.role_id] || `Unknown(${req.user.role_id})`;
            const permitted = allowedRoles.map(r => ROLE_LABELS[r]).join(', ');
            return res.status(403).json({
                error: 'Forbidden',
                detail: `Role '${userRole}' is not permitted. Required: ${permitted}.`,
            });
        }

        next();
    };
};
const authorizeOwnerOrAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const isAdmin = req.user.role_id === ROLES.ADMIN;
    const isOwner = req.user.id === parseInt(req.params.userId, 10);

    if (!isAdmin && !isOwner) {
        return res.status(403).json({
            error: 'Forbidden',
            detail: 'You can only access your own resources.',
        });
    }

    next();
};

module.exports = { authorize, authorizeOwnerOrAdmin, ROLES };