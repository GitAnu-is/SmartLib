import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Phone, MapPin, Send, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { submitContactMessage } from '../api/contact'

export function ContactUsPage({ onNavigate }) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: '',
    })
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState({})

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData({
            ...formData,
            [name]: value,
        })
        // Clear error for this field
        if (errors[name]) {
            setErrors({ ...errors, [name]: '' })
        }
    }

    const validateForm = () => {
        const newErrors = {}

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required'
        } else if (formData.name.trim().length < 2) {
            newErrors.name = 'Name must be at least 2 characters'
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email'
        }

        if (!formData.subject.trim()) {
            newErrors.subject = 'Subject is required'
        } else if (formData.subject.trim().length < 3) {
            newErrors.subject = 'Subject must be at least 3 characters'
        }

        if (!formData.message.trim()) {
            newErrors.message = 'Message is required'
        } else if (formData.message.trim().length < 10) {
            newErrors.message = 'Message must be at least 10 characters'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validateForm()) {
            toast.error('Please fix the errors in the form')
            return
        }

        setLoading(true)
        try {
            const response = await submitContactMessage({
                name: formData.name.trim(),
                email: formData.email.trim(),
                subject: formData.subject.trim(),
                message: formData.message.trim(),
            })

            toast.success(response.message || 'Message sent successfully!')
            setFormData({ name: '', email: '', subject: '', message: '' })
            setErrors({})
        } catch (error) {
            const errorMsg = error?.response?.data?.message || 'Failed to send message. Please try again.'
            toast.error(errorMsg)
        } finally {
            setLoading(false)
        }
    }

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

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-dark via-teal to-cyan bg-clip-text text-transparent mb-4">
                        Contact Us
                    </h1>
                    <p className="text-lg text-medium max-w-2xl mx-auto">
                        Have questions or feedback? We'd love to hear from you. Get in touch with our team anytime.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                    {/* Contact Info Cards */}
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                        className="lg:col-span-1 space-y-6"
                    >
                        {/* Email */}
                        <motion.div
                            variants={itemVariants}
                            whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(13, 148, 136, 0.15)' }}
                            className="bg-white rounded-2xl p-6 shadow-lg border border-teal/20"
                        >
                            <div className="w-12 h-12 bg-gradient-to-br from-teal to-cyan text-white rounded-full flex items-center justify-center mb-4 shadow-md">
                                <Mail size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-dark mb-2">Email</h3>
                            <p className="text-medium text-sm mb-3">Send us an email and we'll respond within 24 hours.</p>
                            <a
                                href="mailto:support@smartlib.com"
                                className="text-teal font-semibold hover:text-teal/80 transition-colors"
                            >
                                support@smartlib.com
                            </a>
                        </motion.div>

                        {/* Phone */}
                        <motion.div
                            variants={itemVariants}
                            whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(255, 107, 107, 0.15)' }}
                            className="bg-white rounded-2xl p-6 shadow-lg border border-coral/20"
                        >
                            <div className="w-12 h-12 bg-gradient-to-br from-coral to-red-500 text-white rounded-full flex items-center justify-center mb-4 shadow-md">
                                <Phone size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-dark mb-2">Phone</h3>
                            <p className="text-medium text-sm mb-3">Call us Monday to Friday, 9AM to 6PM.</p>
                            <a href="tel:+1234567890" className="text-coral font-semibold hover:text-coral/80 transition-colors">
                                +1 (234) 567-890
                            </a>
                        </motion.div>

                        {/* Address */}
                        <motion.div
                            variants={itemVariants}
                            whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(245, 158, 11, 0.15)' }}
                            className="bg-white rounded-2xl p-6 shadow-lg border border-golden/30"
                        >
                            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-full flex items-center justify-center mb-4 shadow-md">
                                <MapPin size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-dark mb-2">Office</h3>
                            <p className="text-medium text-sm">
                                123 Library Street<br />
                                Education City<br />
                                EC 12345
                            </p>
                        </motion.div>

                        {/* Hours */}
                        <motion.div
                            variants={itemVariants}
                            whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(99, 102, 241, 0.15)' }}
                            className="bg-white rounded-2xl p-6 shadow-lg border border-indigo-200"
                        >
                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-full flex items-center justify-center mb-4 shadow-md">
                                <Clock size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-dark mb-2">Hours</h3>
                            <div className="text-sm text-medium space-y-1">
                                <p>Mon-Fri: 9:00 AM - 6:00 PM</p>
                                <p>Saturday: 10:00 AM - 4:00 PM</p>
                                <p>Sunday: Closed</p>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Contact Form */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="lg:col-span-2 bg-white rounded-3xl shadow-2xl p-8 border border-gray-100"
                    >
                        <h2 className="text-2xl font-extrabold text-dark mb-6">Send us a Message</h2>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-dark mb-2">Full Name *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-teal focus:border-transparent outline-none transition-all ${
                                            errors.name ? 'border-coral' : 'border-gray-200'
                                        }`}
                                        placeholder="Your name"
                                    />
                                    {errors.name && <p className="text-coral text-xs mt-1">{errors.name}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-dark mb-2">Email *</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-teal focus:border-transparent outline-none transition-all ${
                                            errors.email ? 'border-coral' : 'border-gray-200'
                                        }`}
                                        placeholder="your@email.com"
                                    />
                                    {errors.email && <p className="text-coral text-xs mt-1">{errors.email}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-dark mb-2">Subject *</label>
                                <input
                                    type="text"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-teal focus:border-transparent outline-none transition-all ${
                                        errors.subject ? 'border-coral' : 'border-gray-200'
                                    }`}
                                    placeholder="What is this about?"
                                />
                                {errors.subject && <p className="text-coral text-xs mt-1">{errors.subject}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-dark mb-2">Message *</label>
                                <textarea
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    rows="6"
                                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-teal focus:border-transparent outline-none transition-all resize-none ${
                                        errors.message ? 'border-coral' : 'border-gray-200'
                                    }`}
                                    placeholder="Your message..."
                                ></textarea>
                                {errors.message && <p className="text-coral text-xs mt-1">{errors.message}</p>}
                                <p className="text-xs text-medium mt-1">{formData.message.length}/500 characters</p>
                            </div>

                            <motion.button
                                type="submit"
                                disabled={loading}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full bg-gradient-to-r from-teal to-cyan text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                <Send size={20} />
                                {loading ? 'Sending...' : 'Send Message'}
                            </motion.button>
                        </form>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}

