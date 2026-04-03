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
  ThumbsUpIcon, CopyIcon, RotateCcwIcon,
} from 'lucide-react'
import { assistantChat, fetchAssistantInsights } from '../api/assistant'
import { fetchBooks, createBook, updateBook, deleteBook } from '../api/books'
import { createBorrowRequest, fetchMyBorrowRequests, cancelBorrowRequest } from '../api/borrowRequests'
import { useWakeWordSpeech } from '../hooks/useWakeWordSpeech'

// ─── ENHANCED RULE-BASED CHATBOT ───────────────────────────────────────────

const FINE_PER_DAY = 50
const BORROW_DAYS = 7

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
      return `👋 Hello! I'm **Libby**, your SmartLib AI assistant.\n\nI can help you with:\n• 📚 Book availability & search\n• 📋 Borrowing rules & fines\n• 📅 Space reservations\n• ⚡ Your overdue risk\n• 💡 Personalized book recommendations\n\nWhat can I help you with today?`

    case 'sinhala_greeting':
      return `ආයුබෝවන්! 🙏 මම Libby, SmartLib AI සහාය කාරිය.\n\nමට ඔබට උදව් කළ හැකිය:\n• 📚 පොත් ලබා ගත හැකිද?\n• 📋 ණය නීති\n• ⚡ ඔබේ ගෙවීම් අවදානම\n\nකුමක් ගැන අසන්නද?`

    case 'borrow_rules':
      return `📋 **Borrowing Rules**\n\n• **Loan Period:** ${BORROW_DAYS} days from approval date\n• **Late Fine:** Rs ${FINE_PER_DAY}.00 per day after due date\n• **Max Books:** Up to 3 books at once\n• **Renewals:** Not currently available\n• **How to Borrow:** Go to "Search & Borrow" → find your book → submit request\n\n💡 *Pro tip: Set a phone reminder 2 days before the due date!*`

    case 'hours':
      return `🕐 **Library Hours**\n\n• **Mon – Fri:** 8:00 AM – 8:00 PM\n• **Saturday:** 9:00 AM – 5:00 PM\n• **Sunday:** 10:00 AM – 4:00 PM\n• **Public Holidays:** Closed\n\nThe SmartLib digital system is available **24/7** for online browsing and requests!`

    case 'risk':
      if (!risk) return `⚠️ Loading your risk data... Please try again in a moment.`
      const riskEmoji = risk.level === 'low' ? '🛡️' : risk.level === 'medium' ? '⚠️' : '🚨'
      return `${riskEmoji} **Your Overdue Risk: ${risk.level.toUpperCase()}** (${risk.score}/100)\n\n• Past late returns: **${risk.pastLateReturns}**\n• Books due soon: **${risk.dueSoonCount}**${risk.dueSoonMinDays != null ? ` (nearest in ${risk.dueSoonMinDays} day(s))` : ''}\n• Current outstanding fine: **Rs ${(risk.currentOverdueFineLkr || 0).toFixed(2)}**\n\n${risk.level === 'high' ? '🚨 *Action needed: Return overdue books immediately to avoid more fines.*' : risk.level === 'medium' ? '⚠️ *Watch out: Some books are due soon!*' : '✅ *Great job! Keep returning books on time.*'}`

    case 'fines':
      if (!risk) return `💰 Loading your fine data...`
      const fine = risk.currentOverdueFineLkr || 0
      return `💰 **Your Fine Summary**\n\n• Outstanding fine: **Rs ${fine.toFixed(2)}**\n• Fine rate: **Rs ${FINE_PER_DAY}.00/day** per overdue book\n\n${fine > 0 ? '⚠️ Please return overdue books and visit the library counter to settle fines.' : '✅ No outstanding fines! Great job staying on track.'}`

    case 'recommend':
      const recs = insights?.recommendations || []
      if (recs.length === 0) return `📚 Loading personalized recommendations... Check the **Smart Picks** panel on the right!`
      const recList = recs.slice(0, 3).map(b => `• **${b.title}** by ${b.author} — ⭐ ${typeof b.rating === 'number' ? b.rating.toFixed(1) : 'N/A'}`).join('\n')
      return `📚 **Top Picks For You**\n\n${recList}\n\nThese are the highest-rated available books right now. Click a book in the Smart Picks panel to borrow it!`

    case 'thanks':
      return `😊 You're very welcome! Happy reading at SmartLib! 📚\n\nIs there anything else I can help you with?`

    case 'help':
      return `🤖 **What I Can Do**\n\n• 📚 **"Check [book title]"** — Book availability\n• 📋 **"Borrowing rules"** — Loan & fine info\n• 📅 **"Reserve a space"** — Study room help\n• ⚡ **"My risk"** — Overdue risk check\n• 💰 **"My fines"** — Outstanding fines\n• 💡 **"Recommend books"** — Personalized picks\n• 🕐 **"Library hours"** — Opening times\n• 📊 **"My books"** — Current borrowings\n\n*Say "Hey Libby" to use voice commands!*`

    case 'elearning':
      return `🎓 **E-Learning Resources**\n\nAccess digital materials:\n1. Go to **"Spaces & E-Learning"** in the navigation\n2. Select **"E-Learning Resources"** tab\n3. Browse by category: Videos, PDFs, Notes\n4. Click any resource to open it\n\n💡 Resources are available 24/7 — great for exam prep!`

    case 'inquiries':
      return `🎫 **Library Inquiries & Support**\n\nNeed to contact the library team?\n1. Go to **"Inquiries"** from the main menu\n2. Click **"New Inquiry"**\n3. Fill in subject & message\n4. Track replies in the same section\n\n📬 The library team typically replies within 1-2 business days.`

    case 'reservations':
      return `📅 **Space Reservations**\n\nTo book a study room or space:\n1. Go to **"Spaces & E-Learning"**\n2. Click **"Library Spaces"**\n3. Select a space → pick a time slot\n4. Confirm your reservation\n\nAvailable spaces include study rooms, computer labs, and group meeting rooms!`

    case 'my_books':
      return `📖 **Your Reading Activity**\n\nCheck your current borrows in the **Dashboard** page, or ask me:\n• *"What is my risk?"* — overdue status\n• *"My fines"* — outstanding payments\n\n📊 Your reading history is shown in the **Reading Analysis** panel →`

    default:
      return null // will fall through to API
  }
}

// ─── MODAL COMPONENT ───────────────────────────────────────────────────────

function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{ type: 'spring', damping: 24, stiffness: 300 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h3 className="font-extrabold text-dark text-lg">{title}</h3>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
              <XIcon size={16} />
            </button>
          </div>
          <div className="p-5">{children}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── BOOK FORM ──────────────────────────────────────────────────────────────

function BookForm({ initial, onSave, onCancel, loading }) {
  const [form, setForm] = useState(initial || { title: '', author: '', category: '', copies: 1, description: '', isbn: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const categories = ['Fiction', 'Non-Fiction', 'Science', 'Technology', 'History', 'Self-Help', 'Psychology', 'Sci-Fi', 'Productivity', 'Biography', 'Philosophy', 'Other']

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-bold text-medium mb-1">Title *</label>
          <input value={form.title} onChange={e => set('title', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal focus:border-transparent outline-none text-sm"
            placeholder="Book title..." />
        </div>
        <div>
          <label className="block text-xs font-bold text-medium mb-1">Author *</label>
          <input value={form.author} onChange={e => set('author', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal focus:border-transparent outline-none text-sm"
            placeholder="Author name..." />
        </div>
        <div>
          <label className="block text-xs font-bold text-medium mb-1">Copies *</label>
          <input type="number" min="0" value={form.copies} onChange={e => set('copies', Number(e.target.value))}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal focus:border-transparent outline-none text-sm" />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-bold text-medium mb-1">Category *</label>
          <select value={form.category} onChange={e => set('category', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal focus:border-transparent outline-none text-sm bg-white">
            <option value="">Select category...</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-bold text-medium mb-1">Description</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-teal focus:border-transparent outline-none text-sm resize-none"
            placeholder="Short description..." />
        </div>
      </div>
      <div className="flex gap-3 pt-1">
        <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-medium hover:bg-gray-50 transition-colors">
          Cancel
        </button>
        <button onClick={() => onSave(form)} disabled={loading || !form.title || !form.author || !form.category}
          className="flex-1 px-4 py-2.5 rounded-xl bg-teal text-white text-sm font-bold hover:bg-teal/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? <><RefreshCwIcon size={14} className="animate-spin" /> Saving...</> : <><CheckCircleIcon size={14} /> Save Book</>}
        </button>
      </div>
    </div>
  )
}

// ─── MESSAGE BUBBLE ─────────────────────────────────────────────────────────

function MessageBubble({ msg, onCopy }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard?.writeText(msg.message)
    setCopied(true)
    onCopy?.()
    setTimeout(() => setCopied(false), 2000)
  }

  // Parse **bold** markdown
  const renderText = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((p, i) =>
      p.startsWith('**') && p.endsWith('**')
        ? <strong key={i}>{p.slice(2, -2)}</strong>
        : <span key={i}>{p}</span>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25 }}
      className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} group`}
    >
      <div className={`flex items-end gap-2 max-w-[84%] ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}>
        <div className={`w-8 h-8 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${msg.type === 'user' ? 'bg-coral' : 'bg-gradient-to-br from-teal to-teal/70'}`}>
          {msg.type === 'user' ? <UserIcon size={14} className="text-white" /> : <BotIcon size={14} className="text-white" />}
        </div>
        <div className="flex flex-col gap-1">
          <div className={`px-4 py-3 rounded-2xl relative ${
            msg.type === 'user'
              ? 'bg-coral text-white rounded-br-sm shadow-lg shadow-coral/20'
              : 'bg-white border border-gray-100 text-dark rounded-bl-sm shadow-md'
          }`}>
            {msg.isLoading ? (
              <div className="flex items-center gap-1.5 py-1">
                {[0,1,2].map(i => (
                  <motion.div key={i} className="w-2 h-2 rounded-full bg-teal/40"
                    animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18 }} />
                ))}
              </div>
            ) : (
              <p className="text-sm whitespace-pre-line leading-relaxed">
                {renderText(msg.message)}
              </p>
            )}
          </div>
          <div className={`flex items-center gap-2 px-1 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <span className="text-[10px] text-medium">{msg.timestamp}</span>
            {msg.type === 'bot' && !msg.isLoading && (
              <button onClick={handleCopy}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-medium hover:text-teal flex items-center gap-1">
                {copied ? <><CheckCircleIcon size={10} /> Copied</> : <><CopyIcon size={10} /> Copy</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── MAIN PAGE ──────────────────────────────────────────────────────────────

const INITIAL_MSG = [{
  id: 1, type: 'bot', isLoading: false,
  message: "👋 Hi there! I'm **Libby**, your SmartLib AI assistant.\n\nAsk me about book availability, borrowing rules, reservations, fines, or your overdue risk. Or try the quick actions below!",
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
}]

const QUICK_ACTIONS = [
  { icon: BookOpenIcon, label: 'Check availability', color: 'text-coral', bg: 'bg-coral/10 hover:bg-coral/20' },
  { icon: HelpCircleIcon, label: 'Borrowing rules', color: 'text-teal', bg: 'bg-teal/10 hover:bg-teal/20' },
  { icon: ZapIcon, label: 'My risk', color: 'text-golden', bg: 'bg-golden/10 hover:bg-yellow-100' },
  { icon: SparklesIcon, label: 'Recommend books', color: 'text-purple-500', bg: 'bg-purple-50 hover:bg-purple-100' },
  { icon: ClockIcon, label: 'Library hours', color: 'text-blue-500', bg: 'bg-blue-50 hover:bg-blue-100' },
  { icon: DollarSignIcon, label: 'My fines', color: 'text-emerald-600', bg: 'bg-emerald-50 hover:bg-emerald-100' },
]

const CATEGORY_COLORS = ['bg-coral', 'bg-teal', 'bg-golden', 'bg-purple-400', 'bg-blue-400']
const COVER_GRADIENTS = [
  'from-teal to-emerald-600', 'from-coral to-rose-600', 'from-golden to-amber-500',
  'from-purple-500 to-violet-600', 'from-blue-500 to-cyan-500', 'from-indigo-500 to-blue-600',
]

export function AIAssistantPage({ onNavigate: _onNavigate }) {
  const [messages, setMessages] = useState(INITIAL_MSG)
  const [inputMessage, setInputMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [insights, setInsights] = useState({ risk: { level: 'low', score: 0, pastLateReturns: 0, dueSoonCount: 0, dueSoonMinDays: null, currentOverdueFineLkr: 0 }, categoryStats: [], fineRecords: [], recommendations: [] })
  const [activePanel, setActivePanel] = useState('overview') // 'overview' | 'books' | 'history'

  // Book CRUD
  const [books, setBooks] = useState([])
  const [booksLoading, setBooksLoading] = useState(false)
  const [bookSearch, setBookSearch] = useState('')
  const [showAddBook, setShowAddBook] = useState(false)
  const [editBook, setEditBook] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [bookFormLoading, setBookFormLoading] = useState(false)
  const [bookError, setBookError] = useState('')

  // My borrows
  const [myBorrows, setMyBorrows] = useState([])
  const [borrowsLoading, setBorrowsLoading] = useState(false)

  const inputRef = useRef(null)
  const inputModeRef = useRef('keyboard')
  const messagesEndRef = useRef(null)
  const chatContainerRef = useRef(null)

  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}') } catch { return {} }
  }, [])
  const isAdmin = user?.role === 'admin'

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load insights
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

  // Load books for panel
  const loadBooks = useCallback(async () => {
    setBooksLoading(true)
    setBookError('')
    try {
      const data = await fetchBooks()
      setBooks(Array.isArray(data) ? data : Array.isArray(data?.books) ? data.books : [])
    } catch (e) {
      setBookError(e?.response?.data?.message || 'Failed to load books')
    } finally {
      setBooksLoading(false)
    }
  }, [])

  // Load my borrows
  const loadBorrows = useCallback(async () => {
    setBorrowsLoading(true)
    try {
      const data = await fetchMyBorrowRequests()
      setMyBorrows(Array.isArray(data) ? data : [])
    } finally {
      setBorrowsLoading(false) }
  }, [])

  useEffect(() => {
    if (activePanel === 'books') loadBooks()
    if (activePanel === 'history') loadBorrows()
  }, [activePanel, loadBooks, loadBorrows])

  // ─── SEND MESSAGE ────────────────────────────────────────────────────────
  const handleSendMessage = async (overrideMessage) => {
    const content = String(overrideMessage ?? inputMessage).trim()
    if (!content || sending) return

    const userMsg = {
      id: Date.now(), type: 'user', isLoading: false,
      message: content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    const loadingId = Date.now() + 1
    const loadingMsg = { id: loadingId, type: 'bot', isLoading: true, message: '', timestamp: '' }

    setMessages(prev => [...prev, userMsg, loadingMsg])
    setInputMessage('')
    setSending(true)

    try {
      // Try local rule-based first
      const intent = detectIntent(content)
      const localReply = buildLocalReply(intent, content, insights)

      let reply = localReply
      let newInsights = null

      if (!localReply || intent === 'availability' || intent === 'unknown') {
        // Fall through to API for live data
        try {
          const data = await assistantChat(content)
          reply = data?.reply || localReply || 'Sorry, I could not generate a response.'
          if (data?.insights) newInsights = data.insights
        } catch {
          reply = localReply || 'Failed to contact the assistant. Please try again.'
        }
      }

      setMessages(prev => prev.map(m =>
        m.id === loadingId
          ? { ...m, isLoading: false, message: reply, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
          : m
      ))

      if (newInsights) setInsights(newInsights)
      else {
        const refreshed = await fetchAssistantInsights().catch(() => null)
        if (refreshed) setInsights(refreshed)
      }
    } catch (e) {
      setMessages(prev => prev.map(m =>
        m.id === loadingId
          ? { ...m, isLoading: false, message: e?.response?.data?.message || 'Error. Please try again.', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
          : m
      ))
    } finally {
      setSending(false)
    }
  }

  // ─── BOOK CRUD ──────────────────────────────────────────────────────────
  const handleSaveBook = async (form) => {
    setBookFormLoading(true)
    try {
      if (editBook) {
        await updateBook(editBook._id, form)
      } else {
        await createBook({ ...form, totalCopies: form.copies, status: form.copies > 0 ? 'available' : 'borrowed' })
      }
      setShowAddBook(false)
      setEditBook(null)
      loadBooks()
    } catch (e) {
      setBookError(e?.response?.data?.message || 'Failed to save book')
    } finally {
      setBookFormLoading(false)
    }
  }

  const handleDeleteBook = async () => {
    if (!deleteConfirm) return
    try {
      await deleteBook(deleteConfirm._id)
      setDeleteConfirm(null)
      loadBooks()
    } catch (e) {
      setBookError(e?.response?.data?.message || 'Failed to delete book')
    }
  }

  const handleBorrowBook = async (bookId) => {
    try {
      await createBorrowRequest(bookId)
      handleSendMessage(`I just submitted a borrow request!`)
    } catch (e) {
      setBookError(e?.response?.data?.message || 'Failed to borrow')
    }
  }

  const handleCancelBorrow = async (reqId) => {
    try {
      await cancelBorrowRequest(reqId)
      loadBorrows()
    } catch (e) {
      setBookError(e?.response?.data?.message || 'Failed to cancel')
    }
  }

  // ─── DERIVED STATE ──────────────────────────────────────────────────────
  const riskLevel = insights?.risk?.level || 'low'
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
    low: { color: 'text-emerald-600', bg: 'bg-emerald-50', ring: 'ring-emerald-300', badge: 'bg-emerald-100 text-emerald-700', icon: '🛡️', label: 'Low Risk' },
    medium: { color: 'text-amber-600', bg: 'bg-amber-50', ring: 'ring-amber-300', badge: 'bg-amber-100 text-amber-700', icon: '⚠️', label: 'Medium Risk' },
    high: { color: 'text-rose-600', bg: 'bg-rose-50', ring: 'ring-rose-300', badge: 'bg-rose-100 text-rose-700', icon: '🚨', label: 'High Risk' },
  }
  const rc = riskConfig[riskLevel] || riskConfig.low

  // ─── VOICE ──────────────────────────────────────────────────────────────
  const { supported: voiceSupported, listening: voiceListening, awake: voiceAwake, error: voiceError, statusText: voiceStatusText, lastHeard: voiceLastHeard, audioActive: voiceAudioActive, speechActive: voiceSpeechActive, toggle: toggleVoice } = useWakeWordSpeech({
    wakeWordRegex: /\b(hey|hi)[\s,]+(libby|liby|lippy)(\s+ai)?\b/i,
    requireWakeWord: true,
    onWake: () => { inputModeRef.current = 'voice'; try { inputRef.current?.focus() } catch {} },
    onCommandText: (text) => { if (inputModeRef.current !== 'voice') return; setInputMessage(text) },
    onCommandFinal: (text) => { if (inputModeRef.current !== 'voice') return; handleSendMessage(text); inputModeRef.current = 'keyboard' },
    commandIdleMs: 1200, awakeIdleMs: 6000,
  })

  const panels = [
    { id: 'overview', label: 'Overview', icon: SparklesIcon },
    { id: 'books', label: 'Books', icon: BookOpenIcon },
    { id: 'history', label: 'History', icon: ClockIcon },
  ]

  return (
    <div className="min-h-screen p-4 sm:p-6" style={{ background: 'linear-gradient(135deg, #f0fdfa 0%, #f9fafb 50%, #fff7ed 100%)' }}>
      <div className="max-w-7xl mx-auto">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal to-emerald-600 flex items-center justify-center shadow-lg shadow-teal/30">
                  <SparklesIcon size={20} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold text-dark leading-tight">AI Smart Assistant</h1>
                  <p className="text-sm text-medium">Powered by Libby · SmartLib Intelligence</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${rc.badge}`}>
                <span>{rc.icon}</span>
                <span>{rc.label}</span>
              </div>
              {insightsLoading && <RefreshCwIcon size={14} className="animate-spin text-teal" />}
            </div>
          </div>
        </motion.div>

        {/* ── Main Grid ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ─── Chat Section (3 cols) ─────────────────────────────── */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-3 flex flex-col">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100/80 overflow-hidden flex flex-col" style={{ height: '720px' }}>

              {/* Chat Header */}
              <div style={{ background: 'linear-gradient(135deg, #0d9488 0%, #059669 100%)' }} className="p-5">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                      <BotIcon size={22} className="text-white" />
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="font-extrabold text-white text-base">Libby AI</h2>
                      <span className="px-2 py-0.5 bg-white/20 rounded-full text-[10px] font-bold text-white/90 uppercase tracking-wide">Beta</span>
                    </div>
                    <p className="text-emerald-100 text-xs mt-0.5">
                      {!voiceSupported ? 'Voice unavailable'
                        : voiceError ? 'Voice error — try clicking mic'
                        : voiceListening ? (voiceAwake ? '🎙️ Listening for your command…' : '💤 Say "Hey Libby" to wake me')
                        : '🎤 Click mic to activate voice'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setMessages(INITIAL_MSG)} title="Clear chat"
                      className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors">
                      <RotateCcwIcon size={14} className="text-white" />
                    </button>
                    <button onClick={toggleVoice} disabled={!voiceSupported} title={voiceStatusText}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${voiceSupported ? 'bg-white/15 hover:bg-white/25' : 'opacity-40 cursor-not-allowed'} ${voiceListening ? 'ring-2 ring-white/70 bg-white/25' : ''}`}>
                      <MicIcon size={16} className={`text-white ${voiceListening ? 'animate-pulse' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
                  {QUICK_ACTIONS.map((a, i) => (
                    <motion.button key={i} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                      onClick={() => handleSendMessage(a.label)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border border-transparent ${a.bg}`}>
                      <a.icon size={12} className={a.color} />
                      <span className="text-dark/80">{a.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Messages */}
              <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-5 space-y-4" style={{ scrollBehavior: 'smooth' }}>
                {messages.map(msg => (
                  <MessageBubble key={msg.id} msg={msg} />
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-gray-100 bg-white">
                <div className="flex gap-2 items-center">
                  <div className="flex-1 relative">
                    <input ref={inputRef} type="text" value={inputMessage}
                      onChange={e => { inputModeRef.current = 'keyboard'; setInputMessage(e.target.value) }}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                      placeholder="Ask Libby anything…"
                      className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-teal/50 focus:border-teal focus:bg-white outline-none text-sm transition-all" />
                    {inputMessage && (
                      <button onClick={() => setInputMessage('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <XIcon size={14} />
                      </button>
                    )}
                  </div>
                  <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                    onClick={() => handleSendMessage()} disabled={sending || !inputMessage.trim()}
                    className="w-11 h-11 bg-coral text-white rounded-2xl flex items-center justify-center shadow-lg shadow-coral/30 disabled:opacity-50 transition-all">
                    {sending ? <RefreshCwIcon size={18} className="animate-spin" /> : <SendIcon size={18} />}
                  </motion.button>
                </div>
                <p className="text-[10px] text-medium mt-2 text-center">
                  Libby uses your library data to give accurate answers. Always verify critical info at the library counter.
                </p>
              </div>
            </div>
          </motion.div>

          {/* ─── Right Panel (2 cols) ──────────────────────────────── */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="lg:col-span-2 flex flex-col gap-4">

            {/* Panel Tabs */}
            <div className="bg-white rounded-2xl p-1.5 flex gap-1 shadow-sm border border-gray-100">
              {panels.map(p => (
                <button key={p.id} onClick={() => setActivePanel(p.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${activePanel === p.id ? 'bg-teal text-white shadow-md' : 'text-medium hover:text-dark hover:bg-gray-50'}`}>
                  <p.icon size={13} />
                  {p.label}
                </button>
              ))}
            </div>

            {/* ── OVERVIEW PANEL ─────────────────────────────────── */}
            {activePanel === 'overview' && (
              <div className="space-y-4">

                {/* Risk Card */}
                <div className={`bg-white rounded-3xl p-5 shadow-sm border border-gray-100 overflow-hidden relative`}>
                  <div className={`absolute inset-0 opacity-5 ${rc.bg}`} />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <AlertTriangleIcon size={18} className={rc.color} />
                        <h3 className="font-extrabold text-dark text-sm">Overdue Risk</h3>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${rc.badge}`}>{rc.icon} {rc.label}</span>
                    </div>

                    {/* Risk bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-medium mb-1.5">
                        <span>Risk Score</span>
                        <span className={`font-bold ${rc.color}`}>{insights?.risk?.score ?? 0}/100</span>
                      </div>
                      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${insights?.risk?.score ?? 0}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className={`h-full rounded-full ${riskLevel === 'low' ? 'bg-emerald-400' : riskLevel === 'medium' ? 'bg-amber-400' : 'bg-rose-400'}`} />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[
                        { label: 'Outstanding', value: formatLkr(insights?.risk?.currentOverdueFineLkr), icon: '💰' },
                        { label: 'Due Soon', value: insights?.risk?.dueSoonCount ?? 0, icon: '📅' },
                        { label: 'Past Late', value: insights?.risk?.pastLateReturns ?? 0, icon: '⏰' },
                      ].map(stat => (
                        <div key={stat.label} className="bg-gray-50 rounded-2xl p-2.5">
                          <p className="text-base mb-0.5">{stat.icon}</p>
                          <p className="font-extrabold text-dark text-xs">{stat.value}</p>
                          <p className="text-[10px] text-medium">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Smart Picks */}
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <SparklesIcon size={18} className="text-golden" />
                      <h3 className="font-extrabold text-dark text-sm">Smart Picks</h3>
                    </div>
                    <span className="text-xs text-medium bg-gray-100 px-2 py-0.5 rounded-full font-semibold">{recommendations.length} books</span>
                  </div>
                  <div className="space-y-2.5">
                    {(recommendations.length === 0 ? Array(3).fill(null) : recommendations).slice(0, 6).map((book, idx) => (
                      <motion.div key={book?._id || idx} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.06 }}
                        className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-gray-50 transition-colors group cursor-pointer"
                        onClick={() => book && handleSendMessage(`Tell me about "${book.title}"`)}>
                        <div className={`w-10 h-13 rounded-xl bg-gradient-to-br ${COVER_GRADIENTS[idx % COVER_GRADIENTS.length]} flex items-center justify-center flex-shrink-0 shadow-sm`}
                          style={{ height: '52px' }}>
                          {book ? <BookOpenIcon size={14} className="text-white/70" /> : <div className="w-6 h-6 bg-white/20 rounded-lg animate-pulse" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          {book ? (
                            <>
                              <p className="font-bold text-dark text-xs truncate">{book.title}</p>
                              <p className="text-[11px] text-medium truncate">{book.author}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${book.status === 'available' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                  📖 {book.status || 'available'}
                                </span>
                              </div>
                            </>
                          ) : (
                            <div className="space-y-1">
                              <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
                              <div className="h-2.5 bg-gray-200 rounded animate-pulse w-1/2" />
                            </div>
                          )}
                        </div>
                        {book && (
                          <div className="text-right">
                            <div className="flex items-center gap-0.5">
                              <StarIcon size={10} className="text-golden fill-golden" />
                              <span className="text-xs font-extrabold text-dark">{typeof book.rating === 'number' ? book.rating.toFixed(1) : '—'}</span>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Reading Analysis */}
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3Icon size={18} className="text-teal" />
                    <h3 className="font-extrabold text-dark text-sm">Reading Analysis</h3>
                  </div>
                  {categoryStats.length === 0 ? (
                    <p className="text-xs text-medium text-center py-4">No reading history yet. Start borrowing!</p>
                  ) : (
                    <div className="space-y-3">
                      {categoryStats.map((cat, idx) => (
                        <div key={cat.category} className="flex items-center gap-3">
                          <span className="text-xs font-semibold text-dark w-20 truncate">{cat.category}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${(cat.count / maxCategoryCount) * 100}%` }}
                              transition={{ duration: 0.8, delay: 0.2 + idx * 0.1 }}
                              className={`h-full ${CATEGORY_COLORS[idx % 5]} rounded-full`} />
                          </div>
                          <span className="text-xs font-bold text-medium w-5 text-right">{cat.count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Fine Records */}
                {fineRecords.length > 0 && (
                  <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-4">
                      <DollarSignIcon size={18} className="text-coral" />
                      <h3 className="font-extrabold text-dark text-sm">Fine Records</h3>
                    </div>
                    <div className="space-y-2">
                      {fineRecords.map((fine) => (
                        <div key={fine.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                          <div className="min-w-0">
                            <p className="font-semibold text-dark text-xs truncate">{fine.book}</p>
                            <p className="text-[10px] text-medium">{fine.date}</p>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            <p className="font-bold text-dark text-xs">{formatLkr(fine.amountLkr)}</p>
                            {fine.status === 'paid'
                              ? <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5 justify-end"><CheckCircleIcon size={10} /> Paid</span>
                              : <span className="text-[10px] text-coral font-semibold flex items-center gap-0.5 justify-end"><XCircleIcon size={10} /> Unpaid</span>}
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
                <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 relative">
                      <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-medium" />
                      <input value={bookSearch} onChange={e => setBookSearch(e.target.value)}
                        placeholder="Search books..." className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal" />
                    </div>
                    {isAdmin && (
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => setShowAddBook(true)}
                        className="px-3 py-2 bg-teal text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm">
                        <PlusIcon size={13} /> Add
                      </motion.button>
                    )}
                    <button onClick={loadBooks} className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                      <RefreshCwIcon size={13} className={`text-medium ${booksLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                  {bookError && (
                    <div className="flex items-center gap-2 p-2.5 bg-rose-50 rounded-xl mb-3 text-xs text-rose-600">
                      <XCircleIcon size={13} /> {bookError}
                    </div>
                  )}
                </div>

                <div className="space-y-2 max-h-[560px] overflow-y-auto pr-0.5">
                  {booksLoading ? (
                    Array(5).fill(null).map((_, i) => (
                      <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 animate-pulse">
                        <div className="flex gap-3">
                          <div className="w-10 h-14 bg-gray-200 rounded-xl" />
                          <div className="flex-1 space-y-2">
                            <div className="h-3 bg-gray-200 rounded w-3/4" />
                            <div className="h-2.5 bg-gray-200 rounded w-1/2" />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : filteredBooks.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
                      <BookOpenIcon size={32} className="text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-medium">{bookSearch ? 'No books match your search' : 'No books found'}</p>
                    </div>
                  ) : filteredBooks.map((book, idx) => (
                    <motion.div key={book._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="bg-white rounded-2xl p-3.5 border border-gray-100 hover:border-teal/30 hover:shadow-md transition-all">
                      <div className="flex gap-3">
                        <div className={`w-10 flex-shrink-0 rounded-xl bg-gradient-to-br ${COVER_GRADIENTS[idx % COVER_GRADIENTS.length]} flex items-center justify-center shadow-sm`}
                          style={{ height: '56px' }}>
                          <BookOpenIcon size={14} className="text-white/70" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <div className="min-w-0">
                              <p className="font-bold text-dark text-xs leading-tight truncate">{book.title}</p>
                              <p className="text-[11px] text-medium truncate">{book.author}</p>
                            </div>
                            <div className="flex items-center gap-0.5 flex-shrink-0">
                              <StarIcon size={9} className="text-golden fill-golden" />
                              <span className="text-[10px] font-bold text-dark">{typeof book.rating === 'number' ? book.rating.toFixed(1) : '—'}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full font-medium">{book.category}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${book.status === 'available' ? 'bg-emerald-100 text-emerald-700' : book.status === 'reserved' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                                {book.status || 'unknown'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              {!isAdmin && book.status === 'available' && (
                                <motion.button whileTap={{ scale: 0.94 }} onClick={() => handleBorrowBook(book._id)}
                                  className="px-2 py-1 bg-teal text-white rounded-lg text-[10px] font-bold hover:bg-teal/90 transition-colors">
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

            {/* ── HISTORY PANEL ─────────────────────────────────────── */}
            {activePanel === 'history' && (
              <div className="space-y-3">
                <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-extrabold text-dark text-sm">My Borrow History</h3>
                    <button onClick={loadBorrows} className="w-7 h-7 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                      <RefreshCwIcon size={12} className={`text-medium ${borrowsLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                  <p className="text-[11px] text-medium">Your borrowing activity</p>
                </div>

                <div className="space-y-2 max-h-[580px] overflow-y-auto">
                  {borrowsLoading ? (
                    Array(4).fill(null).map((_, i) => (
                      <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 animate-pulse">
                        <div className="h-3 bg-gray-200 rounded w-2/3 mb-2" />
                        <div className="h-2.5 bg-gray-200 rounded w-1/3" />
                      </div>
                    ))
                  ) : myBorrows.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
                      <ClockIcon size={32} className="text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-medium">No borrow history yet</p>
                      <p className="text-xs text-medium mt-1">Start by borrowing a book!</p>
                    </div>
                  ) : myBorrows.map((req, idx) => {
                    const statusConf = {
                      approved: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: '✅ Approved' },
                      pending: { bg: 'bg-amber-50', text: 'text-amber-700', label: '⏳ Pending' },
                      rejected: { bg: 'bg-rose-50', text: 'text-rose-600', label: '❌ Rejected' },
                      returned: { bg: 'bg-blue-50', text: 'text-blue-600', label: '📦 Returned' },
                    }[req.status] || { bg: 'bg-gray-50', text: 'text-gray-600', label: req.status }

                    return (
                      <motion.div key={req._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        className={`rounded-2xl p-3.5 border ${statusConf.bg} border-opacity-50 border-gray-100`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-bold text-dark text-xs truncate">{req.book?.title || 'Unknown Book'}</p>
                            <p className="text-[11px] text-medium">{req.book?.author || '—'}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-[10px] font-bold ${statusConf.text}`}>{statusConf.label}</span>
                              {req.dueAt && <span className="text-[10px] text-medium">Due: {new Date(req.dueAt).toLocaleDateString()}</span>}
                            </div>
                          </div>
                          {req.status === 'pending' && (
                            <button onClick={() => handleCancelBorrow(req._id)}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[10px] font-bold transition-colors flex-shrink-0">
                              Cancel
                            </button>
                          )}
                        </div>
                        {req.fineLkr > 0 && (
                          <div className="mt-2 pt-2 border-t border-white/50 flex items-center justify-between">
                            <span className="text-[10px] text-medium">Fine</span>
                            <span className={`text-[10px] font-bold ${req.finePaid ? 'text-emerald-600' : 'text-coral'}`}>
                              {formatLkr(req.fineLkr)} {req.finePaid ? '(Paid)' : '(Unpaid)'}
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

      {/* ── Modals ────────────────────────────────────────────────────── */}

      <Modal open={showAddBook} onClose={() => setShowAddBook(false)} title="Add New Book">
        <BookForm onSave={handleSaveBook} onCancel={() => setShowAddBook(false)} loading={bookFormLoading} />
      </Modal>

      <Modal open={!!editBook} onClose={() => setEditBook(null)} title="Edit Book">
        <BookForm initial={editBook} onSave={handleSaveBook} onCancel={() => setEditBook(null)} loading={bookFormLoading} />
      </Modal>

      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Book">
        <div className="text-center">
          <div className="w-14 h-14 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrashIcon size={24} className="text-rose-500" />
          </div>
          <p className="text-sm text-dark font-semibold mb-1">Delete "{deleteConfirm?.title}"?</p>
          <p className="text-xs text-medium mb-6">This action cannot be undone. All associated data will be removed.</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-medium hover:bg-gray-50 transition-colors">Cancel</button>
            <button onClick={handleDeleteBook} className="flex-1 px-4 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-bold hover:bg-rose-600 transition-colors">Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}