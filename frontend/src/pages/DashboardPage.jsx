import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Clock, Star, Heart, Search } from 'lucide-react'

import { fetchMyBorrowRequests } from '../api/borrowRequests'

export function DashboardPage({ onNavigate }) {
    const containerVariants = {
        hidden: {
            opacity: 0,
        },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.08,
                delayChildren: 0.1,
            },
        },
    }
    const itemVariants = {
        hidden: {
            opacity: 0,
            y: 20,
            scale: 0.95,
        },
        show: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                duration: 0.4,
                ease: 'easeOut',
            },
        },
    }

    const user = JSON.parse(localStorage.getItem('user') || '{}')

    const [searchQuery, setSearchQuery] = useState('')

    const [myRequests, setMyRequests] = useState([])
    const [myRequestsLoading, setMyRequestsLoading] = useState(false)
    const [myRequestsError, setMyRequestsError] = useState('')

    const loadMyRequests = async () => {
        const token = localStorage.getItem('token')
        if (!token) {
            setMyRequests([])
            return
        }

        setMyRequestsError('')
        setMyRequestsLoading(true)
        try {
            const data = await fetchMyBorrowRequests()
            setMyRequests(Array.isArray(data) ? data : [])
        } catch (e) {
            setMyRequestsError(
                e?.response?.data?.message || 'Failed to load your borrowing data'
            )
        } finally {
            setMyRequestsLoading(false)
        }
    }

    useEffect(() => {
        loadMyRequests()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const borrowedCount = useMemo(
        () => myRequests.filter((r) => r.status === 'approved').length,
        [myRequests]
    )

    const avgRating = useMemo(() => {
        const ratings = myRequests
            .filter((r) => r.status === 'approved')
            .map((r) => Number(r.book?.rating))
            .filter((n) => Number.isFinite(n))

        if (ratings.length === 0) return 0
        return ratings.reduce((sum, n) => sum + n, 0) / ratings.length
    }, [myRequests])

    const currentlyReading = useMemo(
        () => myRequests.filter((r) => r.status === 'approved').slice(0, 5),
        [myRequests]
    )

    const handleSearchSubmit = (e) => {
        e.preventDefault()
        const q = searchQuery.trim()
        if (!q) return
        localStorage.setItem('searchBorrowQuery', q)
        onNavigate?.('search-borrow')
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100/50 p-4 sm:p-6">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-200/20 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-teal-100/10 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
            </div>
            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-4"
                >
                    <div>
                        <motion.h1
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-dark via-dark to-teal bg-clip-text text-transparent"
                        >
                            Welcome back, {user.fullname || 'Student'}! ðŸŽ“
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="text-medium text-base mt-0.5"
                        >
                            {myRequestsLoading
                                ? 'Loading your library data...'
                                : `You have ${borrowedCount} active borrows.`}
                        </motion.p>
                    </div>

                    <motion.form
                        onSubmit={handleSearchSubmit}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.15 }}
                        className="relative w-full md:w-80"
                    >
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search size={18} className="text-medium" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-11 pr-12 py-2.5 bg-white border-2 border-transparent rounded-full text-base text-dark focus:ring-2 focus:ring-teal focus:border-teal transition-all outline-none shadow-sm hover:shadow-md"
                            placeholder="Search books, authors..."
                        />
                        <motion.button
                            type="submit"
                            aria-label="Search"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-teal hover:text-teal/80"
                        >
                            <Search size={18} />
                        </motion.button>
                    </motion.form>
                </motion.div>

                {myRequestsError && (
                    <div className="bg-coral/10 text-coral px-4 py-2 rounded-xl font-semibold mb-4 text-base">
                        {myRequestsError}
                    </div>
                )}

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="space-y-5"
                >
                    {/* Main Content */}
                    <div className="space-y-5">
                        {/* Stats Overview */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <motion.div
                                variants={itemVariants}
                                whileHover={{
                                    y: -4,
                                    boxShadow: '0 12px 24px rgba(255, 77, 77, 0.2)',
                                }}
                                className="bg-gradient-to-br from-coral/[0.08] to-coral/[0.02] p-4 rounded-2xl shadow-sm border border-coral/20 flex flex-col items-center justify-center text-center cursor-default transition-all"
                            >
                                <motion.div
                                    whileHover={{ rotate: 360 }}
                                    transition={{ duration: 0.6 }}
                                    className="w-10 h-10 bg-gradient-to-br from-coral to-coral/70 text-white rounded-full flex items-center justify-center mb-2 shadow-md"
                                >
                                    <BookOpen size={20} />
                                </motion.div>
                                <span className="text-3xl font-extrabold text-dark">
                                    {myRequestsLoading ? 'â€”' : borrowedCount}
                                </span>
                                <span className="text-sm text-medium font-semibold">
                                    Borrowed
                                </span>
                            </motion.div>

                            <motion.div
                                variants={itemVariants}
                                whileHover={{
                                    y: -4,
                                    boxShadow: '0 12px 24px rgba(0, 128, 128, 0.2)',
                                }}
                                className="bg-gradient-to-br from-teal/[0.08] to-teal/[0.02] p-4 rounded-2xl shadow-sm border border-teal/20 flex flex-col items-center justify-center text-center cursor-default transition-all"
                            >
                                <motion.div
                                    animate={{ rotate: [0, 360] }}
                                    transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                                    className="w-10 h-10 bg-gradient-to-br from-teal to-teal/70 text-white rounded-full flex items-center justify-center mb-2 shadow-md"
                                >
                                    <Clock size={20} />
                                </motion.div>
                                <span className="text-3xl font-extrabold text-dark">0</span>
                                <span className="text-sm text-medium font-semibold">
                                    Overdue
                                </span>
                            </motion.div>

                            <motion.div
                                variants={itemVariants}
                                whileHover={{
                                    y: -4,
                                    boxShadow: '0 12px 24px rgba(245, 158, 11, 0.2)',
                                }}
                                className="bg-gradient-to-br from-golden/[0.15] to-golden/[0.05] p-4 rounded-2xl shadow-sm border border-golden/30 flex flex-col items-center justify-center text-center cursor-default transition-all"
                            >
                                <motion.div
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-full flex items-center justify-center mb-2 shadow-md"
                                >
                                    <Star size={20} />
                                </motion.div>
                                <span className="text-3xl font-extrabold text-dark">
                                    {myRequestsLoading ? 'â€”' : avgRating.toFixed(1)}
                                </span>
                                <span className="text-sm text-medium font-semibold">
                                    Avg Rating
                                </span>
                            </motion.div>

                            <motion.div
                                variants={itemVariants}
                                whileHover={{
                                    y: -4,
                                    boxShadow: '0 12px 24px rgba(220, 38, 38, 0.2)',
                                }}
                                className="bg-gradient-to-br from-red-100/40 to-red-50/40 p-4 rounded-2xl shadow-sm border border-red-200/40 flex flex-col items-center justify-center text-center cursor-default transition-all"
                            >
                                <motion.div
                                    animate={{ scale: [1, 1.15, 1] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                    className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-full flex items-center justify-center mb-2 shadow-md"
                                >
                                    <Heart size={20} />
                                </motion.div>
                                <span className="text-3xl font-extrabold text-dark">0</span>
                                <span className="text-sm text-medium font-semibold">
                                    Favorites
                                </span>
                            </motion.div>
                        </div>

                        {/* Currently Reading */}
                        <motion.div
                            variants={itemVariants}
                            whileHover={{
                                boxShadow: '0 12px 24px rgba(0, 0, 0, 0.1)',
                            }}
                            className="bg-gradient-to-br from-white to-teal/5 p-5 rounded-2xl shadow-sm border border-gray-100"
                        >
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="flex justify-between items-center mb-4"
                            >
                                <h2 className="text-2xl font-extrabold bg-gradient-to-r from-dark to-teal bg-clip-text text-transparent">
                                    Currently Reading
                                </h2>
                                <motion.button
                                    onClick={() => {
                                        localStorage.setItem('searchBorrowSection', 'requests')
                                        onNavigate?.('search-borrow')
                                    }}
                                    whileHover={{ scale: 1.05, color: '#0d9488' }}
                                    className="text-teal font-bold text-sm hover:underline transition-colors"
                                >
                                    View All
                                </motion.button>
                            </motion.div>

                            <div className="space-y-2">
                                {myRequestsLoading && (
                                    <div className="text-medium text-center py-5 text-base">
                                        Loading your books...
                                    </div>
                                )}

                                {!myRequestsLoading && currentlyReading.length === 0 && (
                                    <div className="text-medium text-center py-5 text-base">
                                        No active borrows yet.
                                    </div>
                                )}

                                {!myRequestsLoading &&
                                    currentlyReading.map((r, idx) => (
                                        <motion.div
                                            key={r._id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.08 }}
                                            whileHover={{ x: 4, backgroundColor: 'rgba(0, 128, 128, 0.05)' }}
                                            className="flex items-center gap-3 p-3 rounded-lg border border-transparent hover:border-teal/20 transition-all"
                                        >
                                            <div
                                                className={`w-12 h-16 ${r.book?.coverColor || 'bg-teal'} rounded-md shadow-sm flex-shrink-0`}
                                            ></div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-dark text-base truncate">
                                                    {r.book?.title || 'â€”'}
                                                </h3>
                                                <p className="text-medium text-sm truncate">
                                                    {r.book?.author || 'â€”'}
                                                </p>
                                                <p className="text-sm text-medium mt-0.5">
                                                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'â€”'}
                                                </p>
                                            </div>
                                            <motion.span
                                                animate={{ scale: [1, 1.05, 1] }}
                                                transition={{ duration: 2, repeat: Infinity, delay: idx * 0.1 }}
                                                className="px-2 py-1 bg-gradient-to-r from-teal/20 to-teal/10 text-teal text-xs font-bold rounded-full flex-shrink-0"
                                            >
                                                Approved
                                            </motion.span>
                                        </motion.div>
                                    ))}
                            </div>
                        </motion.div>

                        {/* Info Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Explore Spaces Card */}
                            <motion.div
                                variants={itemVariants}
                                whileHover={{ y: -6, boxShadow: '0 16px 32px rgba(0, 128, 128, 0.15)' }}
                                onClick={() => onNavigate?.('space-elearning')}
                                className="bg-gradient-to-br from-teal/10 to-cyan/5 p-6 rounded-2xl shadow-md border border-teal/20 cursor-pointer transition-all group"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <motion.div
                                        animate={{ rotate: [0, 5, -5, 0] }}
                                        transition={{ duration: 4, repeat: Infinity }}
                                        className="w-12 h-12 bg-gradient-to-br from-teal to-cyan text-white rounded-xl flex items-center justify-center shadow-lg"
                                    >
                                        ðŸ›ï¸
                                    </motion.div>
                                </div>
                                <h3 className="text-lg font-bold text-dark mb-2 group-hover:text-teal transition-colors">
                                    Study Spaces
                                </h3>
                                <p className="text-sm text-medium mb-4">
                                    Reserve quiet study rooms, group collaboration spaces, or access e-learning resources.
                                </p>
                                <motion.button
                                    whileHover={{ x: 4 }}
                                    className="text-teal font-semibold text-sm flex items-center gap-2 hover:gap-4 transition-all"
                                >
                                    Explore â†’ 
                                </motion.button>
                            </motion.div>

                            {/* Book Tips Card */}
                            <motion.div
                                variants={itemVariants}
                                whileHover={{ y: -6, boxShadow: '0 16px 32px rgba(255, 107, 107, 0.15)' }}
                                className="bg-gradient-to-br from-coral/10 to-red-50 p-6 rounded-2xl shadow-md border border-coral/20 cursor-default transition-all"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <motion.div
                                        animate={{ bounce: [0, -5, 0] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="w-12 h-12 bg-gradient-to-br from-coral to-red-500 text-white rounded-xl flex items-center justify-center shadow-lg"
                                    >
                                        ðŸ’¡
                                    </motion.div>
                                </div>
                                <h3 className="text-lg font-bold text-dark mb-2">
                                    Pro Tips
                                </h3>
                                <p className="text-sm text-medium mb-4">
                                    â€¢ Renew books before due date<br/>
                                    â€¢ Add favorites for quick access<br/>
                                    â€¢ Check ratings before borrowing
                                </p>
                                <motion.p
                                    animate={{ opacity: [0.6, 1, 0.6] }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                    className="text-xs text-coral font-semibold"
                                >
                                    âœ“ Keep learning!
                                </motion.p>
                            </motion.div>

                            {/* Help & Support Card */}
                            <motion.div
                                variants={itemVariants}
                                whileHover={{ y: -6, boxShadow: '0 16px 32px rgba(245, 158, 11, 0.15)' }}
                                className="bg-gradient-to-br from-golden/15 to-yellow-50 p-6 rounded-2xl shadow-md border border-golden/30 cursor-default transition-all"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <motion.div
                                        animate={{ scale: [1, 1.1, 1] }}
                                        transition={{ duration: 2.5, repeat: Infinity }}
                                        className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 text-white rounded-xl flex items-center justify-center shadow-lg"
                                    >
                                        â“
                                    </motion.div>
                                </div>
                                <h3 className="text-lg font-bold text-dark mb-2">
                                    Need Help?
                                </h3>
                                <p className="text-sm text-medium mb-4">
                                    Contact our library team for assistance with borrowing, reservations, or technical support.
                                </p>
                                <motion.button
                                    whileHover={{ x: 4 }}
                                    className="text-yellow-700 font-semibold text-sm flex items-center gap-2 hover:gap-4 transition-all"
                                >
                                    Contact Support â†’
                                </motion.button>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
