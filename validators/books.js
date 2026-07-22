const { ObjectId } = require('mongodb');
const {
    isPlainObject,
    addUnknownFieldErrors,
    readRequiredString
} = require('./common');

const allowedFields = [
    'title',
    'isbn',
    'genre',
    'publicationYear',
    'publisher',
    'language',
    'pageCount',
    'available',
    'description',
    'authorId'
];

const normalizeIsbn = (value) => value.replace(/[\s-]/g, '').toUpperCase();

const validateBook = (body) => {
    const errors = [];

    if (!isPlainObject(body)) {
        return {
            value: {},
            errors: [{ field: 'body', message: 'Must be a JSON object' }]
        };
    }

    addUnknownFieldErrors(body, allowedFields, errors);

    const rawIsbn = readRequiredString(body, 'isbn', errors, { min: 10, max: 20 });
    const value = {
        title: readRequiredString(body, 'title', errors, { min: 2, max: 200 }),
        isbn: rawIsbn ? normalizeIsbn(rawIsbn) : undefined,
        genre: readRequiredString(body, 'genre', errors, { min: 2, max: 80 }),
        publicationYear: body.publicationYear,
        publisher: readRequiredString(body, 'publisher', errors, { min: 2, max: 150 }),
        language: readRequiredString(body, 'language', errors, { min: 2, max: 50 }),
        pageCount: body.pageCount,
        available: body.available,
        description: readRequiredString(body, 'description', errors, { min: 10, max: 2000 }),
        authorId: readRequiredString(body, 'authorId', errors, { min: 24, max: 24 })
    };

    if (value.isbn && !/^(?:\d{9}[\dX]|\d{13})$/.test(value.isbn)) {
        errors.push({ field: 'isbn', message: 'Must be a valid 10- or 13-character ISBN format' });
    }

    const currentYear = new Date().getUTCFullYear();
    if (!Number.isInteger(value.publicationYear) || value.publicationYear < 1000 || value.publicationYear > currentYear) {
        errors.push({ field: 'publicationYear', message: `Must be an integer between 1000 and ${currentYear}` });
    }

    if (!Number.isInteger(value.pageCount) || value.pageCount < 1 || value.pageCount > 100000) {
        errors.push({ field: 'pageCount', message: 'Must be an integer between 1 and 100000' });
    }

    if (typeof value.available !== 'boolean') {
        errors.push({ field: 'available', message: 'Must be a boolean' });
    }

    if (value.authorId && (!ObjectId.isValid(value.authorId) || new ObjectId(value.authorId).toString() !== value.authorId.toLowerCase())) {
        errors.push({ field: 'authorId', message: 'Must be a valid MongoDB ObjectId' });
    }

    return { value, errors };
};

module.exports = { validateBook, allowedFields, normalizeIsbn };
