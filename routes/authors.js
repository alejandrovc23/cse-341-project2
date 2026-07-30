const router = require('express').Router();
const authorsController = require('../controllers/authors');
const asyncHandler = require('../middleware/asyncHandler');
const validateBody = require('../middleware/validateBody');
const validateObjectId = require('../middleware/validateObjectId');
const authorizeMutation = require('../middleware/authorizeMutation');
const { validateAuthor } = require('../validators/authors');

router.route('/')
    .get(asyncHandler(authorsController.getAll))
    .post(
        authorizeMutation,
        validateBody(validateAuthor),
        asyncHandler(authorsController.createAuthor)
    );

router.route('/:id')
    .get(validateObjectId(), asyncHandler(authorsController.getSingle))
    .put(
        authorizeMutation,
        validateObjectId(),
        validateBody(validateAuthor),
        asyncHandler(authorsController.updateAuthor)
    )
    .delete(
        authorizeMutation,
        validateObjectId(),
        asyncHandler(authorsController.deleteAuthor)
    );

module.exports = router;
