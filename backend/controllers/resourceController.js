const asyncHandler = require('express-async-handler');
const path = require('path');
const fs = require('fs');
const Resource = require('../models/Resource');

function bytesToSizeLabel(bytes) {
  const value = Number(bytes) || 0;
  if (value <= 0) return '';
  const mb = value / (1024 * 1024);
  if (mb < 1) return `${Math.max(1, Math.round(value / 1024))} KB`;
  return `${mb.toFixed(mb >= 10 ? 0 : 1)} MB`;
}

// @desc    Get resources (admin)
// @route   GET /api/resources
// @access  Private/Admin
const getResources = asyncHandler(async (req, res) => {
  const resources = await Resource.find({}).sort({ createdAt: -1 });
  res.status(200).json(resources);
});

// @desc    Get resources (user)
// @route   GET /api/resources/public
// @access  Private
const getResourcesPublic = asyncHandler(async (req, res) => {
  const resources = await Resource.find({}).sort({ createdAt: -1 });
  res.status(200).json(resources);
});

// @desc    Upload a resource (admin)
// @route   POST /api/resources
// @access  Private/Admin
const createResource = asyncHandler(async (req, res) => {
  const { title, category, type, description } = req.body;

  if (!title || !String(title).trim()) {
    res.status(400);
    throw new Error('Resource title is required');
  }

  if (!category || !String(category).trim()) {
    res.status(400);
    throw new Error('Category is required');
  }

  if (!type || !String(type).trim()) {
    res.status(400);
    throw new Error('Type is required');
  }

  if (!req.file) {
    res.status(400);
    throw new Error('File is required');
  }

  const fileUrl = `/uploads/resources/${req.file.filename}`;
  const sizeLabel = bytesToSizeLabel(req.file.size);

  const created = await Resource.create({
    title: String(title).trim(),
    category: String(category).trim(),
    type: String(type).trim(),
    description: String(description || '').trim(),
    sizeLabel,
    views: 0,
    fileUrl,
    originalFilename: req.file.originalname || '',
    mimeType: req.file.mimetype || '',
  });

  res.status(201).json(created);
});

function tryDeleteUploadedFile(fileUrl) {
  if (!fileUrl || typeof fileUrl !== 'string') return;
  // expected format: /uploads/resources/<filename>
  const filename = path.basename(fileUrl);
  if (!filename) return;
  const absPath = path.join(__dirname, '..', 'uploads', 'resources', filename);
  try {
    if (fs.existsSync(absPath)) {
      fs.unlinkSync(absPath);
    }
  } catch (_) {
    // best-effort cleanup
  }
}

// @desc    Update a resource (admin)
// @route   PUT /api/resources/:id
// @access  Private/Admin
const updateResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id);
  if (!resource) {
    res.status(404);
    throw new Error('Resource not found');
  }

  const { title, category, type, description } = req.body;

  if (title !== undefined) {
    if (!String(title).trim()) {
      res.status(400);
      throw new Error('Resource title is required');
    }
    resource.title = String(title).trim();
  }

  if (category !== undefined) {
    if (!String(category).trim()) {
      res.status(400);
      throw new Error('Category is required');
    }
    resource.category = String(category).trim();
  }

  if (type !== undefined) {
    if (!String(type).trim()) {
      res.status(400);
      throw new Error('Type is required');
    }
    resource.type = String(type).trim();
  }

  if (description !== undefined) {
    resource.description = String(description || '').trim();
  }

  if (req.file) {
    const oldUrl = resource.fileUrl;
    resource.fileUrl = `/uploads/resources/${req.file.filename}`;
    resource.sizeLabel = bytesToSizeLabel(req.file.size);
    resource.originalFilename = req.file.originalname || '';
    resource.mimeType = req.file.mimetype || '';
    tryDeleteUploadedFile(oldUrl);
  }

  const saved = await resource.save();
  res.status(200).json(saved);
});

// @desc    Delete a resource (admin)
// @route   DELETE /api/resources/:id
// @access  Private/Admin
const deleteResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id);
  if (!resource) {
    res.status(404);
    throw new Error('Resource not found');
  }

  const fileUrl = resource.fileUrl;
  await resource.deleteOne();
  tryDeleteUploadedFile(fileUrl);
  res.status(200).json({ message: 'Resource deleted' });
});

// @desc    Increment resource views (user)
// @route   PATCH /api/resources/:id/view
// @access  Private
const incrementResourceViews = asyncHandler(async (req, res) => {
  const updated = await Resource.findByIdAndUpdate(
    req.params.id,
    { $inc: { views: 1 } },
    { new: true }
  );

  if (!updated) {
    res.status(404);
    throw new Error('Resource not found');
  }

  res.status(200).json(updated);
});

module.exports = {
  getResources,
  getResourcesPublic,
  createResource,
  updateResource,
  deleteResource,
  incrementResourceViews,
};
