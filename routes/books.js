const router = require('express').Router();
const booksController = require('../controllers/books');
const asyncHandler = require('../middleware/asyncHandler');
const validateBody = require('../middleware/validateBody');
const validateObjectId = require('../middleware/validateObjectId');
const authorizeMutation = require('../middleware/authorizeMutation');
const { validateBook } = require('../validators/books');

router.route('/')
    .get(asyncHandler(booksController.getAll))
    .post(
        authorizeMutation,
        validateBody(validateBook),
        asyncHandler(booksController.createBook)
    );

router.route('/:id')
    .get(validateObjectId(), asyncHandler(booksController.getSingle))
    .put(
        authorizeMutation,
        validateObjectId(),
        validateBody(validateBook),
        asyncHandler(booksController.updateBook)
    )
    .delete(
        authorizeMutation,
        validateObjectId(),
        asyncHandler(booksController.deleteBook)
    );

module.exports = router;
