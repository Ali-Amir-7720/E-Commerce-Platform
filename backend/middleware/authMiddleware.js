const { verifyToken } = require('../utils/jwt');

const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            error: 'Authentication required',
            detail: 'Provide a valid Bearer token in the Authorization header',
        });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            error: 'Authentication required',
            detail: 'Token is missing from the Authorization header',
        });
    }

    try {
        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Token expired',
                detail: 'Your session has expired. Please log in again.',
            });
        }
        return res.status(401).json({
            error: 'Invalid token',
            detail: 'The token is malformed or has been tampered with.',
        });
    }
};

module.exports = { authenticate };