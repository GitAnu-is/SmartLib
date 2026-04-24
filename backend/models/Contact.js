const mongoose = require('mongoose');

const CONTACT_STATUS = ['new', 'read', 'replied', 'closed'];

const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      trim: true,
      lowercase: true,
    },
    subject: {
      type: String,
      required: [true, 'Please add a subject'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Please add a message'],
      trim: true,
    },
    status: {
      type: String,
      enum: CONTACT_STATUS,
      default: 'new',
    },
    adminReply: {
      type: String,
      default: null,
      trim: true,
    },
    repliedAt: {
      type: Date,
      default: null,
    },
    repliedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Contact', contactSchema);
