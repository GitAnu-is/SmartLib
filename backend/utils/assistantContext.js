const Book = require('../models/Book');
const BorrowRequest = require('../models/BorrowRequest');
const Inquiry = require('../models/Inquiry');
const Reservation = require('../models/Reservation');
const Resource = require('../models/Resource');
const Space = require('../models/Space');

function escapeRegex(text) {
  return String(text || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function pickKeywords(message, max = 6) {
  const msg = String(message || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s\u0D80-\u0DFF]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const stop = new Set([
    'the',
    'a',
    'an',
    'and',
    'or',
    'to',
    'of',
    'in',
    'for',
    'on',
    'is',
    'are',
    'was',
    'were',
    'i',
    'we',
    'you',
    'me',
    'my',
    'our',
    'please',
    'can',
    'could',
    'tell',
    'check',
    'availability',
    'available',
    'copies',
    'book',
    'borrow',
    'rules',
    'fine',
    'late',
    'overdue',
    'reservation',
    'reserve',
    'space',
    'e',
    'learning',
    'resource',
  ]);

  const tokens = msg
    .split(' ')
    .map((t) => t.trim())
    .filter(Boolean)
    .filter((t) => t.length >= 2)
    .filter((t) => !stop.has(t));

  const uniq = [];
  for (const t of tokens) {
    if (!uniq.includes(t)) uniq.push(t);
    if (uniq.length >= max) break;
  }
  return uniq;
}

async function buildAssistantContext({
  userId,
  message,
  borrowPolicy,
  maxBooks = 5,
  maxResources = 5,
  maxSpaces = 6,
}) {
  const lower = String(message || '').toLowerCase();

  const wantsAvailability = /(available|availability|copies|in stock|have (you|u) got)/i.test(lower);
  const wantsBorrowRules = /(borrow(ing)?|rules|how long|due|fine|late return)/i.test(lower);
  const wantsReservations = /(reserve|reservation|book a|booking|study room|space)/i.test(lower);
  const wantsInquiries = /(inquiry|inquiries|support|help desk|question ticket)/i.test(lower);
  const wantsElearning = /(e-?learning|resources|materials|video|pdf|notes)/i.test(lower);
  const wantsRisk = /(risk|overdue|late|due soon)/i.test(lower);

  const keywords = pickKeywords(message);

  const context = {
    nowIso: new Date().toISOString(),
    user: {
      id: String(userId),
    },
    policy: borrowPolicy || null,
    intents: {
      wantsAvailability,
      wantsBorrowRules,
      wantsReservations,
      wantsInquiries,
      wantsElearning,
      wantsRisk,
    },
    results: {},
  };

  // Books
  if (wantsAvailability || /book|title|author|category/i.test(lower) || keywords.length > 0) {
    const query = keywords.length ? keywords.map(escapeRegex).join('|') : escapeRegex(message);
    const regex = new RegExp(query, 'i');
    const matches = await Book.find({
      $or: [{ title: regex }, { author: regex }, { category: regex }],
    })
      .sort({ rating: -1, createdAt: -1 })
      .limit(maxBooks)
      .select('title author category copies status rating');

    context.results.books = matches.map((b) => ({
      title: b.title,
      author: b.author,
      category: b.category,
      copies: typeof b.copies === 'number' ? b.copies : 0,
      status: b.status || null,
      rating: typeof b.rating === 'number' ? b.rating : null,
    }));
  }

  // Reservations
  if (wantsReservations) {
    const upcoming = await Reservation.find({
      user: userId,
      status: { $in: ['Upcoming', 'Active'] },
    })
      .sort({ createdAt: -1 })
      .limit(5);

    context.results.upcomingReservations = upcoming.map((r) => ({
      spaceName: r.spaceName,
      date: r.date,
      time: r.time,
      status: r.status,
    }));

    const spaces = await Space.find({ status: 'Active' })
      .sort({ createdAt: -1 })
      .limit(maxSpaces)
      .select('name type capacity amenities timeSlots');

    context.results.activeSpaces = spaces.map((s) => ({
      name: s.name,
      type: s.type,
      capacity: s.capacity,
      amenities: Array.isArray(s.amenities) ? s.amenities.slice(0, 6) : [],
      timeSlots: Array.isArray(s.timeSlots) ? s.timeSlots.slice(0, 8) : [],
    }));
  }

  // Inquiries
  if (wantsInquiries) {
    const inquiries = await Inquiry.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('subject status createdAt respondedAt');

    const pending = inquiries.filter((i) => i.status === 'pending').length;
    const answered = inquiries.filter((i) => i.status === 'answered').length;

    context.results.inquiries = {
      pending,
      answered,
      recent: inquiries.slice(0, 5).map((i) => ({
        subject: i.subject,
        status: i.status,
        createdAt: i.createdAt,
        respondedAt: i.respondedAt,
      })),
    };
  }

  // E-learning
  if (wantsElearning) {
    const query = keywords.length ? keywords.map(escapeRegex).join('|') : escapeRegex(message);
    const regex = new RegExp(query, 'i');

    const resources = await Resource.find({
      $or: [{ title: regex }, { category: regex }, { description: regex }],
    })
      .sort({ views: -1, createdAt: -1 })
      .limit(maxResources)
      .select('title category type fileUrl views');

    context.results.resources = resources.map((r) => ({
      title: r.title,
      category: r.category,
      type: r.type,
      fileUrl: r.fileUrl,
      views: r.views,
    }));
  }

  // Borrow requests summary (for risk-like questions)
  if (wantsRisk) {
    const approved = await BorrowRequest.find({ user: userId, status: 'approved' })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('borrowedAt dueAt returnedAt fineLkr finePaid createdAt');

    context.results.borrowRequests = approved.map((r) => ({
      borrowedAt: r.borrowedAt || r.createdAt,
      dueAt: r.dueAt || null,
      returnedAt: r.returnedAt || null,
      fineLkr: Number(r.fineLkr) || 0,
      finePaid: Boolean(r.finePaid),
    }));
  }

  return context;
}

module.exports = {
  buildAssistantContext,
};
