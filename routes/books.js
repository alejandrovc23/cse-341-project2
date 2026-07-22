const router = require('express').Router();
const booksController = require('../controllers/books');
const asyncHandler = require('../middleware/asyncHandler');
const validateBody = require('../middleware/validateBody');
const validateObjectId = require('../middleware/validateObjectId');
const { validateBook } = require('../validators/books');

router.route('/')
    .get(asyncHandler(booksController.getAll))
    .post(validateBody(validateBook), asyncHandler(booksController.createBook));

router.route('/:id')
    .get(validateObjectId(), asyncHandler(booksController.getSingle))
    .put(validateObjectId(), validateBody(validateBook), asyncHandler(booksController.updateBook))
    .delete(validateObjectId(), asyncHandler(booksController.deleteBook));

module.exports = router;
