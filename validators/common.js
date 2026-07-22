const isPlainObject = (value) => (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value)
);

const addUnknownFieldErrors = (body, allowedFields, errors) => {
    Object.keys(body).forEach((field) => {
        if (!allowedFields.includes(field)) {
            errors.push({ field, message: 'Field is not allowed' });
        }
    });
};

const readRequiredString = (body, field, errors, options = {}) => {
    const { min = 1, max = 200 } = options;
    const value = body[field];

    if (typeof value !== 'string' || value.trim() === '') {
        errors.push({ field, message: 'Is required and must be a string' });
        return undefined;
    }

    const normalized = value.trim();
    if (normalized.length < min || normalized.length > max) {
        errors.push({ field, message: `Must contain between ${min} and ${max} characters` });
    }

    return normalized;
};

const isValidIsoDate = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
};

const isHttpUrl = (value) => {
    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
};

module.exports = {
    isPlainObject,
    addUnknownFieldErrors,
    readRequiredString,
    isValidIsoDate,
    isHttpUrl
};
