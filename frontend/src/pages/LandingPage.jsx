import React from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Sparkles, Settings, Monitor, ArrowRight } from 'lucide-react'

export function LandingPage({ onNavigate }) {
    const containerVariants = {
        hidden: {
            opacity: 0,
        },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,
            },
        },
    }
    const itemVariants = {
        hidden: {
            opacity: 0,
            y: 30,
        },
        show: {
            opacity: 1,
            y: 0,
            transition: {
                type: 'spring',
                stiffness: 300,
                damping: 24,
            },
        },
    }
    return (
        <div className="min-h-screen bg-light overflow-hidden">
            {/* Hero Section */}
            <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <motion.div
                        initial={{
                            opacity: 0,
                            x: -50,
                        }}
                        animate={{
                            opacity: 1,
                            x: 0,
                        }}
                        transition={{
                            duration: 0.6,
                            ease: 'easeOut',
                        }}
                        className="z-10"
                    >
                        <div className="inline-block bg-golden/20 text-yellow-700 font-bold px-4 py-1.5 rounded-full text-sm mb-6">
                            🎉 Welcome to the future of reading
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-extrabold text-dark leading-tight mb-6">
                            Your Library, <br />
                            <span className="text-coral">Reimagined ✨</span>
                        </h1>
                        <p className="text-xl text-medium mb-10 max-w-lg leading-relaxed">
                            Discover, borrow, and learn in a vibrant new space. The smart
                            library portal designed entirely around you.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <motion.button
                                onClick={() => onNavigate('login')}
                                className="bg-coral text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg shadow-coral/30 hover:shadow-xl hover:bg-coral/90 transition-all flex items-center gap-2"
                                whileHover={{
                                    scale: 1.05,
                                }}
                                whileTap={{
                                    scale: 0.95,
                                }}
                            >
                                Get Started <ArrowRight size={20} />
                            </motion.button>
                            <motion.button
                                onClick={() => onNavigate('dashboard')}
                                className="bg-white text-teal border-2 border-teal px-8 py-4 rounded-full font-bold text-lg hover:bg-teal/5 transition-all"
                                whileHover={{
                                    scale: 1.05,
                                }}
                                whileTap={{
                                    scale: 0.95,
                                }}
                            >
                                Explore Features
                            </motion.button>
                        </div>
                    </motion.div>

                    {/* Hero Illustration (CSS/SVG Composition) */}
                    <motion.div
                        initial={{
                            opacity: 0,
                            scale: 0.8,
                        }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                        }}
                        transition={{
                            duration: 0.8,
                            delay: 0.2,
                            type: 'spring',
                        }}
                        className="relative h-[500px] hidden lg:block"
                    >
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-teal/10 rounded-full blur-3xl"></div>

                        {/* Abstract Books & Elements */}
                        <motion.div
                            animate={{
                                y: [-10, 10, -10],
                            }}
                            transition={{
                                repeat: Infinity,
                                duration: 4,
                                ease: 'easeInOut',
                            }}
                            className="absolute top-10 right-20 w-32 h-40 bg-coral rounded-2xl shadow-2xl rotate-12 border-4 border-white flex items-center justify-center"
                        >
                            <div className="w-20 h-4 bg-white/30 rounded-full absolute top-6 left-4"></div>
                            <div className="w-16 h-4 bg-white/30 rounded-full absolute top-14 left-4"></div>
                            <BookOpen size={48} className="text-white opacity-50" />
                        </motion.div>

                        <motion.div
                            animate={{
                                y: [10, -10, 10],
                            }}
                            transition={{
                                repeat: Infinity,
                                duration: 5,
                                ease: 'easeInOut',
                            }}
                            className="absolute bottom-20 left-10 w-40 h-32 bg-golden rounded-2xl shadow-2xl -rotate-6 border-4 border-white flex items-center justify-center"
                        >
                            <Sparkles size={48} className="text-yellow-700 opacity-50" />
                        </motion.div>

                        <motion.div
                            animate={{
                                y: [-5, 5, -5],
                            }}
                            transition={{
                                repeat: Infinity,
                                duration: 3.5,
                            }}
                            className="absolute top-40 left-20 w-48 h-48 bg-teal rounded-full shadow-2xl border-4 border-white flex items-center justify-center"
                        >
                            <Monitor size={64} className="text-white opacity-50" />
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section className="bg-white py-24 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-extrabold text-dark mb-4">
                            Everything you need to excel
                        </h2>
                        <p className="text-xl text-medium max-w-2xl mx-auto">
                            Powerful tools wrapped in a beautiful, easy-to-use interface.
                        </p>
                    </div>

                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="show"
                        viewport={{
                            once: true,
                            margin: '-100px',
                        }}
                        className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
                    >
                        {/* Feature 1 */}
                        <motion.div
                            variants={itemVariants}
                            className="bg-light rounded-3xl p-8 hover:shadow-xl transition-shadow border border-gray-100 group"
                        >
                            <div className="w-16 h-16 bg-coral/10 text-coral rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <BookOpen size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-dark mb-3">
                                Search & Borrow
                            </h3>
                            <p className="text-medium leading-relaxed">
                                Find and borrow books in seconds. Check availability and reserve
                                instantly.
                            </p>
                        </motion.div>

                        {/* Feature 2 */}
                        <motion.div
                            variants={itemVariants}
                            className="bg-light rounded-3xl p-8 hover:shadow-xl transition-shadow border border-gray-100 group"
                        >
                            <div className="w-16 h-16 bg-teal/10 text-teal rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Sparkles size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-dark mb-3">AI Assistant</h3>
                            <p className="text-medium leading-relaxed">
                                Your smart study companion. Get personalized recommendations and
                                research help.
                            </p>
                        </motion.div>

                        {/* Feature 3 */}
                        <motion.div
                            variants={itemVariants}
                            className="bg-light rounded-3xl p-8 hover:shadow-xl transition-shadow border border-gray-100 group"
                        >
                            <div className="w-16 h-16 bg-golden/20 text-yellow-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Settings size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-dark mb-3">Admin Tools</h3>
                            <p className="text-medium leading-relaxed">
                                Manage your library effortlessly. Track returns, fines, and
                                account settings.
                            </p>
                        </motion.div>

                        {/* Feature 4 */}
                        <motion.div
                            variants={itemVariants}
                            className="bg-light rounded-3xl p-8 hover:shadow-xl transition-shadow border border-gray-100 group"
                        >
                            <div className="w-16 h-16 bg-coral/10 text-coral rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Monitor size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-dark mb-3">
                                E-Learning & Spaces
                            </h3>
                            <p className="text-medium leading-relaxed">
                                Book study rooms, access digital courses, and collaborate with
                                peers.
                            </p>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Bottom CTA */}
            <section className="py-24 bg-teal text-center px-4">
                <motion.div
                    initial={{
                        opacity: 0,
                        y: 20,
                    }}
                    whileInView={{
                        opacity: 1,
                        y: 0,
                    }}
                    viewport={{
                        once: true,
                    }}
                    className="max-w-3xl mx-auto"
                >
                    <h2 className="text-4xl font-extrabold text-white mb-6">
                        Ready to dive in? 🚀
                    </h2>
                    <p className="text-teal-100 text-xl mb-10">
                        Join thousands of students already using SmartLib to supercharge
                        their studies.
                    </p>
                    <motion.button
                        onClick={() => onNavigate('register')}
                        className="bg-golden text-dark px-10 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all"
                        whileHover={{
                            scale: 1.05,
                        }}
                        whileTap={{
                            scale: 0.95,
                        }}
                    >
                        Create Your Account
                    </motion.button>
                </motion.div>
            </section>
        </div>
    )
}
