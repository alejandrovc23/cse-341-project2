const express = require('express');
const crypto = require('crypto');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');
const mongodb = require('./data/database');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandlers');
const requireAuth = require('./middleware/requireAuth');
const {
    configurePassport,
    getCallbackUrl,
    isOAuthConfigured
} = require('./auth/passport');

const port = process.env.PORT || 3000;
const sessionSecret = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const passport = configurePassport();

const createApp = () => {
    const app = express();
    const sessionStore = MongoStore.create({
        mongoUrl: process.env.MONGODB_URL,
        dbName: mongodb.getDatabaseName(),
        collectionName: 'sessions',
        ttl: 60 * 60 * 24
    });
    sessionStore.on('error', (error) => {
        console.error('Session store error:', error.message);
    });

    app.set('trust proxy', 1);
    app.disable('x-powered-by');
    app.locals.requireAuth = requireAuth;
    app.locals.sessionStore = sessionStore;

    app.use(express.json({ limit: '100kb' }));
    app.use(session({
        name: 'library.sid',
        secret: sessionSecret,
        store: sessionStore,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 1000 * 60 * 60 * 24
        }
    }));
    app.use(passport.initialize());
    app.use(passport.session());

    app.use((req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

        if (req.method === 'OPTIONS') {
            return res.status(204).send();
        }

        next();
    });

    app.use('/', routes);
    app.use(notFound);
    app.use(errorHandler);

    return app;
};

const app = createApp();
const start = async () => {
    await mongodb.initDb();

    if (!process.env.SESSION_SECRET) {
        console.warn('SESSION_SECRET is missing; sessions will be invalidated when the server restarts.');
    }
    if (!isOAuthConfigured()) {
        console.warn('GitHub OAuth is disabled until GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET are configured.');
    }

    return app.listen(port, () => {
        console.log(`Library API is running on port ${port}`);
        console.log(`MongoDB database: ${mongodb.getDatabaseName()}`);
        console.log(`GitHub OAuth callback: ${getCallbackUrl()}`);
    });
};

if (require.main === module) {
    start().catch((error) => {
        console.error('The application could not start:', error.message);
        process.exit(1);
    });
}

module.exports = { app, createApp, start };
