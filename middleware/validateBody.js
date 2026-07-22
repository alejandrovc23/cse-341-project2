const validateBody = (validator) => (req, res, next) => {
    const { value, errors } = validator(req.body);

    if (errors.length > 0) {
        return res.status(400).json({
            message: 'Validation failed',
            errors
        });
    }

    req.validatedBody = value;
    next();
};

module.exports = validateBody;
