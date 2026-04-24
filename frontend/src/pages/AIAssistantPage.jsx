import React, { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  SendIcon,
  BotIcon,
  UserIcon,
  SparklesIcon,
  MicIcon,
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
import { useWakeWordSpeech } from '../hooks/useWakeWordSpeech'

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
  const inputRef = useRef(null)
  const inputModeRef = useRef('keyboard')

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

  // Validation helpers
  const MAX_WORDS = 100
  const MIN_CHARS = 2

  const countWords = (text) => {
    return text.trim().split(/\s+/).filter((word) => word.length > 0).length
  }

  const getValidationStatus = (text) => {
    const trimmed = text.trim()
    const charCount = trimmed.length
    const wordCount = countWords(text)

    return {
      charCount,
      wordCount,
      isValid: charCount >= MIN_CHARS && wordCount <= MAX_WORDS && trimmed.length > 0,
      errors: {
        tooShort: charCount > 0 && charCount < MIN_CHARS,
        tooManyWords: wordCount > MAX_WORDS,
        empty: trimmed.length === 0,
      },
    }
  }

  const validation = getValidationStatus(inputMessage)

  const handleNavigateToOverdueTracking = () => {
    if (_onNavigate) {
      _onNavigate('admin-overdue-tracking')
    }
  }

  const {
    supported: voiceSupported,
    listening: voiceListening,
    awake: voiceAwake,
    error: voiceError,
    statusText: voiceStatusText,
    lastHeard: voiceLastHeard,
    audioActive: voiceAudioActive,
    speechActive: voiceSpeechActive,
    toggle: toggleVoice,
  } = useWakeWordSpeech({
    wakeWordRegex: /\b(hey|hi)[\s,]+(libby|liby|lippy)(\s+ai)?\b/i,
    requireWakeWord: true,
    onWake: () => {
      inputModeRef.current = 'voice'
      try {
        inputRef.current?.focus()
      } catch {
        // ignore
      }
    },
    onCommandText: (text) => {
      if (inputModeRef.current !== 'voice') return
      setInputMessage(text)
    },
    onCommandFinal: (text) => {
      if (inputModeRef.current !== 'voice') return
      handleSendMessage(text)
      inputModeRef.current = 'keyboard'
    },
    commandIdleMs: 1200,
    awakeIdleMs: 6000,
  })

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
              {/* Chat Header - Enhanced */}
              <div className="bg-gradient-to-r from-teal via-teal to-teal/90 p-6 text-white shadow-lg border-b-2 border-teal/30">
                <div className="flex items-center gap-4">
                  {/* Bot Icon Wrapper */}
                  <motion.div
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-14 h-14 bg-gradient-to-br from-white/25 to-white/15 rounded-2xl flex items-center justify-center shadow-md"
                  >
                    <BotIcon size={28} className="text-white" />
                  </motion.div>
                  {/* Title & Status */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="font-extrabold text-xl tracking-wide">Libby AI</h2>
                      <span className="px-2.5 py-1 bg-green-400/20 border-1 border-green-300 rounded-full text-xs font-bold text-green-100">
                        Active
                      </span>
                    </div>
                    <p className="text-sm text-white/85 leading-relaxed">
                      {!voiceSupported
                        ? 'Voice not supported in this browser'
                        : voiceError
                          ? voiceError === 'insecure-context'
                            ? 'Voice requires HTTPS (or localhost)'
                            : `Voice error: ${voiceError}`
                          : voiceListening
                            ? voiceAwake
                              ? 'Listening…'
                              : voiceSpeechActive
                                ? voiceLastHeard
                                  ? `Heard: “${voiceLastHeard}” (say “Hey Libby”)`
                                  : 'Say “Hey Libby”'
                                : voiceAudioActive
                                  ? 'Listening… (no speech yet)'
                                  : 'Listening… (check mic permission)'
                            : 'Click mic to talk'}
                    </p>
                  </div>

                  {/* Voice Button */}
                  <motion.button
                    whileHover={voiceSupported ? { scale: 1.08, rotate: 5 } : {}}
                    whileTap={voiceSupported ? { scale: 0.92 } : {}}
                    type="button"
                    onClick={toggleVoice}
                    disabled={!voiceSupported}
                    title={
                      voiceError
                        ? `Voice error: ${voiceError}`
                        : voiceStatusText
                    }
                    aria-label="Toggle voice activation"
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all shadow-md font-bold ${
                      voiceSupported
                        ? 'bg-white/20 hover:bg-white/30 cursor-pointer'
                        : 'bg-white/10 opacity-50 cursor-not-allowed'
                    } ${voiceListening ? 'ring-2 ring-white ring-offset-2 ring-offset-teal' : ''}`}
                  >
                    <MicIcon size={20} className="text-white" />
                  </motion.button>

                  {/* Online Status */}
                  <div className="flex items-center gap-2">
                    <motion.span
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-3 h-3 bg-green-300 rounded-full shadow-lg"
                    />
                    <span className="text-sm font-semibold text-white/90">Online</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions - Enhanced */}
              <div className="p-5 border-b border-gray-50 bg-gradient-to-b from-white to-gray-50/50">
                <p className="text-xs font-bold text-medium mb-3 uppercase tracking-wider">
                  💡 Quick Actions
                </p>
                <div className="flex flex-wrap gap-2">
                  {quickActions.map((action, idx) => (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: 1.08, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSendMessage(action.label)}
                      className="flex items-center gap-2.5 px-3.5 py-2 bg-white rounded-full text-xs font-semibold border-2 border-gray-200 hover:border-teal hover:bg-teal/5 transition-all shadow-sm hover:shadow-md"
                    >
                      <action.icon size={16} className={action.color} />
                      {action.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Chat Messages - Enhanced */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-white via-white to-gray-50/30">
                {messages.length === 1 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-center h-full"
                  >
                    <div className="text-center max-w-xs">
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-16 h-16 bg-teal/10 rounded-2xl flex items-center justify-center mx-auto mb-4"
                      >
                        <SparklesIcon size={32} className="text-teal" />
                      </motion.div>
                      <p className="text-sm font-bold text-dark mb-1">Welcome to Libby AI!</p>
                      <p className="text-xs text-medium">Ask me anything about the library</p>
                    </div>
                  </motion.div>
                )}
                {messages.map((msg, idx) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`flex items-end gap-2.5 max-w-[75%] ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white shadow-md ${msg.type === 'user' ? 'bg-gradient-to-br from-coral to-coral/80' : 'bg-gradient-to-br from-teal to-teal/80'}`}
                      >
                        {msg.type === 'user' ? (
                          <UserIcon size={16} />
                        ) : (
                          <BotIcon size={16} />
                        )}
                      </motion.div>
                      <div
                        className={`px-4 py-3 rounded-2xl shadow-md transition-all ${
                          msg.type === 'user'
                            ? 'bg-gradient-to-br from-coral to-coral/90 text-white rounded-br-none'
                            : 'bg-white border-2 border-gray-100 text-dark rounded-bl-none hover:border-teal/30'
                        }`}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-line font-medium">
                          {msg.message}
                        </p>
                        <p
                          className={`text-xs mt-2.5 font-semibold ${
                            msg.type === 'user' ? 'text-white/80' : 'text-medium'
                          }`}
                        >
                          {msg.timestamp}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {sending && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="flex items-end gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-teal flex items-center justify-center flex-shrink-0">
                        <BotIcon size={16} className="text-white" />
                      </div>
                      <div className="px-4 py-3 rounded-2xl bg-white border-2 border-gray-100 shadow-md">
                        <div className="flex gap-1.5">
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              animate={{ y: [0, -8, 0] }}
                              transition={{ delay: i * 0.1, duration: 0.6, repeat: Infinity }}
                              className="w-2 h-2 bg-teal rounded-full"
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Chat Input - Enhanced */}
              <div className="p-5 border-t border-gray-100 bg-gradient-to-t from-gray-50 to-white">
                <div className="space-y-3">
                  {/* Input Field */}
                  <div className="flex gap-3 items-end">
                    <div className="flex-1 relative">
                      <input
                        ref={inputRef}
                        type="text"
                        value={inputMessage}
                        onChange={(e) => {
                          inputModeRef.current = 'keyboard'
                          setInputMessage(e.target.value)
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && validation.isValid) {
                            handleSendMessage()
                          }
                        }}
                        placeholder="Ask me anything... (min 2 chars, max 100 words)"
                        className={`w-full px-5 py-3.5 bg-white border-2 rounded-2xl focus:ring-2 focus:ring-offset-0 focus:border-transparent outline-none transition-all font-medium shadow-sm ${
                          validation.errors.empty
                            ? 'border-gray-200'
                            : validation.isValid
                              ? 'border-teal/50 focus:ring-teal/40'
                              : 'border-coral/50 focus:ring-coral/40'
                        }`}
                      />
                    </div>
                    <motion.button
                      whileHover={validation.isValid ? { scale: 1.08, y: -2 } : {}}
                      whileTap={validation.isValid ? { scale: 0.95 } : {}}
                      onClick={() => validation.isValid && handleSendMessage()}
                      disabled={sending || !validation.isValid}
                      className={`w-12 h-12 rounded-2xl font-bold shadow-lg transition-all flex items-center justify-center ${
                        validation.isValid && !sending
                          ? 'bg-gradient-to-br from-coral to-coral/90 text-white shadow-coral/40 hover:shadow-coral/60'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-60'
                      }`}
                    >
                      <SendIcon size={20} />
                    </motion.button>
                  </div>

                  {/* Validation Feedback - Compact */}
                  <div className="flex items-center justify-between px-2 text-xs">
                    <div className="flex gap-4">
                      <div className="flex items-center gap-1">
                        <span
                          className={`font-semibold ${
                            validation.errors.tooShort
                              ? 'text-coral'
                              : validation.isValid
                                ? 'text-teal'
                                : 'text-medium'
                          }`}
                        >
                          {validation.charCount}
                        </span>
                        <span className="text-medium">chars</span>
                      </div>
                      <div className="h-4 border-l border-gray-300" />
                      <div className="flex items-center gap-1">
                        <span
                          className={`font-semibold ${
                            validation.errors.tooManyWords
                              ? 'text-coral'
                              : validation.isValid
                                ? 'text-teal'
                                : 'text-medium'
                          }`}
                        >
                          {validation.wordCount}/{MAX_WORDS}
                        </span>
                        <span className="text-medium">words</span>
                      </div>
                    </div>

                    {validation.isValid && validation.charCount > 0 && (
                      <motion.span
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-teal font-bold flex items-center gap-1"
                      >
                        ✓ Ready
                      </motion.span>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {validation.wordCount > 0 && (
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${Math.min((validation.wordCount / MAX_WORDS) * 100, 100)}%`,
                        }}
                        className={`h-full rounded-full transition-all ${
                          validation.errors.tooManyWords
                            ? 'bg-gradient-to-r from-coral to-coral/60'
                            : validation.wordCount / MAX_WORDS > 0.8
                              ? 'bg-gradient-to-r from-golden to-golden/60'
                              : 'bg-gradient-to-r from-teal to-teal/60'
                        }`}
                      />
                    </div>
                  )}
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
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <SparklesIcon size={20} className="text-golden" />
                  <h3 className="font-extrabold text-dark">For You</h3>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNavigateToOverdueTracking}
                  className="text-xs font-bold text-teal hover:text-teal/80 transition-colors"
                >
                  View Tracking →
                </motion.button>
              </div>
              <div className="space-y-3">
                {(recommendations.length === 0 ? [] : recommendations).slice(0, 3).map((book) => (
                  <motion.div
                    key={book._id || book.id}
                    whileHover={{ scale: 1.02, y: -2 }}
                    onClick={handleNavigateToOverdueTracking}
                    className="flex items-center gap-3 p-3 bg-light rounded-2xl cursor-pointer transition-all hover:bg-teal/5 hover:shadow-md"
                  >
                    <div
                      className={`w-12 h-16 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden`}
                      style={book.coverImage ? { backgroundImage: `url(${book.coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { backgroundColor: book.coverColor || '#0d9488' }}
                    >
                      {!book.coverImage && <BookOpenIcon size={16} className="text-white/50" />}
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
                  </motion.div>
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
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangleIcon size={20} className="text-coral" />
                  <h3 className="font-extrabold text-dark">Overdue Risk</h3>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNavigateToOverdueTracking}
                  className="text-xs font-bold text-teal hover:text-teal/80 transition-colors"
                >
                  Analyze →
                </motion.button>
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
              <div className="space-y-3 text-sm">
                {/* Risk Score Bar */}
                <div>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-medium font-semibold">Risk Score</span>
                    <span className="font-bold text-dark">
                      {insights?.risk?.score ?? 0}/100
                    </span>
                  </div>
                  <div className="w-full bg-light rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${insights?.risk?.score ?? 0}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      className={`h-full rounded-full ${
                        insights?.risk?.score > 70
                          ? 'bg-coral'
                          : insights?.risk?.score > 40
                            ? 'bg-golden'
                            : 'bg-teal'
                      }`}
                    />
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200">
                  <div className="bg-light p-2.5 rounded-xl">
                    <p className="text-xs text-medium mb-1">Past Late Returns</p>
                    <p className="font-bold text-dark text-lg">
                      {insights?.risk?.pastLateReturns ?? 0}
                    </p>
                  </div>
                  <div className="bg-light p-2.5 rounded-xl">
                    <p className="text-xs text-medium mb-1">Books Due Soon</p>
                    <p className="font-bold text-dark text-lg">
                      {insights?.risk?.dueSoonCount ?? 0}
                    </p>
                  </div>
                  <div className="bg-light p-2.5 rounded-xl">
                    <p className="text-xs text-medium mb-1">Days Until Due</p>
                    <p className="font-bold text-teal text-lg">
                      {typeof insights?.risk?.dueSoonMinDays === 'number'
                        ? insights.risk.dueSoonMinDays
                        : '—'}
                    </p>
                  </div>
                  <div className="bg-light p-2.5 rounded-xl">
                    <p className="text-xs text-medium mb-1">Current Fine</p>
                    <p className="font-bold text-coral text-lg">
                      {formatLkr(insights?.risk?.currentOverdueFineLkr ?? 0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Alert Box */}
              {riskLevel !== 'low' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-4 p-3 rounded-xl border-l-4 ${
                    riskLevel === 'high'
                      ? 'bg-coral/10 border-coral'
                      : 'bg-golden/10 border-golden'
                  }`}
                >
                  <p className="text-xs font-semibold text-dark">
                    ⚠ {riskLevel === 'high' ? 'High' : 'Medium'} overdue risk detected
                  </p>
                  <p className="text-xs text-medium mt-1">
                    {riskLevel === 'high'
                      ? 'You have overdue items. Return them immediately to avoid additional fines.'
                      : 'Some books are due soon. Check your return dates.'}
                  </p>
                </motion.div>
              )}

              {riskLevel === 'low' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 rounded-xl bg-teal/10 border-l-4 border-teal"
                >
                  <p className="text-xs font-semibold text-teal">
                    ✓ Great! You're maintaining good reading habits
                  </p>
                  <p className="text-xs text-medium mt-1">
                    Keep returning books on time to maintain your status.
                  </p>
                </motion.div>
              )}
            </motion.div>

            {/* Borrow History Analysis */}
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <BarChart3Icon size={20} className="text-teal" />
                  <h3 className="font-extrabold text-dark">Reading Analysis</h3>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-teal/10 rounded-full">
                  <TrendingUpIcon size={14} className="text-teal" />
                  <span className="text-xs font-bold text-teal">+23% this month</span>
                </div>
              </div>

              <div className="space-y-6">
                {/* Main Bar Chart - Categories You've Explored */}
                <div>
                  <p className="text-xs font-bold text-medium mb-5 uppercase tracking-wider">
                    📚 Most Borrowed Categories
                  </p>
                  <div className="space-y-4">
                    {(categoryStats.length === 0 ? [] : categoryStats).map((cat, idx) => {
                      const percentage = (cat.count / maxCategoryCount) * 100
                      const colors = [
                        { bg: '#E8415A', text: 'text-coral', light: 'from-coral/20 to-coral/5' },
                        { bg: '#0D9E75', text: 'text-teal', light: 'from-teal/20 to-teal/5' },
                        { bg: '#D4AF37', text: 'text-golden', light: 'from-golden/20 to-golden/5' },
                        { bg: '#8B8B8B', text: 'text-medium', light: 'from-medium/20 to-medium/5' },
                        { bg: '#2B2D42', text: 'text-dark', light: 'from-dark/20 to-dark/5' },
                      ]
                      const colorSet = colors[idx % 5]

                      return (
                        <motion.div
                          key={cat.category}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="group"
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-24">
                              <p className="text-sm font-bold text-dark truncate capitalize">
                                {cat.category}
                              </p>
                              <p className="text-xs text-medium mt-0.5">
                                {cat.count} {cat.count === 1 ? 'book' : 'books'} borrowed
                              </p>
                            </div>
                            <div className="flex-1">
                              <div className={`relative h-10 bg-gradient-to-r ${colorSet.light} rounded-xl overflow-hidden border-2 border-gray-100 group-hover:border-gray-200 transition-all`}>
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${percentage}%` }}
                                  transition={{ duration: 1, delay: 0.2 + idx * 0.08, ease: 'easeOut' }}
                                  className="h-full rounded-lg flex items-center justify-end pr-3 transition-all group-hover:shadow-lg"
                                  style={{ backgroundColor: colorSet.bg }}
                                >
                                  {percentage > 20 && (
                                    <span className="text-white font-bold text-sm text-right">
                                      {percentage.toFixed(0)}%
                                    </span>
                                  )}
                                </motion.div>
                              </div>
                            </div>
                            <div className="text-right min-w-fit">
                              <span className={`text-lg font-extrabold ${colorSet.text}`}>
                                {cat.count}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}

                    {/* Empty State */}
                    {categoryStats.length === 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-8"
                      >
                        <BookOpenIcon size={32} className="text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-medium">No borrowing data yet</p>
                        <p className="text-xs text-medium/70">Start borrowing books to see your reading analysis</p>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200" />

                {/* Monthly Performance Stats */}
                <div>
                  <p className="text-xs font-bold text-medium mb-4 uppercase tracking-wider">
                    📊 Monthly Performance
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Growth Card */}
                    <motion.div
                      whileHover={{ scale: 1.05, y: -2 }}
                      className="bg-gradient-to-br from-teal/15 to-teal/5 p-4 rounded-2xl border-2 border-teal/30 hover:border-teal/60 transition-all cursor-default"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <TrendingUpIcon size={18} className="text-teal" />
                        <span className="text-xs font-bold text-teal px-2 py-1 bg-teal/20 rounded-full">Trending</span>
                      </div>
                      <p className="text-2xl font-extrabold text-teal mb-1">+23%</p>
                      <p className="text-xs text-medium">Growth vs last month</p>
                    </motion.div>

                    {/* Total Reads Card */}
                    <motion.div
                      whileHover={{ scale: 1.05, y: -2 }}
                      className="bg-gradient-to-br from-coral/15 to-coral/5 p-4 rounded-2xl border-2 border-coral/30 hover:border-coral/60 transition-all cursor-default"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <BookOpenIcon size={18} className="text-coral" />
                        <span className="text-xs font-bold text-coral px-2 py-1 bg-coral/20 rounded-full">This Month</span>
                      </div>
                      <p className="text-2xl font-extrabold text-coral mb-1">
                        {categoryStats.reduce((sum, cat) => sum + (cat.count || 0), 0)}
                      </p>
                      <p className="text-xs text-medium">Total books borrowed</p>
                    </motion.div>

                    {/* Top Category Card */}
                    <motion.div
                      whileHover={{ scale: 1.05, y: -2 }}
                      className="bg-gradient-to-br from-golden/15 to-golden/5 p-4 rounded-2xl border-2 border-golden/30 hover:border-golden/60 transition-all cursor-default"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <SparklesIcon size={18} className="text-golden" />
                        <span className="text-xs font-bold text-golden px-2 py-1 bg-golden/20 rounded-full">Popular</span>
                      </div>
                      <p className="text-lg font-extrabold text-golden mb-1 truncate capitalize">
                        {categoryStats.length > 0
                          ? categoryStats.reduce((max, cat) =>
                              cat.count > max.count ? cat : max
                            ).category
                          : '—'}
                      </p>
                      <p className="text-xs text-medium">Most borrowed category</p>
                    </motion.div>

                    {/* Avg Per Week Card */}
                    <motion.div
                      whileHover={{ scale: 1.05, y: -2 }}
                      className="bg-gradient-to-br from-medium/15 to-medium/5 p-4 rounded-2xl border-2 border-medium/30 hover:border-medium/60 transition-all cursor-default"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <CalendarIcon size={18} className="text-medium" />
                        <span className="text-xs font-bold text-medium px-2 py-1 bg-medium/20 rounded-full">Average</span>
                      </div>
                      <p className="text-2xl font-extrabold text-dark mb-1">
                        {(categoryStats.reduce((sum, cat) => sum + (cat.count || 0), 0) / 4).toFixed(1)}
                      </p>
                      <p className="text-xs text-medium">Books per week</p>
                    </motion.div>
                  </div>
                </div>

                {/* Achievement Box */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-teal/20 via-teal/10 to-teal/20 p-4 rounded-2xl border-l-4 border-teal shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <ZapIcon size={18} className="text-teal" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-dark mb-0.5">🎉 Reading Streak Active</p>
                      <p className="text-xs text-medium">
                        Keep exploring new categories! You're close to unlocking a new reading achievement.
                      </p>
                    </div>
                  </div>
                </motion.div>
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
