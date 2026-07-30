const router = require('express').Router();
const passport = require('passport');
const requireAuth = require('../middleware/requireAuth');
const { isOAuthConfigured, toPublicUser } = require('../auth/passport');

const ensureOAuthConfigured = (req, res, next) => {
    if (!isOAuthConfigured()) {
        return res.status(503).json({
            message: 'GitHub OAuth is not configured on this server'
        });
    }

    next();
};

router.get('/github',
    ensureOAuthConfigured,
    passport.authenticate('github', { scope: ['read:user'] })
);

router.get('/github/callback',
    ensureOAuthConfigured,
    passport.authenticate('github', { failureRedirect: '/auth/failure' }),
    (req, res) => res.redirect('/api-docs?login=success')
);

router.get('/status', (req, res) => {
    const authenticated = (
        typeof req.isAuthenticated === 'function' &&
        req.isAuthenticated()
    );

    res.status(200).json({
        authenticated,
        user: authenticated ? toPublicUser(req.user) : null
    });
});

router.get('/failure', (req, res) => {
    res.status(401).json({ message: 'GitHub authentication failed' });
});

router.post('/logout', requireAuth, (req, res, next) => {
    req.logout((logoutError) => {
        if (logoutError) {
            return next(logoutError);
        }

        req.session.destroy((sessionError) => {
            if (sessionError) {
                return next(sessionError);
            }

            res.clearCookie('library.sid', {
                httpOnly: true,
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production'
            });
            return res.status(204).send();
        });
    });
});

module.exports = router;
