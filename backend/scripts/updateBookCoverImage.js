const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const Book = require('../models/Book');

// Book cover image URLs
const bookCovers = {
  'kaliyugayaa': 'https://mdgunasena.com/wp-content/uploads/2023/06/10155609.jpg',
  'Ape gama': 'https://upload.wikimedia.org/wikipedia/en/2/29/Ape_Gama_cover.jpg',
  'Beddagama': 'https://bookmania.lk/wp-content/uploads/2024/07/Baddegama-1024x1536-1.png',
  'Madol Duwa': 'https://mdgunasena.com/wp-content/uploads/2021/06/10083325-con.jpg',
  'Sapiens': 'https://mdgunasena.com/wp-content/uploads/2021/06/10162645-3.jpg',
  'Atomic Habits': 'https://www.oskareggert.com/content/images/size/w2000/2024/02/image_67203329.JPG',
  'The Lean Startup': 'https://deenthebookman.lk/wp-content/uploads/2023/12/WhatsApp-Image-2023-12-03-at-10.52.23-AM.jpeg',
  'Thinking, Fast and Slow': 'https://rukmini1.flixcart.com/image/1500/1500/xif0q/book/j/y/d/thinking-fast-and-slow-original-imahcfde5shdcv4y.jpeg?q=70',
  'The Pragmatic Programmer': 'https://www.oreilly.com/library/cover/9780135956977/1200w630h/',
  'Clean Code': 'https://www.oreilly.com/library/cover/9780136083238/1200w630h/',
  'Don\'t Make Me Think': 'https://sensible.com/divi/wp-content/uploads/2020/09/DMMT-cover-262x300.png',
  'The Design of Everyday Things': 'https://bargainbooks.lk/wp-content/uploads/45.jpeg',
  'IT Basics': 'https://images.booksense.com/images/413/523/9798711523413.jpg',
  'OOP Concepts': 'https://d24f1whwu8r3u4.cloudfront.net/assets/book-covers/oo_ruby-16afdd1ea90f62931d9107a9126901912a86f5d7194b820aa1f050c94caa8aa7.png'
};

async function updateBookCoverImages() {
  try {
    const connection = await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');

    // Update each book with its cover image
    for (const [title, coverImage] of Object.entries(bookCovers)) {
      const result = await Book.findOneAndUpdate(
        { title: new RegExp(title, 'i') },
        { coverImage },
        { returnDocument: 'after' }
      );

      if (result) {
        console.log(`✓ ${result.title} updated successfully`);
      } else {
        console.log(`✗ Book with title "${title}" not found`);
      }
    }

    console.log('\n✓ All book cover images updated successfully!');
  } catch (error) {
    console.error('Error updating book cover images:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
}

updateBookCoverImages();
