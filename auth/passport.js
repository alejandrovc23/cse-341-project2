const passport = require('passport');
const { Strategy: GitHubStrategy } = require('passport-github2');
const { ObjectId } = require('mongodb');
const mongodb = require('../data/database');

let configured = false;

const getBaseUrl = () => (
    process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`
).replace(/\/+$/, '');

const getCallbackUrl = () => (
    process.env.GITHUB_CALLBACK_URL || `${getBaseUrl()}/auth/github/callback`
);

const isOAuthConfigured = () => Boolean(
    process.env.GITHUB_CLIENT_ID &&
    process.env.GITHUB_CLIENT_SECRET
);

const toPublicUser = (user) => {
    if (!user) {
        return null;
    }

    return {
        id: user._id.toString(),
        provider: user.provider,
        username: user.username,
        displayName: user.displayName,
        profileUrl: user.profileUrl,
        avatarUrl: user.avatarUrl
    };
};

const configurePassport = () => {
    if (configured) {
        return passport;
    }

    passport.serializeUser((user, done) => {
        done(null, user._id.toString());
    });

    passport.deserializeUser(async (id, done) => {
        try {
            if (!ObjectId.isValid(id)) {
                return done(null, false);
            }

            const user = await mongodb.getDatabase()
                .collection('users')
                .findOne({ _id: new ObjectId(id) });

            return done(null, user || false);
        } catch (error) {
            return done(error);
        }
    });

    if (isOAuthConfigured()) {
        passport.use(new GitHubStrategy({
            clientID: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            callbackURL: getCallbackUrl(),
            state: true
        }, async (accessToken, refreshToken, profile, done) => {
            try {
                const now = new Date();
                const user = await mongodb.getDatabase()
                    .collection('users')
                    .findOneAndUpdate(
                        { provider: 'github', providerId: profile.id },
                        {
                            $set: {
                                username: profile.username || null,
                                displayName: profile.displayName || profile.username || 'GitHub user',
                                profileUrl: profile.profileUrl || null,
                                avatarUrl: profile.photos?.[0]?.value || null,
                                updatedAt: now
                            },
                            $setOnInsert: {
                                provider: 'github',
                                providerId: profile.id,
                                createdAt: now
                            }
                        },
                        { upsert: true, returnDocument: 'after' }
                    );

                return done(null, user);
            } catch (error) {
                return done(error);
            }
        }));
    }

    configured = true;
    return passport;
};

module.exports = {
    configurePassport,
    getCallbackUrl,
    isOAuthConfigured,
    toPublicUser
};
