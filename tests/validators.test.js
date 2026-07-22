const test = require('node:test');
const assert = require('node:assert/strict');
const { ObjectId } = require('mongodb');
const { validateAuthor } = require('../validators/authors');
const { validateBook } = require('../validators/books');

const validAuthor = {
    firstName: 'Jane',
    lastName: 'Austen',
    birthDate: '1775-12-16',
    nationality: 'British',
    biography: 'English novelist known for social commentary.',
    website: 'https://example.com/jane-austen'
};

const validBook = {
    title: 'Pride and Prejudice',
    isbn: '978-0-141-43951-8',
    genre: 'Classic fiction',
    publicationYear: 1813,
    publisher: 'T. Egerton',
    language: 'English',
    pageCount: 432,
    available: true,
    description: 'A novel about manners, morality, upbringing, and marriage.',
    authorId: new ObjectId().toString()
};

test('accepts and normalizes a valid author', () => {
    const result = validateAuthor(validAuthor);
    assert.deepEqual(result.errors, []);
    assert.equal(result.value.firstName, 'Jane');
});

test('rejects invalid dates, URLs, and unknown author fields', () => {
    const result = validateAuthor({
        ...validAuthor,
        birthDate: '2020-02-31',
        website: 'not-a-url',
        admin: true
    });

    assert.equal(result.errors.some((error) => error.field === 'birthDate'), true);
    assert.equal(result.errors.some((error) => error.field === 'website'), true);
    assert.equal(result.errors.some((error) => error.field === 'admin'), true);
});

test('accepts and normalizes a valid book with ten input fields', () => {
    const result = validateBook(validBook);
    assert.deepEqual(result.errors, []);
    assert.equal(result.value.isbn, '9780141439518');
    assert.equal(Object.keys(result.value).length, 10);
});

test('rejects invalid book field types and references', () => {
    const result = validateBook({
        ...validBook,
        publicationYear: '1813',
        pageCount: 0,
        available: 'yes',
        authorId: 'invalid'
    });

    for (const field of ['publicationYear', 'pageCount', 'available', 'authorId']) {
        assert.equal(result.errors.some((error) => error.field === field), true);
    }
});

test('rejects non-object request bodies', () => {
    const result = validateBook([]);
    assert.deepEqual(result.errors, [{ field: 'body', message: 'Must be a JSON object' }]);
});
