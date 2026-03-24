import React, { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  LayoutDashboardIcon,
  BookOpenIcon,
  ClipboardListIcon,
  AlertTriangleIcon,
  MessageSquareIcon,
  FileTextIcon,
  ActivityIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  MailIcon,
  DownloadIcon,
  SearchIcon,
  UsersIcon,
  ClockIcon,
  XIcon,
  ChevronRightIcon,
  SendIcon,
} from 'lucide-react'

import {
  fetchBooks,
  createBook as apiCreateBook,
  updateBook as apiUpdateBook,
  deleteBook as apiDeleteBook,
} from '../api/books'

import {
  approveBorrowRequest,
  fetchBorrowRequestsAdmin,
  rejectBorrowRequest,
  returnBorrowRequest,
} from '../api/borrowRequests'

import { fetchInquiriesAdmin, replyToInquiry } from '../api/inquiries'
import { fetchActivitiesAdmin } from '../api/activities'
import { fetchAdminStats } from '../api/admin'
import { fetchReportCsv } from '../api/reports'

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

function formatIsoDate(date) {
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-CA')
}

const mockBorrowRequests = [
  {
    id: 1,
    studentName: 'Alex Johnson',
    studentId: 'STU001',
    bookTitle: 'Clean Code',
    requestDate: '2024-03-01',
    status: 'pending',
  },
  {
    id: 2,
    studentName: 'Sarah Williams',
    studentId: 'STU002',
    bookTitle: 'Atomic Habits',
    requestDate: '2024-03-01',
    status: 'pending',
  },
  {
    id: 3,
    studentName: 'Mike Chen',
    studentId: 'STU003',
    bookTitle: 'Deep Work',
    requestDate: '2024-02-28',
    status: 'approved',
  },
  {
    id: 4,
    studentName: 'Emma Davis',
    studentId: 'STU004',
    bookTitle: 'Sapiens',
    requestDate: '2024-02-27',
    status: 'approved',
  },
  {
    id: 5,
    studentName: 'James Wilson',
    studentId: 'STU005',
    bookTitle: 'The Lean Startup',
    requestDate: '2024-02-26',
    status: 'rejected',
  },
  {
    id: 6,
    studentName: 'Lisa Brown',
    studentId: 'STU006',
    bookTitle: 'Thinking, Fast and Slow',
    requestDate: '2024-02-25',
    status: 'pending',
  },
]

// Overdue items are computed from real borrow request data.

const mockInquiries = [
  {
    id: 1,
    studentName: 'Alex Johnson',
    subject: 'Book condition issue',
    message:
      'The book I received has some pages missing. Can I get a replacement?',
    date: '2024-03-01',
    status: 'pending',
  },
  {
    id: 2,
    studentName: 'Sarah Williams',
    subject: 'Extended borrowing',
    message: 'Can I extend my borrowing period for finals week?',
    date: '2024-02-28',
    status: 'pending',
  },
  {
    id: 3,
    studentName: 'Mike Chen',
    subject: 'Lost book procedure',
    message: 'I accidentally lost a book. What is the procedure?',
    date: '2024-02-27',
    status: 'answered',
  },
  {
    id: 4,
    studentName: 'Emma Davis',
    subject: 'Reservation question',
    message: 'How long does a reservation last?',
    date: '2024-02-26',
    status: 'answered',
  },
  {
    id: 5,
    studentName: 'James Wilson',
    subject: 'Fine dispute',
    message: 'I believe my fine was calculated incorrectly.',
    date: '2024-02-25',
    status: 'closed',
  },
]

const mockActivityLog = [
  {
    id: 1,
    action: 'Approved borrow request for "Clean Code"',
    admin: 'Admin Sarah',
    timestamp: '10:30 AM',
    type: 'approve',
  },
  {
    id: 2,
    action: 'Added new book "System Design Interview"',
    admin: 'Admin John',
    timestamp: '10:15 AM',
    type: 'add',
  },
  {
    id: 3,
    action: 'Replied to inquiry from Alex Johnson',
    admin: 'Admin Sarah',
    timestamp: '09:45 AM',
    type: 'reply',
  },
  {
    id: 4,
    action: 'Rejected borrow request (book unavailable)',
    admin: 'Admin John',
    timestamp: '09:30 AM',
    type: 'reject',
  },
  {
    id: 5,
    action: 'Updated book details for "Atomic Habits"',
    admin: 'Admin Sarah',
    timestamp: '09:00 AM',
    type: 'update',
  },
  {
    id: 6,
    action: 'Approved borrow request for "Deep Work"',
    admin: 'Admin John',
    timestamp: '08:45 AM',
    type: 'approve',
  },
  {
    id: 7,
    action: 'Sent overdue reminder to 3 students',
    admin: 'Admin Sarah',
    timestamp: '08:30 AM',
    type: 'update',
  },
  {
    id: 8,
    action: 'Generated monthly borrow report',
    admin: 'Admin John',
    timestamp: '08:00 AM',
    type: 'update',
  },
]

const sidebarItems = [
  { key: 'overview', label: 'Dashboard Overview', icon: LayoutDashboardIcon },
  { key: 'books', label: 'Book Management', icon: BookOpenIcon },
  { key: 'requests', label: 'Borrow Requests', icon: ClipboardListIcon },
  { key: 'overdue', label: 'Overdue Tracking', icon: AlertTriangleIcon },
  { key: 'inquiries', label: 'Inquiry Management', icon: MessageSquareIcon },
  { key: 'reports', label: 'Reports', icon: FileTextIcon },
  { key: 'activity', label: 'Activity Log', icon: ActivityIcon },
]

export function AdminDashboardPage() {
  const [activeSection, setActiveSection] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [inquiryFilter, setInquiryFilter] = useState('all')
  const [showAddBookModal, setShowAddBookModal] = useState(false)
  const [showReplyModal, setShowReplyModal] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const [adminStats, setAdminStats] = useState({
    totalBooks: 0,
    activeBorrows: 0,
    pendingRequests: 0,
    overdueBooks: 0,
    openInquiries: 0,
  })
  const [adminStatsLoading, setAdminStatsLoading] = useState(false)
  const [adminStatsError, setAdminStatsError] = useState('')

  const [books, setBooks] = useState([])
  const [booksLoading, setBooksLoading] = useState(false)
  const [booksError, setBooksError] = useState('')
  const [editingBook, setEditingBook] = useState(null)

  const [borrowRequests, setBorrowRequests] = useState([])
  const [borrowRequestsLoading, setBorrowRequestsLoading] = useState(false)
  const [borrowRequestsError, setBorrowRequestsError] = useState('')
  const [borrowRequestActionLoading, setBorrowRequestActionLoading] = useState({})

  const [inquiries, setInquiries] = useState([])
  const [inquiriesLoading, setInquiriesLoading] = useState(false)
  const [inquiriesError, setInquiriesError] = useState('')
  const [replyMessage, setReplyMessage] = useState('')
  const [replySending, setReplySending] = useState(false)

  const [activityLog, setActivityLog] = useState([])
  const [activityLogLoading, setActivityLogLoading] = useState(false)
  const [activityLogError, setActivityLogError] = useState('')

  const [reportDates, setReportDates] = useState({
    borrow: '',
    overdue: '',
    usage: '',
  })
  const [reportLoading, setReportLoading] = useState({})
  const [reportsError, setReportsError] = useState('')

  const [bookTitle, setBookTitle] = useState('')
  const [bookAuthor, setBookAuthor] = useState('')
  const [bookCategory, setBookCategory] = useState('Design')
  const [bookTotalCopies, setBookTotalCopies] = useState(1)
  const [bookFormErrors, setBookFormErrors] = useState({})

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  const stats = [
    {
      label: 'Total Books',
      value: adminStatsLoading ? '—' : String(adminStats.totalBooks ?? 0),
      icon: BookOpenIcon,
      color: 'bg-coral/10 text-coral',
    },
    {
      label: 'Active Borrows',
      value: adminStatsLoading ? '—' : String(adminStats.activeBorrows ?? 0),
      icon: ClipboardListIcon,
      color: 'bg-teal/10 text-teal',
    },
    {
      label: 'Pending Requests',
      value: adminStatsLoading ? '—' : String(adminStats.pendingRequests ?? 0),
      icon: ClockIcon,
      color: 'bg-golden/20 text-yellow-700',
    },
    {
      label: 'Overdue Books',
      value: adminStatsLoading ? '—' : String(adminStats.overdueBooks ?? 0),
      icon: AlertTriangleIcon,
      color: 'bg-coral/10 text-coral',
    },
    {
      label: 'Open Inquiries',
      value: adminStatsLoading ? '—' : String(adminStats.openInquiries ?? 0),
      icon: MessageSquareIcon,
      color: 'bg-teal/10 text-teal',
    },
  ]

  const loadAdminStats = async () => {
    setAdminStatsError('')
    setAdminStatsLoading(true)
    try {
      const data = await fetchAdminStats()
      setAdminStats({
        totalBooks: Number(data?.totalBooks) || 0,
        activeBorrows: Number(data?.activeBorrows) || 0,
        pendingRequests: Number(data?.pendingRequests) || 0,
        overdueBooks: Number(data?.overdueBooks) || 0,
        openInquiries: Number(data?.openInquiries) || 0,
      })
    } catch (e) {
      setAdminStatsError(e?.response?.data?.message || 'Failed to load stats')
    } finally {
      setAdminStatsLoading(false)
    }
  }

  useEffect(() => {
    if (activeSection === 'overview') {
      loadAdminStats()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection])

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

  const getActivityIcon = (type) => {
    switch (type) {
      case 'approve':
        return <CheckCircleIcon size={16} className="text-teal" />
      case 'reject':
        return <XCircleIcon size={16} className="text-coral" />
      case 'add':
        return <PlusIcon size={16} className="text-golden" />
      case 'reply':
        return <MessageSquareIcon size={16} className="text-teal" />
      case 'update':
        return <EditIcon size={16} className="text-medium" />
      default:
        return <ActivityIcon size={16} className="text-medium" />
    }
  }

  const filteredInquiries = inquiries.filter((inq) => {
    if (inquiryFilter === 'all') return true
    return inq.status === inquiryFilter
  })

  const filteredBooks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return books

    return books.filter((b) => {
      const title = (b.title || '').toLowerCase()
      const author = (b.author || '').toLowerCase()
      return title.includes(q) || author.includes(q)
    })
  }, [books, searchQuery])

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
    if (activeSection === 'books') {
      loadBooks()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection])

  const loadBorrowRequests = async () => {
    setBorrowRequestsError('')
    setBorrowRequestsLoading(true)
    try {
      const data = await fetchBorrowRequestsAdmin()
      setBorrowRequests(Array.isArray(data) ? data : [])
    } catch (e) {
      setBorrowRequestsError(
        e?.response?.data?.message || 'Failed to load borrow requests'
      )
    } finally {
      setBorrowRequestsLoading(false)
    }
  }

  const setRequestActionLoading = (requestId, isLoading) => {
    setBorrowRequestActionLoading((prev) => ({
      ...prev,
      [requestId]: isLoading,
    }))
  }

  const handleApproveRequest = async (request) => {
    if (!request?._id) return
    setBorrowRequestsError('')
    setRequestActionLoading(request._id, true)
    try {
      const updated = await approveBorrowRequest(request._id)
      setBorrowRequests((prev) =>
        prev.map((r) => (r._id === request._id ? updated : r))
      )
    } catch (e) {
      setBorrowRequestsError(
        e?.response?.data?.message || 'Failed to approve request'
      )
    } finally {
      setRequestActionLoading(request._id, false)
    }
  }

  const handleRejectRequest = async (request) => {
    if (!request?._id) return
    setBorrowRequestsError('')
    setRequestActionLoading(request._id, true)
    try {
      const updated = await rejectBorrowRequest(request._id)
      setBorrowRequests((prev) =>
        prev.map((r) => (r._id === request._id ? updated : r))
      )
    } catch (e) {
      setBorrowRequestsError(
        e?.response?.data?.message || 'Failed to reject request'
      )
    } finally {
      setRequestActionLoading(request._id, false)
    }
  }

  const handleReturnRequest = async (request) => {
    if (!request?._id) return
    setBorrowRequestsError('')
    setRequestActionLoading(request._id, true)
    try {
      const updated = await returnBorrowRequest(request._id)
      setBorrowRequests((prev) =>
        prev.map((r) => (r._id === request._id ? updated : r))
      )
    } catch (e) {
      setBorrowRequestsError(
        e?.response?.data?.message || 'Failed to mark as returned'
      )
    } finally {
      setRequestActionLoading(request._id, false)
    }
  }

  useEffect(() => {
    if (activeSection === 'requests' || activeSection === 'overdue') {
      loadBorrowRequests()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection])

  const overdueItems = useMemo(() => {
    const today = new Date()

    return (Array.isArray(borrowRequests) ? borrowRequests : [])
      .filter((r) => r?.status === 'approved' && !r?.returnedAt)
      .map((r) => {
        const borrowedAt = r?.borrowedAt
          ? new Date(r.borrowedAt)
          : r?.createdAt
            ? new Date(r.createdAt)
            : null
        if (!borrowedAt || Number.isNaN(borrowedAt.getTime())) return null

        const dueDate = r?.dueAt ? new Date(r.dueAt) : (() => {
          const d = new Date(borrowedAt)
          d.setDate(d.getDate() + BORROW_PERIOD_DAYS)
          return d
        })()

        const daysLate = Math.max(0, daysBetween(today, dueDate))
        if (daysLate <= 0) return null

        const fineAmount = daysLate * FINE_PER_DAY_LKR

        return {
          id: r._id,
          studentName: r.user?.fullname || '—',
          studentEmail: r.user?.email || '—',
          bookTitle: r.book?.title || '—',
          dueDate,
          daysLate,
          fineAmount,
        }
      })
      .filter(Boolean)
      .sort((a, b) => (b.daysLate || 0) - (a.daysLate || 0))
  }, [borrowRequests])

  const loadInquiries = async () => {
    setInquiriesError('')
    setInquiriesLoading(true)
    try {
      const data = await fetchInquiriesAdmin()
      const normalized = (Array.isArray(data) ? data : []).map((inq) => ({
        id: inq._id,
        studentName: inq.user?.fullname || '—',
        subject: inq.subject || '',
        message: inq.message || '',
        date: inq.createdAt
          ? new Date(inq.createdAt).toLocaleDateString()
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
      loadInquiries()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection])

  const setReportIsLoading = (reportType, isLoading) => {
    setReportLoading((prev) => ({
      ...prev,
      [reportType]: isLoading,
    }))
  }

  const getReportErrorMessage = async (error) => {
    const maybeBlob = error?.response?.data
    if (typeof Blob !== 'undefined' && maybeBlob instanceof Blob) {
      try {
        const text = await maybeBlob.text()
        try {
          const json = JSON.parse(text)
          return json?.message || 'Failed to generate report'
        } catch {
          return text || 'Failed to generate report'
        }
      } catch {
        return 'Failed to generate report'
      }
    }

    return error?.response?.data?.message || error?.message || 'Failed to generate report'
  }

  const handleGenerateReport = async (reportType) => {
    const date = reportDates?.[reportType]
    setReportsError('')
    if (!date) {
      setReportsError('Please select a date to generate the report')
      return
    }

    setReportIsLoading(reportType, true)
    try {
      const { blob, filename } = await fetchReportCsv(reportType, date)

      const downloadFilename =
        filename || `${reportType}-report-${String(date).trim() || 'date'}.csv`

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = downloadFilename
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      const message = await getReportErrorMessage(e)
      setReportsError(message)
    } finally {
      setReportIsLoading(reportType, false)
    }
  }

  const handleGenerateOverdueReportNow = async () => {
    const today = new Date().toISOString().slice(0, 10)
    const reportType = 'overdue'

    setReportsError('')
    setReportIsLoading(reportType, true)
    try {
      const { blob, filename } = await fetchReportCsv(reportType, today)
      const downloadFilename =
        filename || `${reportType}-report-${String(today).trim() || 'date'}.csv`

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = downloadFilename
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      const message = await getReportErrorMessage(e)
      setReportsError(message)
    } finally {
      setReportIsLoading(reportType, false)
    }
  }

  const loadActivityLog = async () => {
    setActivityLogError('')
    setActivityLogLoading(true)
    try {
      const data = await fetchActivitiesAdmin(50)
      const normalized = (Array.isArray(data) ? data : []).map((a) => ({
        id: a._id,
        action: a.action || '',
        admin: a.admin?.fullname || '—',
        timestamp: a.createdAt
          ? new Date(a.createdAt).toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit',
            })
          : '',
        type: a.type || 'update',
      }))
      setActivityLog(normalized)
    } catch (e) {
      setActivityLogError(
        e?.response?.data?.message || 'Failed to load activity log'
      )
    } finally {
      setActivityLogLoading(false)
    }
  }

  useEffect(() => {
    if (activeSection === 'overview' || activeSection === 'activity') {
      loadActivityLog()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection])

  const handleOpenReplyModal = (inquiry) => {
    setShowReplyModal(inquiry)
    setReplyMessage('')
  }

  const handleSendReply = async () => {
    if (!showReplyModal?.id) return
    const response = replyMessage.trim()
    if (!response) return

    setReplySending(true)
    try {
      const updated = await replyToInquiry(showReplyModal.id, { response })
      const normalized = {
        id: updated._id,
        studentName: updated.user?.fullname || '—',
        subject: updated.subject || '',
        message: updated.message || '',
        date: updated.createdAt ? new Date(updated.createdAt).toLocaleDateString() : '',
        status: updated.status || 'answered',
        response: updated.response || '',
      }

      setInquiries((prev) => prev.map((i) => (i.id === normalized.id ? normalized : i)))
      setShowReplyModal(null)
      setReplyMessage('')
    } catch (e) {
      setInquiriesError(e?.response?.data?.message || 'Failed to send reply')
    } finally {
      setReplySending(false)
    }
  }

  const resetBookForm = () => {
    setBookTitle('')
    setBookAuthor('')
    setBookCategory('Design')
    setBookTotalCopies(1)
    setBookFormErrors({})
  }

  const openAddBookModal = () => {
    setEditingBook(null)
    resetBookForm()
    setShowAddBookModal(true)
  }

  const openEditBookModal = (book) => {
    setEditingBook(book)
    setBookTitle(book?.title || '')
    setBookAuthor(book?.author || '')
    setBookCategory(book?.category || 'Design')
    setBookTotalCopies(
      typeof book?.totalCopies === 'number' ? book.totalCopies : 1
    )
    setBookFormErrors({})
    setShowAddBookModal(true)
  }

  const handleSubmitBook = async () => {
    const title = bookTitle.trim()
    const author = bookAuthor.trim()
    const category = String(bookCategory || '').trim()
    const totalCopies = Number(bookTotalCopies)

    const errors = {}
    if (!title) errors.title = 'Title is required'
    if (!author) errors.author = 'Author is required'
    if (!category) errors.category = 'Category is required'
    if (title && /[^A-Za-z\s]/.test(title)) {
      errors.title = 'Title cannot contain numbers or symbols'
    }
    if (author && /[^A-Za-z\s]/.test(author)) {
      errors.author = 'Author cannot contain numbers or symbols'
    }
    if (Number.isNaN(totalCopies)) {
      errors.totalCopies = 'Number of copies must be a number'
    } else if (!Number.isInteger(totalCopies)) {
      errors.totalCopies = 'Number of copies must be a whole number'
    } else if (totalCopies < 1) {
      errors.totalCopies = 'Number of copies must be at least 1'
    }

    if (Object.keys(errors).length > 0) {
      setBookFormErrors(errors)
      return
    }

    const payload = {
      title,
      author,
      category,
      totalCopies,
      copies: totalCopies,
    }

    try {
      if (editingBook?._id) {
        await apiUpdateBook(editingBook._id, payload)
        toast.success('Book updated successfully')
      } else {
        await apiCreateBook(payload)
        toast.success('Book added successfully')
      }
      setShowAddBookModal(false)
      setEditingBook(null)
      await loadBooks()
    } catch (e) {
      setBooksError(e?.response?.data?.message || 'Failed to save book')
    }
  }

  const handleDeleteBook = async (book) => {
    try {
      await apiDeleteBook(book._id)
      await loadBooks()
    } catch (e) {
      setBooksError(e?.response?.data?.message || 'Failed to delete book')
    }
  }

  return (
    <div className="min-h-screen bg-light flex">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-100 p-4 flex-shrink-0 transition-all duration-300 hidden lg:block`}
      >
        <div className="mb-8">
          <h2
            className={`font-extrabold text-dark ${sidebarOpen ? 'text-xl' : 'text-sm text-center'}`}
          >
            {sidebarOpen ? 'Admin Panel' : '🛡️'}
          </h2>
        </div>
        <nav className="space-y-2">
          {sidebarItems.map((item) => (
            <motion.button
              key={item.key}
              onClick={() => setActiveSection(item.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold transition-all ${activeSection === item.key ? 'bg-teal text-white shadow-lg shadow-teal/30' : 'text-medium hover:bg-light hover:text-dark'}`}
              whileHover={{ x: 4 }}
            >
              <item.icon size={20} />
              {sidebarOpen && <span>{item.label}</span>}
            </motion.button>
          ))}
        </nav>
      </motion.aside>

      {/* Mobile Sidebar Toggle */}
      <div className="lg:hidden fixed bottom-6 left-6 z-50">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-teal text-white p-4 rounded-full shadow-lg"
        >
          <LayoutDashboardIcon size={24} />
        </motion.button>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-8 overflow-auto">
        <div className="max-w-6xl mx-auto">
          {/* Overview Section */}
          {activeSection === 'overview' && (
            <motion.div variants={containerVariants} initial="hidden" animate="show">
              <motion.div variants={itemVariants} className="mb-8">
                <h1 className="text-3xl font-extrabold text-dark mb-2">
                  Dashboard Overview 🛡️
                </h1>
                <p className="text-medium">
                  Welcome back, Admin. Here's what's happening today.
                </p>
              </motion.div>

              {adminStatsError && (
                <motion.div variants={itemVariants} className="mb-4">
                  <div className="bg-coral/10 text-coral px-4 py-3 rounded-2xl font-semibold">
                    {adminStatsError}
                  </div>
                </motion.div>
              )}

              <motion.div
                variants={itemVariants}
                className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8"
              >
                {stats.map((stat, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100"
                  >
                    <div
                      className={`w-12 h-12 ${stat.color} rounded-2xl flex items-center justify-center mb-3`}
                    >
                      <stat.icon size={24} />
                    </div>
                    <p className="text-2xl font-extrabold text-dark">
                      {stat.value}
                    </p>
                    <p className="text-sm text-medium">{stat.label}</p>
                  </div>
                ))}
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
              >
                <h2 className="text-xl font-extrabold text-dark mb-4">
                  Recent Activity
                </h2>
                {activityLogError && (
                  <div className="bg-coral/10 text-coral px-4 py-3 rounded-2xl font-semibold mb-4">
                    {activityLogError}
                  </div>
                )}
                <div className="space-y-3">
                  {activityLogLoading && (
                    <div className="p-3 bg-light rounded-2xl text-medium">
                      Loading activity...
                    </div>
                  )}

                  {!activityLogLoading && activityLog.length === 0 && (
                    <div className="p-3 bg-light rounded-2xl text-medium">
                      No activity yet.
                    </div>
                  )}

                  {!activityLogLoading && activityLog.slice(0, 5).map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center gap-4 p-3 bg-light rounded-2xl"
                    >
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        {getActivityIcon(log.type)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-dark">
                          {log.action}
                        </p>
                        <p className="text-xs text-medium">{log.admin}</p>
                      </div>
                      <span className="text-xs text-medium">
                        {log.timestamp}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Book Management Section */}
          {activeSection === 'books' && (
            <motion.div variants={containerVariants} initial="hidden" animate="show">
              <motion.div
                variants={itemVariants}
                className="flex justify-between items-center mb-8"
              >
                <div>
                  <h1 className="text-3xl font-extrabold text-dark mb-2">
                    Book Management 📚
                  </h1>
                  <p className="text-medium">
                    Add, update, or remove books from the library.
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={openAddBookModal}
                  className="flex items-center gap-2 px-5 py-3 bg-teal text-white rounded-full font-bold shadow-lg shadow-teal/30"
                >
                  <PlusIcon size={20} />
                  Add New Book
                </motion.button>
              </motion.div>

              <motion.div variants={itemVariants} className="mb-6">
                <div className="relative max-w-md">
                  <SearchIcon
                    size={20}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-medium"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search books..."
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-teal focus:border-transparent outline-none"
                  />
                </div>
              </motion.div>

              {booksError && (
                <motion.div variants={itemVariants} className="mb-4">
                  <div className="bg-coral/10 text-coral px-4 py-3 rounded-2xl font-semibold">
                    {booksError}
                  </div>
                </motion.div>
              )}

              <motion.div
                variants={itemVariants}
                className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-light">
                      <tr>
                        <th className="text-left p-4 font-bold text-dark">Book</th>
                        <th className="text-left p-4 font-bold text-dark">
                          Category
                        </th>
                        <th className="text-center p-4 font-bold text-dark">
                          Status
                        </th>
                        <th className="text-center p-4 font-bold text-dark">
                          Copies
                        </th>
                        <th className="text-right p-4 font-bold text-dark">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {booksLoading && (
                        <tr>
                          <td className="p-6 text-center text-medium" colSpan={5}>
                            Loading books...
                          </td>
                        </tr>
                      )}

                      {!booksLoading && filteredBooks.length === 0 && (
                        <tr>
                          <td className="p-6 text-center text-medium" colSpan={5}>
                            No books found.
                          </td>
                        </tr>
                      )}

                      {!booksLoading &&
                        filteredBooks.map((book) => {
                          const status =
                            book.status || (book.copies > 0 ? 'available' : 'borrowed')

                          return (
                            <tr key={book._id} className="hover:bg-light/50">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-10 h-14 ${book.coverColor || 'bg-teal'} rounded-lg flex items-center justify-center`}
                                  >
                                    <BookOpenIcon size={16} className="text-white/50" />
                                  </div>
                                  <div>
                                    <p className="font-bold text-dark">{book.title}</p>
                                    <p className="text-sm text-medium">{book.author}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <span className="px-3 py-1 bg-light rounded-full text-sm font-semibold text-medium">
                                  {book.category}
                                </span>
                              </td>
                              <td className="p-4 text-center">{getStatusBadge(status)}</td>
                              <td className="p-4 text-center">
                                <span className="font-bold text-dark">{book.copies}</span>
                                <span className="text-medium">/{book.totalCopies}</span>
                              </td>
                              <td className="p-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => openEditBookModal(book)}
                                    className="p-2 bg-light rounded-xl text-medium hover:text-teal"
                                  >
                                    <EditIcon size={16} />
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleDeleteBook(book)}
                                    className="p-2 bg-light rounded-xl text-medium hover:text-coral"
                                  >
                                    <TrashIcon size={16} />
                                  </motion.button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Borrow Requests Section */}
          {activeSection === 'requests' && (
            <motion.div variants={containerVariants} initial="hidden" animate="show">
              <motion.div variants={itemVariants} className="mb-8">
                <h1 className="text-3xl font-extrabold text-dark mb-2">
                  Borrow Requests 📋
                </h1>
                <p className="text-medium">
                  Review and manage student borrow requests.
                </p>
              </motion.div>

              {borrowRequestsError && (
                <motion.div variants={itemVariants} className="mb-4">
                  <div className="bg-coral/10 text-coral px-4 py-3 rounded-2xl font-semibold">
                    {borrowRequestsError}
                  </div>
                </motion.div>
              )}

              <motion.div
                variants={itemVariants}
                className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-light">
                      <tr>
                        <th className="text-left p-4 font-bold text-dark">Student</th>
                        <th className="text-left p-4 font-bold text-dark">Book</th>
                        <th className="text-center p-4 font-bold text-dark">Date</th>
                        <th className="text-center p-4 font-bold text-dark">Status</th>
                        <th className="text-right p-4 font-bold text-dark">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {borrowRequestsLoading && (
                        <tr>
                          <td className="p-6 text-center text-medium" colSpan={5}>
                            Loading requests...
                          </td>
                        </tr>
                      )}

                      {!borrowRequestsLoading && borrowRequests.length === 0 && (
                        <tr>
                          <td className="p-6 text-center text-medium" colSpan={5}>
                            No borrow requests found.
                          </td>
                        </tr>
                      )}

                      {!borrowRequestsLoading &&
                        borrowRequests.map((request) => (
                        <tr key={request._id} className="hover:bg-light/50">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-teal/10 rounded-full flex items-center justify-center">
                                <UsersIcon size={16} className="text-teal" />
                              </div>
                              <div>
                                <p className="font-bold text-dark">{request.user?.fullname || '—'}</p>
                                <p className="text-xs text-medium">{request.user?._id || '—'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 font-semibold text-dark">{request.book?.title || '—'}</td>
                          <td className="p-4 text-center text-medium">
                            {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : '—'}
                          </td>
                          <td className="p-4 text-center">{getStatusBadge(request.status)}</td>
                          <td className="p-4 text-right">
                            {request.status === 'pending' && (
                              <div className="flex justify-end gap-2">
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleApproveRequest(request)}
                                  disabled={!!borrowRequestActionLoading[request._id]}
                                  className="px-4 py-2 bg-teal text-white rounded-full text-sm font-bold disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                  Approve
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleRejectRequest(request)}
                                  disabled={!!borrowRequestActionLoading[request._id]}
                                  className="px-4 py-2 bg-coral text-white rounded-full text-sm font-bold disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                  Reject
                                </motion.button>
                              </div>
                            )}

                            {request.status === 'approved' && !request.returnedAt && (
                              <div className="flex justify-end">
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleReturnRequest(request)}
                                  disabled={!!borrowRequestActionLoading[request._id]}
                                  className="px-4 py-2 bg-golden text-dark rounded-full text-sm font-bold disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                  Mark Returned
                                </motion.button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Overdue Tracking Section */}
          {activeSection === 'overdue' && (
            <motion.div variants={containerVariants} initial="hidden" animate="show">
              <motion.div
                variants={itemVariants}
                className="flex justify-between items-center mb-8"
              >
                <div>
                  <h1 className="text-3xl font-extrabold text-dark mb-2">
                    Overdue Tracking ⚠️
                  </h1>
                  <p className="text-medium">
                    Monitor late returns and send reminders.
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleGenerateOverdueReportNow}
                  disabled={!!reportLoading?.overdue}
                  className={`flex items-center gap-2 px-5 py-3 bg-coral text-white rounded-full font-bold shadow-lg shadow-coral/30 ${
                    reportLoading?.overdue ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                >
                  <DownloadIcon size={20} />
                  {reportLoading?.overdue ? 'Generating...' : 'Generate Report'}
                </motion.button>
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-light">
                      <tr>
                        <th className="text-left p-4 font-bold text-dark">Student</th>
                        <th className="text-left p-4 font-bold text-dark">Book</th>
                        <th className="text-center p-4 font-bold text-dark">Due Date</th>
                        <th className="text-center p-4 font-bold text-dark">Days Late</th>
                        <th className="text-center p-4 font-bold text-dark">Fine</th>
                        <th className="text-right p-4 font-bold text-dark">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {borrowRequestsLoading && (
                        <tr>
                          <td className="p-6 text-center text-medium" colSpan={6}>
                            Loading overdue items...
                          </td>
                        </tr>
                      )}

                      {!borrowRequestsLoading && borrowRequestsError && (
                        <tr>
                          <td className="p-6 text-center text-coral font-semibold" colSpan={6}>
                            {borrowRequestsError}
                          </td>
                        </tr>
                      )}

                      {!borrowRequestsLoading && !borrowRequestsError && overdueItems.length === 0 && (
                        <tr>
                          <td className="p-6 text-center text-medium" colSpan={6}>
                            No overdue books.
                          </td>
                        </tr>
                      )}

                      {!borrowRequestsLoading && !borrowRequestsError && overdueItems.map((item) => (
                        <tr key={item.id} className="hover:bg-light/50">
                          <td className="p-4">
                            <p className="font-bold text-dark">{item.studentName}</p>
                            <p className="text-xs text-medium">{item.studentEmail}</p>
                          </td>
                          <td className="p-4 font-semibold text-dark">{item.bookTitle}</td>
                          <td className="p-4 text-center text-medium">{formatIsoDate(item.dueDate)}</td>
                          <td className="p-4 text-center">
                            <span className="px-3 py-1 bg-coral/10 text-coral font-bold rounded-full">
                              {item.daysLate} days
                            </span>
                          </td>
                          <td className="p-4 text-center font-bold text-dark">
                            {formatLkr(item.fineAmount)}
                          </td>
                          <td className="p-4 text-right">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="flex items-center gap-2 px-4 py-2 bg-golden text-dark rounded-full text-sm font-bold ml-auto"
                            >
                              <MailIcon size={16} />
                              Send Reminder
                            </motion.button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Inquiry Management Section */}
          {activeSection === 'inquiries' && (
            <motion.div variants={containerVariants} initial="hidden" animate="show">
              <motion.div variants={itemVariants} className="mb-8">
                <h1 className="text-3xl font-extrabold text-dark mb-2">
                  Inquiry Management 💬
                </h1>
                <p className="text-medium">View and respond to student inquiries.</p>
              </motion.div>

              {inquiriesError && (
                <motion.div variants={itemVariants} className="mb-4">
                  <div className="bg-coral/10 text-coral px-4 py-3 rounded-2xl font-semibold">
                    {inquiriesError}
                  </div>
                </motion.div>
              )}

              <motion.div variants={itemVariants} className="flex gap-2 mb-6">
                {['all', 'pending', 'answered', 'closed'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setInquiryFilter(filter)}
                    className={`px-4 py-2 rounded-full text-sm font-bold capitalize transition-all ${inquiryFilter === filter ? 'bg-teal text-white' : 'bg-white text-medium border border-gray-200'}`}
                  >
                    {filter}
                  </button>
                ))}
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-4">
                {inquiriesLoading && (
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 text-medium">
                    Loading inquiries...
                  </div>
                )}

                {!inquiriesLoading && filteredInquiries.length === 0 && (
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 text-medium">
                    No inquiries found.
                  </div>
                )}

                {!inquiriesLoading && filteredInquiries.map((inquiry) => (
                  <div
                    key={inquiry.id}
                    className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-dark text-lg">{inquiry.subject}</h3>
                        <p className="text-sm text-medium">
                          From: {inquiry.studentName} • {inquiry.date}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(inquiry.status)}
                        {inquiry.status === 'pending' && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleOpenReplyModal(inquiry)}
                            className="px-4 py-2 bg-teal text-white rounded-full text-sm font-bold"
                          >
                            Reply
                          </motion.button>
                        )}
                      </div>
                    </div>
                    <p className="text-dark">{inquiry.message}</p>
                    {inquiry.response && (
                      <div className="bg-teal/5 border border-teal/20 rounded-2xl p-4 mt-4">
                        <p className="text-sm font-bold text-teal mb-1">Admin Response:</p>
                        <p className="text-dark text-sm">{inquiry.response}</p>
                      </div>
                    )}
                  </div>
                ))}
              </motion.div>
            </motion.div>
          )}

          {/* Reports Section */}
          {activeSection === 'reports' && (
            <motion.div variants={containerVariants} initial="hidden" animate="show">
              <motion.div variants={itemVariants} className="mb-8">
                <h1 className="text-3xl font-extrabold text-dark mb-2">Reports 📊</h1>
                <p className="text-medium">Generate and download system reports.</p>
              </motion.div>

              {reportsError && (
                <motion.div variants={itemVariants} className="mb-4">
                  <div className="bg-coral/10 text-coral px-4 py-3 rounded-2xl font-semibold">
                    {reportsError}
                  </div>
                </motion.div>
              )}

              <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    type: 'borrow',
                    title: 'Borrow Report',
                    desc: 'All borrowing activity',
                    icon: ClipboardListIcon,
                    color: 'bg-teal',
                  },
                  {
                    type: 'overdue',
                    title: 'Overdue Report',
                    desc: 'Late returns and fines',
                    icon: AlertTriangleIcon,
                    color: 'bg-coral',
                  },
                  {
                    type: 'usage',
                    title: 'Usage Report',
                    desc: 'Library usage statistics',
                    icon: ActivityIcon,
                    color: 'bg-golden',
                  },
                ].map((report, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
                  >
                    <div
                      className={`w-14 h-14 ${report.color} rounded-2xl flex items-center justify-center mb-4`}
                    >
                      <report.icon size={28} className="text-white" />
                    </div>
                    <h3 className="font-extrabold text-dark text-xl mb-2">{report.title}</h3>
                    <p className="text-medium mb-4">{report.desc}</p>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-bold text-dark">Date Range</label>
                        <input
                          type="date"
                          value={reportDates?.[report.type] || ''}
                          onChange={(e) => {
                            setReportsError('')
                            setReportDates((prev) => ({
                              ...prev,
                              [report.type]: e.target.value,
                            }))
                          }}
                          className="w-full mt-1 px-4 py-2 bg-light border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal outline-none"
                        />
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => handleGenerateReport(report.type)}
                        disabled={!reportDates?.[report.type] || !!reportLoading?.[report.type]}
                        className={`w-full py-3 bg-dark text-white rounded-full font-bold flex items-center justify-center gap-2 ${
                          !reportDates?.[report.type] || !!reportLoading?.[report.type]
                            ? 'opacity-60 cursor-not-allowed'
                            : ''
                        }`}
                      >
                        <DownloadIcon size={18} />
                        {reportLoading?.[report.type] ? 'Generating...' : 'Generate'}
                      </motion.button>
                    </div>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          )}

          {/* Activity Log Section */}
          {activeSection === 'activity' && (
            <motion.div variants={containerVariants} initial="hidden" animate="show">
              <motion.div variants={itemVariants} className="mb-8">
                <h1 className="text-3xl font-extrabold text-dark mb-2">Activity Log 📝</h1>
                <p className="text-medium">Track all admin actions and system changes.</p>
              </motion.div>

              {activityLogError && (
                <motion.div variants={itemVariants} className="mb-4">
                  <div className="bg-coral/10 text-coral px-4 py-3 rounded-2xl font-semibold">
                    {activityLogError}
                  </div>
                </motion.div>
              )}

              <motion.div
                variants={itemVariants}
                className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
              >
                <div className="space-y-4">
                  {activityLogLoading && (
                    <div className="text-medium">Loading activity log...</div>
                  )}

                  {!activityLogLoading && activityLog.length === 0 && (
                    <div className="text-medium">No activity yet.</div>
                  )}

                  {!activityLogLoading && activityLog.map((log, idx) => (
                    <div key={log.id} className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 bg-light rounded-xl flex items-center justify-center">
                          {getActivityIcon(log.type)}
                        </div>
                        {idx < activityLog.length - 1 && (
                          <div className="w-0.5 h-8 bg-gray-200 mt-2"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="font-semibold text-dark">{log.action}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-medium">{log.admin}</span>
                          <ChevronRightIcon size={14} className="text-medium" />
                          <span className="text-sm text-medium">{log.timestamp}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Add/Edit Book Modal */}
      <AnimatePresence>
        {showAddBookModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-dark/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowAddBookModal(false)
              setEditingBook(null)
              setBookFormErrors({})
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-extrabold text-dark">
                  {editingBook ? 'Edit Book' : 'Add New Book'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddBookModal(false)
                    setEditingBook(null)
                  }}
                  className="text-medium hover:text-dark"
                >
                  <XIcon size={24} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-dark mb-2">Title</label>
                  <input
                    type="text"
                    required
                    value={bookTitle}
                    onChange={(e) => {
                      const nextValue = e.target.value
                      if (/^[A-Za-z\s]*$/.test(nextValue)) {
                        setBookTitle(nextValue)
                        if (bookFormErrors.title) {
                          setBookFormErrors((prev) => ({ ...prev, title: undefined }))
                        }
                      } else {
                        setBookFormErrors((prev) => ({
                          ...prev,
                          title: 'Title cannot contain numbers or symbols',
                        }))
                      }
                    }}
                    className={`w-full px-4 py-3 bg-light border rounded-2xl focus:ring-2 focus:ring-teal outline-none ${bookFormErrors.title ? 'border-coral' : 'border-gray-200'}`}
                  />
                  {bookFormErrors.title && (
                    <p className="text-xs text-coral font-semibold mt-1">{bookFormErrors.title}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-dark mb-2">Author</label>
                  <input
                    type="text"
                    required
                    value={bookAuthor}
                    onChange={(e) => {
                      const nextValue = e.target.value
                      if (/^[A-Za-z\s]*$/.test(nextValue)) {
                        setBookAuthor(nextValue)
                        if (bookFormErrors.author) {
                          setBookFormErrors((prev) => ({ ...prev, author: undefined }))
                        }
                      } else {
                        setBookFormErrors((prev) => ({
                          ...prev,
                          author: 'Author cannot contain numbers or symbols',
                        }))
                      }
                    }}
                    className={`w-full px-4 py-3 bg-light border rounded-2xl focus:ring-2 focus:ring-teal outline-none ${bookFormErrors.author ? 'border-coral' : 'border-gray-200'}`}
                  />
                  {bookFormErrors.author && (
                    <p className="text-xs text-coral font-semibold mt-1">{bookFormErrors.author}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-dark mb-2">Category</label>
                  <select
                    required
                    value={bookCategory}
                    onChange={(e) => {
                      setBookCategory(e.target.value)
                      if (bookFormErrors.category) {
                        setBookFormErrors((prev) => ({ ...prev, category: undefined }))
                      }
                    }}
                    className={`w-full px-4 py-3 bg-light border rounded-2xl focus:ring-2 focus:ring-teal outline-none ${bookFormErrors.category ? 'border-coral' : 'border-gray-200'}`}
                  >
                    <option>Design</option>
                    <option>Programming</option>
                    <option>Psychology</option>
                    <option>Business</option>
                    <option>Self-Help</option>
                    <option>History</option>
                    <option>Productivity</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-dark mb-2">Number of Copies</label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={bookTotalCopies}
                    onChange={(e) => {
                      setBookTotalCopies(e.target.value)
                      if (bookFormErrors.totalCopies) {
                        setBookFormErrors((prev) => ({ ...prev, totalCopies: undefined }))
                      }
                    }}
                    className={`w-full px-4 py-3 bg-light border rounded-2xl focus:ring-2 focus:ring-teal outline-none ${bookFormErrors.totalCopies ? 'border-coral' : 'border-gray-200'}`}
                  />
                  {bookFormErrors.totalCopies && (
                    <p className="text-xs text-coral font-semibold mt-1">{bookFormErrors.totalCopies}</p>
                  )}
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmitBook}
                  className="w-full bg-teal text-white py-3 rounded-full font-bold shadow-lg shadow-teal/30 mt-4"
                >
                  {editingBook ? 'Update Book' : 'Add Book'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reply Modal */}
      <AnimatePresence>
        {showReplyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-dark/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowReplyModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-extrabold text-dark">Reply to Inquiry</h2>
                <button
                  onClick={() => setShowReplyModal(null)}
                  className="text-medium hover:text-dark"
                >
                  <XIcon size={24} />
                </button>
              </div>
              <div className="bg-light rounded-2xl p-4 mb-4">
                <p className="font-bold text-dark mb-1">{showReplyModal.subject}</p>
                <p className="text-sm text-medium mb-2">From: {showReplyModal.studentName}</p>
                <p className="text-dark">{showReplyModal.message}</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-dark mb-2">Your Response</label>
                <textarea
                  rows={4}
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="w-full px-4 py-3 bg-light border border-gray-200 rounded-2xl focus:ring-2 focus:ring-teal outline-none resize-none"
                  placeholder="Type your response..."
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSendReply}
                disabled={replySending || !replyMessage.trim()}
                className="w-full bg-teal text-white py-3 rounded-full font-bold shadow-lg shadow-teal/30 mt-4 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <SendIcon size={18} />
                Send Reply
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
