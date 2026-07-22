const fs = require('fs');
const path = require('path');

const objectId = {
    type: 'string',
    pattern: '^[a-fA-F0-9]{24}$',
    example: '64ac660864282d23d377e557'
};

const errorResponse = (description) => ({
    description,
    content: {
        'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
        }
    }
});

const jsonResponse = (description, schema) => ({
    description,
    content: {
        'application/json': { schema }
    }
});

const idParameter = {
    name: 'id',
    in: 'path',
    required: true,
    description: 'MongoDB ObjectId of the resource',
    schema: objectId
};

const buildCollectionPath = (tag, singular, schemaName) => ({
    get: {
        tags: [tag],
        summary: `Get all ${tag.toLowerCase()}`,
        responses: {
            200: jsonResponse(`${tag} retrieved successfully`, {
                type: 'array',
                items: { $ref: `#/components/schemas/${schemaName}` }
            }),
            500: errorResponse('Unexpected server error')
        }
    },
    post: {
        tags: [tag],
        summary: `Create ${singular}`,
        requestBody: {
            required: true,
            content: {
                'application/json': {
                    schema: { $ref: `#/components/schemas/${schemaName}Input` }
                }
            }
        },
        responses: {
            201: jsonResponse(`${singular} created successfully`, {
                $ref: '#/components/schemas/CreatedResource'
            }),
            400: errorResponse('Request validation failed'),
            409: errorResponse('A unique value already exists'),
            500: errorResponse('Unexpected server error')
        }
    }
});

const buildItemPath = (tag, singular, schemaName, options = {}) => {
    const deleteResponses = {
        204: { description: `${singular} deleted successfully` },
        400: errorResponse('Invalid MongoDB ObjectId'),
        404: errorResponse(`${singular} not found`),
        500: errorResponse('Unexpected server error')
    };

    if (options.deleteConflict) {
        deleteResponses[409] = errorResponse(options.deleteConflict);
    }

    return {
    get: {
        tags: [tag],
        summary: `Get ${singular} by ID`,
        parameters: [idParameter],
        responses: {
            200: jsonResponse(`${singular} retrieved successfully`, {
                $ref: `#/components/schemas/${schemaName}`
            }),
            400: errorResponse('Invalid MongoDB ObjectId'),
            404: errorResponse(`${singular} not found`),
            500: errorResponse('Unexpected server error')
        }
    },
    put: {
        tags: [tag],
        summary: `Replace ${singular}`,
        parameters: [idParameter],
        requestBody: {
            required: true,
            content: {
                'application/json': {
                    schema: { $ref: `#/components/schemas/${schemaName}Input` }
                }
            }
        },
        responses: {
            204: { description: `${singular} updated successfully` },
            400: errorResponse('Invalid ID or request validation failed'),
            404: errorResponse(`${singular} not found`),
            409: errorResponse('A unique value already exists'),
            500: errorResponse('Unexpected server error')
        }
    },
    delete: {
        tags: [tag],
        summary: `Delete ${singular}`,
        description: options.deleteDescription,
        parameters: [idParameter],
        responses: deleteResponses
    }
    };
};

const authorInput = {
    type: 'object',
    additionalProperties: false,
    required: ['firstName', 'lastName', 'birthDate', 'nationality', 'biography', 'website'],
    properties: {
        firstName: { type: 'string', minLength: 2, maxLength: 80, example: 'Jane' },
        lastName: { type: 'string', minLength: 2, maxLength: 80, example: 'Austen' },
        birthDate: { type: 'string', format: 'date', example: '1775-12-16' },
        nationality: { type: 'string', minLength: 2, maxLength: 80, example: 'British' },
        biography: {
            type: 'string',
            minLength: 10,
            maxLength: 2000,
            example: 'English novelist known for her social commentary.'
        },
        website: {
            type: 'string',
            format: 'uri',
            example: 'https://example.com/authors/jane-austen'
        }
    }
};

const bookInput = {
    type: 'object',
    additionalProperties: false,
    required: [
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
    ],
    properties: {
        title: { type: 'string', minLength: 2, maxLength: 200, example: 'Pride and Prejudice' },
        isbn: { type: 'string', example: '9780141439518' },
        genre: { type: 'string', minLength: 2, maxLength: 80, example: 'Classic fiction' },
        publicationYear: { type: 'integer', minimum: 1000, example: 1813 },
        publisher: { type: 'string', minLength: 2, maxLength: 150, example: 'T. Egerton' },
        language: { type: 'string', minLength: 2, maxLength: 50, example: 'English' },
        pageCount: { type: 'integer', minimum: 1, maximum: 100000, example: 432 },
        available: { type: 'boolean', example: true },
        description: {
            type: 'string',
            minLength: 10,
            maxLength: 2000,
            example: 'A novel about manners, upbringing, morality, and marriage.'
        },
        authorId: objectId
    }
};

const documentMetadata = {
    _id: objectId,
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
};

const doc = {
    openapi: '3.0.3',
    info: {
        title: 'Library API',
        version: '1.0.0',
        description: 'REST API for managing authors and books in MongoDB. All create and update operations validate their complete request bodies.'
    },
    servers: [
        { url: 'http://localhost:3000', description: 'Local development' },
        { url: 'https://project2-vxz5.onrender.com', description: 'Render production deployment' }
    ],
    tags: [
        { name: 'Authors', description: 'Author CRUD operations' },
        { name: 'Books', description: 'Book CRUD operations' },
        { name: 'System', description: 'Service status' }
    ],
    paths: {
        '/health': {
            get: {
                tags: ['System'],
                summary: 'Check service health',
                responses: {
                    200: jsonResponse('Service is available', {
                        type: 'object',
                        properties: { status: { type: 'string', example: 'ok' } }
                    })
                }
            }
        },
        '/authors': buildCollectionPath('Authors', 'author', 'Author'),
        '/authors/{id}': buildItemPath('Authors', 'author', 'Author', {
            deleteDescription: 'Deletion is rejected while one or more books reference the author.',
            deleteConflict: 'Books still reference this author'
        }),
        '/books': {
            ...buildCollectionPath('Books', 'book', 'Book'),
            get: {
                ...buildCollectionPath('Books', 'book', 'Book').get,
                parameters: [{
                    name: 'authorId',
                    in: 'query',
                    required: false,
                    description: 'Optionally filter books by author',
                    schema: objectId
                }]
            }
        },
        '/books/{id}': buildItemPath('Books', 'book', 'Book')
    },
    components: {
        schemas: {
            AuthorInput: authorInput,
            Author: {
                type: 'object',
                additionalProperties: false,
                required: [...authorInput.required, '_id', 'createdAt', 'updatedAt'],
                properties: { ...authorInput.properties, ...documentMetadata }
            },
            BookInput: bookInput,
            Book: {
                type: 'object',
                additionalProperties: false,
                required: [...bookInput.required, '_id', 'createdAt', 'updatedAt'],
                properties: { ...bookInput.properties, ...documentMetadata }
            },
            CreatedResource: {
                type: 'object',
                required: ['id'],
                properties: { id: objectId }
            },
            ValidationError: {
                type: 'object',
                required: ['field', 'message'],
                properties: {
                    field: { type: 'string', example: 'title' },
                    message: { type: 'string', example: 'Is required and must be a string' }
                }
            },
            Error: {
                type: 'object',
                required: ['message'],
                properties: {
                    message: { type: 'string', example: 'Validation failed' },
                    errors: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/ValidationError' }
                    }
                }
            }
        }
    }
};

const outputFile = path.join(__dirname, 'swagger.json');
fs.writeFileSync(outputFile, `${JSON.stringify(doc, null, 2)}\n`);
console.log(`OpenAPI documentation generated at ${outputFile}`);
