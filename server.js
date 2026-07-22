const express = require('express');
const mongodb = require('./data/database');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandlers');

const app = express();
const port = process.env.PORT || 3000;

app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));
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

const start = async () => {
    await mongodb.initDb();
    return app.listen(port, () => {
        console.log(`Library API is running on port ${port}`);
        console.log(`MongoDB database: ${mongodb.getDatabaseName()}`);
    });
};

if (require.main === module) {
    start().catch((error) => {
        console.error('The application could not start:', error.message);
        process.exit(1);
    });
}

module.exports = { app, start };
