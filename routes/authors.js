const router = require('express').Router();
const authorsController = require('../controllers/authors');
const asyncHandler = require('../middleware/asyncHandler');
const validateBody = require('../middleware/validateBody');
const validateObjectId = require('../middleware/validateObjectId');
const { validateAuthor } = require('../validators/authors');

router.route('/')
    .get(asyncHandler(authorsController.getAll))
    .post(validateBody(validateAuthor), asyncHandler(authorsController.createAuthor));

router.route('/:id')
    .get(validateObjectId(), asyncHandler(authorsController.getSingle))
    .put(validateObjectId(), validateBody(validateAuthor), asyncHandler(authorsController.updateAuthor))
    .delete(validateObjectId(), asyncHandler(authorsController.deleteAuthor));

module.exports = router;
