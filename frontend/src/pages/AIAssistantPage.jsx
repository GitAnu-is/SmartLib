import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  SendIcon, BotIcon, UserIcon, SparklesIcon, MicIcon,
  AlertTriangleIcon, BookOpenIcon, TrendingUpIcon, ClockIcon,
  CheckCircleIcon, XCircleIcon, BarChart3Icon, ZapIcon,
  HelpCircleIcon, CalendarIcon, GraduationCapIcon, ShieldIcon,
  DollarSignIcon, StarIcon, RefreshCwIcon, PlusIcon,
  EditIcon, TrashIcon, SearchIcon, XIcon, ChevronDownIcon,
  BookmarkIcon, ChevronRightIcon, InfoIcon, WifiOffIcon,
  ThumbsUpIcon, CopyIcon, RotateCcwIcon, TrendingDownIcon,
  ActivityIcon, TargetIcon, AwardIcon, BellIcon, ChevronUpIcon,
} from 'lucide-react'
import { assistantChat, fetchAssistantInsights } from '../api/assistant'
import { fetchBooks, createBook, updateBook, deleteBook } from '../api/books'
import { createBorrowRequest, fetchMyBorrowRequests, cancelBorrowRequest } from '../api/borrowRequests'
import { useWakeWordSpeech } from '../hooks/useWakeWordSpeech'

// ─── CONSTANTS ──────────────────────────────────────────────────────────────
const FINE_PER_DAY = 50
const BORROW_DAYS = 7

// ─── INTENT DETECTION ───────────────────────────────────────────────────────
const intentPatterns = [
  { intent: 'greeting', patterns: [/^(hi|hello|hey|good\s*(morning|afternoon|evening)|what'?s up|howdy|yo)\b/i] },
  { intent: 'availability', patterns: [/(available|availability|copies|in stock|do you have|have you got|find book|search book)/i] },
  { intent: 'borrow_rules', patterns: [/(borrow(ing)?|rules|how long|loan period|return|due date|fine|penalty|late)/i] },
  { intent: 'reservations', patterns: [/(reserve|reservation|book a|space|study room|booking)/i] },
  { intent: 'inquiries', patterns: [/(inquiry|inquiries|support|help desk|ticket|complaint)/i] },
  { intent: 'elearning', patterns: [/(e-?learning|resources|materials|video|pdf|notes|digital)/i] },
  { intent: 'risk', patterns: [/(risk|overdue|danger|how safe|my status)/i] },
  { intent: 'fines', patterns: [/(fine|fee|payment|amount|money|owe|pay|outstanding)/i] },
  { intent: 'my_books', patterns: [/(my books|my borrow|what (have|did) i borrow|currently reading|my reading)/i] },
  { intent: 'hours', patterns: [/(hour|open|close|when|timing|schedule|time)/i] },
  { intent: 'recommend', patterns: [/(recommend|suggest|what should|best book|popular|trending|top rated)/i] },
  { intent: 'thanks', patterns: [/(thank|thanks|thank you|thx|ty|appreciate)/i] },
  { intent: 'help', patterns: [/(help|what can you do|commands|options|menu|capability)/i] },
  { intent: 'sinhala_greeting', patterns: [/(ආයුබෝවන්|හලෝ|ස්තූතියි|හොඳ)/] },
  { intent: 'analytics', patterns: [/(analytics|analysis|statistics|stats|reading habit|progress|chart|graph)/i] },
]

function detectIntent(message) {
  const lower = message.toLowerCase().trim()
  for (const { intent, patterns } of intentPatterns) {
    if (patterns.some(p => p.test(lower))) return intent
  }
  return 'unknown'
}

function buildLocalReply(intent, message, insights) {
  const risk = insights?.risk
  switch (intent) {
    case 'greeting':
      return `👋 Hello! I'm **Libby**, your SmartLib AI assistant.\n\nI can help you with:\n• 📚 Book availability & search\n• 📋 Borrowing rules & fines\n• 📅 Space reservations\n• ⚡ Your overdue risk analysis\n• 💡 Personalized book recommendations\n• 📊 Reading analytics & insights\n\nWhat can I help you with today?`
    case 'sinhala_greeting':
      return `ආයුබෝවන්! 🙏 මම Libby, SmartLib AI සහාය කාරිය.\n\nමට ඔබට උදව් කළ හැකිය:\n• 📚 පොත් ලබා ගත හැකිද?\n• 📋 ණය නීති\n• ⚡ ඔබේ ගෙවීම් අවදානම\n\nකුමක් ගැන අසන්නද?`
    case 'borrow_rules':
      return `📋 **Borrowing Rules**\n\n• **Loan Period:** ${BORROW_DAYS} days from approval date\n• **Late Fine:** Rs ${FINE_PER_DAY}.00 per day after due date\n• **Max Books:** Up to 3 books at once\n• **Renewals:** Not currently available\n• **How to Borrow:** Search & Borrow → find book → submit request\n\n💡 *Pro tip: Set a reminder 2 days before the due date!*`
    case 'hours':
      return `🕐 **Library Hours**\n\n• **Mon – Fri:** 8:00 AM – 8:00 PM\n• **Saturday:** 9:00 AM – 5:00 PM\n• **Sunday:** 10:00 AM – 4:00 PM\n• **Public Holidays:** Closed\n\nThe SmartLib digital system is available **24/7** for online browsing and requests!`
    case 'risk':
      if (!risk) return `⚠️ Loading your risk data... Please try again in a moment.`
      const riskEmoji = risk.level === 'low' ? '🛡️' : risk.level === 'medium' ? '⚠️' : '🚨'
      return `${riskEmoji} **Your Overdue Risk: ${risk.level.toUpperCase()}** (${risk.score}/100)\n\n• Past late returns: **${risk.pastLateReturns}**\n• Books due soon: **${risk.dueSoonCount}**${risk.dueSoonMinDays != null ? ` (nearest in ${risk.dueSoonMinDays} day(s))` : ''}\n• Outstanding fine: **Rs ${(risk.currentOverdueFineLkr || 0).toFixed(2)}**\n\n${risk.level === 'high' ? '🚨 *Action needed: Return overdue books immediately to avoid more fines.*' : risk.level === 'medium' ? '⚠️ *Watch out: Some books are due soon!*' : '✅ *Great job! Keep returning books on time.*'}`
    case 'analytics':
      const cats = insights?.categoryStats || []
      if (cats.length === 0) return `📊 **Your Reading Analytics**\n\nNo reading history yet! Start borrowing books to see your personalized analytics.\n\nCheck the **Analytics** panel on the right to track your reading progress.`
      const topCat = cats.sort((a, b) => b.count - a.count)[0]
      return `📊 **Your Reading Analytics**\n\nYour favorite genre is **${topCat?.category}** with ${topCat?.count} books!\n\nCheck the **Analytics** panel for your full reading breakdown, risk history, and trends.`
    case 'fines':
      if (!risk) return `💰 Loading your fine data...`
      const fine = risk.currentOverdueFineLkr || 0
      return `💰 **Your Fine Summary**\n\n• Outstanding fine: **Rs ${fine.toFixed(2)}**\n• Fine rate: **Rs ${FINE_PER_DAY}.00/day** per overdue book\n\n${fine > 0 ? '⚠️ Please return overdue books and visit the library counter to settle fines.' : '✅ No outstanding fines! Great job staying on track.'}`
    case 'recommend':
      const recs = insights?.recommendations || []
      if (recs.length === 0) return `📚 Loading personalized recommendations... Check the **Smart Picks** panel!`
      const recList = recs.slice(0, 3).map(b => `• **${b.title}** by ${b.author} — ⭐ ${typeof b.rating === 'number' ? b.rating.toFixed(1) : 'N/A'}`).join('\n')
      return `📚 **Top Picks For You**\n\n${recList}\n\nThese are the highest-rated available books. Click any book in the Smart Picks panel to borrow!`
    case 'thanks':
      return `😊 You're very welcome! Happy reading at SmartLib! 📚\n\nIs there anything else I can help you with?`
    case 'help':
      return `🤖 **What I Can Do**\n\n• 📚 **"Check [book title]"** — Book availability\n• 📋 **"Borrowing rules"** — Loan & fine info\n• 📅 **"Reserve a space"** — Study room help\n• ⚡ **"My risk"** — Overdue risk analysis\n• 💰 **"My fines"** — Outstanding fines\n• 💡 **"Recommend books"** — Personalized picks\n• 📊 **"Analytics"** — Reading statistics\n• 🕐 **"Library hours"** — Opening times\n\n*Say "Hey Libby" to use voice commands!*`
    case 'elearning':
      return `🎓 **E-Learning Resources**\n\n1. Go to **"Spaces & E-Learning"** in the navigation\n2. Select **"E-Learning Resources"** tab\n3. Browse by category: Videos, PDFs, Notes\n4. Click any resource to open it\n\n💡 Resources are available 24/7 — great for exam prep!`
    case 'inquiries':
      return `🎫 **Library Inquiries & Support**\n\n1. Go to **"Inquiries"** from the main menu\n2. Click **"New Inquiry"**\n3. Fill in subject & message\n4. Track replies in the same section\n\n📬 The team typically replies within 1-2 business days.`
    case 'reservations':
      return `📅 **Space Reservations**\n\n1. Go to **"Spaces & E-Learning"**\n2. Click **"Library Spaces"**\n3. Select a space → pick a time slot\n4. Confirm your reservation\n\nAvailable: study rooms, computer labs, group meeting rooms!`
    case 'my_books':
      return `📖 **Your Reading Activity**\n\nCheck your current borrows in the **Dashboard**, or ask me:\n• *"What is my risk?"* — overdue status\n• *"My fines"* — outstanding payments\n• *"Analytics"* — reading breakdown\n\n📊 See your full history in the **History** panel →`
    default:
      return null
  }
}

// ─── DESIGN TOKENS ──────────────────────────────────────────────────────────
const PALETTE = {
  teal: { main: '#0d9488', light: '#ccfbf1', dark: '#0f766e', text: '#134e4a' },
  coral: { main: '#f97316', light: '#fff7ed', dark: '#ea580c', text: '#7c2d12' },
  violet: { main: '#7c3aed', light: '#f5f3ff', dark: '#6d28d9', text: '#4c1d95' },
  amber: { main: '#d97706', light: '#fffbeb', dark: '#b45309', text: '#78350f' },
  rose: { main: '#e11d48', light: '#fff1f2', dark: '#be123c', text: '#881337' },
  emerald: { main: '#059669', light: '#ecfdf5', dark: '#047857', text: '#064e3b' },
  blue: { main: '#2563eb', light: '#eff6ff', dark: '#1d4ed8', text: '#1e3a8a' },
}

const COVER_GRADIENTS = [
  ['#0d9488', '#059669'], ['#7c3aed', '#6d28d9'], ['#f97316', '#ea580c'],
  ['#2563eb', '#1d4ed8'], ['#d97706', '#b45309'], ['#e11d48', '#be123c'],
]

// ─── RISK SCORE CHART ───────────────────────────────────────────────────────
function RiskScoreChart({ score = 0, level = 'low' }) {
  const colors = { low: '#059669', medium: '#d97706', high: '#e11d48' }
  const color = colors[level] || colors.low

  return (
    <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-slate-50 to-white p-3.5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold text-slate-600">Risk Score</span>
        <span className="text-xs font-bold" style={{ color }}>{score}/100</span>
      </div>

      <div className="relative h-3 rounded-full bg-gray-200 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(0, Math.min(score, 100))}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{
            background: 'linear-gradient(90deg, #059669 0%, #d97706 55%, #e11d48 100%)',
          }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-[10px] font-semibold text-slate-400">
        <span>Low</span>
        <span>Moderate</span>
        <span>High</span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
        <div className="rounded-lg bg-emerald-50 text-emerald-700 font-semibold px-2 py-1 text-center">0-34</div>
        <div className="rounded-lg bg-amber-50 text-amber-700 font-semibold px-2 py-1 text-center">35-69</div>
        <div className="rounded-lg bg-rose-50 text-rose-700 font-semibold px-2 py-1 text-center">70-100</div>
      </div>
    </div>
  )
}

// ─── RISK TREND SPARKLINE ────────────────────────────────────────────────────
function RiskSparkline({ data = [], color = '#0d9488' }) {
  if (data.length < 2) return null
  const w = 200, h = 50
  const max = Math.max(...data), min = Math.min(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * (h - 8) - 4
    return `${x},${y}`
  }).join(' ')
  const lastX = (data.length - 1) / (data.length - 1) * w
  const lastY = h - ((data[data.length - 1] - min) / range) * (h - 8) - 4

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: '50px' }}>
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill="url(#sparkFill)" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r="3.5" fill={color} />
      <circle cx={lastX} cy={lastY} r="6" fill={color} fillOpacity="0.2" />
    </svg>
  )
}

// ─── RADIAL PROGRESS ────────────────────────────────────────────────────────
function RadialProgress({ value, max, color, size = 56, strokeWidth = 5, label, sublabel }) {
  const r = (size - strokeWidth * 2) / 2
  const circ = 2 * Math.PI * r
  const pct = Math.min(value / max, 1)
  const dash = pct * circ
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f3f4f6" strokeWidth={strokeWidth} />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round" strokeDasharray={`${dash} ${circ}`}
          initial={{ strokeDasharray: `0 ${circ}` }}
          animate={{ strokeDasharray: `${dash} ${circ}` }}
          transition={{ duration: 1, ease: 'easeOut' }} />
        <text x={size / 2} y={size / 2 + 1} textAnchor="middle" dominantBaseline="middle"
          fontSize={size * 0.22} fontWeight="700" fill={color} style={{ transform: `rotate(90deg) translate(0, -${size}px)` }}>{label}</text>
      </svg>
      {sublabel && <span className="text-[10px] text-gray-500 font-medium text-center">{sublabel}</span>}
    </div>
  )
}

// ─── ANIMATED COUNTER ───────────────────────────────────────────────────────
function AnimatedCounter({ value, prefix = '', suffix = '', decimals = 0 }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const start = Date.now()
    const duration = 800
    const from = 0
    const to = Number(value) || 0
    const tick = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setDisplay(from + (to - from) * ease)
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [value])
  return <>{prefix}{display.toFixed(decimals)}{suffix}</>
}

// ─── MODAL ──────────────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])
  if (!open) return null
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(6px)' }}
        onClick={onClose}>
        <motion.div initial={{ scale: 0.9, opacity: 0, y: 24 }} animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }} transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100"
          onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 text-base tracking-tight">{title}</h3>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
              <XIcon size={15} className="text-gray-500" />
            </button>
          </div>
          <div className="px-6 py-5">{children}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── BOOK FORM ───────────────────────────────────────────────────────────────
function BookForm({ initial, onSave, onCancel, loading }) {
  const [form, setForm] = useState(initial || { title: '', author: '', category: '', copies: 1, description: '', isbn: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const categories = ['Fiction', 'Non-Fiction', 'Science', 'Technology', 'History', 'Self-Help', 'Psychology', 'Sci-Fi', 'Productivity', 'Biography', 'Philosophy', 'Other']
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Title *</label>
          <input value={form.title} onChange={e => set('title', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none text-sm text-gray-800 placeholder:text-gray-400 transition-all"
            placeholder="Book title..." />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Author *</label>
          <input value={form.author} onChange={e => set('author', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none text-sm text-gray-800 placeholder:text-gray-400 transition-all"
            placeholder="Author name..." />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Copies *</label>
          <input type="number" min="0" value={form.copies} onChange={e => set('copies', Number(e.target.value))}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none text-sm text-gray-800 transition-all" />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Category *</label>
          <select value={form.category} onChange={e => set('category', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none text-sm bg-white text-gray-800 transition-all">
            <option value="">Select category...</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Description</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none text-sm resize-none text-gray-800 placeholder:text-gray-400 transition-all"
            placeholder="Short description..." />
        </div>
      </div>
      <div className="flex gap-3 pt-1">
        <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
        <button onClick={() => onSave(form)} disabled={loading || !form.title || !form.author || !form.category}
          className="flex-1 px-4 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? <><RefreshCwIcon size={14} className="animate-spin" /> Saving...</> : <><CheckCircleIcon size={14} /> Save Book</>}
        </button>
      </div>
    </div>
  )
}

// ─── MESSAGE BUBBLE ──────────────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard?.writeText(msg.message)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  const renderText = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((p, i) =>
      p.startsWith('**') && p.endsWith('**')
        ? <strong key={i} className="font-semibold text-gray-900">{p.slice(2, -2)}</strong>
        : <span key={i}>{p}</span>
    )
  }
  const isUser = msg.type === 'user'
  return (
    <motion.div initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} group`}>
      <div className={`flex items-end gap-2.5 max-w-[88%] ${isUser ? 'flex-row-reverse' : ''}`}>
        <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${isUser ? 'bg-orange-500' : 'bg-gradient-to-br from-teal-600 to-emerald-600'}`}>
          {isUser ? <UserIcon size={13} className="text-white" /> : <BotIcon size={13} className="text-white" />}
        </div>
        <div className="flex flex-col gap-1">
          <div className={`px-4 py-3 rounded-2xl ${isUser
            ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-br-sm shadow-md shadow-orange-200'
            : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm'}`}>
            {msg.isLoading ? (
              <div className="flex items-center gap-1.5 py-0.5">
                {[0, 1, 2].map(i => (
                  <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-teal-500"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }} />
                ))}
              </div>
            ) : (
              <p className="text-sm whitespace-pre-line leading-relaxed">
                {renderText(msg.message)}
              </p>
            )}
          </div>
          <div className={`flex items-center gap-2 px-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
            <span className="text-[10px] text-gray-400">{msg.timestamp}</span>
            {!isUser && !msg.isLoading && (
              <button onClick={handleCopy}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-gray-400 hover:text-teal-600 flex items-center gap-1">
                {copied ? <><CheckCircleIcon size={9} /> Copied</> : <><CopyIcon size={9} /> Copy</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── STAT CARD ───────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color, trend }) {
  const cfg = {
    teal: { bg: 'bg-teal-50', text: 'text-teal-700', icon: 'text-teal-600', border: 'border-teal-100' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', icon: 'text-amber-600', border: 'border-amber-100' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-700', icon: 'text-rose-500', border: 'border-rose-100' },
    violet: { bg: 'bg-violet-50', text: 'text-violet-700', icon: 'text-violet-600', border: 'border-violet-100' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'text-emerald-600', border: 'border-emerald-100' },
  }[color] || {}
  return (
    <div className={`rounded-2xl p-3.5 border ${cfg.bg} ${cfg.border} flex flex-col gap-2`}>
      <div className="flex items-center justify-between">
        <div className={`w-8 h-8 rounded-xl ${cfg.bg} flex items-center justify-center`}>
          <Icon size={15} className={cfg.icon} />
        </div>
        {trend !== undefined && (
          <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${trend >= 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
            {trend >= 0 ? <TrendingUpIcon size={9} /> : <TrendingDownIcon size={9} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <p className={`text-lg font-bold ${cfg.text}`}>{value}</p>
        <p className="text-[11px] text-gray-500 font-medium">{label}</p>
        {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ─── RISK FACTOR BAR ─────────────────────────────────────────────────────────
function RiskFactor({ label, value, max, color }) {
  const pct = Math.min(value / max, 1) * 100
  const colors = { low: '#059669', medium: '#d97706', high: '#e11d48', info: '#2563eb' }
  const bg = colors[color] || '#0d9488'
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] font-medium text-gray-500 w-24 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          className="h-full rounded-full" style={{ background: bg }} />
      </div>
      <span className="text-[11px] font-bold text-gray-700 w-7 text-right">{value}</span>
    </div>
  )
}

// ─── CATEGORY BAR CHART ───────────────────────────────────────────────────
function CategoryBarChart({ stats = [], palette = [] }) {
  if (!stats.length) return null
  const top = stats
    .filter((s) => Number(s.count || 0) > 0)
    .slice(0, 6)

  if (!top.length) return null

  const max = Math.max(...top.map(s => s.count || 0), 1)
  const yTicks = [max, Math.ceil(max * 0.66), Math.ceil(max * 0.33), 0]

  return (
    <div className="mt-4 rounded-2xl border border-gray-100 bg-gradient-to-br from-slate-50 to-white p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold text-slate-700">Category Performance</span>
        <span className="text-[10px] text-slate-400">Top {top.length} categories</span>
      </div>
      <div className="grid grid-cols-[34px_1fr] gap-2 h-44">
        <div className="flex flex-col justify-between text-[10px] font-medium text-slate-400 pb-5">
          {yTicks.map((tick, i) => (
            <span key={i}>{tick}</span>
          ))}
        </div>
        <div className="relative">
          <div className="absolute inset-0 flex flex-col justify-between pb-5 pointer-events-none">
            {yTicks.map((_, i) => (
              <div key={i} className="border-t border-dashed border-slate-200" />
            ))}
          </div>
          <div className="relative h-full flex items-end gap-2 pb-5">
            {top.map((cat, idx) => {
              const heightPct = Math.max(10, Math.round(((cat.count || 0) / max) * 100))
              const color = palette[idx % palette.length] || '#0d9488'
              return (
                <div key={cat.category} className="flex-1 min-w-0 flex flex-col items-center justify-end gap-1.5 h-full">
                  <span className="text-[10px] font-semibold text-slate-500">{cat.count}</span>
                  <motion.div
                    initial={{ height: 0, opacity: 0.6 }}
                    animate={{ height: `${heightPct}%`, opacity: 1 }}
                    transition={{ duration: 0.7, delay: idx * 0.08, ease: 'easeOut' }}
                    className="w-full rounded-t-lg shadow-sm"
                    style={{
                      minHeight: '12px',
                      background: `linear-gradient(180deg, ${color}, ${color}cc)`,
                    }}
                  />
                  <span className="text-[10px] text-slate-500 text-center truncate w-full" title={cat.category}>{cat.category}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const INITIAL_MSG = [{
  id: 1, type: 'bot', isLoading: false,
  message: "👋 Hi there! I'm **Libby**, your SmartLib AI assistant.\n\nAsk me about book availability, borrowing rules, reservations, fines, or your risk score. Or try the quick actions below!",
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
}]

const QUICK_ACTIONS = [
  { icon: BookOpenIcon, label: 'Check availability', color: 'text-orange-500', bg: 'bg-orange-50 hover:bg-orange-100', border: 'border-orange-100' },
  { icon: HelpCircleIcon, label: 'Borrowing rules', color: 'text-teal-600', bg: 'bg-teal-50 hover:bg-teal-100', border: 'border-teal-100' },
  { icon: ZapIcon, label: 'My risk', color: 'text-amber-600', bg: 'bg-amber-50 hover:bg-amber-100', border: 'border-amber-100' },
  { icon: SparklesIcon, label: 'Recommend books', color: 'text-violet-600', bg: 'bg-violet-50 hover:bg-violet-100', border: 'border-violet-100' },
  { icon: BarChart3Icon, label: 'Analytics', color: 'text-blue-600', bg: 'bg-blue-50 hover:bg-blue-100', border: 'border-blue-100' },
  { icon: DollarSignIcon, label: 'My fines', color: 'text-emerald-600', bg: 'bg-emerald-50 hover:bg-emerald-100', border: 'border-emerald-100' },
]

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export function AIAssistantPage({ onNavigate: _onNavigate }) {
  const [messages, setMessages] = useState(INITIAL_MSG)
  const [inputMessage, setInputMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [insights, setInsights] = useState({
    risk: { level: 'low', score: 0, pastLateReturns: 0, dueSoonCount: 0, dueSoonMinDays: null, currentOverdueFineLkr: 0 },
    categoryStats: [], fineRecords: [], recommendations: [],
  })
  const [activePanel] = useState('overview')
  const [books, setBooks] = useState([])
  const [booksLoading, setBooksLoading] = useState(false)
  const [bookSearch, setBookSearch] = useState('')
  const [showAddBook, setShowAddBook] = useState(false)
  const [editBook, setEditBook] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [bookFormLoading, setBookFormLoading] = useState(false)
  const [bookError, setBookError] = useState('')
  const [myBorrows, setMyBorrows] = useState([])
  const [borrowsLoading, setBorrowsLoading] = useState(false)

  const inputRef = useRef(null)
  const inputModeRef = useRef('keyboard')
  const messagesEndRef = useRef(null)

  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}') } catch { return {} }
  }, [])
  const isAdmin = user?.role === 'admin'

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return
    const run = async () => {
      setInsightsLoading(true)
      try { const d = await fetchAssistantInsights(); if (d) setInsights(d) }
      finally { setInsightsLoading(false) }
    }
    run()
  }, [])

  const loadBooks = useCallback(async () => {
    setBooksLoading(true); setBookError('')
    try {
      const data = await fetchBooks()
      setBooks(Array.isArray(data) ? data : Array.isArray(data?.books) ? data.books : [])
    } catch (e) { setBookError(e?.response?.data?.message || 'Failed to load books') }
    finally { setBooksLoading(false) }
  }, [])

  const loadBorrows = useCallback(async () => {
    setBorrowsLoading(true)
    try { const data = await fetchMyBorrowRequests(); setMyBorrows(Array.isArray(data) ? data : []) }
    finally { setBorrowsLoading(false) }
  }, [])

  useEffect(() => {
    if (activePanel === 'books') loadBooks()
    if (activePanel === 'history') loadBorrows()
  }, [activePanel, loadBooks, loadBorrows])

  // ─── SEND MESSAGE ────────────────────────────────────────────────────────
  const handleSendMessage = async (overrideMessage) => {
    const content = String(overrideMessage ?? inputMessage).trim()
    if (!content || sending) return
    const userMsg = { id: Date.now(), type: 'user', isLoading: false, message: content, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    const loadingId = Date.now() + 1
    const loadingMsg = { id: loadingId, type: 'bot', isLoading: true, message: '', timestamp: '' }
    setMessages(prev => [...prev, userMsg, loadingMsg])
    setInputMessage('')
    setSending(true)
    try {
      const intent = detectIntent(content)
      const localReply = buildLocalReply(intent, content, insights)
      let reply = localReply
      let newInsights = null
      if (!localReply || intent === 'availability' || intent === 'unknown') {
        try {
          const data = await assistantChat(content)
          reply = data?.reply || localReply || 'Sorry, I could not generate a response.'
          if (data?.insights) newInsights = data.insights
        } catch { reply = localReply || 'Failed to contact the assistant. Please try again.' }
      }
      setMessages(prev => prev.map(m => m.id === loadingId
        ? { ...m, isLoading: false, message: reply, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
        : m
      ))
      if (newInsights) setInsights(newInsights)
      else { const refreshed = await fetchAssistantInsights().catch(() => null); if (refreshed) setInsights(refreshed) }
    } catch (e) {
      setMessages(prev => prev.map(m => m.id === loadingId
        ? { ...m, isLoading: false, message: e?.response?.data?.message || 'Error. Please try again.', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
        : m
      ))
    } finally { setSending(false) }
  }

  // ─── BOOK CRUD ───────────────────────────────────────────────────────────
  const handleSaveBook = async (form) => {
    setBookFormLoading(true)
    try {
      if (editBook) await updateBook(editBook._id, form)
      else await createBook({ ...form, totalCopies: form.copies, status: form.copies > 0 ? 'available' : 'borrowed' })
      setShowAddBook(false); setEditBook(null); loadBooks()
    } catch (e) { setBookError(e?.response?.data?.message || 'Failed to save book') }
    finally { setBookFormLoading(false) }
  }

  const handleDeleteBook = async () => {
    if (!deleteConfirm) return
    try { await deleteBook(deleteConfirm._id); setDeleteConfirm(null); loadBooks() }
    catch (e) { setBookError(e?.response?.data?.message || 'Failed to delete book') }
  }

  const handleBorrowBook = async (bookId) => {
    try { await createBorrowRequest(bookId); handleSendMessage(`I just submitted a borrow request!`) }
    catch (e) { setBookError(e?.response?.data?.message || 'Failed to borrow') }
  }

  const handleCancelBorrow = async (reqId) => {
    try { await cancelBorrowRequest(reqId); loadBorrows() }
    catch (e) { setBookError(e?.response?.data?.message || 'Failed to cancel') }
  }

  // ─── DERIVED STATE ───────────────────────────────────────────────────────
  const riskLevel = insights?.risk?.level || 'low'
  const riskScore = insights?.risk?.score ?? 0
  const categoryStats = Array.isArray(insights?.categoryStats) ? insights.categoryStats : []
  const fineRecords = Array.isArray(insights?.fineRecords) ? insights.fineRecords : []
  const recommendations = Array.isArray(insights?.recommendations) ? insights.recommendations : []
  const maxCategoryCount = useMemo(() => Math.max(...categoryStats.map(c => c.count || 0), 1), [categoryStats])
  const formatLkr = (a) => `Rs ${(Number(a) || 0).toFixed(2)}`

  const filteredBooks = useMemo(() => {
    if (!bookSearch.trim()) return books
    const q = bookSearch.toLowerCase()
    return books.filter(b => b.title?.toLowerCase().includes(q) || b.author?.toLowerCase().includes(q) || b.category?.toLowerCase().includes(q))
  }, [books, bookSearch])

  const riskConfig = {
    low: { label: 'Low Risk', color: '#059669', textColor: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', icon: ShieldIcon },
    medium: { label: 'Moderate Risk', color: '#d97706', textColor: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', icon: AlertTriangleIcon },
    high: { label: 'High Risk', color: '#e11d48', textColor: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', badge: 'bg-rose-100 text-rose-700', icon: AlertTriangleIcon },
  }
  const rc = riskConfig[riskLevel] || riskConfig.low
  const RiskIcon = rc.icon

  // ─── VOICE ──────────────────────────────────────────────────────────────
  const { supported: voiceSupported, listening: voiceListening, awake: voiceAwake, error: voiceError, statusText: voiceStatusText, toggle: toggleVoice } = useWakeWordSpeech({
    wakeWordRegex: /\b(hey|hi)[\s,]+(libby|liby|lippy)(\s+ai)?\b/i,
    requireWakeWord: true,
    onWake: () => { inputModeRef.current = 'voice' },
    onCommandText: (text) => { if (inputModeRef.current !== 'voice') return; setInputMessage(text) },
    onCommandFinal: (text) => { if (inputModeRef.current !== 'voice') return; handleSendMessage(text); inputModeRef.current = 'keyboard' },
    commandIdleMs: 1200, awakeIdleMs: 6000,
  })

  const panels = [{ id: 'overview', label: 'Overview', icon: SparklesIcon }]

  // Mock sparkline trend data for demo
  const riskTrend = [30, 25, 45, 38, 52, 41, riskScore]
  const CATEGORY_PALETTE = ['#0d9488', '#7c3aed', '#f97316', '#2563eb', '#d97706', '#e11d48']

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ background: 'linear-gradient(145deg, #f0fdf9 0%, #f8fafc 40%, #fdf4ff 100%)' }}>
      <div className="max-w-[1400px] mx-auto">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-200">
                  <SparklesIcon size={20} className="text-white" />
                </div>
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-gray-900 tracking-tight">AI Smart Assistant</h1>
                  <span className="px-2 py-0.5 bg-teal-100 text-teal-700 text-[10px] font-bold rounded-full uppercase tracking-wider">Beta</span>
                </div>
                <p className="text-xs text-gray-500">Libby · SmartLib Intelligence System</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {insightsLoading && <RefreshCwIcon size={14} className="animate-spin text-teal-500" />}
              <div className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${rc.badge} border ${rc.border}`}>
                <RiskIcon size={12} />
                {rc.label}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Main Grid ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-5">

          {/* ── Chat Section ──────────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="flex flex-col">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden flex flex-col min-h-[620px] lg:min-h-[680px]">

              {/* Chat Header */}
              <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0d9488 0%, #059669 60%, #0f766e 100%)' }}>
                <div className="absolute inset-0 opacity-10"
                  style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                <div className="relative p-4 flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                      <BotIcon size={20} className="text-white" />
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-300 rounded-full border-2 border-teal-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-white text-sm">Libby AI Assistant</h2>
                    </div>
                    <p className="text-emerald-200 text-[11px] mt-0.5">
                      {voiceListening ? (voiceAwake ? '🎙️ Listening…' : '💤 Say "Hey Libby"') : '● Online · Ready to help'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setMessages(INITIAL_MSG)} title="Clear chat"
                      className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors">
                      <RotateCcwIcon size={13} className="text-white" />
                    </button>
                    <button onClick={toggleVoice} disabled={!voiceSupported}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${voiceListening ? 'bg-white/30 ring-2 ring-white/60' : 'bg-white/15 hover:bg-white/25'} disabled:opacity-40`}>
                      <MicIcon size={15} className={`text-white ${voiceListening ? 'animate-pulse' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="px-4 pb-3">
                  <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
                    {QUICK_ACTIONS.map((a, i) => (
                      <motion.button key={i} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}
                        onClick={() => handleSendMessage(a.label)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 text-[11px] font-semibold text-white whitespace-nowrap transition-all backdrop-blur-sm">
                        <a.icon size={11} />
                        {a.label}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/30">
                {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 bg-white border-t border-gray-100">
                <div className="flex gap-2 items-center">
                  <div className="flex-1 relative">
                    <input ref={inputRef} type="text" value={inputMessage}
                      onChange={e => { inputModeRef.current = 'keyboard'; setInputMessage(e.target.value) }}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                      placeholder="Ask Libby anything…"
                      className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:bg-white outline-none text-sm text-gray-800 placeholder:text-gray-400 transition-all" />
                    {inputMessage && (
                      <button onClick={() => setInputMessage('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                        <XIcon size={13} />
                      </button>
                    )}
                  </div>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.94 }}
                    onClick={() => handleSendMessage()} disabled={sending || !inputMessage.trim()}
                    className="w-11 h-11 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200 disabled:opacity-50 transition-all">
                    {sending ? <RefreshCwIcon size={17} className="animate-spin" /> : <SendIcon size={17} />}
                  </motion.button>
                </div>
                <p className="text-[10px] text-gray-400 mt-2 text-center">
                  Libby uses your library data to give personalized answers. Verify critical info at the library counter.
                </p>
              </div>
            </div>
          </motion.div>

          {/* ── Analytics & Library Panel (Stacked) ───────────────────── */}
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col gap-4">

            {/* Panel Tabs */}
            <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100 flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center">
                <SparklesIcon size={14} className="text-teal-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800">Assistant Insights</p>
                <p className="text-[11px] text-gray-500">Professional analytics overview</p>
              </div>
            </div>

            {/* ── OVERVIEW PANEL ────────────────────────────────────── */}
            {activePanel === 'overview' && (
              <div className="space-y-4">

                {/* ── RISK ANALYTICS CARD ─────────────────────────── */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 pt-5 pb-3">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-xl ${rc.bg} flex items-center justify-center`}>
                          <ActivityIcon size={14} className={rc.textColor} />
                        </div>
                        <span className="text-sm font-bold text-gray-800">Risk Analysis</span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${rc.badge} border ${rc.border}`}>
                        {rc.label}
                      </span>
                    </div>

                    {/* Chart + Stats */}
                    <div className="space-y-3">
                      <RiskScoreChart score={riskScore} level={riskLevel} />
                      <div className="space-y-2.5">
                        <RiskFactor label="Overall Score" value={riskScore} max={100}
                          color={riskLevel === 'low' ? 'low' : riskLevel === 'medium' ? 'medium' : 'high'} />
                        <RiskFactor label="Past Late" value={insights?.risk?.pastLateReturns ?? 0} max={10} color="medium" />
                        <RiskFactor label="Due Soon" value={insights?.risk?.dueSoonCount ?? 0} max={5} color="info" />
                        <RiskFactor label="Fine Debt" value={Math.min(Math.floor((insights?.risk?.currentOverdueFineLkr || 0) / 50), 10)} max={10} color="high" />
                      </div>
                    </div>

                    {/* Trend Sparkline */}
                    <div className="mt-3 pt-3 border-t border-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-semibold text-gray-500">Risk trend (7 weeks)</span>
                        <span className={`text-[11px] font-bold ${riskScore > riskTrend[5] ? 'text-rose-500' : 'text-emerald-600'}`}>
                          {riskScore > riskTrend[5] ? '↑' : '↓'} {Math.abs(riskScore - riskTrend[5])} pts
                        </span>
                      </div>
                      <RiskSparkline data={riskTrend} color={rc.color} />
                    </div>
                  </div>

                  {/* Stat Grid */}
                  <div className="grid grid-cols-3 border-t border-gray-100">
                    {[
                      { label: 'Fine', value: formatLkr(insights?.risk?.currentOverdueFineLkr), icon: '💰', color: 'text-rose-600' },
                      { label: 'Due Soon', value: `${insights?.risk?.dueSoonCount ?? 0} books`, icon: '📅', color: 'text-amber-600' },
                      { label: 'Late History', value: `${insights?.risk?.pastLateReturns ?? 0} times`, icon: '⏰', color: 'text-gray-700' },
                    ].map((s, i) => (
                      <div key={i} className={`p-3.5 text-center ${i < 2 ? 'border-r border-gray-100' : ''}`}>
                        <p className="text-base mb-1">{s.icon}</p>
                        <p className={`text-xs font-bold ${s.color}`}>{s.value}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── READING ANALYTICS ──────────────────────────── */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-violet-50 flex items-center justify-center">
                        <BarChart3Icon size={14} className="text-violet-600" />
                      </div>
                      <span className="text-sm font-bold text-gray-800">Reading Breakdown</span>
                    </div>
                    <span className="text-xs text-gray-400">{categoryStats.reduce((a, c) => a + (c.count || 0), 0)} books total</span>
                  </div>

                  {categoryStats.length === 0 ? (
                    <div className="py-6 text-center">
                      <BookOpenIcon size={28} className="text-gray-200 mx-auto mb-2" />
                      <p className="text-xs text-gray-400">Start borrowing to see analytics</p>
                    </div>
                  ) : (
                    <CategoryBarChart stats={categoryStats} palette={CATEGORY_PALETTE} />
                  )}
                </div>

                {/* ── SMART PICKS ────────────────────────────────── */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-amber-50 flex items-center justify-center">
                        <SparklesIcon size={14} className="text-amber-600" />
                      </div>
                      <span className="text-sm font-bold text-gray-800">Smart Picks</span>
                    </div>
                    <span className="text-[11px] font-semibold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">{recommendations.length} picks</span>
                  </div>

                  <div className="space-y-2">
                    {(recommendations.length === 0 ? Array(3).fill(null) : recommendations).slice(0, 5).map((book, idx) => (
                      <motion.div key={book?._id || idx}
                        initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => book && handleSendMessage(`Tell me about "${book.title}"`)}
                        className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-gray-50 cursor-pointer group transition-all border border-transparent hover:border-gray-100">
                        <div className="w-9 flex-shrink-0 rounded-xl flex items-center justify-center shadow-sm overflow-hidden"
                          style={{ height: '48px', background: `linear-gradient(135deg, ${COVER_GRADIENTS[idx % COVER_GRADIENTS.length][0]}, ${COVER_GRADIENTS[idx % COVER_GRADIENTS.length][1]})` }}>
                          {book ? <BookOpenIcon size={13} className="text-white/70" /> : <div className="w-5 h-5 bg-white/20 rounded-lg animate-pulse" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          {book ? (
                            <>
                              <p className="text-[12px] font-semibold text-gray-800 truncate leading-tight">{book.title}</p>
                              <p className="text-[10px] text-gray-500 truncate">{book.author}</p>
                              <span className={`inline-flex items-center gap-0.5 text-[9px] font-semibold mt-0.5 px-1.5 py-0.5 rounded-full ${book.status === 'available' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                {book.status || 'available'}
                              </span>
                            </>
                          ) : (
                            <div className="space-y-1.5">
                              <div className="h-2.5 bg-gray-200 rounded animate-pulse w-3/4" />
                              <div className="h-2 bg-gray-200 rounded animate-pulse w-1/2" />
                            </div>
                          )}
                        </div>
                        {book && (
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-0.5">
                              <StarIcon size={9} className="text-amber-500 fill-amber-500" />
                              <span className="text-[11px] font-bold text-gray-700">{typeof book.rating === 'number' ? book.rating.toFixed(1) : '—'}</span>
                            </div>
                            <ChevronRightIcon size={11} className="text-gray-300 group-hover:text-teal-500 transition-colors" />
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* ── FINE RECORDS ──────────────────────────────── */}
                {fineRecords.length > 0 && (
                  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-7 h-7 rounded-xl bg-rose-50 flex items-center justify-center">
                        <DollarSignIcon size={14} className="text-rose-500" />
                      </div>
                      <span className="text-sm font-bold text-gray-800">Fine Records</span>
                    </div>
                    <div className="space-y-2">
                      {fineRecords.map((fine) => (
                        <div key={fine.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="min-w-0">
                            <p className="text-[12px] font-semibold text-gray-800 truncate">{fine.book}</p>
                            <p className="text-[10px] text-gray-400">{fine.date}</p>
                          </div>
                          <div className="text-right ml-3">
                            <p className="text-[12px] font-bold text-gray-800">{formatLkr(fine.amountLkr)}</p>
                            {fine.status === 'paid'
                              ? <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5 justify-end"><CheckCircleIcon size={9} /> Paid</span>
                              : <span className="text-[10px] text-rose-500 font-semibold flex items-center gap-0.5 justify-end"><XCircleIcon size={9} /> Unpaid</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── BOOKS PANEL ──────────────────────────────────────── */}
            {activePanel === 'books' && (
              <div className="space-y-3">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                      <SearchIcon size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input value={bookSearch} onChange={e => setBookSearch(e.target.value)}
                        placeholder="Search books, authors…"
                        className="w-full pl-8 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 placeholder:text-gray-400 transition-all" />
                    </div>
                    {isAdmin && (
                      <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}
                        onClick={() => setShowAddBook(true)}
                        className="px-3 py-2.5 bg-teal-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm hover:bg-teal-700 transition-colors">
                        <PlusIcon size={12} /> Add
                      </motion.button>
                    )}
                    <button onClick={loadBooks} className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                      <RefreshCwIcon size={12} className={`text-gray-500 ${booksLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                  {bookError && (
                    <div className="flex items-center gap-2 p-2.5 bg-rose-50 rounded-xl mt-3 text-xs text-rose-600 border border-rose-100">
                      <XCircleIcon size={12} /> {bookError}
                    </div>
                  )}
                </div>

                <div className="space-y-2 max-h-[620px] overflow-y-auto">
                  {booksLoading ? Array(5).fill(null).map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 animate-pulse">
                      <div className="flex gap-3">
                        <div className="w-9 h-12 bg-gray-200 rounded-xl" />
                        <div className="flex-1 space-y-2"><div className="h-3 bg-gray-200 rounded w-3/4" /><div className="h-2.5 bg-gray-200 rounded w-1/2" /></div>
                      </div>
                    </div>
                  )) : filteredBooks.length === 0 ? (
                    <div className="bg-white rounded-2xl p-10 text-center border border-gray-100">
                      <BookOpenIcon size={28} className="text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">{bookSearch ? 'No books match your search' : 'No books found'}</p>
                    </div>
                  ) : filteredBooks.map((book, idx) => (
                    <motion.div key={book._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.025 }}
                      className="bg-white rounded-2xl p-3.5 border border-gray-100 hover:border-teal-200 hover:shadow-md transition-all">
                      <div className="flex gap-3">
                        <div className="w-9 flex-shrink-0 rounded-xl flex items-center justify-center shadow-sm overflow-hidden"
                          style={{ height: '52px', background: `linear-gradient(135deg, ${COVER_GRADIENTS[idx % COVER_GRADIENTS.length][0]}, ${COVER_GRADIENTS[idx % COVER_GRADIENTS.length][1]})` }}>
                          <BookOpenIcon size={13} className="text-white/70" />
                        </div>
                       <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="min-w-0 pr-2">
                              <p className="text-[12px] font-semibold text-gray-800 truncate transition-colors" title={book.title}>
                                {book.title}
                              </p>
                              <p className="text-[10px] text-gray-500 truncate mt-0.5" title={book.author}>
                                {book.author}
                              </p>
                            </div>
                            <div className="flex items-center gap-0.5 ml-2">
                              <StarIcon size={9} className="text-amber-500 fill-amber-500" />
                              <span className="text-[10px] font-bold text-gray-700">{typeof book.rating === 'number' ? book.rating.toFixed(1) : '—'}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full font-medium">{book.category}</span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${book.status === 'available' ? 'bg-emerald-100 text-emerald-700' : book.status === 'reserved' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                                {book.status || 'unknown'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              {!isAdmin && book.status === 'available' && (
                                <motion.button whileTap={{ scale: 0.94 }} onClick={() => handleBorrowBook(book._id)}
                                  className="px-2.5 py-1 bg-teal-600 text-white rounded-lg text-[10px] font-semibold hover:bg-teal-700 transition-colors">
                                  Borrow
                                </motion.button>
                              )}
                              {isAdmin && (
                                <>
                                  <button onClick={() => setEditBook(book)}
                                    className="w-6 h-6 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors">
                                    <EditIcon size={10} className="text-blue-600" />
                                  </button>
                                  <button onClick={() => setDeleteConfirm(book)}
                                    className="w-6 h-6 rounded-lg bg-rose-50 hover:bg-rose-100 flex items-center justify-center transition-colors">
                                    <TrashIcon size={10} className="text-rose-500" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* ── HISTORY PANEL ────────────────────────────────────── */}
            {activePanel === 'history' && (
              <div className="space-y-3">
                <div className="bg-white rounded-2xl px-4 py-3.5 shadow-sm border border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-gray-800">Borrow History</h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">{myBorrows.length} total requests</p>
                  </div>
                  <button onClick={loadBorrows} className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                    <RefreshCwIcon size={12} className={`text-gray-500 ${borrowsLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <div className="space-y-2 max-h-[620px] overflow-y-auto">
                  {borrowsLoading ? Array(4).fill(null).map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 animate-pulse">
                      <div className="h-3 bg-gray-200 rounded w-2/3 mb-2" /><div className="h-2.5 bg-gray-200 rounded w-1/3" />
                    </div>
                  )) : myBorrows.length === 0 ? (
                    <div className="bg-white rounded-2xl p-10 text-center border border-gray-100">
                      <ClockIcon size={28} className="text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">No borrow history yet</p>
                      <p className="text-xs text-gray-400 mt-1">Start by borrowing a book!</p>
                    </div>
                  ) : myBorrows.map((req, idx) => {
                    const statusConf = {
                      approved: { bg: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700', badge: 'bg-emerald-100', label: 'Approved', icon: CheckCircleIcon },
                      pending: { bg: 'bg-amber-50 border-amber-100', text: 'text-amber-700', badge: 'bg-amber-100', label: 'Pending', icon: ClockIcon },
                      rejected: { bg: 'bg-rose-50 border-rose-100', text: 'text-rose-600', badge: 'bg-rose-100', label: 'Rejected', icon: XCircleIcon },
                      returned: { bg: 'bg-blue-50 border-blue-100', text: 'text-blue-600', badge: 'bg-blue-100', label: 'Returned', icon: BookmarkIcon },
                    }[req.status] || { bg: 'bg-gray-50 border-gray-100', text: 'text-gray-600', badge: 'bg-gray-100', label: req.status, icon: InfoIcon }
                    const SIcon = statusConf.icon
                    return (
                      <motion.div key={req._id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.035 }}
                        className={`rounded-2xl p-3.5 border ${statusConf.bg}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div className={`w-7 h-7 rounded-xl ${statusConf.badge} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                              <SIcon size={12} className={statusConf.text} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[12px] font-semibold text-gray-800 truncate">{req.book?.title || 'Unknown Book'}</p>
                              <p className="text-[10px] text-gray-500">{req.book?.author || '—'}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[10px] font-bold ${statusConf.text}`}>{statusConf.label}</span>
                                {req.dueAt && <span className="text-[10px] text-gray-400">Due: {new Date(req.dueAt).toLocaleDateString()}</span>}
                              </div>
                            </div>
                          </div>
                          {req.status === 'pending' && (
                            <button onClick={() => handleCancelBorrow(req._id)}
                              className="px-2.5 py-1 bg-white border border-rose-200 text-rose-500 rounded-lg text-[10px] font-semibold hover:bg-rose-50 transition-colors flex-shrink-0">
                              Cancel
                            </button>
                          )}
                        </div>
                        {req.fineLkr > 0 && (
                          <div className="mt-2.5 pt-2.5 border-t border-white/60 flex items-center justify-between">
                            <span className="text-[10px] text-gray-500">Outstanding fine</span>
                            <span className={`text-[10px] font-bold ${req.finePaid ? 'text-emerald-600' : 'text-rose-500'}`}>
                              {formatLkr(req.fineLkr)} {req.finePaid ? '· Paid' : '· Unpaid'}
                            </span>
                          </div>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* ── Admin Book Management Modals ─────────────────────────────────── */}
      <Modal open={showAddBook} onClose={() => setShowAddBook(false)} title="Add Library Book">
        <BookForm onSave={handleSaveBook} onCancel={() => setShowAddBook(false)} loading={bookFormLoading} />
      </Modal>
      <Modal open={!!editBook} onClose={() => setEditBook(null)} title="Edit Library Book">
        <BookForm initial={editBook} onSave={handleSaveBook} onCancel={() => setEditBook(null)} loading={bookFormLoading} />
      </Modal>
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirm Book Deletion">
        <div className="text-center">
          <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <TrashIcon size={22} className="text-rose-500" />
          </div>
          <p className="text-sm font-semibold text-gray-900 mb-1">Delete "{deleteConfirm?.title}"?</p>
          <p className="text-xs text-gray-500 mb-6">This action cannot be undone. All associated data will be removed.</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
            <button onClick={handleDeleteBook} className="flex-1 px-4 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-semibold hover:bg-rose-600 transition-colors">Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}