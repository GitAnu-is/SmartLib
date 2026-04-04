const path = require('path');
const fs = require('fs');
const express = require('express');
const multer = require('multer');

const {
  getResources,
  getResourcesPublic,
  createResource,
  updateResource,
  deleteResource,
  incrementResourceViews,
} = require('../controllers/resourceController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads', 'resources');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname || '') || '';
    const safeExt = ext.slice(0, 10);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
  },
});

function fileFilter(req, file, cb) {
  const allowed = [
    'application/pdf',
    'video/mp4',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
    return;
  }

  cb(new Error('Only PDF, MP4, or DOCX files are allowed'));
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 },
});

router.get('/public', protect, getResourcesPublic);
router.patch('/:id/view', protect, incrementResourceViews);
router.get('/', protect, authorize('admin'), getResources);
router.post('/', protect, authorize('admin'), upload.single('file'), createResource);
router.put('/:id', protect, authorize('admin'), upload.single('file'), updateResource);
router.delete('/:id', protect, authorize('admin'), deleteResource);

module.exports = router;
