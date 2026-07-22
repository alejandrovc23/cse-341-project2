const router = require('express').Router();
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../swagger.json');

router.get('/', (req, res) => {
    res.status(200).json({
        name: 'Library API',
        version: '1.0.0',
        documentation: '/api-docs',
        resources: ['/authors', '/books']
    });
});

router.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

router.get('/swagger.json', (req, res) => res.status(200).json(swaggerDocument));
router.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
router.use('/authors', require('./authors'));
router.use('/books', require('./books'));

module.exports = router;
