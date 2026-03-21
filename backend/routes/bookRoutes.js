const express = require('express');
const router = express.Router();

const {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
} = require('../controllers/bookController');

const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', getBooks);
router.get('/:id', getBookById);
router.post('/', protect, authorize('admin'), createBook);
router.put('/:id', protect, authorize('admin'), updateBook);
router.delete('/:id', protect, authorize('admin'), deleteBook);

module.exports = router;
