const { ObjectId } = require('mongodb');
const mongodb = require('../data/database');

const collectionName = 'books';

const getAll = async (req, res) => {
    const query = {};

    if (req.query.authorId !== undefined) {
        const { authorId } = req.query;
        if (!ObjectId.isValid(authorId) || new ObjectId(authorId).toString() !== authorId.toLowerCase()) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: [{ field: 'authorId', message: 'Must be a valid MongoDB ObjectId' }]
            });
        }
        query.authorId = new ObjectId(authorId);
    }

    const books = await mongodb.getDatabase()
        .collection(collectionName)
        .find(query)
        .sort({ title: 1 })
        .toArray();

    res.status(200).json(books);
};

const getSingle = async (req, res) => {
    const book = await mongodb.getDatabase()
        .collection(collectionName)
        .findOne({ _id: req.objectIds.id });

    if (!book) {
        return res.status(404).json({ message: 'Book not found' });
    }

    res.status(200).json(book);
};

const getAuthorId = (authorId) => new ObjectId(authorId);

const authorExists = async (authorId) => {
    const author = await mongodb.getDatabase()
        .collection('authors')
        .findOne({ _id: authorId }, { projection: { _id: 1 } });

    return Boolean(author);
};

const createBook = async (req, res) => {
    const authorId = getAuthorId(req.validatedBody.authorId);

    if (!await authorExists(authorId)) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: [{ field: 'authorId', message: 'Referenced author does not exist' }]
        });
    }

    const now = new Date();
    const book = {
        ...req.validatedBody,
        authorId,
        createdAt: now,
        updatedAt: now
    };

    const result = await mongodb.getDatabase()
        .collection(collectionName)
        .insertOne(book);

    res.status(201)
        .location(`/books/${result.insertedId}`)
        .json({ id: result.insertedId });
};

const updateBook = async (req, res) => {
    const collection = mongodb.getDatabase().collection(collectionName);
    const currentBook = await collection.findOne({ _id: req.objectIds.id });

    if (!currentBook) {
        return res.status(404).json({ message: 'Book not found' });
    }

    const authorId = getAuthorId(req.validatedBody.authorId);
    if (!await authorExists(authorId)) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: [{ field: 'authorId', message: 'Referenced author does not exist' }]
        });
    }

    const book = {
        ...req.validatedBody,
        authorId,
        createdAt: currentBook.createdAt || new Date(),
        updatedAt: new Date()
    };

    await collection.replaceOne({ _id: req.objectIds.id }, book);
    res.status(204).send();
};

const deleteBook = async (req, res) => {
    const result = await mongodb.getDatabase()
        .collection(collectionName)
        .deleteOne({ _id: req.objectIds.id });

    if (result.deletedCount === 0) {
        return res.status(404).json({ message: 'Book not found' });
    }

    res.status(204).send();
};

module.exports = {
    getAll,
    getSingle,
    createBook,
    updateBook,
    deleteBook
};
