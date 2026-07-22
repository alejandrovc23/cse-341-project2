const mongodb = require('../data/database');

const collectionName = 'authors';

const getAll = async (req, res) => {
    const authors = await mongodb.getDatabase()
        .collection(collectionName)
        .find()
        .sort({ lastName: 1, firstName: 1 })
        .toArray();

    res.status(200).json(authors);
};

const getSingle = async (req, res) => {
    const author = await mongodb.getDatabase()
        .collection(collectionName)
        .findOne({ _id: req.objectIds.id });

    if (!author) {
        return res.status(404).json({ message: 'Author not found' });
    }

    res.status(200).json(author);
};

const createAuthor = async (req, res) => {
    const now = new Date();
    const author = {
        ...req.validatedBody,
        createdAt: now,
        updatedAt: now
    };

    const result = await mongodb.getDatabase()
        .collection(collectionName)
        .insertOne(author);

    res.status(201)
        .location(`/authors/${result.insertedId}`)
        .json({ id: result.insertedId });
};

const updateAuthor = async (req, res) => {
    const collection = mongodb.getDatabase().collection(collectionName);
    const currentAuthor = await collection.findOne({ _id: req.objectIds.id });

    if (!currentAuthor) {
        return res.status(404).json({ message: 'Author not found' });
    }

    const author = {
        ...req.validatedBody,
        createdAt: currentAuthor.createdAt || new Date(),
        updatedAt: new Date()
    };

    await collection.replaceOne({ _id: req.objectIds.id }, author);
    res.status(204).send();
};

const deleteAuthor = async (req, res) => {
    const database = mongodb.getDatabase();
    const linkedBook = await database.collection('books').findOne(
        { authorId: req.objectIds.id },
        { projection: { _id: 1 } }
    );

    if (linkedBook) {
        return res.status(409).json({
            message: 'Author cannot be deleted while books still reference it'
        });
    }

    const result = await database.collection(collectionName)
        .deleteOne({ _id: req.objectIds.id });

    if (result.deletedCount === 0) {
        return res.status(404).json({ message: 'Author not found' });
    }

    res.status(204).send();
};

module.exports = {
    getAll,
    getSingle,
    createAuthor,
    updateAuthor,
    deleteAuthor
};
