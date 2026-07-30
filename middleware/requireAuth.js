const requireAuth = (req, res, next) => {
    if (typeof req.isAuthenticated === 'function' && req.isAuthenticated()) {
        return next();
    }

    return res.status(401).json({
        message: 'Authentication required',
        login: '/auth/github'
    });
};

module.exports = requireAuth;
