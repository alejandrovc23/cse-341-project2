const router = require('express').Router();
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../swagger.json');

router.get('/', (req, res) => {
    res.status(200).json({
        name: 'Library API',
        version: '2.0.0',
        documentation: '/api-docs',
        authentication: '/auth/status',
        resources: ['/authors', '/books']
    });
});

router.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

router.get('/swagger.json', (req, res) => res.status(200).json(swaggerDocument));
router.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    swaggerOptions: {
        persistAuthorization: true,
        withCredentials: true
    }
}));
router.use('/auth', require('./auth'));
router.use('/authors', require('./authors'));
router.use('/books', require('./books'));

module.exports = router;
