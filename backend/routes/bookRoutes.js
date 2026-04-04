const express = require('express');
const router = express.Router();

const {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  uploadCoverImage,
} = require('../controllers/bookController');

const { protect, authorize } = require('../middleware/authMiddleware');
const { upload, handleUploadError } = require('../middleware/uploadMiddleware');

// More specific routes first
router.post(
  '/:id/upload-cover', 
  protect, 
  authorize('admin'), 
  upload.single('coverImage'), 
  handleUploadError,
  uploadCoverImage
);

// Less specific routes after
router.get('/', getBooks);
router.get('/:id', getBookById);
router.post('/', protect, authorize('admin'), createBook);
router.put('/:id', protect, authorize('admin'), updateBook);
router.delete('/:id', protect, authorize('admin'), deleteBook);

module.exports = router;
