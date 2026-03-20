import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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

const mockBooks = [
    {
        id: 1,
        title: 'The Design of Everyday Things',
        author: 'Don Norman',
        category: 'Design',
        status: 'available',
        copies: 3,
        totalCopies: 5,
        coverColor: 'bg-coral',
    },
    {
        id: 2,
        title: 'Thinking, Fast and Slow',
        author: 'Daniel Kahneman',
        category: 'Psychology',
        status: 'borrowed',
        copies: 0,
        totalCopies: 3,
        coverColor: 'bg-teal',
    },
]

const mockBorrowRequests = [
    {
        id: 1,
        studentName: 'Alex Johnson',
        studentId: 'STU001',
        bookTitle: 'Clean Code',
        requestDate: '2024-03-01',
        status: 'pending',
    },
]

const mockOverdueItems = [
    {
        id: 1,
        studentName: 'Alex Johnson',
        studentEmail: 'alex@university.edu',
        bookTitle: 'Introduction to Algorithms',
        dueDate: '2024-02-25',
        daysLate: 5,
        fineAmount: 2.5,
    },
]

const mockInquiries = [
    {
        id: 1,
        studentName: 'Alex Johnson',
        subject: 'Book condition issue',
        message: 'The book I received has some pages missing. Can I get a replacement?',
        date: '2024-03-01',
        status: 'pending',
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
]

const sidebarItems = [
    {
        key: 'overview',
        label: 'Dashboard Overview',
        icon: LayoutDashboardIcon,
    },
    {
        key: 'books',
        label: 'Book Management',
        icon: BookOpenIcon,
    },
    {
        key: 'requests',
        label: 'Borrow Requests',
        icon: ClipboardListIcon,
    },
    {
        key: 'overdue',
        label: 'Overdue Tracking',
        icon: AlertTriangleIcon,
    },
    {
        key: 'inquiries',
        label: 'Inquiry Management',
        icon: MessageSquareIcon,
    },
    {
        key: 'reports',
        label: 'Reports',
        icon: FileTextIcon,
    },
    {
        key: 'activity',
        label: 'Activity Log',
        icon: ActivityIcon,
    },
]

export function AdminDashboardPage() {
    const [activeSection, setActiveSection] = useState('overview')
    const [searchQuery, setSearchQuery] = useState('')
    const [inquiryFilter, setInquiryFilter] = useState('all')
    const [showAddBookModal, setShowAddBookModal] = useState(false)
    const [showReplyModal, setShowReplyModal] = useState(null)
    const [sidebarOpen, setSidebarOpen] = useState(true)

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

    const stats = [
        {
            label: 'Total Books',
            value: '1,247',
            icon: BookOpenIcon,
            color: 'bg-coral/10 text-coral',
        },
        {
            label: 'Active Borrows',
            value: '342',
            icon: ClipboardListIcon,
            color: 'bg-teal/10 text-teal',
        },
        {
            label: 'Pending Requests',
            value: '18',
            icon: ClockIcon,
            color: 'bg-golden/20 text-yellow-700',
        },
    ]

    const getStatusBadge = (status) => {
        switch (status) {
            case 'available':
            case 'approved':
            case 'answered':
                return <span className="px-3 py-1 bg-teal/10 text-teal text-xs font-bold rounded-full">{status}</span>
            case 'borrowed':
            case 'rejected':
                return <span className="px-3 py-1 bg-coral/10 text-coral text-xs font-bold rounded-full">{status}</span>
            case 'pending':
                return <span className="px-3 py-1 bg-golden/20 text-yellow-700 text-xs font-bold rounded-full">{status}</span>
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
            default:
                return <ActivityIcon size={16} className="text-medium" />
        }
    }

    return (
        <div className="min-h-screen bg-light flex">
            {/* Sidebar */}
            <motion.aside
                initial={{
                    x: -20,
                    opacity: 0,
                }}
                animate={{
                    x: 0,
                    opacity: 1,
                }}
                className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-100 p-4 flex-shrink-0 transition-all duration-300 hidden lg:block`}
            >
                <div className="mb-8">
                    <h2 className={`font-extrabold text-dark ${sidebarOpen ? 'text-xl' : 'text-sm text-center'}`}>
                        {sidebarOpen ? 'Admin Panel' : '🛡️'}
                    </h2>
                </div>
                <nav className="space-y-2">
                    {sidebarItems.map((item) => (
                        <motion.button
                            key={item.key}
                            onClick={() => setActiveSection(item.key)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold transition-all ${activeSection === item.key ? 'bg-teal text-white shadow-lg shadow-teal/30' : 'text-medium hover:bg-light hover:text-dark'}`}
                            whileHover={{
                                x: 4,
                            }}
                        >
                            <item.icon size={20} />
                            {sidebarOpen && <span>{item.label}</span>}
                        </motion.button>
                    ))}
                </nav>
            </motion.aside>

            {/* Main Content */}
            <main className="flex-1 p-4 sm:p-8 overflow-auto">
                <div className="max-w-6xl mx-auto">
                    {/* Content based on activeSection */}
                    {activeSection === 'overview' && (
                        <motion.div variants={containerVariants} initial="hidden" animate="show">
                            <h1 className="text-3xl font-extrabold text-dark mb-2">Dashboard Overview 🛡️</h1>
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                                {stats.map((stat, idx) => (
                                    <div key={idx} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                                        <p className="text-2xl font-extrabold text-dark">{stat.value}</p>
                                        <p className="text-sm text-medium">{stat.label}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                    {/* Add other sections as needed */}
                    <div className="mt-8 p-12 bg-white rounded-3xl border border-dashed border-gray-200 text-center">
                        <p className="text-medium">Content for {activeSection} section goes here...</p>
                    </div>
                </div>
            </main>
        </div>
    )
}
