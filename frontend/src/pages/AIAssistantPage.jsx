import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  SendIcon,
  BotIcon,
  UserIcon,
  SparklesIcon,
  AlertTriangleIcon,
  BookOpenIcon,
  TrendingUpIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  BarChart3Icon,
  ZapIcon,
  HelpCircleIcon,
  CalendarIcon,
  GraduationCapIcon,
} from 'lucide-react'
import { assistantChat, fetchAssistantInsights } from '../api/assistant'

const initialChatHistory = [
  {
    id: 1,
    type: 'bot',
    message:
      "Hi there! I'm Libby, your library assistant. Ask me about book availability, borrowing rules, reservations, inquiries, e‑learning, or your overdue risk.",
    timestamp: new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
  },
]
const quickActions = [
  {
    icon: BookOpenIcon,
    label: 'Check availability',
    color: 'text-coral',
  },
  {
    icon: HelpCircleIcon,
    label: 'Borrowing rules',
    color: 'text-teal',
  },
  {
    icon: CalendarIcon,
    label: 'Reserve a book',
    color: 'text-golden',
  },
  {
    icon: GraduationCapIcon,
    label: 'E-learning help',
    color: 'text-dark',
  },
]
export function AIAssistantPage({ onNavigate: _onNavigate }) {
  const [messages, setMessages] = useState(initialChatHistory)
  const [inputMessage, setInputMessage] = useState('')

  const [sending, setSending] = useState(false)
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [insights, setInsights] = useState({
    risk: {
      level: 'low',
      score: 0,
      pastLateReturns: 0,
      dueSoonCount: 0,
      dueSoonMinDays: null,
      currentOverdueFineLkr: 0,
    },
    categoryStats: [],
    fineRecords: [],
    recommendations: [],
  })
  const containerVariants = {
    hidden: {
      opacity: 0,
    },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }
  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 20,
    },
    show: {
      opacity: 1,
      y: 0,
    },
  }
  const handleSendMessage = async (overrideMessage) => {
    const content = String(overrideMessage ?? inputMessage).trim()
    if (!content || sending) return

    const newMessage = {
      id: Date.now(),
      type: 'user',
      message: content,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }

    setMessages((prev) => [...prev, newMessage])
    setInputMessage('')
    setSending(true)

    try {
      const data = await assistantChat(content)
      const botResponse = {
        id: Date.now() + 1,
        type: 'bot',
        message: data?.reply || 'Sorry — I could not generate a response.',
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      }
      setMessages((prev) => [...prev, botResponse])
      if (data?.insights) {
        setInsights(data.insights)
      } else {
        const refreshed = await fetchAssistantInsights()
        if (refreshed) setInsights(refreshed)
      }
    } catch (e) {
      const errMsg =
        e?.response?.data?.message ||
        'Failed to contact assistant. Please try again.'
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          type: 'bot',
          message: errMsg,
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
      ])
    } finally {
      setSending(false)
    }
  }
  const getRiskColor = (level) => {
    switch (level) {
      case 'low':
        return 'bg-teal text-teal'
      case 'medium':
        return 'bg-golden text-yellow-700'
      case 'high':
        return 'bg-coral text-coral'
      default:
        return 'bg-medium text-medium'
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    const run = async () => {
      setInsightsLoading(true)
      try {
        const data = await fetchAssistantInsights()
        if (data) setInsights(data)
      } finally {
        setInsightsLoading(false)
      }
    }
    run()
  }, [])

  const riskLevel = insights?.risk?.level || 'low'
  const categoryStats = Array.isArray(insights?.categoryStats)
    ? insights.categoryStats
    : []
  const fineRecords = Array.isArray(insights?.fineRecords)
    ? insights.fineRecords
    : []
  const recommendations = Array.isArray(insights?.recommendations)
    ? insights.recommendations
    : []

  const maxCategoryCount = useMemo(() => {
    if (categoryStats.length === 0) return 1
    return Math.max(...categoryStats.map((c) => c.count || 0), 1)
  }, [categoryStats])

  const formatLkr = (amount) => `Rs ${(Number(amount) || 0).toFixed(2)}`
  return (
    <div className="min-h-screen bg-light p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{
            opacity: 0,
            y: -20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="mb-8"
        >
          <h1 className="text-3xl font-extrabold text-dark mb-2 flex items-center gap-3">
            <SparklesIcon className="text-golden" size={32} />
            AI Smart Assistant
          </h1>
          <p className="text-medium">
            Your intelligent library companion powered by AI.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-5 gap-8"
        >
          {/* Chat Section - Left Side (3 cols) */}
          <motion.div variants={itemVariants} className="lg:col-span-3">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[700px]">
              {/* Chat Header */}
              <div className="bg-teal p-6 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    <BotIcon size={24} />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-lg">Libby AI</h2>
                    <p className="text-teal-100 text-sm">Always here to help</p>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    <span className="text-sm text-teal-100">Online</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="p-4 border-b border-gray-100 bg-light/50">
                <p className="text-xs font-bold text-medium mb-2">
                  Quick Actions
                </p>
                <div className="flex flex-wrap gap-2">
                  {quickActions.map((action, idx) => (
                    <motion.button
                      key={idx}
                      whileHover={{
                        scale: 1.05,
                      }}
                      whileTap={{
                        scale: 0.95,
                      }}
                      onClick={() => handleSendMessage(action.label)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full text-sm font-semibold border border-gray-200 hover:border-teal transition-colors"
                    >
                      <action.icon size={14} className={action.color} />
                      {action.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{
                      opacity: 0,
                      y: 10,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`flex items-end gap-2 max-w-[80%] ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.type === 'user' ? 'bg-coral' : 'bg-teal'}`}
                      >
                        {msg.type === 'user' ? (
                          <UserIcon size={16} className="text-white" />
                        ) : (
                          <BotIcon size={16} className="text-white" />
                        )}
                      </div>
                      <div
                        className={`p-4 rounded-2xl ${msg.type === 'user' ? 'bg-coral text-white rounded-br-sm' : 'bg-white border border-gray-100 text-dark rounded-bl-sm shadow-sm'}`}
                      >
                        <p className="text-sm whitespace-pre-line">
                          {msg.message}
                        </p>
                        <p
                          className={`text-xs mt-2 ${msg.type === 'user' ? 'text-white/70' : 'text-medium'}`}
                        >
                          {msg.timestamp}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-gray-100 bg-white">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask me anything about the library..."
                    className="flex-1 px-4 py-3 bg-light border border-gray-200 rounded-2xl focus:ring-2 focus:ring-teal focus:border-transparent outline-none"
                  />
                  <motion.button
                    whileHover={{
                      scale: 1.05,
                    }}
                    whileTap={{
                      scale: 0.95,
                    }}
                    onClick={() => handleSendMessage()}
                    disabled={sending}
                    className="px-5 py-3 bg-coral text-white rounded-2xl font-bold shadow-lg shadow-coral/30"
                  >
                    <SendIcon size={20} />
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Insights Panels - Right Side (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personalized Recommendations */}
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
            >
              <div className="flex items-center gap-2 mb-4">
                <SparklesIcon size={20} className="text-golden" />
                <h3 className="font-extrabold text-dark">For You</h3>
              </div>
              <div className="space-y-3">
                {(recommendations.length === 0 ? [] : recommendations).slice(0, 3).map((book) => (
                  <div
                    key={book._id || book.id}
                    className="flex items-center gap-3 p-3 bg-light rounded-2xl"
                  >
                    <div
                      className={`w-12 h-16 ${book.coverColor || 'bg-teal'} rounded-xl flex items-center justify-center flex-shrink-0`}
                    >
                      <BookOpenIcon size={16} className="text-white/50" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-dark text-sm truncate">
                        {book.title}
                      </h4>
                      <p className="text-xs text-medium">{book.author}</p>
                      <p className="text-xs text-teal mt-1">Top rated available</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-extrabold text-teal">
                        {typeof book.rating === 'number' ? book.rating.toFixed(1) : '—'}
                      </span>
                      <p className="text-xs text-medium">rating</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-medium mt-3 text-center">
                Unavailable books are excluded
              </p>
            </motion.div>

            {/* Overdue Risk Evaluation */}
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
            >
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangleIcon size={20} className="text-coral" />
                <h3 className="font-extrabold text-dark">Overdue Risk</h3>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {['low', 'medium', 'high'].map((level) => (
                  <div
                    key={level}
                    className={`p-3 rounded-2xl text-center transition-all ${
                      riskLevel === level
                        ? `${getRiskColor(level).split(' ')[0]}/20 ring-2 ${
                            level === 'low'
                              ? 'ring-teal'
                              : level === 'medium'
                                ? 'ring-golden'
                                : 'ring-coral'
                          }`
                        : 'bg-light'
                    }`}
                  >
                    <span
                      className={`text-xs font-bold uppercase ${riskLevel === level ? getRiskColor(level).split(' ')[1] : 'text-medium'}`}
                    >
                      {level}
                    </span>
                    {riskLevel === level && (
                      <motion.div
                        initial={{
                          scale: 0,
                        }}
                        animate={{
                          scale: 1,
                        }}
                        className="mt-1"
                      >
                        <ZapIcon
                          size={16}
                          className={getRiskColor(level).split(' ')[1]}
                        />
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-medium">Past late returns:</span>
                  <span className="font-bold text-dark">
                    {insights?.risk?.pastLateReturns ?? 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-medium">Books due soon:</span>
                  <span className="font-bold text-dark">
                    {insights?.risk?.dueSoonCount ?? 0}
                    {typeof insights?.risk?.dueSoonMinDays === 'number'
                      ? ` (in ${insights.risk.dueSoonMinDays} days)`
                      : ''}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-medium">Risk score:</span>
                  <span className="font-bold text-teal">
                    {insights?.risk?.score ?? 0}/100
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Borrow History Analysis */}
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
            >
              <div className="flex items-center gap-2 mb-4">
                <BarChart3Icon size={20} className="text-teal" />
                <h3 className="font-extrabold text-dark">Reading Analysis</h3>
              </div>
              <p className="text-xs text-medium mb-3">
                Categories you've explored
              </p>
              <div className="space-y-3">
                {(categoryStats.length === 0 ? [] : categoryStats).map((cat, idx) => (
                  <div key={cat.category} className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-dark w-24">
                      {cat.category}
                    </span>
                    <div className="flex-1 bg-light rounded-full h-4 overflow-hidden">
                      <motion.div
                        initial={{
                          width: 0,
                        }}
                        animate={{
                          width: `${(cat.count / maxCategoryCount) * 100}%`,
                        }}
                        transition={{
                          duration: 0.8,
                          delay: 0.2,
                        }}
                        className={`h-full ${['bg-coral', 'bg-teal', 'bg-golden', 'bg-medium', 'bg-dark'][idx % 5]} rounded-full`}
                      />
                    </div>
                    <span className="text-sm font-bold text-medium w-6">
                      {cat.count}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUpIcon size={16} className="text-teal" />
                  <span className="text-sm text-medium">Monthly trend:</span>
                </div>
                <span className="text-sm font-bold text-teal">
                  +23% this month
                </span>
              </div>
            </motion.div>

            {/* Fine Records */}
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
            >
              <div className="flex items-center gap-2 mb-4">
                <ClockIcon size={20} className="text-golden" />
                <h3 className="font-extrabold text-dark">Fine Records</h3>
              </div>
              <div className="space-y-2">
                {fineRecords.map((fine) => (
                  <div
                    key={fine.id}
                    className="flex items-center justify-between p-3 bg-light rounded-xl"
                  >
                    <div>
                      <p className="font-semibold text-dark text-sm">
                        {fine.book}
                      </p>
                      <p className="text-xs text-medium">{fine.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-dark">
                        {formatLkr(fine.amountLkr)}
                      </p>
                      {fine.status === 'paid' ? (
                        <span className="text-xs text-teal font-semibold flex items-center gap-1">
                          <CheckCircleIcon size={12} /> Paid
                        </span>
                      ) : (
                        <span className="text-xs text-coral font-semibold flex items-center gap-1">
                          <XCircleIcon size={12} /> Unpaid
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {insightsLoading && fineRecords.length === 0 && (
                  <div className="text-sm text-medium">Loading...</div>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
