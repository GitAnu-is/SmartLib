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
        <div className="min-h-screen bg-light p-4 sm:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-dark">
                            Welcome back, {user.fullname || 'Student'}! 🎓
                        </h1>
                        <p className="text-medium mt-1">
                            {myRequestsLoading
                                ? 'Loading your library data...'
                                : `You have ${borrowedCount} active borrows.`}
                        </p>
                    </div>

                    <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search size={20} className="text-medium" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-full text-dark focus:ring-2 focus:ring-teal focus:border-transparent transition-all outline-none shadow-sm"
                            placeholder="Search books, authors, or subjects..."
                        />
                    </form>
                </div>

                {myRequestsError && (
                    <div className="bg-coral/10 text-coral px-4 py-3 rounded-2xl font-semibold mb-6">
                        {myRequestsError}
                    </div>
                )}

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                >
                    {/* Main Content - Left Column (takes up 2 cols on lg) */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Stats Overview */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <motion.div
                                variants={itemVariants}
                                className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center"
                            >
                                <div className="w-12 h-12 bg-coral/10 text-coral rounded-full flex items-center justify-center mb-3">
                                    <BookOpen size={24} />
                                </div>
                                <span className="text-3xl font-extrabold text-dark">
                                    {myRequestsLoading ? '—' : borrowedCount}
                                </span>
                                <span className="text-sm text-medium font-semibold">
                                    Borrowed
                                </span>
                            </motion.div>

                            <motion.div
                                variants={itemVariants}
                                className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center"
                            >
                                <div className="w-12 h-12 bg-teal/10 text-teal rounded-full flex items-center justify-center mb-3">
                                    <Clock size={24} />
                                </div>
                                <span className="text-3xl font-extrabold text-dark">0</span>
                                <span className="text-sm text-medium font-semibold">
                                    Overdue
                                </span>
                            </motion.div>

                            <motion.div
                                variants={itemVariants}
                                className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center"
                            >
                                <div className="w-12 h-12 bg-golden/20 text-yellow-600 rounded-full flex items-center justify-center mb-3">
                                    <Star size={24} />
                                </div>
                                <span className="text-3xl font-extrabold text-dark">
                                    {myRequestsLoading ? '—' : avgRating.toFixed(1)}
                                </span>
                                <span className="text-sm text-medium font-semibold">
                                    Avg Rating
                                </span>
                            </motion.div>

                            <motion.div
                                variants={itemVariants}
                                className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center"
                            >
                                <div className="w-12 h-12 bg-coral/10 text-coral rounded-full flex items-center justify-center mb-3">
                                    <Heart size={24} />
                                </div>
                                <span className="text-3xl font-extrabold text-dark">0</span>
                                <span className="text-sm text-medium font-semibold">
                                    Favorites
                                </span>
                            </motion.div>
                        </div>

                        {/* Currently Reading */}
                        <motion.div
                            variants={itemVariants}
                            className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-extrabold text-dark">
                                    Currently Reading
                                </h2>
                                <button
                                    onClick={() => {
                                        localStorage.setItem('searchBorrowSection', 'requests')
                                        onNavigate?.('search-borrow')
                                    }}
                                    className="text-teal font-bold text-sm hover:underline"
                                >
                                    View All
                                </button>
                            </div>

                            <div className="space-y-4">
                                {myRequestsLoading && (
                                    <div className="text-medium text-center py-8">
                                        Loading your books...
                                    </div>
                                )}

                                {!myRequestsLoading && currentlyReading.length === 0 && (
                                    <div className="text-medium text-center py-8">
                                        No active borrows yet.
                                    </div>
                                )}

                                {!myRequestsLoading &&
                                    currentlyReading.map((r) => (
                                        <div
                                            key={r._id}
                                            className="flex items-center gap-4 p-4 rounded-2xl hover:bg-light transition-colors border border-transparent hover:border-gray-100"
                                        >
                                            <div
                                                className={`w-16 h-24 ${r.book?.coverColor || 'bg-teal'} rounded-lg shadow-md flex-shrink-0`}
                                            ></div>
                                            <div className="flex-1">
                                                <h3 className="font-bold text-dark text-lg">
                                                    {r.book?.title || '—'}
                                                </h3>
                                                <p className="text-medium text-sm">
                                                    {r.book?.author || '—'}
                                                </p>
                                                <p className="text-xs text-medium mt-1">
                                                    Borrowed: {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}
                                                </p>
                                            </div>
                                            <span className="px-3 py-1 bg-teal/10 text-teal text-xs font-bold rounded-full">
                                                Approved
                                            </span>
                                        </div>
                                    ))}
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
