import React, { useState } from 'react'
import {
    BookOpen,
    User,
    Menu,
    X,
    Search,
    Sparkles,
    Shield,
    GraduationCap,
    LayoutDashboard,
    ChevronDown,
    UserCircle,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const navItems = [
    {
        key: 'landing',
        label: 'Home',
        icon: null,
    },
    {
        key: 'dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
    },
    {
        key: 'search-borrow',
        label: 'Search & Borrow',
        icon: Search,
    },
    {
        key: 'ai-assistant',
        label: 'AI Assistant',
        icon: Sparkles,
    },
    {
        key: 'admin',
        label: 'Admin',
        icon: Shield,
    },
    {
        key: 'space-elearning',
        label: 'Spaces & E-Learning',
        icon: GraduationCap,
    },
    {
        key: 'profile',
        label: 'My Profile',
        icon: UserCircle,
    },
]

export function Navbar({ currentPage, onNavigate }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [showMoreMenu, setShowMoreMenu] = useState(false)
    const [showUserMenu, setShowUserMenu] = useState(false)
    const isLoggedIn = Boolean(localStorage.getItem('token'))
    const mainNavItems = navItems.slice(0, 3)
    const moreNavItems = navItems.slice(3, 6).filter(item => item.key !== 'admin')

    return (
        <nav className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    {/* Logo */}
                    <motion.div
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => onNavigate('landing')}
                        whileHover={{
                            scale: 1.05,
                        }}
                        whileTap={{
                            scale: 0.95,
                        }}
                    >
                        <div className="bg-coral p-2 rounded-xl text-white">
                            <BookOpen size={24} strokeWidth={2.5} />
                        </div>
                        <span className="font-extrabold text-2xl text-dark tracking-tight">
                            Smart<span className="text-teal">Lib</span>
                        </span>
                    </motion.div>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center gap-6">
                        {mainNavItems.map((item) => (
                            <button
                                key={item.key}
                                onClick={() => onNavigate(item.key)}
                                className={`font-bold transition-colors flex items-center gap-1.5 ${currentPage === item.key ? 'text-coral' : 'text-medium hover:text-dark'}`}
                            >
                                {item.icon && <item.icon size={16} />}
                                {item.label}
                            </button>
                        ))}

                        {/* More Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowMoreMenu(!showMoreMenu)}
                                onBlur={() => setTimeout(() => setShowMoreMenu(false), 150)}
                                className={`font-bold transition-colors flex items-center gap-1 ${moreNavItems.some((item) => item.key === currentPage) ? 'text-coral' : 'text-medium hover:text-dark'}`}
                            >
                                More
                                <ChevronDown
                                    size={16}
                                    className={`transition-transform ${showMoreMenu ? 'rotate-180' : ''}`}
                                />
                            </button>

                            <AnimatePresence>
                                {showMoreMenu && (
                                    <motion.div
                                        initial={{
                                            opacity: 0,
                                            y: 10,
                                        }}
                                        animate={{
                                            opacity: 1,
                                            y: 0,
                                        }}
                                        exit={{
                                            opacity: 0,
                                            y: 10,
                                        }}
                                        className="absolute top-full right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 overflow-hidden"
                                    >
                                        {moreNavItems.map((item) => (
                                            <button
                                                key={item.key}
                                                onClick={() => {
                                                    onNavigate(item.key)
                                                    setShowMoreMenu(false)
                                                }}
                                                className={`w-full px-4 py-3 text-left font-semibold transition-colors flex items-center gap-3 ${currentPage === item.key ? 'bg-teal/10 text-teal' : 'text-medium hover:bg-light hover:text-dark'}`}
                                            >
                                                {item.icon && <item.icon size={18} />}
                                                {item.label}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* User Menu / Login Button */}
                        {isLoggedIn && (
                            <div className="relative">
                                <motion.button
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    onBlur={() => setTimeout(() => setShowUserMenu(false), 150)}
                                    className="flex items-center gap-2 bg-teal text-white px-4 py-2.5 rounded-full font-bold shadow-sm hover:shadow-md transition-all"
                                    whileHover={{
                                        y: -2,
                                    }}
                                    whileTap={{
                                        y: 0,
                                    }}
                                >
                                    <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold">
                                        AJ
                                    </div>
                                    <span className="hidden sm:inline">User</span>
                                    <ChevronDown
                                        size={16}
                                        className={`transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                                    />
                                </motion.button>

                                <AnimatePresence>
                                    {showUserMenu && (
                                        <motion.div
                                            initial={{
                                                opacity: 0,
                                                y: 10,
                                            }}
                                            animate={{
                                                opacity: 1,
                                                y: 0,
                                            }}
                                            exit={{
                                                opacity: 0,
                                                y: 10,
                                            }}
                                            className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 overflow-hidden"
                                        >
                                            <button
                                                onClick={() => {
                                                    onNavigate('profile')
                                                    setShowUserMenu(false)
                                                }}
                                                className={`w-full px-4 py-3 text-left font-semibold transition-colors flex items-center gap-3 ${currentPage === 'profile' ? 'bg-teal/10 text-teal' : 'text-medium hover:bg-light hover:text-dark'}`}
                                            >
                                                <UserCircle size={18} />
                                                My Profile
                                            </button>
                                            <button
                                                onClick={() => {
                                                    localStorage.removeItem('token');
                                                    onNavigate('login');
                                                    setShowUserMenu(false)
                                                }}
                                                className="w-full px-4 py-3 text-left font-semibold transition-colors flex items-center gap-3 text-coral hover:bg-coral/10"
                                            >
                                                <User size={18} />
                                                Sign Out
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}

                        {!isLoggedIn && (currentPage === 'login' || currentPage === 'register' || currentPage === 'landing') && (
                            <div className="flex gap-2">
                                <motion.button
                                    onClick={() => onNavigate('login')}
                                    className="flex items-center gap-2 bg-teal text-white px-6 py-2.5 rounded-full font-bold shadow-sm hover:shadow-md transition-all"
                                    whileHover={{
                                        y: -2,
                                    }}
                                    whileTap={{
                                        y: 0,
                                    }}
                                >
                                    <User size={18} />
                                    <span>Login</span>
                                </motion.button>
                                <motion.button
                                    onClick={() => onNavigate('register')}
                                    className="flex items-center gap-2 bg-coral text-white px-6 py-2.5 rounded-full font-bold shadow-sm hover:shadow-md transition-all"
                                    whileHover={{
                                        y: -2,
                                    }}
                                    whileTap={{
                                        y: 0,
                                    }}
                                >
                                    <UserCircle size={18} />
                                    <span>Register</span>
                                </motion.button>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="lg:hidden flex items-center">
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="text-dark p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{
                            opacity: 0,
                            height: 0,
                        }}
                        animate={{
                            opacity: 1,
                            height: 'auto',
                        }}
                        exit={{
                            opacity: 0,
                            height: 0,
                        }}
                        className="lg:hidden bg-white border-t border-gray-100 overflow-hidden"
                    >
                        <div className="px-4 py-4 space-y-2">
                            {navItems.map((item) => (
                                <button
                                    key={item.key}
                                    onClick={() => {
                                        onNavigate(item.key)
                                        setMobileMenuOpen(false)
                                    }}
                                    className={`w-full px-4 py-3 rounded-2xl font-bold text-left transition-colors flex items-center gap-3 ${currentPage === item.key ? 'bg-teal/10 text-teal' : 'text-medium hover:bg-light hover:text-dark'}`}
                                >
                                    {item.icon && <item.icon size={20} />}
                                    {item.label}
                                </button>
                            ))}

                            {currentPage !== 'login' && currentPage !== 'register' && (
                                <motion.button
                                    onClick={() => {
                                        localStorage.removeItem('token');
                                        onNavigate('login');
                                        setMobileMenuOpen(false)
                                    }}
                                    className="w-full flex items-center justify-center gap-2 bg-coral text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-coral/30 mt-4"
                                    whileTap={{
                                        scale: 0.98,
                                    }}
                                >
                                    <User size={18} />
                                    <span>Sign Out</span>
                                </motion.button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    )
}
