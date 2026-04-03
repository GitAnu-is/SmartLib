import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  SendIcon, BotIcon, UserIcon, SparklesIcon, AlertTriangleIcon,
  BookOpenIcon, TrendingUpIcon, ClockIcon, CheckCircleIcon, XCircleIcon,
  BarChart3Icon, ZapIcon, HelpCircleIcon, CalendarIcon, GraduationCapIcon,
  AlertCircleIcon, InfoIcon, RefreshCwIcon, WifiOffIcon, ShieldAlertIcon,
  MessageSquareIcon, ThumbsUpIcon, ThumbsDownIcon, CopyIcon, TrashIcon,
  ChevronDownIcon, StarIcon, ActivityIcon, TrendingDownIcon, ShieldCheckIcon,
  FlameIcon, CreditCardIcon, BookMarkedIcon, ArrowRightIcon, BadgeAlertIcon,
  CircleDollarSignIcon, PercentIcon, BarChart2Icon, XIcon,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
  Cell, PieChart, Pie, Legend,
} from 'recharts'
// import { assistantChat, fetchAssistantInsights } from '../api/assistant'

// ─── Dummy Data ───────────────────────────────────────────────────────────────
const DUMMY_INSIGHTS = {
  risk: {
    level: 'medium',
    score: 58,
    pastLateReturns: 3,
    dueSoonCount: 2,
    dueSoonMinDays: 4,
    currentOverdueFineLkr: 150,
  },
  categoryStats: [
    { category: 'Fiction',   count: 12 },
    { category: 'Science',   count: 8  },
    { category: 'History',   count: 5  },
    { category: 'Tech',      count: 9  },
    { category: 'Self-Help', count: 6  },
  ],
  fineRecords: [
    { id: 1, book: 'Atomic Habits',          date: '2025-12-10', amountLkr: 75,  status: 'paid'   },
    { id: 2, book: 'The Pragmatic Programmer',date: '2026-01-15', amountLkr: 150, status: 'unpaid' },
    { id: 3, book: 'Sapiens',                date: '2025-11-02', amountLkr: 50,  status: 'paid'   },
    { id: 4, book: 'Deep Work',              date: '2026-02-20', amountLkr: 200, status: 'unpaid' },
    { id: 5, book: 'Clean Code',             date: '2025-09-18', amountLkr: 100, status: 'paid'   },
  ],
  recommendations: [
    { id: 1, title: 'Atomic Habits',        author: 'James Clear',       rating: 4.8, genre: 'Self-Help', description: 'No matter your goals, Atomic Habits offers a proven framework for improving—every day.' },
    { id: 2, title: 'The Midnight Library', author: 'Matt Haig',         rating: 4.5, genre: 'Fiction',   description: 'Between life and death there is a library, and within that library, the shelves go on forever.' },
    { id: 3, title: 'Sapiens',              author: 'Yuval Noah Harari', rating: 4.7, genre: 'History',   description: 'A brief history of humankind, exploring how biology and history have defined us.' },
    { id: 4, title: 'Project Hail Mary',    author: 'Andy Weir',         rating: 4.9, genre: 'Sci-Fi',    description: 'A lone astronaut must save the earth from disaster in this incredible science fiction adventure.' },
    { id: 5, title: 'Deep Work',            author: 'Cal Newport',       rating: 4.6, genre: 'Self-Help', description: 'Rules for focused success in a distracted world.' },
  ],
}

// Stub API functions — replace with real imports when backend is ready
async function assistantChat(message) {
  await new Promise((r) => setTimeout(r, 1200))
  return {
    reply: `Thanks for your message! You asked: "${message}"\n\nI'm currently running in demo mode. Connect the backend to get live answers.`,
    actions: ['Check Availability', 'My Overdue Risk'],
    insights: null,
  }
}
async function fetchAssistantInsights() {
  await new Promise((r) => setTimeout(r, 600))
  return DUMMY_INSIGHTS
}

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_MESSAGE_LENGTH   = 200
const MIN_MESSAGE_LENGTH   = 2
const MAX_MESSAGES_PER_MIN = 10
const COOLDOWN_MS          = 800

const SUGGESTED_PROMPTS = [
  'Is "Atomic Habits" currently available?',
  'How many books can I borrow at once?',
  'When is my next book due?',
  'What are my unpaid fines?',
  'Recommend something like Harry Potter',
  'How do I access e-learning resources?',
]

// ─── Validation Engine ────────────────────────────────────────────────────────
function validateMessage(text, recentCount, lastSentAt) {
  const trimmed = text.trim()
  if (!trimmed)                              return { code: 'EMPTY',     msg: 'Please type a message before sending.' }
  if (trimmed.length < MIN_MESSAGE_LENGTH)   return { code: 'TOO_SHORT', msg: `Message must be at least ${MIN_MESSAGE_LENGTH} characters.` }
  if (trimmed.length > MAX_MESSAGE_LENGTH)   return { code: 'TOO_LONG',  msg: `Message too long — ${trimmed.length}/${MAX_MESSAGE_LENGTH} chars used.` }
  if (Date.now() - lastSentAt < COOLDOWN_MS) return { code: 'COOLDOWN',  msg: 'Sending too fast — please wait a moment.' }
  if (recentCount >= MAX_MESSAGES_PER_MIN)   return { code: 'RATE_LIMIT', msg: 'Rate limit reached. Please wait before sending more.' }
  if (/^\s+$/.test(text))                    return { code: 'WHITESPACE', msg: 'Message cannot be only whitespace.' }
  if (text === text.toUpperCase() && trimmed.length > 8)
                                             return { code: 'CAPS',      msg: 'Please avoid typing in ALL CAPS.' }
  if (/(.)\1{6,}/.test(trimmed))             return { code: 'REPEAT',    msg: 'Message contains too many repeated characters.' }
  if (/<[^>]*>/.test(trimmed))               return { code: 'HTML',      msg: 'HTML tags are not allowed in messages.' }
  if (/https?:\/\/\S+/.test(trimmed))        return { code: 'URL',       msg: 'URLs are not permitted in messages.' }
  return null
}

// ─── Toast hook ───────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([])
  const add = useCallback((msg, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random()
    setToasts((p) => [...p, { id, msg, type }])
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), duration)
  }, [])
  const remove = useCallback((id) => setToasts((p) => p.filter((t) => t.id !== id)), [])
  return { toasts, add, remove }
}

// ─── Toast UI ─────────────────────────────────────────────────────────────────
function ToastStack({ toasts, removeToast }) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => {
          const styles = {
            success: 'bg-teal-500 text-white',
            error:   'bg-red-500 text-white',
            warning: 'bg-amber-500 text-white',
            info:    'bg-gray-900 text-white',
          }
          const icons = { success: CheckCircleIcon, error: XCircleIcon, warning: AlertTriangleIcon, info: InfoIcon }
          const Icon = icons[t.type] || InfoIcon
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 80, scale: 0.88 }}
              animate={{ opacity: 1, x: 0,  scale: 1    }}
              exit={  { opacity: 0, x: 80, scale: 0.88  }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold min-w-[240px] max-w-xs ${styles[t.type] || styles.info}`}
            >
              <Icon size={15} className="flex-shrink-0" />
              <span className="flex-1 text-sm">{t.msg}</span>
              <button onClick={() => removeToast(t.id)} className="opacity-60 hover:opacity-100 transition-opacity">
                <XCircleIcon size={13} />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

// ─── ValidationBanner ────────────────────────────────────────────────────────
function ValidationBanner({ message, type = 'error', onDismiss }) {
  const map = {
    error:   { bg: 'bg-red-50 border-red-200 text-red-700',        Icon: XCircleIcon        },
    warning: { bg: 'bg-amber-50 border-amber-200 text-amber-700', Icon: AlertTriangleIcon  },
    info:    { bg: 'bg-blue-50 border-blue-200 text-blue-700',    Icon: InfoIcon           },
    success: { bg: 'bg-teal-50 border-teal-200 text-teal-700',    Icon: CheckCircleIcon    },
  }
  const { bg, Icon } = map[type] || map.info
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -4, height: 0 }}
          animate={{ opacity: 1, y: 0,  height: 'auto' }}
          exit={  { opacity: 0, y: -4, height: 0 }}
          transition={{ duration: 0.16 }}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold overflow-hidden ${bg}`}
        >
          <Icon size={13} className="flex-shrink-0" />
          <span className="flex-1">{message}</span>
          {onDismiss && (
            <button onClick={onDismiss} className="opacity-50 hover:opacity-100 transition-opacity ml-1">
              <XCircleIcon size={12} />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── CharMeter ───────────────────────────────────────────────────────────────
function CharMeter({ current, max }) {
  const pct  = Math.min(current / max, 1)
  const over = current > max
  const near = pct >= 0.8 && !over
  if (current === 0) return null
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-14 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${over ? 'bg-red-400' : near ? 'bg-amber-400' : 'bg-teal-500'}`}
          animate={{ width: `${Math.min(pct * 100, 100)}%` }}
          transition={{ duration: 0.12 }}
        />
      </div>
      <span className={`text-[11px] font-bold tabular-nums ${over ? 'text-red-500' : near ? 'text-amber-500' : 'text-gray-400'}`}>
        {over ? `-${current - max}` : max - current}
      </span>
    </div>
  )
}

// ─── Skeleton ────────────────────────────────────────────────────────────────
function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 rounded-2xl ${className}`} />
}

// ─── EmptyState ──────────────────────────────────────────────────────────────
function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center py-7 gap-2 text-center">
      <div className="w-11 h-11 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100">
        <Icon size={20} className="text-gray-400" />
      </div>
      <p className="text-sm font-bold text-gray-500">{title}</p>
      {subtitle && <p className="text-[11px] font-medium text-gray-400 max-w-[180px]">{subtitle}</p>}
    </div>
  )
}

// ─── MessageBubble ────────────────────────────────────────────────────────
function MessageBubble({ msg, onCopy, onFeedback, onActionClick }) {
  const [copied, setCopied] = useState(false)
  const [fb,     setFb    ] = useState(null)
  const isUser  = msg.type === 'user'
  const isError = msg.isError

  const handleCopy = () => {
    navigator.clipboard?.writeText(msg.message).catch(() => {})
    setCopied(true)
    onCopy?.()
    setTimeout(() => setCopied(false), 1600)
  }

  const formatText = (text) => {
    if (isUser || !text) return text
    return text.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {line.split(/(\*\*.*?\*\*)/g).map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j} className="font-extrabold text-gray-900">{part.slice(2, -2)}</strong>
          }
          return part
        })}
        {i !== text.split('\n').length - 1 && <br />}
      </React.Fragment>
    ))
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.96 }}
      animate={{ opacity: 1, y: 0,  scale: 1    }}
      transition={{ type: 'spring', stiffness: 290, damping: 26 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} group mb-2`}
    >
      <div className={`flex items-end gap-2 max-w-[84%] ${isUser ? 'flex-row-reverse' : ''}`}>
        <div className={`w-8 h-8 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm
          ${isUser ? 'bg-orange-500' : isError ? 'bg-red-400' : 'bg-teal-500'}`}>
          {isUser
            ? <UserIcon         size={14} className="text-white" />
            : isError
              ? <AlertCircleIcon size={14} className="text-white" />
              : <BotIcon         size={14} className="text-white" />}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className={`px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed
            ${isUser  ? 'bg-orange-500 text-white rounded-br-sm'
            : isError ? 'bg-red-50 border border-red-200 text-red-700 rounded-bl-sm'
            :           'bg-white border border-gray-100 text-gray-800 rounded-bl-sm'}`}
          >
            <div className="whitespace-pre-line break-words">{formatText(msg.message)}</div>

            {!isUser && msg.actions && msg.actions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100/60">
                {msg.actions.map((act, i) => (
                  <button
                    key={i}
                    onClick={() => onActionClick?.(act)}
                    className="text-[11px] font-bold bg-teal-50 text-teal-600 hover:bg-teal-500 hover:text-white px-3 py-1.5 rounded-lg transition-colors border border-teal-100 shadow-sm"
                  >
                    {act}
                  </button>
                ))}
              </div>
            )}

            <p className={`text-[10px] mt-1.5 ${isUser ? 'text-white/60 text-right' : 'text-gray-400 text-right'}`}>
              {msg.timestamp}
            </p>
          </div>

          {!isUser && !isError && (
            <div className="flex gap-1 pl-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-800 transition-colors"
                title="Copy"
              >
                {copied
                  ? <CheckCircleIcon size={12} className="text-teal-500" />
                  : <CopyIcon        size={12} />}
              </button>
              <button
                onClick={() => { setFb('up'); onFeedback?.('up', msg.id) }}
                className={`p-1.5 rounded-lg hover:bg-gray-100 transition-colors ${fb === 'up' ? 'text-teal-500' : 'text-gray-400'}`}
                title="Helpful"
              >
                <ThumbsUpIcon size={12} />
              </button>
              <button
                onClick={() => { setFb('down'); onFeedback?.('down', msg.id) }}
                className={`p-1.5 rounded-lg hover:bg-gray-100 transition-colors ${fb === 'down' ? 'text-orange-500' : 'text-gray-400'}`}
                title="Not helpful"
              >
                <ThumbsDownIcon size={12} />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ─── RiskProgressRing (SVG circle) ───────────────────────────────────────────
function RiskProgressRing({ score = 0, size = 88 }) {
  const r     = 36
  const circ  = 2 * Math.PI * r
  const pct   = Math.min(Math.max(score, 0), 100)
  const dash  = (pct / 100) * circ
  const color = pct < 35 ? '#0D9488' : pct < 65 ? '#F59E0B' : '#EF4444'
  return (
    <svg width={size} height={size} viewBox="0 0 80 80">
      <circle cx="40" cy="40" r={r} fill="none" stroke="#F3F4F6" strokeWidth="8" />
      <motion.circle
        cx="40" cy="40" r={r}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={`${circ}`}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - dash }}
        transition={{ duration: 1.1, ease: 'easeOut' }}
        transform="rotate(-90 40 40)"
      />
      <text x="40" y="44" textAnchor="middle" fontSize="14" fontWeight="900" fill={color}>{pct}</text>
    </svg>
  )
}

// ─── Insight Panel Header ─────────────────────────────────────────────────────
function PanelHeader({ icon: Icon, iconBg, iconColor, title, subtitle, badge, onRefresh }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center border ${iconColor}`}>
          <Icon size={18} />
        </div>
        <div>
          <h3 className="font-extrabold text-gray-900 text-base tracking-tight">{title}</h3>
          <p className="text-[11px] font-semibold text-gray-400">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {badge}
        {onRefresh && (
          <button onClick={onRefresh} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-teal-600 transition-colors">
            <RefreshCwIcon size={13} />
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Book Cover SVG ───────────────────────────────────────────────────────────
function BookCoverSVG({ title, author, genre, index, className = '' }) {
  const themes = [
    {
      bg1: '#0f4c75', bg2: '#1b262c', accent: '#e94560', pattern: 'waves',
      textColor: '#fff', accentText: '#ffd700',
    },
    {
      bg1: '#2d6a4f', bg2: '#1b4332', accent: '#95d5b2', pattern: 'circles',
      textColor: '#fff', accentText: '#b7e4c7',
    },
    {
      bg1: '#7b2d8b', bg2: '#4a0e6e', accent: '#f72585', pattern: 'diamonds',
      textColor: '#fff', accentText: '#ffd6ff',
    },
    {
      bg1: '#b5451b', bg2: '#7c2d12', accent: '#fbbf24', pattern: 'lines',
      textColor: '#fff', accentText: '#fef3c7',
    },
    {
      bg1: '#1e3a5f', bg2: '#0a1628', accent: '#38bdf8', pattern: 'dots',
      textColor: '#fff', accentText: '#bae6fd',
    },
  ]
  const t     = themes[index % themes.length]
  const short = title.length > 18 ? title.slice(0, 16) + '…' : title
  const auth  = author.length > 16 ? author.slice(0, 14) + '…' : author
  const W = 68, H = 96

  const renderPattern = () => {
    if (t.pattern === 'waves') return (
      <g opacity="0.18">
        {[0,12,24,36,48].map((y,i) => (
          <path key={i} d={`M0 ${y+8} Q${W/4} ${y} ${W/2} ${y+8} Q${W*3/4} ${y+16} ${W} ${y+8}`}
            fill="none" stroke={t.accent} strokeWidth="2" />
        ))}
      </g>
    )
    if (t.pattern === 'circles') return (
      <g opacity="0.15">
        {[[10,20],[55,15],[20,70],[58,75],[30,45]].map(([cx,cy],i) => (
          <circle key={i} cx={cx} cy={cy} r={10+i*4} fill="none" stroke={t.accent} strokeWidth="1.5" />
        ))}
      </g>
    )
    if (t.pattern === 'diamonds') return (
      <g opacity="0.15">
        {[[10,10],[50,20],[20,55],[55,65],[35,85]].map(([cx,cy],i) => (
          <rect key={i} x={cx-7} y={cy-7} width="14" height="14"
            fill={t.accent} transform={`rotate(45 ${cx} ${cy})`} opacity="0.6" />
        ))}
      </g>
    )
    if (t.pattern === 'lines') return (
      <g opacity="0.12">
        {[0,10,20,30,40,50,60,70,80,90].map((y,i) => (
          <line key={i} x1="0" y1={y} x2={W} y2={y+8} stroke={t.accent} strokeWidth="3" />
        ))}
      </g>
    )
    // dots
    return (
      <g opacity="0.18">
        {Array.from({length:5}).flatMap((_,row) =>
          Array.from({length:4}).map((_,col) => (
            <circle key={`${row}-${col}`} cx={8+col*17} cy={8+row*20} r="2.5" fill={t.accent} />
          ))
        )}
      </g>
    )
  }

  // Genre icon shape
  const renderIcon = () => {
    const g = (genre || '').toLowerCase()
    if (g.includes('sci') || g.includes('tech')) return (
      <g transform={`translate(${W/2-10}, 36)`} opacity="0.55">
        <circle cx="10" cy="10" r="7" fill="none" stroke={t.accent} strokeWidth="1.5"/>
        <line x1="10" y1="3" x2="10" y2="0"  stroke={t.accent} strokeWidth="1.5"/>
        <line x1="10" y1="17" x2="10" y2="20" stroke={t.accent} strokeWidth="1.5"/>
        <line x1="3"  y1="10" x2="0"  y2="10" stroke={t.accent} strokeWidth="1.5"/>
        <line x1="17" y1="10" x2="20" y2="10" stroke={t.accent} strokeWidth="1.5"/>
      </g>
    )
    if (g.includes('hist')) return (
      <g transform={`translate(${W/2-9}, 34)`} opacity="0.55">
        <rect x="0" y="2" width="18" height="14" rx="1" fill="none" stroke={t.accent} strokeWidth="1.5"/>
        <line x1="4" y1="7"  x2="14" y2="7"  stroke={t.accent} strokeWidth="1.2"/>
        <line x1="4" y1="10" x2="14" y2="10" stroke={t.accent} strokeWidth="1.2"/>
        <line x1="4" y1="13" x2="10" y2="13" stroke={t.accent} strokeWidth="1.2"/>
        <rect x="6" y="0" width="6" height="3" rx="0.5" fill={t.accent}/>
      </g>
    )
    if (g.includes('self') || g.includes('help')) return (
      <g transform={`translate(${W/2-9}, 34)`} opacity="0.55">
        <path d="M9 2 L11 7 L17 7 L12 11 L14 17 L9 13 L4 17 L6 11 L1 7 L7 7 Z"
          fill={t.accent} opacity="0.7"/>
      </g>
    )
    // fiction / default: open book
    return (
      <g transform={`translate(${W/2-11}, 34)`} opacity="0.55">
        <path d="M11 4 Q6 3 2 5 L2 17 Q6 15 11 16 Q16 15 20 17 L20 5 Q16 3 11 4 Z"
          fill="none" stroke={t.accent} strokeWidth="1.5"/>
        <line x1="11" y1="4"  x2="11" y2="16" stroke={t.accent} strokeWidth="1.2"/>
      </g>
    )
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} style={{ borderRadius: 8, display: 'block', flexShrink: 0, width: '100%', height: '100%' }}>
      <defs>
        <linearGradient id={`bg-${index}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={t.bg1}/>
          <stop offset="100%" stopColor={t.bg2}/>
        </linearGradient>
      </defs>

      {/* Background */}
      <rect width={W} height={H} fill={`url(#bg-${index})`} rx="7"/>

      {/* Spine shadow */}
      <rect x="0" y="0" width="5" height={H} fill="rgba(0,0,0,0.25)" rx="7"/>
      <rect x="5" y="0" width="1.5" height={H} fill="rgba(255,255,255,0.08)"/>

      {/* Pattern */}
      {renderPattern()}

      {/* Accent top bar */}
      <rect x="5" y="0" width={W-5} height="4" fill={t.accent} opacity="0.7" rx="0"/>

      {/* Genre icon */}
      {renderIcon()}

      {/* Title text — word-wrap manually into 2 lines */}
      {(() => {
        const words = short.split(' ')
        const mid   = Math.ceil(words.length / 2)
        const line1 = words.slice(0, mid).join(' ')
        const line2 = words.slice(mid).join(' ')
        return (
          <g>
            <text x={W/2} y={line2 ? H-22 : H-16} textAnchor="middle"
              fontSize="8" fontWeight="800" fill={t.textColor}
              style={{ fontFamily: 'system-ui, sans-serif' }}>
              {line1}
            </text>
            {line2 && (
              <text x={W/2} y={H-12} textAnchor="middle"
                fontSize="8" fontWeight="800" fill={t.textColor}
                style={{ fontFamily: 'system-ui, sans-serif' }}>
                {line2}
              </text>
            )}
          </g>
        )
      })()}

      {/* Author */}
      <text x={W/2} y={H-3} textAnchor="middle" fontSize="5.5" fill={t.accentText} opacity="0.85"
        style={{ fontFamily: 'system-ui, sans-serif' }}>
        {auth}
      </text>

      {/* Shine overlay */}
      <rect x="5" y="0" width={W-5} height={H} fill="url(#shine)" opacity="0.04" rx="0"/>
    </svg>
  )
}

// ─── Book Details Modal ───────────────────────────────────────────────────────
function BookDetailsModal({ book, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Header/Banner */}
        <div className="h-32 bg-gradient-to-br from-teal-500 to-emerald-400 relative">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/10 hover:bg-black/20 rounded-full text-white transition-colors">
            <XIcon size={18} />
          </button>
        </div>
        
        {/* Content */}
        <div className="px-6 pb-6 relative -mt-16 text-center">
          <div className="w-32 h-44 mx-auto shadow-xl rounded-xl overflow-hidden mb-4 border-4 border-white bg-white">
            <BookCoverSVG 
              title={book.title} 
              author={book.author} 
              genre={book.genre} 
              index={book.id || 0} 
              className="w-full h-full" 
            />
          </div>
          
          <h3 className="text-xl font-extrabold text-gray-900 leading-tight">{book.title}</h3>
          <p className="text-sm font-semibold text-gray-500 mt-1">{book.author}</p>

          <div className="flex items-center justify-center gap-3 mt-4">
            <span className="flex items-center gap-1 text-xs font-bold bg-yellow-50 text-yellow-700 px-2.5 py-1 rounded-lg border border-yellow-200">
              <StarIcon size={12} className="fill-yellow-500 text-yellow-500" /> {book.rating}
            </span>
            <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg border border-gray-200">
              {book.genre}
            </span>
          </div>

          <p className="text-sm text-gray-600 mt-5 leading-relaxed px-2">
            {book.description || `Dive into this highly recommended ${book.genre} book. Available now in the main library collection.`}
          </p>

          <div className="mt-6 flex gap-3">
            <button className="flex-1 bg-teal-500 hover:bg-teal-600 text-white py-3 rounded-xl font-bold transition-colors shadow-sm">
              Reserve Now
            </button>
            <button onClick={onClose} className="px-5 py-3 rounded-xl font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200">
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── For You Panel ────────────────────────────────────────────────────────────
function ForYouPanel({ recommendations, loading, onBookClick }) {
  return (
    <motion.div
      className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/80 relative overflow-hidden h-full"
    >
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/5 rounded-bl-full -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-20 h-20 bg-teal-400/5 rounded-tr-full -z-10 pointer-events-none" />

      <PanelHeader
        icon={StarIcon}
        iconBg="bg-gradient-to-br from-yellow-400/20 to-yellow-400/5"
        iconColor="border-yellow-400/10 text-yellow-500"
        title="For You"
        subtitle="Personalised Top Picks"
        badge={
          <span className="text-[10px] font-extrabold bg-yellow-50 text-yellow-600 border border-yellow-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Curated
          </span>
        }
      />

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-[88px] rounded-2xl" />)}
        </div>
      ) : recommendations.length === 0 ? (
        <EmptyState icon={BookOpenIcon} title="No recommendations yet" subtitle="Borrow books to unlock picks" />
      ) : (
        <div className="space-y-2.5">
          {recommendations.slice(0, 4).map((book, idx) => (
            <motion.div
              key={book._id || book.id || idx}
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.09, type: 'spring', stiffness: 260, damping: 24 }}
              whileHover={{ x: 5, scale: 1.015 }}
              onClick={() => onBookClick && onBookClick(book)}
              className="group flex items-center gap-3.5 p-3 bg-white border border-gray-100 hover:border-teal-300 hover:shadow-lg rounded-2xl transition-all cursor-pointer"
            >
              {/* Rich SVG cover */}
              <div className="flex-shrink-0 shadow-[0_4px_14px_rgba(0,0,0,0.18)] rounded-[8px] overflow-hidden w-[68px] h-[96px]">
                <BookCoverSVG
                  title={book.title}
                  author={book.author}
                  genre={book.genre}
                  index={idx}
                  className="w-full h-full"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-extrabold text-gray-900 text-sm leading-snug group-hover:text-teal-600 transition-colors line-clamp-2">
                  {book.title}
                </h4>
                <p className="text-[11px] text-gray-500 mt-0.5 truncate font-medium">{book.author}</p>

                {/* Stars */}
                <div className="flex items-center gap-1 mt-1.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <StarIcon
                      key={i}
                      size={10}
                      className={i < Math.round(book.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}
                    />
                  ))}
                  <span className="text-[10px] font-bold text-gray-500 ml-0.5">
                    {typeof book.rating === 'number' ? book.rating.toFixed(1) : '—'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <span className="text-[10px] font-extrabold text-teal-600 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                    Available
                  </span>
                  {book.genre && (
                    <span className="text-[10px] font-semibold text-gray-500 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded-md">
                      {book.genre}
                    </span>
                  )}
                </div>
              </div>

              {/* Arrow */}
              <ArrowRightIcon size={15} className="text-gray-200 group-hover:text-teal-400 transition-colors flex-shrink-0" />
            </motion.div>
          ))}

          {/* View more */}
          {recommendations.length > 4 && (
            <button className="w-full text-center text-xs font-bold text-teal-600 hover:text-teal-700 py-2 rounded-xl hover:bg-teal-50 transition-colors border border-transparent hover:border-teal-100 mt-2">
              +{recommendations.length - 4} more recommendations →
            </button>
          )}
        </div>
      )}
    </motion.div>
  )
}

// ─── Reading Analysis Panel (large, full half-width) ─────────────────────────
function ReadingAnalysisPanel({ categoryStats, loading }) {
  const COLORS = ['#0D9488', '#6366F1', '#F59E0B', '#EC4899', '#3B82F6', '#10B981']

  const totalBooks  = categoryStats.reduce((a, c) => a + (c.count || 0), 0)
  const topCategory = categoryStats.length > 0
    ? categoryStats.reduce((a, b) => (a.count > b.count ? a : b))
    : null
  const avgPerGenre = categoryStats.length > 0
    ? (totalBooks / categoryStats.length).toFixed(1)
    : 0

  // Monthly trend dummy data
  const monthlyTrend = [
    { month: 'Oct', books: 3 }, { month: 'Nov', books: 5 }, { month: 'Dec', books: 4 },
    { month: 'Jan', books: 8 }, { month: 'Feb', books: 6 }, { month: 'Mar', books: 9 },
  ]

  return (
    <div className="bg-white rounded-3xl p-7 shadow-[0_8px_40px_rgb(0,0,0,0.06)] border border-gray-100 relative overflow-hidden">
      {/* Decorative top gradient stripe */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 via-indigo-400 to-pink-400 rounded-t-3xl" />
      <div className="absolute top-0 right-0 w-48 h-48 bg-teal-400/5 rounded-bl-full -z-10 pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-teal-500/20 to-indigo-500/10 rounded-2xl flex items-center justify-center border border-teal-100 shadow-sm">
            <BarChart3Icon size={22} className="text-teal-600" />
          </div>
          <div>
            <h3 className="font-extrabold text-gray-900 text-lg tracking-tight">Reading Analysis</h3>
            <p className="text-xs font-semibold text-gray-400">Your genre breakdown & reading trends</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-teal-50 text-teal-700 border border-teal-100 px-3 py-1.5 rounded-xl">
            <TrendingUpIcon size={13} />
            <span className="text-xs font-extrabold">+23% this month</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3"><Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" /></div>
          <Skeleton className="h-52 rounded-2xl" />
        </div>
      ) : categoryStats.length === 0 ? (
        <EmptyState icon={BarChart3Icon} title="No history yet" subtitle="Read books to generate your chart" />
      ) : (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Total Books Read', value: totalBooks, sub: 'all time', color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100', icon: BookOpenIcon },
              { label: 'Genres Explored',  value: categoryStats.length, sub: 'categories', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', icon: SparklesIcon },
              { label: 'Avg per Genre',    value: avgPerGenre, sub: 'books', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', icon: TrendingUpIcon },
            ].map(({ label, value, sub, color, bg, border, icon: Ic }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className={`${bg} border ${border} rounded-2xl p-4`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-gray-500">{label}</p>
                  <Ic size={14} className={color} />
                </div>
                <p className={`text-3xl font-extrabold ${color} leading-none`}>{value}</p>
                <p className="text-[10px] text-gray-400 font-semibold mt-1 uppercase tracking-wide">{sub}</p>
              </motion.div>
            ))}
          </div>

          {/* Two-column: bar chart + category breakdown */}
          <div className="grid grid-cols-5 gap-5 mb-5">
            {/* Bar chart – 3 cols */}
            <div className="col-span-3">
              <p className="text-xs font-extrabold text-gray-600 mb-3 uppercase tracking-wider">Books by Genre</p>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryStats} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                    <XAxis dataKey="category" axisLine={false} tickLine={false}
                      tick={{ fontSize: 11, fill: '#9CA3AF', fontWeight: 700 }} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#D1D5DB' }} />
                    <RechartsTooltip
                      cursor={{ fill: 'rgba(13,148,136,0.06)', radius: 8 }}
                      contentStyle={{ borderRadius: 14, border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', fontSize: 12, fontWeight: 700 }}
                      formatter={(v) => [`${v} books`, '']}
                    />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={34}>
                      {categoryStats.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category % breakdown – 2 cols */}
            <div className="col-span-2">
              <p className="text-xs font-extrabold text-gray-600 mb-3 uppercase tracking-wider">Share</p>
              <div className="space-y-2.5">
                {categoryStats.map((c, i) => {
                  const pct = totalBooks > 0 ? Math.round((c.count / totalBooks) * 100) : 0
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                          <span className="text-xs font-bold text-gray-700">{c.category}</span>
                        </div>
                        <span className="text-xs font-extrabold" style={{ color: COLORS[i % COLORS.length] }}>{pct}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: COLORS[i % COLORS.length] }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, delay: i * 0.08, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Monthly trend sparkline */}
          <div className="border-t border-gray-100 pt-5">
            <p className="text-xs font-extrabold text-gray-600 mb-3 uppercase tracking-wider">6-Month Reading Trend</p>
            <div className="h-28">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrend} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                  <XAxis dataKey="month" axisLine={false} tickLine={false}
                    tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 700 }} dy={6} />
                  <RechartsTooltip
                    cursor={{ fill: 'rgba(13,148,136,0.06)', radius: 6 }}
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 6px 20px rgba(0,0,0,0.1)', fontSize: 11, fontWeight: 700 }}
                    formatter={(v) => [`${v} books`, '']}
                  />
                  <Bar dataKey="books" radius={[6, 6, 0, 0]} barSize={28} fill="#0D9488" opacity={0.75} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top genre callout */}
          {topCategory && (
            <div className="mt-4 flex items-center gap-3 bg-gradient-to-r from-teal-50 to-indigo-50 border border-teal-100 rounded-2xl px-5 py-3.5">
              <StarIcon size={18} className="text-teal-500 fill-teal-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-extrabold text-gray-800">
                  You love <span className="text-teal-600">{topCategory.category}</span>!
                </p>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  {topCategory.count} books read in your favourite genre.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Overdue Risk Panel (large, full half-width) ──────────────────────────────
function OverdueRiskPanel({ risk, loading }) {
  const level   = risk?.level    || 'low'
  const score   = risk?.score    || 0
  const lateRet = risk?.pastLateReturns      ?? 0
  const dueSoon = risk?.dueSoonCount         ?? 0
  const dueInMin= risk?.dueSoonMinDays       ?? null
  const fineLkr = risk?.currentOverdueFineLkr ?? 0

  const riskMeta = {
    high:   { color: 'text-red-600',   bg: 'bg-red-50',   border: 'border-red-200',   badge: 'bg-red-100 text-red-600 border-red-200',     bar: '#EF4444', icon: FlameIcon,        label: 'High Risk',   stripe: 'from-red-400 to-rose-500'    },
    medium: { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-600 border-amber-200', bar: '#F59E0B', icon: AlertTriangleIcon,label: 'Medium Risk', stripe: 'from-amber-400 to-orange-400' },
    low:    { color: 'text-teal-600',  bg: 'bg-teal-50',  border: 'border-teal-200',  badge: 'bg-teal-50 text-teal-700 border-teal-200',    bar: '#0D9488', icon: ShieldCheckIcon,  label: 'Low Risk',    stripe: 'from-teal-400 to-emerald-400' },
  }
  const meta = riskMeta[level] || riskMeta.low

  // Simulated history for sparkline
  const riskHistory = [
    { day: 'Mon', score: 45 }, { day: 'Tue', score: 50 }, { day: 'Wed', score: 55 },
    { day: 'Thu', score: 52 }, { day: 'Fri', score: 58 }, { day: 'Sat', score: 60 }, { day: 'Sun', score: score },
  ]

  const tips = {
    high:   ['Return all overdue books immediately.', 'Pay outstanding fines to restore access.', 'Contact the library if you need an extension.'],
    medium: ['2 books are due within the next 4 days.', 'Return on time to keep your score healthy.', 'Set a reminder to avoid late fees.'],
    low:    ['Great borrowing habits — keep it up!', 'You have no overdue items currently.', 'Your account is in excellent standing.'],
  }

  return (
    <div className="bg-white rounded-3xl p-7 shadow-[0_8px_40px_rgb(0,0,0,0.06)] border border-gray-100 relative overflow-hidden">
      {/* Top accent stripe */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${meta.stripe} rounded-t-3xl`} />
      <div className={`absolute top-0 right-0 w-52 h-52 ${meta.bg} opacity-30 rounded-bl-full -z-10 pointer-events-none`} />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 ${meta.bg} border ${meta.border} rounded-2xl flex items-center justify-center shadow-sm`}>
            <meta.icon size={22} className={meta.color} />
          </div>
          <div>
            <h3 className="font-extrabold text-gray-900 text-lg tracking-tight">Overdue Risk</h3>
            <p className="text-xs font-semibold text-gray-400">Account health &amp; borrowing status</p>
          </div>
        </div>
        <span className={`text-xs font-extrabold px-4 py-1.5 rounded-full uppercase tracking-wide border ${meta.badge}`}>
          {meta.label}
        </span>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 rounded-2xl" />
          <div className="grid grid-cols-2 gap-3"><Skeleton className="h-20" /><Skeleton className="h-20" /></div>
        </div>
      ) : (
        <>
          {/* Score ring + progress */}
          <div className="flex items-center gap-6 mb-6 p-5 rounded-2xl border border-gray-100 bg-gray-50/50">
            <RiskProgressRing score={score} size={100} />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-extrabold text-gray-700">Risk Score</p>
                <p className={`text-2xl font-extrabold ${meta.color}`}>{score}<span className="text-sm font-bold text-gray-400">/100</span></p>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-3">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: meta.bar }}
                  initial={{ width: 0 }}
                  animate={{ width: `${score}%` }}
                  transition={{ duration: 1.0, ease: 'easeOut' }}
                />
              </div>
              {/* Risk scale legend */}
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-teal-500">Safe (0–34)</span>
                <span className="text-amber-500">Medium (35–64)</span>
                <span className="text-red-500">High (65+)</span>
              </div>
            </div>
          </div>

          {/* 4-stat grid */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              { label: 'Late Returns',  value: lateRet,                          icon: ClockIcon,      accent: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', desc: 'past history' },
              { label: 'Due Soon',      value: dueSoon,                           icon: CalendarIcon,   accent: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-100',  desc: 'books pending' },
              { label: 'Days to Next',  value: dueInMin !== null ? `${dueInMin}d` : '—', icon: ZapIcon, accent: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100', desc: 'earliest due' },
              { label: 'Overdue Fine',  value: fineLkr > 0 ? `Rs ${fineLkr}` : 'None', icon: CircleDollarSignIcon, accent: fineLkr > 0 ? 'text-red-600' : 'text-teal-600', bg: fineLkr > 0 ? 'bg-red-50' : 'bg-teal-50', border: fineLkr > 0 ? 'border-red-100' : 'border-teal-100', desc: 'current fine' },
            ].map(({ label, value, icon: Ic, accent, bg, border, desc }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.07 }}
                className={`${bg} border ${border} rounded-2xl p-4`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">{label}</p>
                    <p className={`text-2xl font-extrabold ${accent} mt-1 leading-none`}>{value}</p>
                    <p className="text-[10px] text-gray-400 font-medium mt-1">{desc}</p>
                  </div>
                  <div className={`w-8 h-8 ${bg} rounded-xl flex items-center justify-center border ${border}`}>
                    <Ic size={15} className={accent} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Risk score sparkline */}
          <div className="border-t border-gray-100 pt-5 mb-5">
            <p className="text-xs font-extrabold text-gray-600 mb-3 uppercase tracking-wider">7-Day Score Trend</p>
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskHistory} margin={{ top: 2, right: 4, left: -22, bottom: 0 }}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false}
                    tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 700 }} dy={6} />
                  <RechartsTooltip
                    cursor={{ fill: 'rgba(0,0,0,0.04)', radius: 6 }}
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 6px 20px rgba(0,0,0,0.1)', fontSize: 11, fontWeight: 700 }}
                    formatter={(v) => [`${v}`, 'Risk Score']}
                  />
                  <Bar dataKey="score" radius={[5, 5, 0, 0]} barSize={22}>
                    {riskHistory.map((entry, i) => (
                      <Cell key={i} fill={entry.score < 35 ? '#0D9488' : entry.score < 65 ? '#F59E0B' : '#EF4444'} opacity={i === riskHistory.length - 1 ? 1 : 0.55} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pay fine CTA */}
          {fineLkr > 0 && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="mt-3 flex items-center gap-4 bg-red-50 border border-red-200 rounded-2xl px-5 py-4"
            >
              <CircleDollarSignIcon size={20} className="text-red-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-extrabold text-red-700">Outstanding Fine: Rs {Number(fineLkr).toFixed(2)}</p>
                <p className="text-xs text-red-400 font-medium mt-0.5">Accruing daily until books are returned</p>
              </div>
              <button className="bg-red-500 hover:bg-red-600 text-white text-xs font-extrabold px-5 py-2.5 rounded-xl transition-colors shadow-sm whitespace-nowrap">
                Pay Now
              </button>
            </motion.div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function AIAssistantPage({ onNavigate: _onNavigate }) {
  const [messages, setMessages] = useState([{
    id: 1, type: 'bot',
    message: "Hi there! I'm Libby 👋 Your intelligent library assistant. \n\nAsk me about book availability, borrowing rules, reservations, e‑learning, or your overdue risk.",
    actions: ['Check Availability', 'Borrowing Rules', 'My Overdue Risk'],
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }])
  const [inputMessage,     setInputMessage    ] = useState('')
  const [inputError,       setInputError      ] = useState(null)
  const [inputWarning,     setInputWarning    ] = useState(null)
  const [sending,          setSending         ] = useState(false)
  const [insightsLoading,  setInsightsLoading ] = useState(false)
  const [insightsError,    setInsightsError   ] = useState(null)
  const [sendTimestamps,   setSendTimestamps  ] = useState([])
  const [showSuggestions,  setShowSuggestions ] = useState(false)
  const [sessionStats,     setSessionStats    ] = useState({ sent: 0 })
  const [connectionStatus, setConnectionStatus] = useState('online')
  const [clearConfirm,     setClearConfirm    ] = useState(false)
  const [selectedBook,     setSelectedBook    ] = useState(null) // New State for Modal
  const [insights, setInsights] = useState({
    risk:            { level: 'low', score: 0, pastLateReturns: 0, dueSoonCount: 0, dueSoonMinDays: null, currentOverdueFineLkr: 0 },
    categoryStats:   [],
    fineRecords:     [],
    recommendations: [],
  })

  const lastSentAtRef  = useRef(0)
  const messagesEndRef = useRef(null)
  const inputRef       = useRef(null)
  const { toasts, add: addToast, remove: removeToast } = useToast()

  // Network listener
  useEffect(() => {
    const up   = () => { setConnectionStatus('online');  addToast('Connection restored', 'success') }
    const down = () => { setConnectionStatus('offline'); addToast('You are offline', 'error') }
    window.addEventListener('online',  up)
    window.addEventListener('offline', down)
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down) }
  }, [addToast])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  // Load insights
  const loadInsights = useCallback(async () => {
    setInsightsLoading(true)
    setInsightsError(null)
    try {
      const data = await fetchAssistantInsights()
      if (data) setInsights(data)
      else setInsightsError('Could not load insights. Please refresh.')
    } catch {
      setInsightsError('Failed to load insights — check your connection.')
    } finally {
      setInsightsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadInsights()
  }, [loadInsights])

  // Derived
  const recentSendCount = useMemo(() => {
    const ago = Date.now() - 60_000
    return sendTimestamps.filter((t) => t > ago).length
  }, [sendTimestamps])

  const categoryStats   = Array.isArray(insights?.categoryStats)   ? insights.categoryStats   : []
  const recommendations = Array.isArray(insights?.recommendations) ? insights.recommendations : []

  const isOverLength  = inputMessage.length > MAX_MESSAGE_LENGTH
  const isNearLimit   = inputMessage.length >= MAX_MESSAGE_LENGTH * 0.8 && !isOverLength
  const isRateLimited = recentSendCount >= MAX_MESSAGES_PER_MIN
  const sendDisabled  = sending || isOverLength || isRateLimited || connectionStatus === 'offline'
  const remainingMsgs = MAX_MESSAGES_PER_MIN - recentSendCount

  // Input change with extended validation
  const handleInputChange = (e) => {
    const val = e.target.value
    setInputMessage(val)

    if (val.length > MAX_MESSAGE_LENGTH) {
      setInputError(`Over limit by ${val.length - MAX_MESSAGE_LENGTH} char${val.length - MAX_MESSAGE_LENGTH > 1 ? 's' : ''}.`)
      setInputWarning(null)
    } else if (/<[^>]*>/.test(val)) {
      setInputError('HTML tags are not allowed in messages.')
      setInputWarning(null)
    } else if (/https?:\/\/\S+/.test(val)) {
      setInputError('URLs are not permitted in messages.')
      setInputWarning(null)
    } else if (/(.)\1{6,}/.test(val.trim())) {
      setInputWarning('Message contains too many repeated characters.')
      setInputError(null)
    } else if (val.length >= MAX_MESSAGE_LENGTH * 0.8) {
      setInputError(null)
      setInputWarning(`${MAX_MESSAGE_LENGTH - val.length} characters remaining.`)
    } else if (val === val.toUpperCase() && val.trim().length > 8) {
      setInputWarning('Please avoid typing in ALL CAPS.')
      setInputError(null)
    } else {
      if (inputError && val.trim().length >= MIN_MESSAGE_LENGTH) setInputError(null)
      setInputWarning(null)
    }
    if (showSuggestions && val.length > 0) setShowSuggestions(false)
  }

  // Send
  const handleSendMessage = async (overrideMessage) => {
    const content = String(overrideMessage ?? inputMessage).trim()
    const err = validateMessage(content, recentSendCount, lastSentAtRef.current)
    if (err) { setInputError(err.msg); return }

    setInputError(null)
    setInputWarning(null)
    setShowSuggestions(false)
    lastSentAtRef.current = Date.now()
    setSendTimestamps((p) => [...p.filter((t) => t > Date.now() - 60_000), Date.now()])
    setSessionStats((p) => ({ sent: p.sent + 1 }))
    setMessages((p) => [...p, {
      id: Date.now(), type: 'user', message: content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }])
    setInputMessage('')
    setSending(true)
    inputRef.current?.focus()

    try {
      const data = await assistantChat(content)
      setMessages((p) => [...p, {
        id: Date.now() + 1, type: 'bot',
        message: data?.reply || 'Sorry — I could not generate a response.',
        actions: data?.actions || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }])
      if (data?.insights) setInsights(data.insights)
      else { const r = await fetchAssistantInsights(); if (r) setInsights(r) }
    } catch (e) {
      const msg = e?.response?.data?.message || 'Failed to contact assistant. Please try again.'
      setMessages((p) => [...p, {
        id: Date.now() + 2, type: 'bot', message: msg, isError: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }])
      addToast('Failed to reach Libby. Try again.', 'error')
    } finally {
      setSending(false)
    }
  }

  // Clear chat
  const handleClearChat = () => {
    if (!clearConfirm) { setClearConfirm(true); setTimeout(() => setClearConfirm(false), 3000); return }
    setMessages([{
      id: Date.now(), type: 'bot',
      message: "Chat cleared! How can I help you?",
      actions: ['Check Availability', 'Borrowing Rules'],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }])
    setSessionStats({ sent: 0 })
    setClearConfirm(false)
    addToast('Chat cleared', 'info')
  }

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } }
  const itemVariants      = { hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 24 } } }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8">
      <ToastStack toasts={toasts} removeToast={removeToast} />

      {/* Render the modal overlay if a book is selected */}
      <AnimatePresence>
        {selectedBook && (
          <BookDetailsModal 
            book={selectedBook} 
            onClose={() => setSelectedBook(null)} 
          />
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          className="mb-6 flex items-start justify-between gap-4 flex-wrap"
        >
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-1 flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-400/10 rounded-2xl flex items-center justify-center shadow-sm">
                <SparklesIcon className="text-yellow-500" size={22} />
              </div>
              AI Smart Assistant
            </h1>
            <p className="text-gray-500 text-sm">Your intelligent library companion powered by AI.</p>
          </div>

          {/* Status pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border
              ${connectionStatus === 'online'
                ? 'bg-teal-50 text-teal-600 border-teal-200'
                : 'bg-red-50 text-red-500 border-red-200'}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${connectionStatus === 'online' ? 'bg-teal-500 animate-pulse' : 'bg-red-400'}`} />
              {connectionStatus === 'online' ? 'Online' : 'Offline'}
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-bold text-gray-500 shadow-sm">
              <MessageSquareIcon size={11} />
              {sessionStats.sent} sent
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold
              ${isRateLimited
                ? 'bg-red-50 text-red-500 border-red-200'
                : remainingMsgs <= 3
                  ? 'bg-amber-50 text-amber-600 border-amber-200'
                  : 'bg-white text-gray-500 border-gray-200 shadow-sm'}`}
            >
              <ActivityIcon size={11} />
              {isRateLimited ? 'Rate limited' : `${remainingMsgs} left/min`}
            </div>
          </div>
        </motion.div>

        {/* Global banners */}
        <div className="space-y-2 mb-4">
          <AnimatePresence>
            {connectionStatus === 'offline' && (
              <motion.div key="offline"
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm font-semibold"
              >
                <WifiOffIcon size={16} className="flex-shrink-0" />
                You're offline. Messages cannot be sent until your connection is restored.
              </motion.div>
            )}
            {insightsError && (
              <motion.div key="insights-err"
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-700 text-sm font-semibold"
              >
                <AlertTriangleIcon size={16} className="flex-shrink-0" />
                <span className="flex-1">{insightsError}</span>
                <button onClick={loadInsights} className="flex items-center gap-1 text-xs underline hover:no-underline">
                  <RefreshCwIcon size={12} /> Retry
                </button>
              </motion.div>
            )}
            {isRateLimited && (
              <motion.div key="rate-limit"
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm font-semibold"
              >
                <ShieldAlertIcon size={16} className="flex-shrink-0" />
                Rate limit reached — {MAX_MESSAGES_PER_MIN} messages per minute max. Please wait before continuing.
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ══ ROW 1: Chat + For You ══ */}
        <motion.div
          variants={containerVariants} initial="hidden" animate="show"
          className="grid grid-cols-1 xl:grid-cols-5 gap-6 mb-6"
        >
          {/* Chat panel – 3 cols */}
          <motion.div variants={itemVariants} className="xl:col-span-3">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col" style={{ height: 720 }}>

              {/* Chat header – gradient with mesh */}
              <div className="relative bg-gradient-to-br from-teal-600 via-teal-500 to-emerald-400 p-5 flex-shrink-0 overflow-hidden">
                <div className="absolute inset-0 opacity-10"
                  style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
                <div className="relative flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-lg">
                      <BotIcon size={22} className="text-white" />
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${sending ? 'bg-amber-300 animate-pulse' : 'bg-green-400'}`} />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-white text-lg leading-tight tracking-tight">Libby AI</h2>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${sending ? 'bg-amber-300 animate-pulse' : 'bg-green-300'}`} />
                      <p className="text-white/80 text-xs font-medium">{sending ? 'Thinking…' : 'Always here to help'}</p>
                    </div>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-xl border border-white/20">
                      <ActivityIcon size={11} className="text-white/70" />
                      <span className={`text-xs font-bold ${isRateLimited ? 'text-red-300' : remainingMsgs <= 3 ? 'text-amber-300' : 'text-white/80'}`}>
                        {remainingMsgs}/{MAX_MESSAGES_PER_MIN}
                      </span>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={handleClearChat}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border
                        ${clearConfirm ? 'bg-red-500 border-red-400 text-white' : 'bg-white/15 border-white/20 text-white/90 hover:bg-white/25'}`}
                    >
                      <TrashIcon size={12} />
                      {clearConfirm ? 'Confirm?' : 'Clear'}
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Quick action chips */}
              <div className="px-4 pt-3 pb-3 border-b border-gray-100 bg-gradient-to-b from-gray-50/80 to-white flex-shrink-0">
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { icon: BookOpenIcon,      label: 'Availability', color: 'text-orange-500', bg: 'hover:bg-orange-50 hover:border-orange-300', prompt: 'Check availability' },
                    { icon: HelpCircleIcon,    label: 'Rules',        color: 'text-teal-600',   bg: 'hover:bg-teal-50 hover:border-teal-300',   prompt: 'Borrowing rules'    },
                    { icon: CalendarIcon,      label: 'Reserve',      color: 'text-violet-500', bg: 'hover:bg-violet-50 hover:border-violet-300',prompt: 'Reserve a book'     },
                    { icon: GraduationCapIcon, label: 'E-learning',   color: 'text-blue-600',   bg: 'hover:bg-blue-50 hover:border-blue-300',   prompt: 'E-learning help'    },
                  ].map((a, i) => (
                    <motion.button
                      key={i}
                      whileHover={{ scale: sendDisabled ? 1 : 1.04, y: sendDisabled ? 0 : -1 }}
                      whileTap={{ scale: sendDisabled ? 1 : 0.96 }}
                      onClick={() => !sendDisabled && handleSendMessage(a.prompt)}
                      disabled={sendDisabled}
                      className={`flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full text-xs font-bold border border-gray-200 shadow-sm transition-all
                        ${sendDisabled ? 'opacity-40 cursor-not-allowed' : `cursor-pointer ${a.bg}`}`}
                    >
                      <a.icon size={12} className={a.color} />
                      <span className="text-gray-700">{a.label}</span>
                    </motion.button>
                  ))}
                  <button
                    onClick={() => setShowSuggestions((p) => !p)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-white rounded-full text-xs font-bold border border-gray-200 hover:border-gray-300 shadow-sm transition-all text-gray-500"
                  >
                    <ChevronDownIcon size={12} className={`transition-transform duration-200 ${showSuggestions ? 'rotate-180' : ''}`} />
                    More
                  </button>
                </div>
                <AnimatePresence>
                  {showSuggestions && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-2.5 flex flex-wrap gap-1.5">
                        {SUGGESTED_PROMPTS.map((p, i) => (
                          <button key={i}
                            onClick={() => { handleSendMessage(p); setShowSuggestions(false) }}
                            disabled={sendDisabled}
                            className="px-3 py-1.5 bg-teal-50 border border-teal-100 rounded-full text-xs font-semibold text-teal-700 hover:bg-teal-100 transition-colors disabled:opacity-40"
                          >{p}</button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3"
                style={{ backgroundImage: 'radial-gradient(circle, #f0fdfa 1px, transparent 1px)', backgroundSize: '24px 24px', backgroundPosition: '0 0' }}>
                {messages.map((msg) => (
                  <MessageBubble
                    key={msg.id} msg={msg}
                    onActionClick={handleSendMessage}
                    onCopy={() => addToast('Copied to clipboard', 'success', 1500)}
                    onFeedback={(dir) => addToast(dir === 'up' ? 'Thanks for the feedback!' : "We'll work to improve.", 'info', 2000)}
                  />
                ))}
                {sending && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                    <div className="flex items-end gap-2">
                      <div className="w-8 h-8 rounded-2xl bg-teal-500 flex items-center justify-center shadow-sm flex-shrink-0">
                        <BotIcon size={14} className="text-white" />
                      </div>
                      <div className="px-4 py-3 rounded-2xl bg-white border border-gray-100 shadow-sm rounded-bl-sm">
                        <div className="flex gap-1.5 items-center h-4 px-1">
                          {[0, 150, 300].map((d) => (
                            <div key={d} className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              <div className="flex-shrink-0 p-4 border-t border-gray-100 bg-white space-y-2">
                <ValidationBanner message={inputError}   type="error"   onDismiss={() => setInputError(null)} />
                <ValidationBanner message={inputWarning} type="warning" onDismiss={() => setInputWarning(null)} />
                <div className="flex gap-2 items-end">
                  <div className="flex-1 relative">
                    <textarea
                      ref={inputRef} rows={1} value={inputMessage}
                      onChange={handleInputChange}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (!sendDisabled) handleSendMessage() } }}
                      placeholder="Ask Libby anything about the library…"
                      className={`w-full px-4 py-3 pr-24 bg-gray-50/80 border rounded-2xl text-sm resize-none focus:ring-2 focus:border-transparent outline-none transition-all leading-relaxed
                        ${isOverLength ? 'border-red-300 focus:ring-red-200/40' : inputError ? 'border-red-300 focus:ring-red-200/40' : isNearLimit ? 'border-amber-300 focus:ring-amber-200/40' : 'border-gray-200 focus:ring-teal-400/30'}`}
                      style={{ minHeight: 48, maxHeight: 120 }}
                    />
                    <div className="absolute right-3 bottom-3.5">
                      <CharMeter current={inputMessage.length} max={MAX_MESSAGE_LENGTH} />
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: sendDisabled ? 1 : 1.08 }} whileTap={{ scale: sendDisabled ? 1 : 0.92 }}
                    onClick={() => handleSendMessage()} disabled={sendDisabled}
                    className={`w-11 h-11 flex items-center justify-center rounded-2xl font-bold shadow-lg transition-all flex-shrink-0 self-end
                      ${sendDisabled ? 'bg-gray-200 shadow-none cursor-not-allowed text-gray-400' : 'bg-gradient-to-br from-orange-500 to-orange-600 shadow-orange-400/30 text-white cursor-pointer'}`}
                  >
                    <SendIcon size={16} />
                  </motion.button>
                </div>
                <div className="flex items-center justify-between px-0.5">
                  <span className="text-[10px] text-gray-400 select-none">
                    <kbd className="px-1.5 py-0.5 bg-gray-100 rounded-md font-mono text-[9px]">Enter</kbd> send ·{' '}
                    <kbd className="px-1.5 py-0.5 bg-gray-100 rounded-md font-mono text-[9px]">Shift+Enter</kbd> newline
                  </span>
                  <span className={`text-[10px] font-bold tabular-nums ${isRateLimited ? 'text-red-400' : remainingMsgs <= 3 ? 'text-amber-400' : 'text-gray-300'}`}>
                    {remainingMsgs}/{MAX_MESSAGES_PER_MIN} /min
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* For You panel – 2 cols */}
          <motion.div variants={itemVariants} className="xl:col-span-2">
            <ForYouPanel 
              recommendations={recommendations} 
              loading={insightsLoading} 
              onBookClick={(book) => setSelectedBook(book)} 
            />
          </motion.div>
        </motion.div>

        {/* ══ ROW 2: Reading Analysis + Overdue Risk (full-width, side-by-side) ══ */}
        <motion.div
          variants={containerVariants} initial="hidden" animate="show"
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <motion.div variants={itemVariants}>
            <ReadingAnalysisPanel categoryStats={categoryStats} loading={insightsLoading} />
          </motion.div>
          <motion.div variants={itemVariants}>
            <OverdueRiskPanel risk={insights?.risk} loading={insightsLoading} />
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}