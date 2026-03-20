import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
    UserIcon,
    MailIcon,
    BookOpenIcon,
    ClockIcon,
    AlertTriangleIcon,
    DollarSignIcon,
    EditIcon,
    SaveIcon,
    BellIcon,
    ShieldIcon,
    LogOutIcon,
    CalendarIcon,
    CheckCircleIcon,
    HashIcon,
} from 'lucide-react'

export function UserProfilePage() {
    const [isEditing, setIsEditing] = useState(false)

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [formData, setFormData] = useState({
        fullName: user.fullname || 'Alex Johnson',
        email: user.email || 'alex.johnson@university.edu',
        phone: '+1 (555) 123-4567',
        department: 'Computer Science',
        year: '3rd Year',
    })

    return (
        <div className="min-h-screen bg-light p-4 sm:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Profile Header */}
                <motion.div
                    initial={{
                        opacity: 0,
                        y: -20,
                    }}
                    animate={{
                        opacity: 1,
                        y: 0,
                    }}
                    className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-8"
                >
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                        <div className="w-24 h-24 bg-teal rounded-full flex items-center justify-center text-white text-3xl font-extrabold shadow-lg shadow-teal/30 capitalize">
                            {formData.fullName.slice(0, 2)}
                        </div>

                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                <h1 className="text-3xl font-extrabold text-dark">{formData.fullName}</h1>
                                <span className="px-3 py-1 bg-teal/10 text-teal text-sm font-bold rounded-full">
                                    {formData.department}
                                </span>
                                <span className="px-3 py-1 bg-golden/20 text-yellow-700 text-sm font-bold rounded-full">
                                    {formData.year}
                                </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-medium">
                                <span className="flex items-center gap-1.5"><MailIcon size={16} />{formData.email}</span>
                                <span className="flex items-center gap-1.5"><CalendarIcon size={16} />Member since March 2026</span>
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsEditing(!isEditing)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold shadow-lg transition-all ${isEditing ? 'bg-coral text-white' : 'bg-teal text-white'}`}
                        >
                            <EditIcon size={18} />
                            {isEditing ? 'Cancel' : 'Edit Profile'}
                        </motion.button>
                    </div>
                </motion.div>

                {/* Form Information */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-dark mb-2">Full Name</label>
                            <input
                                type="text"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                disabled={!isEditing}
                                className={`w-full px-4 py-3 bg-light border border-gray-200 rounded-2xl focus:ring-2 focus:ring-teal outline-none transition-all ${!isEditing ? 'opacity-70' : ''}`}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-dark mb-2">Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                disabled={!isEditing}
                                className={`w-full px-4 py-3 bg-light border border-gray-200 rounded-2xl focus:ring-2 focus:ring-teal outline-none transition-all ${!isEditing ? 'opacity-70' : ''}`}
                            />
                        </div>
                    </div>
                    {isEditing && (
                        <button
                            onClick={() => setIsEditing(false)}
                            className="mt-6 flex items-center gap-2 px-6 py-3 bg-teal text-white rounded-full font-bold shadow-lg"
                        >
                            <SaveIcon size={18} />Save Changes
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
