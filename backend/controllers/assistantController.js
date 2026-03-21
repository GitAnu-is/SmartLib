const asyncHandler = require('express-async-handler');

const Book = require('../models/Book');
const BorrowRequest = require('../models/BorrowRequest');
const Inquiry = require('../models/Inquiry');
const Reservation = require('../models/Reservation');

const BORROW_PERIOD_DAYS = 7;
const FINE_PER_DAY_LKR = 50;

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function computeDueAt(borrowedAt) {
  const due = new Date(borrowedAt);
  due.setDate(due.getDate() + BORROW_PERIOD_DAYS);
  return due;
}

function calcLateDays(asOf, dueAt) {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.max(
    0,
    Math.floor((startOfDay(asOf) - startOfDay(dueAt)) / msPerDay)
  );
}

async function computeRiskAndFinesForUser(userId) {
  const now = new Date();

  const allRequests = await BorrowRequest.find({ user: userId, status: 'approved' })
    .populate('book', 'title category')
    .sort({ createdAt: -1 });

  const active = allRequests.filter((r) => !r.returnedAt);
  const returned = allRequests.filter((r) => Boolean(r.returnedAt));

  const pastLateReturns = returned.filter((r) => {
    const borrowedAt = r.borrowedAt || r.createdAt;
    const dueAt = r.dueAt || computeDueAt(borrowedAt);
    const returnedAt = r.returnedAt;
    if (!returnedAt) return false;
    return calcLateDays(returnedAt, dueAt) > 0;
  }).length;

  const activeItems = active.map((r) => {
    const borrowedAt = r.borrowedAt || r.createdAt;
    const dueAt = r.dueAt || computeDueAt(borrowedAt);
    const remainingDays = Math.ceil((startOfDay(dueAt) - startOfDay(now)) / (24 * 60 * 60 * 1000));
    const lateDays = calcLateDays(now, dueAt);
    const currentFineLkr = lateDays * FINE_PER_DAY_LKR;
    return {
      requestId: r._id,
      dueAt,
      remainingDays,
      lateDays,
      currentFineLkr,
    };
  });

  const overdueCount = activeItems.filter((x) => x.lateDays > 0).length;
  const dueSoonItems = activeItems
    .filter((x) => x.remainingDays >= 0 && x.remainingDays <= 3)
    .sort((a, b) => a.remainingDays - b.remainingDays);

  const dueSoonCount = dueSoonItems.length;
  const dueSoonMinDays = dueSoonCount > 0 ? dueSoonItems[0].remainingDays : null;

  const currentOverdueFineLkr = activeItems
    .filter((x) => x.currentFineLkr > 0)
    .reduce((sum, x) => sum + x.currentFineLkr, 0);

  // Simple risk model: weight past behavior + proximity + active overdue
  let score = 0;
  score += pastLateReturns * 20;
  score += dueSoonCount * 15;
  score += overdueCount * 30;
  score = Math.max(0, Math.min(100, score));

  const level = overdueCount > 0 || score >= 60 ? 'high' : score >= 30 ? 'medium' : 'low';

  return {
    level,
    score,
    pastLateReturns,
    dueSoonCount,
    dueSoonMinDays,
    overdueCount,
    currentOverdueFineLkr,
  };
}

async function buildInsightsForUser(userId) {
  const risk = await computeRiskAndFinesForUser(userId);

  const requests = await BorrowRequest.find({ user: userId })
    .populate('book', 'title category')
    .sort({ createdAt: -1 })
    .limit(200);

  const categoryCounts = new Map();
  for (const r of requests) {
    const cat = r.book?.category;
    if (!cat) continue;
    categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
  }
  const categoryStats = Array.from(categoryCounts.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const fineRequests = await BorrowRequest.find({ user: userId, fineLkr: { $gt: 0 } })
    .populate('book', 'title')
    .sort({ returnedAt: -1, createdAt: -1 })
    .limit(5);

  const fineRecords = fineRequests.map((r) => ({
    id: r._id,
    book: r.book?.title || 'Book',
    amountLkr: Number(r.fineLkr) || 0,
    status: r.finePaid ? 'paid' : 'unpaid',
    date: (r.returnedAt || r.createdAt || new Date()).toISOString().slice(0, 10),
  }));

  const recommendations = await Book.find({ status: 'available', copies: { $gt: 0 } })
    .sort({ rating: -1, createdAt: -1 })
    .limit(3)
    .select('title author rating coverColor');

  return { risk, categoryStats, fineRecords, recommendations };
}

function extractQuoted(text) {
  const s = String(text || '');
  const m1 = s.match(/"([^"]{2,})"/);
  if (m1?.[1]) return m1[1];
  const m2 = s.match(/'([^']{2,})'/);
  if (m2?.[1]) return m2[1];
  return '';
}

function formatLkr(amount) {
  const n = Number(amount) || 0;
  return `Rs ${n.toFixed(2)}`;
}

// @desc    Assistant insights (risk/fines/categories)
// @route   GET /api/assistant/insights
// @access  Private
const getAssistantInsights = asyncHandler(async (req, res) => {
  const insights = await buildInsightsForUser(req.user._id);
  res.status(200).json(insights);
});

// @desc    Assistant chat
// @route   POST /api/assistant/chat
// @access  Private
const chatWithAssistant = asyncHandler(async (req, res) => {
  const message = String(req.body?.message || '').trim();
  if (!message) {
    res.status(400);
    throw new Error('message is required');
  }

  const lower = message.toLowerCase();

  const wantsAvailability = /(available|availability|copies|in stock)/i.test(lower);
  const wantsBorrowRules = /(borrow(ing)?|rules|how long|due|fine|late return)/i.test(lower);
  const wantsReservations = /(reserve|reservation|book a|booking|study room|space)/i.test(lower);
  const wantsInquiries = /(inquiry|inquiries|support|help desk|question ticket)/i.test(lower);
  const wantsElearning = /(e-?learning|resources|materials|video|pdf|notes)/i.test(lower);
  const wantsRisk = /(risk|overdue|late|due soon)/i.test(lower);

  const parts = [];

  if (wantsAvailability) {
    const quoted = extractQuoted(message);
    const titleCandidate = quoted || message
      .replace(/check|availability|available|copies|in stock|please|can you|could you|tell me|about/gi, '')
      .trim();

    if (!titleCandidate || titleCandidate.length < 2) {
      parts.push('Tell me the book title (you can put it in quotes), and I’ll check availability.');
    } else {
      const regex = new RegExp(titleCandidate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const matches = await Book.find({ title: regex })
        .sort({ rating: -1, createdAt: -1 })
        .limit(5)
        .select('title author copies status');

      if (matches.length === 0) {
        parts.push(`I couldn’t find a matching title for “${titleCandidate}”. Try a shorter keyword from the title.`);
      } else {
        const lines = matches.map((b) => {
          const copies = typeof b.copies === 'number' ? b.copies : 0;
          const status = b.status || (copies > 0 ? 'available' : 'borrowed');
          return `• ${b.title} — ${copies} copies (${status})`;
        });
        parts.push(`Here’s what I found:\n${lines.join('\n')}`);
      }
    }
  }

  if (wantsBorrowRules) {
    parts.push(
      `Borrowing rules (summary):\n` +
      `• Submit a borrow request from “Search & Borrow”.\n` +
      `• Once approved, the due date is ${BORROW_PERIOD_DAYS} days from the borrow date.\n` +
      `• If returned late, the fine is Rs ${FINE_PER_DAY_LKR}.00 per day (after the due date).`
    );
  }

  if (wantsReservations) {
    const upcoming = await Reservation.find({
      user: req.user._id,
      status: { $in: ['Upcoming', 'Active'] },
    })
      .sort({ createdAt: -1 })
      .limit(3);

    if (upcoming.length === 0) {
      parts.push(
        `You don’t have any upcoming space reservations. To reserve: go to “Spaces & E‑Learning” → “Library Spaces”, choose a space and time slot, then confirm.`
      );
    } else {
      const lines = upcoming.map((r) => `• ${r.spaceName} — ${r.date} (${r.time})`);
      parts.push(`Your upcoming reservations:\n${lines.join('\n')}`);
    }
  }

  if (wantsInquiries) {
    const inquiries = await Inquiry.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
    const pending = inquiries.filter((i) => i.status === 'pending').length;
    const answered = inquiries.filter((i) => i.status === 'answered').length;

    parts.push(
      `Inquiries status: ${pending} pending, ${answered} answered.\n` +
      `To submit a new inquiry: go to your Inquiry section and send your question (subject + message).`
    );
  }

  if (wantsElearning) {
    parts.push(
      `E‑Learning navigation: go to “Spaces & E‑Learning” → “E‑Learning Resources”. You can open videos/PDFs/notes from the resource list.`
    );
  }

  if (wantsRisk) {
    const risk = await computeRiskAndFinesForUser(req.user._id);
    const dueSoonText = risk.dueSoonCount > 0
      ? `${risk.dueSoonCount} item(s) due soon (closest in ${risk.dueSoonMinDays} day(s))`
      : 'No items due soon';

    parts.push(
      `Overdue risk: ${risk.level.toUpperCase()} (score ${risk.score}/100).\n` +
      `• Past late returns: ${risk.pastLateReturns}\n` +
      `• ${dueSoonText}\n` +
      `• Current overdue fine (so far): ${formatLkr(risk.currentOverdueFineLkr)}`
    );
  }

  if (parts.length === 0) {
    parts.push(
      `I can help with: book availability, borrowing rules/fines, space reservations, inquiries, and e‑learning navigation.\n` +
      `Try: “Check availability of \"Clean Code\"” or “What is my overdue risk?”`
    );
  }

  const insights = await buildInsightsForUser(req.user._id);

  res.status(200).json({
    reply: parts.join('\n\n'),
    insights,
  });
});

module.exports = {
  getAssistantInsights,
  chatWithAssistant,
};
