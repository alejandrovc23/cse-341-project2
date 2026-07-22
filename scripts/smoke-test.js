const assert = require('node:assert/strict');
const { ObjectId } = require('mongodb');
const mongodb = require('../data/database');
const { app } = require('../server');

let server;
let authorId;
let bookId;

const request = async (baseUrl, path, options = {}) => {
    const response = await fetch(`${baseUrl}${path}`, options);
    const text = await response.text();
    const body = text ? JSON.parse(text) : undefined;
    return { response, body };
};

const run = async () => {
    await mongodb.initDb();
    server = await new Promise((resolve) => {
        const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
    });

    const baseUrl = `http://127.0.0.1:${server.address().port}`;
    const jsonHeaders = { 'Content-Type': 'application/json' };
    const uniqueValue = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const isbn = uniqueValue.slice(0, 13).padEnd(13, '0');

    let result = await request(baseUrl, '/health');
    assert.equal(result.response.status, 200);

    result = await request(baseUrl, '/authors', {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify({
            firstName: 'Integration',
            lastName: `Author ${uniqueValue}`,
            birthDate: '1980-01-01',
            nationality: 'Peruvian',
            biography: 'Temporary author created by the automated integration smoke test.',
            website: `https://example.com/authors/${uniqueValue}`
        })
    });
    assert.equal(result.response.status, 201);
    authorId = result.body.id;

    result = await request(baseUrl, `/authors/${authorId}`);
    assert.equal(result.response.status, 200);

    result = await request(baseUrl, '/books', {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify({ title: 'Incomplete book' })
    });
    assert.equal(result.response.status, 400);

    const bookInput = {
        title: `Integration Book ${uniqueValue}`,
        isbn,
        genre: 'Testing',
        publicationYear: 2024,
        publisher: 'CSE 341 Press',
        language: 'English',
        pageCount: 250,
        available: true,
        description: 'Temporary book created to verify all database-backed API operations.',
        authorId
    };

    result = await request(baseUrl, '/books', {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify(bookInput)
    });
    assert.equal(result.response.status, 201);
    bookId = result.body.id;

    result = await request(baseUrl, `/books?authorId=${authorId}`);
    assert.equal(result.response.status, 200);
    assert.equal(result.body.some((book) => book._id === bookId), true);

    result = await request(baseUrl, `/books/${bookId}`, {
        method: 'PUT',
        headers: jsonHeaders,
        body: JSON.stringify({ ...bookInput, available: false })
    });
    assert.equal(result.response.status, 204);

    result = await request(baseUrl, `/authors/${authorId}`, { method: 'DELETE' });
    assert.equal(result.response.status, 409);

    result = await request(baseUrl, `/books/${bookId}`, { method: 'DELETE' });
    assert.equal(result.response.status, 204);
    bookId = undefined;

    result = await request(baseUrl, `/authors/${authorId}`, { method: 'DELETE' });
    assert.equal(result.response.status, 204);
    authorId = undefined;

    result = await request(baseUrl, `/books/${new ObjectId()}`);
    assert.equal(result.response.status, 404);

    console.log('Integration smoke test passed: CRUD, validation, relationships, and errors work against MongoDB.');
};

const cleanup = async () => {
    try {
        if (bookId) {
            await mongodb.getDatabase().collection('books').deleteOne({ _id: new ObjectId(bookId) });
        }
        if (authorId) {
            await mongodb.getDatabase().collection('authors').deleteOne({ _id: new ObjectId(authorId) });
        }
    } finally {
        if (server) {
            await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
        }
        await mongodb.closeDb();
    }
};

run()
    .catch((error) => {
        console.error('Integration smoke test failed:', error);
        process.exitCode = 1;
    })
    .finally(cleanup);
