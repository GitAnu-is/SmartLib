const mongoose = require('mongoose');

const RESOURCE_TYPES = ['video', 'pdf', 'notes'];

const resourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: RESOURCE_TYPES,
      required: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    sizeLabel: {
      type: String,
      default: '',
      trim: true,
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    fileUrl: {
      type: String,
      required: true,
      trim: true,
    },
    originalFilename: {
      type: String,
      default: '',
      trim: true,
    },
    mimeType: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Resource', resourceSchema);
