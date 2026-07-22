const { ObjectId } = require('mongodb');

const validateObjectId = (parameterName = 'id') => (req, res, next) => {
    const id = req.params[parameterName];

    if (!ObjectId.isValid(id) || new ObjectId(id).toString() !== id.toLowerCase()) {
        return res.status(400).json({
            message: `Invalid ${parameterName}`,
            errors: [{ field: parameterName, message: 'Must be a valid MongoDB ObjectId' }]
        });
    }

    req.objectIds = req.objectIds || {};
    req.objectIds[parameterName] = new ObjectId(id);
    next();
};

module.exports = validateObjectId;
