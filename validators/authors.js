const {
    isPlainObject,
    addUnknownFieldErrors,
    readRequiredString,
    isValidIsoDate,
    isHttpUrl
} = require('./common');

const allowedFields = [
    'firstName',
    'lastName',
    'birthDate',
    'nationality',
    'biography',
    'website'
];

const validateAuthor = (body) => {
    const errors = [];

    if (!isPlainObject(body)) {
        return {
            value: {},
            errors: [{ field: 'body', message: 'Must be a JSON object' }]
        };
    }

    addUnknownFieldErrors(body, allowedFields, errors);

    const value = {
        firstName: readRequiredString(body, 'firstName', errors, { min: 2, max: 80 }),
        lastName: readRequiredString(body, 'lastName', errors, { min: 2, max: 80 }),
        birthDate: readRequiredString(body, 'birthDate', errors, { min: 10, max: 10 }),
        nationality: readRequiredString(body, 'nationality', errors, { min: 2, max: 80 }),
        biography: readRequiredString(body, 'biography', errors, { min: 10, max: 2000 }),
        website: readRequiredString(body, 'website', errors, { min: 10, max: 300 })
    };

    if (value.birthDate && !isValidIsoDate(value.birthDate)) {
        errors.push({ field: 'birthDate', message: 'Must use a real date in YYYY-MM-DD format' });
    } else if (value.birthDate && new Date(`${value.birthDate}T00:00:00.000Z`) > new Date()) {
        errors.push({ field: 'birthDate', message: 'Cannot be in the future' });
    }

    if (value.website && !isHttpUrl(value.website)) {
        errors.push({ field: 'website', message: 'Must be a valid HTTP or HTTPS URL' });
    }

    return { value, errors };
};

module.exports = { validateAuthor, allowedFields };
