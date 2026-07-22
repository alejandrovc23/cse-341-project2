const notFound = (req, res) => {
    res.status(404).json({
        message: `Route not found: ${req.method} ${req.originalUrl}`
    });
};

const errorHandler = (err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    if (err?.type === 'entity.parse.failed') {
        return res.status(400).json({ message: 'Request body contains invalid JSON' });
    }

    if (err?.code === 11000) {
        const field = Object.keys(err.keyPattern || {})[0] || 'field';
        return res.status(409).json({
            message: `A record with that ${field} already exists`,
            errors: [{ field, message: 'Must be unique' }]
        });
    }

    console.error(err);
    res.status(500).json({ message: 'An unexpected server error occurred' });
};

module.exports = { notFound, errorHandler };
