const fs = require('fs');
const path = require('path');

const objectIdSchema = {
    type: 'string',
    pattern: '^[a-fA-F0-9]{24}$'
};

const objectIdExample = {
    ...objectIdSchema,
    example: '64ac660864282d23d377e557'
};

const errorExamples = {
    validation: {
        message: 'Validation failed',
        errors: [{ field: 'title', message: 'Is required and must be a string' }]
    },
    invalidId: {
        message: 'Invalid id',
        errors: [{ field: 'id', message: 'Must be a valid MongoDB ObjectId' }]
    },
    unique: {
        message: 'A record with that isbn already exists',
        errors: [{ field: 'isbn', message: 'Must be unique' }]
    },
    server: {
        message: 'An unexpected server error occurred'
    }
};

const notFoundExample = (resource) => ({
    message: `${resource.charAt(0).toUpperCase()}${resource.slice(1)} not found`
});

const errorResponse = (description, example) => ({
    description,
    content: {
        'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example
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
    description: 'MongoDB ObjectId of the resource. Paste a real _id returned by a GET or POST request.',
    schema: objectIdSchema
};

const buildCollectionPath = (tag, singular, schemaName, options = {}) => ({
    get: {
        tags: [tag],
        summary: `Get all ${tag.toLowerCase()}`,
        responses: {
            200: jsonResponse(`${tag} retrieved successfully`, {
                type: 'array',
                items: { $ref: `#/components/schemas/${schemaName}` }
            }),
            500: errorResponse('Unexpected server error', errorExamples.server)
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
            400: errorResponse('Request validation failed', errorExamples.validation),
            ...(options.unique ? {
                409: errorResponse('A unique value already exists', errorExamples.unique)
            } : {}),
            500: errorResponse('Unexpected server error', errorExamples.server)
        }
    }
});

const buildItemPath = (tag, singular, schemaName, options = {}) => {
    const deleteResponses = {
        204: { description: `${singular} deleted successfully` },
        400: errorResponse('Invalid MongoDB ObjectId', errorExamples.invalidId),
        404: errorResponse(`${singular} not found`, notFoundExample(singular)),
        500: errorResponse('Unexpected server error', errorExamples.server)
    };

    if (options.deleteConflict) {
        deleteResponses[409] = errorResponse(options.deleteConflict, {
            message: 'Author cannot be deleted while books still reference it'
        });
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
            400: errorResponse('Invalid MongoDB ObjectId', errorExamples.invalidId),
            404: errorResponse(`${singular} not found`, notFoundExample(singular)),
            500: errorResponse('Unexpected server error', errorExamples.server)
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
            400: errorResponse('Invalid ID or request validation failed', errorExamples.validation),
            404: errorResponse(`${singular} not found`, notFoundExample(singular)),
            ...(options.unique ? {
                409: errorResponse('A unique value already exists', errorExamples.unique)
            } : {}),
            500: errorResponse('Unexpected server error', errorExamples.server)
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
        firstName: { type: 'string', minLength: 2, maxLength: 80, example: 'Video' },
        lastName: { type: 'string', minLength: 2, maxLength: 80, example: 'Author' },
        birthDate: { type: 'string', format: 'date', example: '1990-01-01' },
        nationality: { type: 'string', minLength: 2, maxLength: 80, example: 'American' },
        biography: {
            type: 'string',
            minLength: 10,
            maxLength: 2000,
            example: 'Temporary author created during the CSE 341 demonstration video.'
        },
        website: {
            type: 'string',
            format: 'uri',
            example: 'https://example.com/video-author'
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
        title: { type: 'string', minLength: 2, maxLength: 200, example: 'Video Demo Book' },
        isbn: { type: 'string', example: '9782026072301' },
        genre: { type: 'string', minLength: 2, maxLength: 80, example: 'Educational' },
        publicationYear: { type: 'integer', minimum: 1000, example: 2026 },
        publisher: { type: 'string', minLength: 2, maxLength: 150, example: 'BYU-I Demo Press' },
        language: { type: 'string', minLength: 2, maxLength: 50, example: 'English' },
        pageCount: { type: 'integer', minimum: 1, maximum: 100000, example: 200 },
        available: { type: 'boolean', example: true },
        description: {
            type: 'string',
            minLength: 10,
            maxLength: 2000,
            example: 'Temporary book created during the CSE 341 demonstration video.'
        },
        authorId: {
            ...objectIdSchema,
            example: '6a611c8b0ab8471bd61f3fd6',
            description: 'MongoDB ObjectId of the existing Jane Austen record. This example can be executed as-is.'
        }
    }
};

const documentMetadata = {
    _id: objectIdExample,
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
        { url: 'https://project2-vxz5.onrender.com', description: 'Render production deployment' },
        { url: 'http://localhost:3000', description: 'Local development' }
    ],
    tags: [
        { name: 'Authors', description: 'Author CRUD operations' },
        { name: 'Books', description: 'Book CRUD operations' },
        { name: 'System', description: 'Service status' }
    ],
    paths: {
        '/': {
            get: {
                tags: ['System'],
                summary: 'Get API information',
                responses: {
                    200: jsonResponse('API information returned successfully', {
                        type: 'object',
                        properties: {
                            name: { type: 'string', example: 'Library API' },
                            version: { type: 'string', example: '1.0.0' },
                            documentation: { type: 'string', example: '/api-docs' },
                            resources: {
                                type: 'array',
                                items: { type: 'string' },
                                example: ['/authors', '/books']
                            }
                        }
                    })
                }
            }
        },
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
            ...buildCollectionPath('Books', 'book', 'Book', { unique: true }),
            get: {
                ...buildCollectionPath('Books', 'book', 'Book', { unique: true }).get,
                parameters: [{
                    name: 'authorId',
                    in: 'query',
                    required: false,
                    description: 'Optionally filter books by author. Leave this field empty to return every book.',
                    schema: objectIdSchema
                }],
                responses: {
                    ...buildCollectionPath('Books', 'book', 'Book', { unique: true }).get.responses,
                    400: errorResponse('Invalid authorId query parameter', {
                        message: 'Validation failed',
                        errors: [{
                            field: 'authorId',
                            message: 'Must be a valid MongoDB ObjectId'
                        }]
                    })
                }
            }
        },
        '/books/{id}': buildItemPath('Books', 'book', 'Book', { unique: true })
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
                properties: { id: objectIdExample }
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
