const asyncHandler = require('express-async-handler');
const Space = require('../models/Space');

// @desc    Get active spaces (user)
// @route   GET /api/spaces/public
// @access  Private
const getSpacesPublic = asyncHandler(async (req, res) => {
  const spaces = await Space.find({ status: 'Active' }).sort({ createdAt: -1 });
  res.status(200).json(spaces);
});

// @desc    Get all spaces (admin)
// @route   GET /api/spaces
// @access  Private/Admin
const getSpaces = asyncHandler(async (req, res) => {
  const spaces = await Space.find({}).sort({ createdAt: -1 });
  res.status(200).json(spaces);
});

// @desc    Create a new space (admin)
// @route   POST /api/spaces
// @access  Private/Admin
const createSpace = asyncHandler(async (req, res) => {
  const { name, type, capacity, status, color, amenities, timeSlots } = req.body;

  if (!name || !String(name).trim()) {
    res.status(400);
    throw new Error('Space name is required');
  }

  if (!type || !String(type).trim()) {
    res.status(400);
    throw new Error('Space type is required');
  }

  const cap = Number(capacity);
  if (!Number.isFinite(cap) || cap <= 0) {
    res.status(400);
    throw new Error('Capacity must be a positive number');
  }

  const space = await Space.create({
    name: String(name).trim(),
    type: String(type).trim(),
    capacity: cap,
    status: status || 'Active',
    color: color || 'teal',
    amenities: Array.isArray(amenities) ? amenities.filter(Boolean) : [],
    timeSlots: Array.isArray(timeSlots) ? timeSlots.filter(Boolean) : [],
  });

  res.status(201).json(space);
});

// @desc    Update a space (admin)
// @route   PUT /api/spaces/:id
// @access  Private/Admin
const updateSpace = asyncHandler(async (req, res) => {
  const space = await Space.findById(req.params.id);
  if (!space) {
    res.status(404);
    throw new Error('Space not found');
  }

  const { name, type, capacity, status, color, amenities, timeSlots } = req.body;

  if (typeof name !== 'undefined') {
    if (!String(name).trim()) {
      res.status(400);
      throw new Error('Space name is required');
    }
    space.name = String(name).trim();
  }

  if (typeof type !== 'undefined') {
    if (!String(type).trim()) {
      res.status(400);
      throw new Error('Space type is required');
    }
    space.type = String(type).trim();
  }

  if (typeof capacity !== 'undefined') {
    const cap = Number(capacity);
    if (!Number.isFinite(cap) || cap <= 0) {
      res.status(400);
      throw new Error('Capacity must be a positive number');
    }
    space.capacity = cap;
  }

  if (typeof status !== 'undefined') {
    space.status = status;
  }

  if (typeof color !== 'undefined') {
    space.color = color;
  }

  if (typeof amenities !== 'undefined') {
    space.amenities = Array.isArray(amenities) ? amenities.filter(Boolean) : [];
  }

  if (typeof timeSlots !== 'undefined') {
    space.timeSlots = Array.isArray(timeSlots) ? timeSlots.filter(Boolean) : [];
  }

  const updated = await space.save();
  res.status(200).json(updated);
});

// @desc    Delete a space (admin)
// @route   DELETE /api/spaces/:id
// @access  Private/Admin
const deleteSpace = asyncHandler(async (req, res) => {
  const space = await Space.findById(req.params.id);
  if (!space) {
    res.status(404);
    throw new Error('Space not found');
  }

  await space.deleteOne();
  res.status(200).json({ message: 'Space deleted' });
});

module.exports = { getSpacesPublic, getSpaces, createSpace, updateSpace, deleteSpace };
