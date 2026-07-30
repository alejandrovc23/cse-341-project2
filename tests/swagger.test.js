const test = require('node:test');
const assert = require('node:assert/strict');
const swagger = require('../swagger.json');

test('uses the Render deployment as the default Swagger server', () => {
    assert.equal(swagger.servers[0].url, 'https://project2-vxz5.onrender.com');
});

test('documents every CRUD operation for authors and books', () => {
    for (const resource of ['authors', 'books']) {
        assert.ok(swagger.paths[`/${resource}`].get);
        assert.ok(swagger.paths[`/${resource}`].post);
        assert.ok(swagger.paths[`/${resource}/{id}`].get);
        assert.ok(swagger.paths[`/${resource}/{id}`].put);
        assert.ok(swagger.paths[`/${resource}/{id}`].delete);
    }
});

test('documents GitHub OAuth, session status, and logout', () => {
    assert.ok(swagger.paths['/auth/github'].get);
    assert.ok(swagger.paths['/auth/github/callback'].get);
    assert.ok(swagger.paths['/auth/status'].get);
    assert.ok(swagger.paths['/auth/logout'].post);
    assert.ok(swagger.components.securitySchemes.cookieAuth);
});

test('protects every mutating author and book operation in Swagger', () => {
    for (const resource of ['authors', 'books']) {
        for (const operation of [
            swagger.paths[`/${resource}`].post,
            swagger.paths[`/${resource}/{id}`].put,
            swagger.paths[`/${resource}/{id}`].delete
        ]) {
            assert.deepEqual(operation.security, [{ cookieAuth: [] }]);
            assert.ok(operation.responses['401']);
        }
    }
});

test('does not prefill the optional books authorId filter', () => {
    const authorIdParameter = swagger.paths['/books'].get.parameters
        .find((parameter) => parameter.name === 'authorId');

    assert.equal(authorIdParameter.required, false);
    assert.equal(authorIdParameter.schema.example, undefined);
});

test('documents resource-specific conflict and validation responses', () => {
    assert.equal(swagger.paths['/authors'].post.responses['409'], undefined);
    assert.ok(swagger.paths['/books'].post.responses['409']);
    assert.ok(swagger.paths['/books'].get.responses['400']);
    assert.ok(swagger.paths['/authors/{id}'].delete.responses['409']);
});

test('provides executable demonstration examples for Swagger', () => {
    const authorProperties = swagger.components.schemas.AuthorInput.properties;
    const bookProperties = swagger.components.schemas.BookInput.properties;

    assert.equal(authorProperties.firstName.example, 'Video');
    assert.equal(authorProperties.lastName.example, 'Author');
    assert.match(bookProperties.authorId.example, /^[a-f0-9]{24}$/);
    assert.equal(bookProperties.title.example, 'Video Demo Book');
});
