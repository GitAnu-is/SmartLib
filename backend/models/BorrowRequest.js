const mongoose = require('mongoose');

const BORROW_REQUEST_STATUS = ['pending', 'approved', 'rejected'];

const borrowRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
    },
    status: {
      type: String,
      enum: BORROW_REQUEST_STATUS,
      default: 'pending',
    },

    // Borrow lifecycle (set when approved/returned)
    borrowedAt: {
      type: Date,
      default: null,
    },
    dueAt: {
      type: Date,
      default: null,
    },
    returnedAt: {
      type: Date,
      default: null,
    },

    // Fine tracking (LKR)
    lateDays: {
      type: Number,
      default: 0,
      min: 0,
    },
    fineLkr: {
      type: Number,
      default: 0,
      min: 0,
    },
    finePaid: {
      type: Boolean,
      default: false,
    },
    finePaidAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('BorrowRequest', borrowRequestSchema);
