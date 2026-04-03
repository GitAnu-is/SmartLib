import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, ArrowRight, Mail, Lock } from 'lucide-react'
import api from '../api/api'
import toast from 'react-hot-toast'

export function LoginPage({ onNavigate }) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const { data } = await api.post('/auth/login', { email, password })
            localStorage.setItem('token', data.token)
            localStorage.setItem('user', JSON.stringify(data))
            toast.success('Login Successful!')
            if (data.role === 'admin') {
                onNavigate('admin')
            } else {
                onNavigate('dashboard')
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Login failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-[calc(100vh-80px)] bg-light flex items-center justify-center p-4 sm:p-8">
            <motion.div
                initial={{
                    opacity: 0,
                    y: 20,
                }}
                animate={{
                    opacity: 1,
                    y: 0,
                }}
                transition={{
                    duration: 0.5,
                }}
                className="w-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]"
            >
                {/* Left Side - Illustration */}
                <div className="hidden md:flex md:w-1/2 bg-teal relative p-12 flex-col justify-between overflow-hidden">
                    {/* Abstract Background Shapes */}
                    <div className="absolute -top-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-10 -right-10 w-80 h-80 bg-golden/20 rounded-full blur-3xl"></div>

                    <div className="relative z-10">
                        <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center backdrop-blur-sm mb-8">
                            <BookOpen size={32} className="text-white" />
                        </div>
                        <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">
                            Welcome back to your smart space.
                        </h2>
                        <p className="text-teal-100 text-lg">
                            Access your digital library, track your reading goals, and book
                            study rooms all in one place.
                        </p>
                    </div>

                    <div className="relative z-10 h-48 w-full mt-8">
                        <motion.div
                            animate={{
                                y: [-5, 5, -5],
                            }}
                            transition={{
                                repeat: Infinity,
                                duration: 4,
                                ease: 'easeInOut',
                            }}
                            className="absolute top-0 left-10 w-32 h-24 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-4"
                        >
                            <div className="w-1/2 h-2 bg-white/30 rounded-full mb-2"></div>
                            <div className="w-3/4 h-2 bg-white/30 rounded-full mb-2"></div>
                            <div className="w-2/3 h-2 bg-white/30 rounded-full"></div>
                        </motion.div>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="w-full md:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col justify-center">
                    <div className="max-w-md w-full mx-auto">
                        <h3 className="text-3xl font-extrabold text-dark mb-2">
                            Hello, Student! 👋
                        </h3>
                        <p className="text-medium mb-8">
                            Please enter your details to sign in.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-dark mb-2">
                                    Student Email
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail size={20} className="text-medium" />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="block w-full pl-11 pr-4 py-3.5 bg-light border border-gray-200 rounded-2xl text-dark focus:ring-2 focus:ring-teal focus:border-transparent transition-all outline-none"
                                        autoComplete="off"
                                        placeholder="Email Address"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-dark mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock size={20} className="text-medium" />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="block w-full pl-11 pr-4 py-3.5 bg-light border border-gray-200 rounded-2xl text-dark focus:ring-2 focus:ring-teal focus:border-transparent transition-all outline-none"
                                        autoComplete="off"
                                        placeholder="Enter Password"
                                    />
                                </div>
                            </div>

                            <motion.button
                                type="submit"
                                disabled={loading}
                                whileHover={{
                                    scale: 1.02,
                                }}
                                whileTap={{
                                    scale: 0.98,
                                }}
                                className={`w-full bg-coral text-white font-bold py-4 rounded-full shadow-lg shadow-coral/30 hover:shadow-xl transition-all flex justify-center items-center gap-2 mt-4 ${loading ? 'opacity-70' : ''}`}
                            >
                                {loading ? 'Signing In...' : 'Sign In'} <ArrowRight size={20} />
                            </motion.button>
                        </form>

                        <p className="text-center text-medium mt-8 text-sm">
                            Don't have an account?{' '}
                            <button onClick={() => onNavigate('register')} className="font-bold text-coral hover:text-coral/80">
                                Register here
                            </button>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
