const dotenv = require('dotenv');
const { MongoClient } = require('mongodb');

dotenv.config({ quiet: true });

let client;
let database;

const getDatabaseName = () => process.env.MONGODB_DATABASE || 'library_api';

const initDb = async () => {
    if (database) {
        return database;
    }

    const mongoUrl = process.env.MONGODB_URL;
    if (!mongoUrl) {
        throw new Error('Missing MONGODB_URL environment variable');
    }

    client = new MongoClient(mongoUrl, { serverSelectionTimeoutMS: 10000 });
    await client.connect();
    database = client.db(getDatabaseName());

    await Promise.all([
        database.collection('books').createIndex({ isbn: 1 }, { unique: true }),
        database.collection('books').createIndex({ authorId: 1 }),
        database.collection('authors').createIndex({ lastName: 1, firstName: 1 }),
        database.collection('users').createIndex(
            { provider: 1, providerId: 1 },
            { unique: true }
        )
    ]);

    return database;
};

const getDatabase = () => {
    if (!database) {
        throw new Error('Database has not been initialized');
    }

    return database;
};

const closeDb = async () => {
    if (client) {
        await client.close();
    }

    client = undefined;
    database = undefined;
};

module.exports = { initDb, getDatabase, closeDb, getDatabaseName };
