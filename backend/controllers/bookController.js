const asyncHandler = require('express-async-handler');
const Book = require('../models/Book');
const { logActivity } = require('../utils/activityLogger');

const pickCoverColor = () => {
  const colors = ['bg-coral', 'bg-teal', 'bg-golden', 'bg-dark', 'bg-medium'];
  return colors[Math.floor(Math.random() * colors.length)];
};

const normalizeStatus = ({ status, copies }) => {
  if (status) return status;
  if (typeof copies === 'number' && copies <= 0) return 'borrowed';
  return 'available';
};

// @desc    Get all books
// @route   GET /api/books
// @access  Public
const getBooks = asyncHandler(async (req, res) => {
  const { q, category } = req.query;

  const filter = {};

  if (q) {
    const regex = new RegExp(q, 'i');
    filter.$or = [{ title: regex }, { author: regex }];
  }

  if (category && category !== 'All') {
    filter.category = category;
  }

  const books = await Book.find(filter).sort({ createdAt: -1 });
  res.status(200).json(books);
});

// @desc    Get book by id
// @route   GET /api/books/:id
// @access  Public
const getBookById = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);

  if (!book) {
    res.status(404);
    throw new Error('Book not found');
  }

  res.status(200).json(book);
});

// @desc    Create a book
// @route   POST /api/books
// @access  Private/Admin
const createBook = asyncHandler(async (req, res) => {
  const {
    title,
    author,
    category,
    description = '',
    totalCopies,
    copies,
    coverColor,
    rating,
    status,
  } = req.body;

  if (!title || !author || !category) {
    res.status(400);
    throw new Error('Please include title, author, and category');
  }

  const parsedTotalCopies = Number(totalCopies);
  if (Number.isNaN(parsedTotalCopies) || parsedTotalCopies < 0) {
    res.status(400);
    throw new Error('totalCopies must be a non-negative number');
  }

  const parsedCopies = copies === undefined ? parsedTotalCopies : Number(copies);
  if (Number.isNaN(parsedCopies) || parsedCopies < 0) {
    res.status(400);
    throw new Error('copies must be a non-negative number');
  }

  if (parsedCopies > parsedTotalCopies) {
    res.status(400);
    throw new Error('copies cannot exceed totalCopies');
  }

  const book = await Book.create({
    title,
    author,
    category,
    description,
    totalCopies: parsedTotalCopies,
    copies: parsedCopies,
    coverColor: coverColor || pickCoverColor(),
    rating: rating === undefined ? 0 : Number(rating),
    status: normalizeStatus({ status, copies: parsedCopies }),
    createdBy: req.user?._id,
  });

  await logActivity(req, {
    type: 'add',
    action: `Added new book "${book.title}"`,
    meta: { bookId: book._id, title: book.title },
  });

  res.status(201).json(book);
});

// @desc    Update a book
// @route   PUT /api/books/:id
// @access  Private/Admin
const updateBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);

  if (!book) {
    res.status(404);
    throw new Error('Book not found');
  }

  const updates = { ...req.body };

  if (updates.totalCopies !== undefined) {
    const parsedTotal = Number(updates.totalCopies);
    if (Number.isNaN(parsedTotal) || parsedTotal < 0) {
      res.status(400);
      throw new Error('totalCopies must be a non-negative number');
    }
    updates.totalCopies = parsedTotal;
  }

  if (updates.copies !== undefined) {
    const parsedCopies = Number(updates.copies);
    if (Number.isNaN(parsedCopies) || parsedCopies < 0) {
      res.status(400);
      throw new Error('copies must be a non-negative number');
    }
    updates.copies = parsedCopies;
  }

  const nextTotal = updates.totalCopies !== undefined ? updates.totalCopies : book.totalCopies;
  const nextCopies = updates.copies !== undefined ? updates.copies : book.copies;

  if (nextCopies > nextTotal) {
    res.status(400);
    throw new Error('copies cannot exceed totalCopies');
  }

  updates.status = normalizeStatus({ status: updates.status, copies: nextCopies });

  const updatedBook = await Book.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });

  await logActivity(req, {
    type: 'update',
    action: `Updated book "${updatedBook.title}"`,
    meta: { bookId: updatedBook._id, title: updatedBook.title },
  });

  res.status(200).json(updatedBook);
});

// @desc    Delete a book
// @route   DELETE /api/books/:id
// @access  Private/Admin
const deleteBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);

  if (!book) {
    res.status(404);
    throw new Error('Book not found');
  }

  await book.deleteOne();

  await logActivity(req, {
    type: 'delete',
    action: `Deleted book "${book.title}"`,
    meta: { bookId: book._id, title: book.title },
  });

  res.status(200).json({ message: 'Book removed' });
});

module.exports = {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
};
