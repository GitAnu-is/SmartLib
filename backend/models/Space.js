const mongoose = require('mongoose');

const SPACE_STATUS = ['Active', 'Maintenance', 'Inactive'];

const spaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      trim: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: SPACE_STATUS,
      default: 'Active',
    },
    color: {
      type: String,
      default: 'teal',
      trim: true,
    },
    amenities: {
      type: [String],
      default: [],
    },
    timeSlots: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Space', spaceSchema);
