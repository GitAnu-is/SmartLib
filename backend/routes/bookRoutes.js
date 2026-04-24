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
const { upload, handleUploadError } = require('../middleware/uploadMiddleware');

router.get('/', getBooks);
router.get('/:id', getBookById);
router.post('/', protect, authorize('admin'), upload.single('coverImageFile'), handleUploadError, createBook);
router.put('/:id', protect, authorize('admin'), upload.single('coverImageFile'), handleUploadError, updateBook);
router.delete('/:id', protect, authorize('admin'), deleteBook);

module.exports = router;
