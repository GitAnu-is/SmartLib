import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Search, BookOpen, Users, Zap, Shield } from 'lucide-react'

export function HelpCenterPage({ onNavigate }) {
    const [searchQuery, setSearchQuery] = useState('')
    const [expandedFAQ, setExpandedFAQ] = useState(null)

    const faqs = [
        {
            category: 'Borrowing & Books',
            icon: BookOpen,
            items: [
                {
                    q: 'How do I borrow a book?',
                    a: 'Navigate to the "Search & Borrow" section, find your desired book, and click the borrow button. Your request will be sent to librarians for approval. You will receive a notification once approved.',
                },
                {
                    q: 'How long can I keep a book?',
                    a: 'Books are typically available for 3 weeks. You can renew books before the due date if no one else has reserved them. Late returns may result in fines.',
                },
                {
                    q: 'What if a book is not available?',
                    a: 'You can place a reservation for unavailable books. You will be notified when the book becomes available and can pick it up within 7 days.',
                },
                {
                    q: 'How do I rate a book?',
                    a: 'After returning a borrowed book, you can leave a rating and review in your dashboard under "Previously Read" books.',
                },
                {
                    q: 'Can I return books early?',
                    a: 'Yes, you can return books anytime. There are no penalties for early returns.',
                },
            ],
        },
        {
            category: 'Spaces & Reservations',
            icon: Users,
            items: [
                {
                    q: 'How do I reserve a study space?',
                    a: 'Go to "Spaces & E-Learning" > "Library Spaces", select a space, choose your preferred time slot, and confirm your reservation.',
                },
                {
                    q: 'Can I reserve multiple spaces?',
                    a: 'Yes, you can reserve multiple spaces for different times. However, overlapping reservations for the same space are not allowed.',
                },
                {
                    q: 'How long can I use a reserved space?',
                    a: 'Reserved spaces are available for 2-hour time slots. You can extend your reservation if the space is not booked afterward.',
                },
                {
                    q: 'What if I need to cancel my reservation?',
                    a: 'You can cancel reservations anytime without penalties. Navigate to your reservations and click the cancel button.',
                },
                {
                    q: 'Are there group study rooms available?',
                    a: 'Yes! We have various space types: quiet study pods (individual), group study rooms (2-8 people), and collaborative labs (larger groups).',
                },
            ],
        },
        {
            category: 'E-Learning Resources',
            icon: Zap,
            items: [
                {
                    q: 'How do I access e-learning materials?',
                    a: 'Go to "Spaces & E-Learning" > "E-Learning Resources" to browse and download videos, PDFs, and study notes.',
                },
                {
                    q: 'Can I download materials for offline use?',
                    a: 'Most materials can be downloaded for personal, non-commercial use. Check individual resource permissions.',
                },
                {
                    q: 'How often are new resources added?',
                    a: 'Our e-learning library is updated weekly with new materials across multiple subjects and categories.',
                },
                {
                    q: 'Can I request specific learning materials?',
                    a: 'Yes! Use the inquiry feature to request new materials. Our team will review and add materials based on popular requests.',
                },
            ],
        },
        {
            category: 'Account & Security',
            icon: Shield,
            items: [
                {
                    q: 'How do I update my profile?',
                    a: 'Click on your username in the top-right corner and select "Profile". You can edit your personal information and preferences.',
                },
                {
                    q: 'How do I reset my password?',
                    a: 'On the login page, click "Forgot Password?" and follow the instructions sent to your email.',
                },
                {
                    q: 'How is my personal data protected?',
                    a: 'We use industry-standard encryption and security measures to protect all user data. Your information is never shared with third parties without consent.',
                },
                {
                    q: 'Can I export my borrowing history?',
                    a: 'Yes, you can download your borrowing history from your profile. This is useful for academic records.',
                },
                {
                    q: 'What is the password requirement?',
                    a: 'Passwords must be exactly 8 characters, containing uppercase letters, lowercase letters, numbers, and symbols.',
                },
            ],
        },
    ]

    const filteredFAQs = faqs
        .map((section) => ({
            ...section,
            items: section.items.filter(
                (item) =>
                    item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    item.a.toLowerCase().includes(searchQuery.toLowerCase())
            ),
        }))
        .filter((section) => section.items.length > 0)

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

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100/50 py-12 px-4 sm:px-6">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-200/20 rounded-full blur-3xl"></div>
            </div>

            <div className="max-w-4xl mx-auto relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-dark via-teal to-cyan bg-clip-text text-transparent mb-4">
                        Help Center
                    </h1>
                    <p className="text-lg text-medium max-w-2xl mx-auto">
                        Find answers to common questions about our library system.
                    </p>
                </motion.div>

                {/* Search Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-12"
                >
                    <div className="relative">
                        <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-medium" />
                        <input
                            type="text"
                            placeholder="Search help articles..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal focus:border-transparent outline-none transition-all text-base"
                        />
                    </div>
                </motion.div>

                {/* FAQ Sections */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="space-y-6"
                >
                    {filteredFAQs.length === 0 ? (
                        <motion.div
                            variants={itemVariants}
                            className="bg-white rounded-2xl p-8 text-center shadow-lg border border-gray-100"
                        >
                            <p className="text-lg text-medium">
                                No results found for "<strong>{searchQuery}</strong>". Try a different search term.
                            </p>
                        </motion.div>
                    ) : (
                        filteredFAQs.map((section, idx) => {
                            const IconComponent = section.icon
                            return (
                                <motion.div
                                    key={idx}
                                    variants={itemVariants}
                                    className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
                                >
                                    <div className="bg-gradient-to-r from-teal/10 to-cyan/10 p-6 border-b border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-teal to-cyan text-white rounded-lg flex items-center justify-center">
                                                <IconComponent size={20} />
                                            </div>
                                            <h2 className="text-xl font-bold text-dark">{section.category}</h2>
                                        </div>
                                    </div>

                                    <div className="divide-y divide-gray-100">
                                        {section.items.map((item, itemIdx) => (
                                            <motion.div
                                                key={itemIdx}
                                                className="p-6"
                                            >
                                                <button
                                                    onClick={() =>
                                                        setExpandedFAQ(
                                                            expandedFAQ === `${idx}-${itemIdx}` ? null : `${idx}-${itemIdx}`
                                                        )
                                                    }
                                                    className="w-full flex items-start justify-between text-left hover:text-teal transition-colors group"
                                                >
                                                    <span className="text-base font-bold text-dark group-hover:text-teal transition-colors">
                                                        {item.q}
                                                    </span>
                                                    <motion.div
                                                        animate={{
                                                            rotate:
                                                                expandedFAQ === `${idx}-${itemIdx}` ? 180 : 0,
                                                        }}
                                                        className="flex-shrink-0 ml-4"
                                                    >
                                                        <ChevronDown
                                                            size={20}
                                                            className="text-teal"
                                                        />
                                                    </motion.div>
                                                </button>

                                                <AnimatePresence>
                                                    {expandedFAQ === `${idx}-${itemIdx}` && (
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: 'auto' }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            transition={{ duration: 0.3 }}
                                                            className="mt-4 pt-4 border-t border-gray-100"
                                                        >
                                                            <p className="text-medium text-sm leading-relaxed">
                                                                {item.a}
                                                            </p>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            )
                        })
                    )}
                </motion.div>

                {/* Still Need Help */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-12 bg-gradient-to-r from-teal/10 to-cyan/10 rounded-2xl p-8 border border-teal/20 text-center"
                >
                    <h3 className="text-2xl font-bold text-dark mb-3">Still need help?</h3>
                    <p className="text-medium mb-6">
                        Can't find the answer you're looking for? Contact our support team.
                    </p>
                    <motion.button
                        onClick={() => onNavigate?.('contact-us')}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-gradient-to-r from-teal to-cyan text-white font-bold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all"
                    >
                        Contact Support
                    </motion.button>
                </motion.div>
            </div>
        </div>
    )
}
