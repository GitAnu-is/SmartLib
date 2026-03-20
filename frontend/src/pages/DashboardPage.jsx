import React from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Clock, Star, Heart, Search } from 'lucide-react'

export function DashboardPage() {
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

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    return (
        <div className="min-h-screen bg-light p-4 sm:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-dark">
                            Welcome back, {user.fullname || 'Student'}! 🎓
                        </h1>
                        <p className="text-medium mt-1">You have 2 books due this week.</p>
                    </div>

                    <div className="relative w-full md:w-96">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search size={20} className="text-medium" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-full text-dark focus:ring-2 focus:ring-teal focus:border-transparent transition-all outline-none shadow-sm"
                            placeholder="Search books, authors, or subjects..."
                        />
                    </div>
                </div>

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
                                <span className="text-3xl font-extrabold text-dark">12</span>
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
                                <span className="text-3xl font-extrabold text-dark">2</span>
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
                                <span className="text-3xl font-extrabold text-dark">4.8</span>
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
                                <span className="text-3xl font-extrabold text-dark">24</span>
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
                                <button className="text-teal font-bold text-sm hover:underline">
                                    View All
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-4 p-4 rounded-2xl hover:bg-light transition-colors border border-transparent hover:border-gray-100">
                                    <div className="w-16 h-24 bg-coral rounded-lg shadow-md flex-shrink-0"></div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-dark text-lg">
                                            The Design of Everyday Things
                                        </h3>
                                        <p className="text-medium text-sm mb-2">Don Norman</p>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-teal h-2 rounded-full"
                                                style={{
                                                    width: '65%',
                                                }}
                                            ></div>
                                        </div>
                                        <p className="text-xs text-medium mt-1">
                                            65% completed • Due in 4 days
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
