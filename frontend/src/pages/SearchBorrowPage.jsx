import React, { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  SearchIcon,
  BookOpenIcon,
  StarIcon,
  ClockIcon,
  UsersIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  EditIcon,
  TrashIcon,
  MessageSquareIcon,
  DollarSignIcon,
  XIcon,
  SendIcon,
} from 'lucide-react'

import { fetchBookById, fetchBooks } from '../api/books'
import {
  cancelBorrowRequest,
  createBorrowRequest,
  fetchMyBorrowRequests,
} from '../api/borrowRequests'
import { createInquiry, fetchMyInquiries } from '../api/inquiries'
import {
  fetchMyWaitingList,
  joinWaitingList as apiJoinWaitingList,
  leaveWaitingList as apiLeaveWaitingList,
} from '../api/waitingList'

const BORROW_PERIOD_DAYS = 7
const FINE_PER_DAY_LKR = 50

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function daysBetween(dateA, dateB) {
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.floor((startOfDay(dateA) - startOfDay(dateB)) / msPerDay)
}

function formatLkr(amount) {
  const value = Number(amount) || 0
  return `Rs ${value.toFixed(2)}`
}

export function SearchBorrowPage({ onNavigate }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [activeSection, setActiveSection] = useState('search')
  const [requestFilter, setRequestFilter] = useState('all')
  const [selectedBook, setSelectedBook] = useState(null)
  const [showInquiryForm, setShowInquiryForm] = useState(false)
  const [inquirySubject, setInquirySubject] = useState('')
  const [inquiryMessage, setInquiryMessage] = useState('')

  const [requests, setRequests] = useState([])
  const [requestsLoading, setRequestsLoading] = useState(false)
  const [requestsError, setRequestsError] = useState('')
  const [requestActionLoading, setRequestActionLoading] = useState({})

  const [books, setBooks] = useState([])
  const [booksLoading, setBooksLoading] = useState(false)
  const [booksError, setBooksError] = useState('')

  const [inquiries, setInquiries] = useState([])
  const [inquiriesLoading, setInquiriesLoading] = useState(false)
  const [inquiriesError, setInquiriesError] = useState('')
  const [inquirySubmitting, setInquirySubmitting] = useState(false)

  const [waitingList, setWaitingList] = useState([])
  const [waitingListLoading, setWaitingListLoading] = useState(false)
  const [waitingListError, setWaitingListError] = useState('')
  const [waitingListActionLoading, setWaitingListActionLoading] = useState({})

  const borrowedCount = useMemo(
    () => requests.filter((r) => r.status === 'approved' && !r.returnedAt).length,
    [requests]
  )

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  const loadBooks = async () => {
    setBooksError('')
    setBooksLoading(true)
    try {
      const data = await fetchBooks()
      setBooks(Array.isArray(data) ? data : [])
    } catch (e) {
      setBooksError(e?.response?.data?.message || 'Failed to load books')
    } finally {
      setBooksLoading(false)
    }
  }

  useEffect(() => {
    loadBooks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const q = localStorage.getItem('searchBorrowQuery')
    if (q) {
      setSearchQuery(q)
      localStorage.removeItem('searchBorrowQuery')
    }

    const section = localStorage.getItem('searchBorrowSection')
    if (section) {
      setActiveSection(section)
      localStorage.removeItem('searchBorrowSection')
    }
  }, [])

  const loadMyRequests = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setRequests([])
      return
    }

    setRequestsError('')
    setRequestsLoading(true)
    try {
      const data = await fetchMyBorrowRequests()
      const normalized = (Array.isArray(data) ? data : []).map((r) => ({
        id: r._id,
        bookId: r.book?._id,
        bookTitle: r.book?.title || '',
        bookAuthor: r.book?.author || '',
        createdAt: r.createdAt || '',
        borrowedAt: r.borrowedAt || null,
        dueAt: r.dueAt || null,
        returnedAt: r.returnedAt || null,
        lateDays: r.lateDays || 0,
        fineLkr: r.fineLkr || 0,
        date: r.createdAt
          ? new Date(r.createdAt).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: '2-digit',
            })
          : '',
        status: r.status,
        coverColor: r.book?.coverColor || 'bg-teal',
      }))

      setRequests(normalized)
    } catch (e) {
      setRequestsError(
        e?.response?.data?.message || 'Failed to load borrow requests'
      )
    } finally {
      setRequestsLoading(false)
    }
  }

  useEffect(() => {
    if (activeSection === 'requests' || activeSection === 'fines') {
      loadMyRequests()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection])

  const fines = useMemo(() => {
    const today = new Date()

    return requests
      .filter((r) => r.status === 'approved' && !r.returnedAt)
      .map((r) => {
        const borrowedAt = r.borrowedAt
          ? new Date(r.borrowedAt)
          : r.createdAt
            ? new Date(r.createdAt)
            : null
        if (!borrowedAt || Number.isNaN(borrowedAt.getTime())) return null

        const dueDate = r.dueAt
          ? new Date(r.dueAt)
          : (() => {
              const d = new Date(borrowedAt)
              d.setDate(d.getDate() + BORROW_PERIOD_DAYS)
              return d
            })()

        const daysLate = Math.max(0, daysBetween(today, dueDate))
        const totalFine = daysLate * FINE_PER_DAY_LKR

        if (daysLate <= 0) return null

        return {
          id: r.id,
          bookTitle: r.bookTitle || '—',
          daysLate,
          finePerDay: FINE_PER_DAY_LKR,
          totalFine,
          status: 'unpaid',
        }
      })
      .filter(Boolean)
  }, [requests])

  const loadMyInquiries = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setInquiries([])
      return
    }

    setInquiriesError('')
    setInquiriesLoading(true)
    try {
      const data = await fetchMyInquiries()
      const normalized = (Array.isArray(data) ? data : []).map((inq) => ({
        id: inq._id,
        subject: inq.subject || '',
        message: inq.message || '',
        date: inq.createdAt
          ? new Date(inq.createdAt).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: '2-digit',
            })
          : '',
        status: inq.status || 'pending',
        response: inq.response || '',
      }))
      setInquiries(normalized)
    } catch (e) {
      setInquiriesError(e?.response?.data?.message || 'Failed to load inquiries')
    } finally {
      setInquiriesLoading(false)
    }
  }

  useEffect(() => {
    if (activeSection === 'inquiries') {
      loadMyInquiries()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection])

  const loadMyWaitingList = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setWaitingList([])
      return
    }

    setWaitingListError('')
    setWaitingListLoading(true)
    try {
      const data = await fetchMyWaitingList()
      const normalized = (Array.isArray(data) ? data : []).map((e) => ({
        id: e._id,
        bookTitle: e.book?.title || '',
        coverColor: e.book?.coverColor || 'bg-teal',
        position: typeof e.position === 'number' ? e.position : 1,
      }))
      setWaitingList(normalized)
    } catch (e) {
      setWaitingListError(
        e?.response?.data?.message || 'Failed to load waiting list'
      )
    } finally {
      setWaitingListLoading(false)
    }
  }

  useEffect(() => {
    if (activeSection === 'waiting') {
      loadMyWaitingList()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection])

  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(books.map((b) => b.category).filter(Boolean))
    ).sort((a, b) => String(a).localeCompare(String(b)))

    return ['All', ...unique]
  }, [books])

  const filteredBooks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()

    return books.filter((book) => {
      const matchesSearch =
        !q ||
        (book.title || '').toLowerCase().includes(q) ||
        (book.author || '').toLowerCase().includes(q)

      const matchesCategory =
        activeFilter === 'All' || book.category === activeFilter

      return matchesSearch && matchesCategory
    })
  }, [books, searchQuery, activeFilter])

  const filteredRequests = requests.filter((req) => {
    if (requestFilter === 'all') return true
    return req.status === requestFilter
  })

  const handleBorrowNow = async () => {
    if (!selectedBook) return
    if (selectedBook.status !== 'available') return

    const token = localStorage.getItem('token')
    if (!token) {
      toast.error('Please sign in to borrow books')
      return
    }

    if (borrowedCount >= 3) {
      toast.error("You've reached your borrow limit")
      return
    }

    try {
      await createBorrowRequest(selectedBook._id)
      setSelectedBook(null)
      setActiveSection('requests')
      setRequestFilter('pending')
      await loadMyRequests()
      toast.success('Borrow request submitted')
    } catch (e) {
      toast.error(
        e?.response?.data?.message || 'Failed to submit borrow request'
      )
    }
  }

  const setRequestIsLoading = (requestId, isLoading) => {
    setRequestActionLoading((prev) => ({
      ...prev,
      [requestId]: isLoading,
    }))
  }

  const handleEditRequest = async (request) => {
    if (!request?.bookId) {
      toast.error('Book details not available')
      return
    }

    try {
      const book = await fetchBookById(request.bookId)
      const status =
        book?.status || (typeof book?.copies === 'number' && book.copies > 0 ? 'available' : 'borrowed')
      const rating = Number(book?.rating || 0)
      setSelectedBook({ ...book, status, rating })
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to load book details')
    }
  }

  const handleDeleteRequest = async (request) => {
    if (!request?.id) return

    const ok = window.confirm('Cancel this borrow request?')
    if (!ok) return

    setRequestIsLoading(request.id, true)
    try {
      await cancelBorrowRequest(request.id)
      setRequests((prev) => prev.filter((r) => r.id !== request.id))
      toast.success('Borrow request cancelled')
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to cancel request')
    } finally {
      setRequestIsLoading(request.id, false)
    }
  }

  const handleSubmitInquiry = async () => {
    const subject = inquirySubject.trim()
    const message = inquiryMessage.trim()

    const token = localStorage.getItem('token')
    if (!token) {
      toast.error('Please sign in to submit inquiries')
      return
    }

    if (!subject) {
      toast.error('Please enter a subject')
      return
    }

    if (!message) {
      toast.error('Please enter a message')
      return
    }

    setInquirySubmitting(true)
    try {
      await createInquiry({ subject, message })
      setShowInquiryForm(false)
      setInquirySubject('')
      setInquiryMessage('')
      await loadMyInquiries()
      toast.success('Inquiry submitted')
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to submit inquiry')
    } finally {
      setInquirySubmitting(false)
    }
  }

  const setWaitingActionLoading = (entryId, isLoading) => {
    setWaitingListActionLoading((prev) => ({
      ...prev,
      [entryId]: isLoading,
    }))
  }

  const handleJoinWaitingList = async () => {
    if (!selectedBook) return

    const token = localStorage.getItem('token')
    if (!token) {
      toast.error('Please sign in to join waiting list')
      return
    }

    const entryKey = selectedBook._id
    setWaitingActionLoading(entryKey, true)
    try {
      await apiJoinWaitingList(selectedBook._id)
      setSelectedBook(null)
      setActiveSection('waiting')
      await loadMyWaitingList()
      toast.success('Added to waiting list')
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to join waiting list')
    } finally {
      setWaitingActionLoading(entryKey, false)
    }
  }

  const handleLeaveWaitingList = async (entry) => {
    if (!entry?.id) return
    setWaitingActionLoading(entry.id, true)
    try {
      await apiLeaveWaitingList(entry.id)
      await loadMyWaitingList()
      toast.success('Removed from waiting list')
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to leave queue')
    } finally {
      setWaitingActionLoading(entry.id, false)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'available':
        return (
          <span className="px-3 py-1 bg-teal/10 text-teal text-xs font-bold rounded-full">
            Available
          </span>
        )
      case 'borrowed':
        return (
          <span className="px-3 py-1 bg-coral/10 text-coral text-xs font-bold rounded-full">
            Borrowed
          </span>
        )
      case 'reserved':
        return (
          <span className="px-3 py-1 bg-golden/20 text-yellow-700 text-xs font-bold rounded-full">
            Reserved
          </span>
        )
      case 'pending':
        return (
          <span className="px-3 py-1 bg-golden/20 text-yellow-700 text-xs font-bold rounded-full">
            Pending
          </span>
        )
      case 'approved':
        return (
          <span className="px-3 py-1 bg-teal/10 text-teal text-xs font-bold rounded-full">
            Approved
          </span>
        )
      case 'rejected':
        return (
          <span className="px-3 py-1 bg-coral/10 text-coral text-xs font-bold rounded-full">
            Rejected
          </span>
        )
      case 'answered':
        return (
          <span className="px-3 py-1 bg-teal/10 text-teal text-xs font-bold rounded-full">
            Answered
          </span>
        )
      case 'closed':
        return (
          <span className="px-3 py-1 bg-medium/20 text-medium text-xs font-bold rounded-full">
            Closed
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-light p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-extrabold text-dark mb-2">
            Search & Borrow 📚
          </h1>
          <p className="text-medium">
            Find your next great read and manage your borrowing.
          </p>
        </motion.div>

        {/* Section Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-wrap gap-2 mb-8"
        >
          {[
            { key: 'search', label: 'Search Books', icon: SearchIcon },
            { key: 'requests', label: 'My Requests', icon: ClockIcon },
            { key: 'waiting', label: 'Waiting List', icon: UsersIcon },
            { key: 'fines', label: 'Fines', icon: DollarSignIcon },
            { key: 'inquiries', label: 'Inquiries', icon: MessageSquareIcon },
          ].map((tab) => (
            <motion.button
              key={tab.key}
              onClick={() => setActiveSection(tab.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all ${activeSection === tab.key ? 'bg-teal text-white shadow-lg shadow-teal/30' : 'bg-white text-medium hover:text-dark border border-gray-200'}`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <tab.icon size={18} />
              {tab.label}
            </motion.button>
          ))}
        </motion.div>

        {/* Borrow Limit Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-8"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold text-dark">Your Borrow Limit</span>
            <span className="text-sm text-medium">
              {borrowedCount}/3 books borrowed
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(borrowedCount / 3) * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="bg-teal h-3 rounded-full"
            />
          </div>
          {borrowedCount >= 3 && (
            <p className="text-coral text-sm mt-2 font-semibold">
              You've reached your borrow limit. Return a book to borrow more.
            </p>
          )}
        </motion.div>

        {/* Search Section */}
        {activeSection === 'search' && (
          <motion.div variants={containerVariants} initial="hidden" animate="show">
            {/* Search Bar */}
            <motion.div variants={itemVariants} className="mb-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <SearchIcon size={22} className="text-medium" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-14 pr-4 py-4 bg-white border border-gray-200 rounded-2xl text-dark text-lg focus:ring-2 focus:ring-teal focus:border-transparent transition-all outline-none shadow-sm"
                  placeholder="Search by title, author, or keyword..."
                />
              </div>
            </motion.div>

            {/* Category Filters */}
            <motion.div variants={itemVariants} className="flex flex-wrap gap-2 mb-8">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveFilter(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${activeFilter === cat ? 'bg-coral text-white shadow-md' : 'bg-white text-medium hover:text-dark border border-gray-200'}`}
                >
                  {cat}
                </button>
              ))}
            </motion.div>

            {booksError && (
              <motion.div variants={itemVariants} className="mb-6">
                <div className="bg-coral/10 text-coral px-4 py-3 rounded-2xl font-semibold">
                  {booksError}
                </div>
              </motion.div>
            )}

            {/* Books Grid */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {booksLoading && (
                <div className="col-span-full text-center text-medium py-10">
                  Loading books...
                </div>
              )}
              {!booksLoading && filteredBooks.length === 0 && (
                <div className="col-span-full text-center text-medium py-10">
                  No books found.
                </div>
              )}
              {!booksLoading &&
                filteredBooks.map((book) => {
                  const status = book.status || (book.copies > 0 ? 'available' : 'borrowed')
                  const rating = typeof book.rating === 'number' ? book.rating : 0

                  return (
                    <motion.div
                      key={book._id}
                      className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 cursor-pointer group"
                      whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
                      onClick={() => setSelectedBook({ ...book, status, rating })}
                    >
                      <div className={`w-full h-40 ${book.coverColor || 'bg-teal'} rounded-2xl mb-4 flex items-center justify-center`}>
                        <BookOpenIcon size={48} className="text-white/50" />
                      </div>
                      <div className="mb-2">{getStatusBadge(status)}</div>
                      <h3 className="font-bold text-dark text-lg mb-1 line-clamp-1">
                        {book.title}
                      </h3>
                      <p className="text-medium text-sm mb-3">{book.author}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs bg-light px-2 py-1 rounded-full text-medium font-semibold">
                          {book.category}
                        </span>
                        <div className="flex items-center gap-1">
                          <StarIcon size={14} className="text-golden fill-golden" />
                          <span className="text-sm font-bold text-dark">
                            {rating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
            </motion.div>
          </motion.div>
        )}

        {/* Requests Section */}
        {activeSection === 'requests' && (
          <motion.div variants={containerVariants} initial="hidden" animate="show">
            {requestsError && (
              <motion.div variants={itemVariants} className="mb-4">
                <div className="bg-coral/10 text-coral px-4 py-3 rounded-2xl font-semibold">
                  {requestsError}
                </div>
              </motion.div>
            )}

            <motion.div variants={itemVariants} className="flex gap-2 mb-6">
              {['all', 'pending', 'approved', 'rejected'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setRequestFilter(filter)}
                  className={`px-4 py-2 rounded-full text-sm font-bold capitalize transition-all ${requestFilter === filter ? 'bg-teal text-white' : 'bg-white text-medium border border-gray-200'}`}
                >
                  {filter}
                </button>
              ))}
            </motion.div>

            <motion.div variants={itemVariants} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="divide-y divide-gray-100">
                {requestsLoading && (
                  <div className="p-6 text-center text-medium">
                    Loading requests...
                  </div>
                )}

                {filteredRequests.map((request) => (
                  <div key={request.id} className="p-6 flex items-center gap-4">
                    <div className={`w-16 h-20 ${request.coverColor} rounded-xl flex-shrink-0 flex items-center justify-center`}>
                      <BookOpenIcon size={24} className="text-white/50" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-dark">{request.bookTitle}</h3>
                      <p className="text-medium text-sm">{request.bookAuthor}</p>
                      <p className="text-xs text-medium mt-1">Requested: {request.date}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(request.status)}
                      {request.status === 'pending' && (
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleEditRequest(request)}
                            disabled={!!requestActionLoading[request.id]}
                            className="p-2 bg-light rounded-full text-medium hover:text-teal disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            <EditIcon size={16} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDeleteRequest(request)}
                            disabled={!!requestActionLoading[request.id]}
                            className="p-2 bg-light rounded-full text-medium hover:text-coral disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            <TrashIcon size={16} />
                          </motion.button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {!requestsLoading && filteredRequests.length === 0 && (
                  <div className="p-6 text-center text-medium">
                    No requests found.
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Waiting List Section */}
        {activeSection === 'waiting' && (
          <motion.div variants={containerVariants} initial="hidden" animate="show">
            <motion.div variants={itemVariants} className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-xl font-extrabold text-dark mb-6 flex items-center gap-2">
                <UsersIcon size={24} className="text-teal" />
                Your Waiting List
              </h2>

              {waitingListError && (
                <div className="bg-coral/10 text-coral px-4 py-3 rounded-2xl font-semibold mb-4">
                  {waitingListError}
                </div>
              )}

              {waitingListLoading ? (
                <p className="text-medium text-center py-8">Loading waiting list...</p>
              ) : waitingList.length === 0 ? (
                <p className="text-medium text-center py-8">
                  You're not on any waiting lists.
                </p>
              ) : (
                <div className="space-y-4">
                  {waitingList.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 bg-light rounded-2xl">
                      <div className={`w-16 h-20 ${item.coverColor} rounded-xl flex-shrink-0 flex items-center justify-center`}>
                        <BookOpenIcon size={24} className="text-white/50" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-dark">{item.bookTitle}</h3>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm bg-golden/20 text-yellow-700 px-3 py-1 rounded-full font-bold">
                            Position #{item.position}
                          </span>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleLeaveWaitingList(item)}
                        disabled={!!waitingListActionLoading[item.id]}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-bold text-coral hover:bg-coral/5 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        Leave Queue
                      </motion.button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-sm text-medium mt-6 text-center">
                📋 Waiting list uses FIFO (First In, First Out) method. You'll be notified when it's your turn!
              </p>
            </motion.div>
          </motion.div>
        )}

        {/* Fines Section */}
        {activeSection === 'fines' && (
          <motion.div variants={containerVariants} initial="hidden" animate="show">
            <motion.div variants={itemVariants} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-extrabold text-dark flex items-center gap-2">
                  <AlertTriangleIcon size={24} className="text-coral" />
                  Fine Calculator
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-light">
                    <tr>
                      <th className="text-left p-4 font-bold text-dark">Book</th>
                      <th className="text-center p-4 font-bold text-dark">Days Late</th>
                      <th className="text-center p-4 font-bold text-dark">Fine/Day</th>
                      <th className="text-center p-4 font-bold text-dark">Total</th>
                      <th className="text-center p-4 font-bold text-dark">Status</th>
                      <th className="text-right p-4 font-bold text-dark">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {fines.length === 0 ? (
                      <tr>
                        <td className="p-6 text-center text-medium" colSpan={6}>
                          No overdue fines.
                        </td>
                      </tr>
                    ) : (
                      fines.map((fine) => (
                        <tr key={fine.id} className="hover:bg-light/50">
                          <td className="p-4 font-semibold text-dark">{fine.bookTitle}</td>
                          <td className="p-4 text-center text-coral font-bold">{fine.daysLate}</td>
                          <td className="p-4 text-center text-medium">{formatLkr(fine.finePerDay)}</td>
                          <td className="p-4 text-center font-bold text-dark">{formatLkr(fine.totalFine)}</td>
                          <td className="p-4 text-center">
                            <span className="inline-flex items-center gap-1 text-coral font-bold text-sm">
                              <XCircleIcon size={16} /> Unpaid
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-4 py-2 bg-coral text-white rounded-full text-sm font-bold shadow-lg shadow-coral/30">
                              Pay Fine
                            </motion.button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="p-6 bg-light border-t border-gray-100 flex justify-between items-center">
                <span className="text-medium">Total Unpaid Fines:</span>
                <span className="text-2xl font-extrabold text-coral">
                  {formatLkr(fines.reduce((sum, f) => sum + (Number(f.totalFine) || 0), 0))}
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Inquiries Section */}
        {activeSection === 'inquiries' && (
          <motion.div variants={containerVariants} initial="hidden" animate="show">
            <motion.div variants={itemVariants} className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-extrabold text-dark">My Inquiries</h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowInquiryForm(true)}
                className="px-5 py-2.5 bg-teal text-white rounded-full font-bold shadow-lg shadow-teal/30"
              >
                + New Inquiry
              </motion.button>
            </motion.div>

            {inquiriesError && (
              <motion.div variants={itemVariants} className="mb-4">
                <div className="bg-coral/10 text-coral px-4 py-3 rounded-2xl font-semibold">
                  {inquiriesError}
                </div>
              </motion.div>
            )}

            <motion.div variants={itemVariants} className="space-y-4">
              {inquiriesLoading && (
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 text-medium">
                  Loading inquiries...
                </div>
              )}

              {!inquiriesLoading && inquiries.length === 0 && (
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 text-medium">
                  No inquiries found.
                </div>
              )}

              {!inquiriesLoading && inquiries.map((inquiry) => (
                <div key={inquiry.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-dark text-lg">{inquiry.subject}</h3>
                    {getStatusBadge(inquiry.status)}
                  </div>
                  <p className="text-medium mb-3">{inquiry.message}</p>
                  {inquiry.response && (
                    <div className="bg-teal/5 border border-teal/20 rounded-2xl p-4 mt-4">
                      <p className="text-sm font-bold text-teal mb-1">Admin Response:</p>
                      <p className="text-dark text-sm">{inquiry.response}</p>
                    </div>
                  )}
                  <p className="text-xs text-medium mt-3">Submitted: {inquiry.date}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        )}

        {/* Book Detail Modal */}
        <AnimatePresence>
          {selectedBook && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-dark/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedBook(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className={`w-24 h-32 ${selectedBook.coverColor || 'bg-teal'} rounded-2xl flex items-center justify-center`}>
                    <BookOpenIcon size={40} className="text-white/50" />
                  </div>
                  <button
                    onClick={() => setSelectedBook(null)}
                    className="text-medium hover:text-dark"
                  >
                    <XIcon size={24} />
                  </button>
                </div>
                <div className="mb-2">{getStatusBadge(selectedBook.status)}</div>
                <h2 className="text-2xl font-extrabold text-dark mb-1">{selectedBook.title}</h2>
                <p className="text-medium mb-4">{selectedBook.author}</p>
                <p className="text-dark mb-6">{selectedBook.description || ''}</p>
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-sm bg-light px-3 py-1 rounded-full text-medium font-semibold">
                    {selectedBook.category}
                  </span>
                  <div className="flex items-center gap-1">
                    <StarIcon size={16} className="text-golden fill-golden" />
                    <span className="font-bold text-dark">
                      {(selectedBook.rating || 0).toFixed(1)}
                    </span>
                  </div>
                  <span className="text-sm text-medium">
                    {selectedBook.copies} copies available
                  </span>
                </div>
                <div className="flex gap-3">
                  {selectedBook.status === 'available' && borrowedCount < 3 ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleBorrowNow}
                      className="flex-1 bg-coral text-white py-3 rounded-full font-bold shadow-lg shadow-coral/30"
                    >
                      Borrow Now
                    </motion.button>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleJoinWaitingList}
                      disabled={!!waitingListActionLoading[selectedBook?._id]}
                      className="flex-1 bg-golden text-dark py-3 rounded-full font-bold shadow-lg shadow-golden/30"
                    >
                      Join Waiting List
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-3 bg-white border border-gray-200 rounded-full font-bold text-dark"
                  >
                    <MessageSquareIcon size={20} />
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Inquiry Form Modal */}
        <AnimatePresence>
          {showInquiryForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-dark/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowInquiryForm(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-extrabold text-dark">New Inquiry</h2>
                  <button
                    onClick={() => setShowInquiryForm(false)}
                    className="text-medium hover:text-dark"
                  >
                    <XIcon size={24} />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-dark mb-2">Subject</label>
                    <input
                      type="text"
                      value={inquirySubject}
                      onChange={(e) => setInquirySubject(e.target.value)}
                      className="w-full px-4 py-3 bg-light border border-gray-200 rounded-2xl focus:ring-2 focus:ring-teal focus:border-transparent outline-none"
                      placeholder="What's your inquiry about?"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-dark mb-2">Message</label>
                    <textarea
                      value={inquiryMessage}
                      onChange={(e) => setInquiryMessage(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 bg-light border border-gray-200 rounded-2xl focus:ring-2 focus:ring-teal focus:border-transparent outline-none resize-none"
                      placeholder="Describe your inquiry in detail..."
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSubmitInquiry}
                    disabled={inquirySubmitting}
                    className="w-full bg-teal text-white py-3 rounded-full font-bold shadow-lg shadow-teal/30 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <SendIcon size={18} />
                    Submit Inquiry
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
