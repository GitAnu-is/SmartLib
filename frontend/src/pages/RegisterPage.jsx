import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, ArrowRight, Mail, Lock, User } from 'lucide-react'
import api from '../api/api'
import toast from 'react-hot-toast'

export function RegisterPage({ onNavigate }) {
    const [fullname, setFullname] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const { data } = await api.post('/auth/register', { fullname, email, password })
            localStorage.setItem('token', data.token)
            localStorage.setItem('user', JSON.stringify(data))
            toast.success('Registration Successful!')
            if (data.role === 'admin') {
                onNavigate('admin')
            } else {
                onNavigate('dashboard')
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Registration failed')
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
                    <div className="absolute -top-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-10 -right-10 w-80 h-80 bg-golden/20 rounded-full blur-3xl"></div>

                    <div className="relative z-10">
                        <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center backdrop-blur-sm mb-8">
                            <BookOpen size={32} className="text-white" />
                        </div>
                        <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">
                            Join our smart library network.
                        </h2>
                        <p className="text-teal-100 text-lg">
                            Create an account to access thousands of books, courses, and more.
                        </p>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="w-full md:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col justify-center">
                    <div className="max-w-md w-full mx-auto">
                        <h3 className="text-3xl font-extrabold text-dark mb-2">
                            Create Account ✍️
                        </h3>
                        <p className="text-medium mb-8">
                            Enter your details to create a student account.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-dark mb-2">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <User size={20} className="text-medium" />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        value={fullname}
                                        onChange={(e) => setFullname(e.target.value)}
                                        className="block w-full pl-11 pr-4 py-3.5 bg-light border border-gray-200 rounded-2xl text-dark focus:ring-2 focus:ring-teal focus:border-transparent transition-all outline-none"
                                        autoComplete="off"
                                        placeholder="Full Name"
                                    />
                                </div>
                            </div>

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
                                {loading ? 'Registering...' : 'Register'} <ArrowRight size={20} />
                            </motion.button>
                        </form>

                        <p className="text-center text-medium mt-8 text-sm">
                            Already have an account?{' '}
                            <button onClick={() => onNavigate('login')} className="font-bold text-coral hover:text-coral/80">
                                Sign In
                            </button>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
