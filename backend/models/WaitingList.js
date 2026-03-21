const mongoose = require('mongoose');

const WAITING_LIST_STATUS = ['active', 'left'];

const waitingListSchema = new mongoose.Schema(
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
      enum: WAITING_LIST_STATUS,
      default: 'active',
    },
    leftAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WaitingList', waitingListSchema);
