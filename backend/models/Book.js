const mongoose = require('mongoose');

const BOOK_STATUS = ['available', 'borrowed', 'reserved'];

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a title'],
      trim: true,
    },
    author: {
      type: String,
      required: [true, 'Please add an author'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Please add a category'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    totalCopies: {
      type: Number,
      required: [true, 'Please add total copies'],
      min: 0,
    },
    copies: {
      // available copies
      type: Number,
      required: [true, 'Please add available copies'],
      min: 0,
    },
    status: {
      type: String,
      enum: BOOK_STATUS,
      default: 'available',
    },
    coverColor: {
      type: String,
      default: 'bg-teal',
      trim: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Book', bookSchema);
