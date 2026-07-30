const test = require('node:test');
const assert = require('node:assert/strict');
const requireAuth = require('../middleware/requireAuth');
const { toPublicUser } = require('../auth/passport');

test('allows an authenticated request to continue', () => {
    let nextCalled = false;
    const req = { isAuthenticated: () => true };

    requireAuth(req, {}, () => {
        nextCalled = true;
    });

    assert.equal(nextCalled, true);
});

test('rejects an unauthenticated request with a login route', () => {
    const req = { isAuthenticated: () => false };
    const response = {};
    const res = {
        status(code) {
            response.status = code;
            return this;
        },
        json(body) {
            response.body = body;
            return this;
        }
    };

    requireAuth(req, res, () => assert.fail('next should not be called'));

    assert.equal(response.status, 401);
    assert.deepEqual(response.body, {
        message: 'Authentication required',
        login: '/auth/github'
    });
});

test('exposes only safe user profile fields', () => {
    const user = {
        _id: { toString: () => '64ac660864282d23d377e557' },
        provider: 'github',
        providerId: '12345',
        username: 'octocat',
        displayName: 'The Octocat',
        profileUrl: 'https://github.com/octocat',
        avatarUrl: 'https://avatars.githubusercontent.com/u/583231',
        accessToken: 'must-not-leak'
    };

    assert.deepEqual(toPublicUser(user), {
        id: '64ac660864282d23d377e557',
        provider: 'github',
        username: 'octocat',
        displayName: 'The Octocat',
        profileUrl: 'https://github.com/octocat',
        avatarUrl: 'https://avatars.githubusercontent.com/u/583231'
    });
});
