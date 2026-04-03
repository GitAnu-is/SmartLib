const express = require('express');

const {
	getSpacesPublic,
	getSpaces,
	createSpace,
	updateSpace,
	deleteSpace,
} = require('../controllers/spaceController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/public', protect, getSpacesPublic);
router.get('/', protect, authorize('admin'), getSpaces);
router.post('/', protect, authorize('admin'), createSpace);
router.put('/:id', protect, authorize('admin'), updateSpace);
router.delete('/:id', protect, authorize('admin'), deleteSpace);

module.exports = router;
