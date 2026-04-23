import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
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
    Phone,
    MapPin,
    GraduationCap,
    Award,
    Camera,
    Eye,
    EyeOff,
    Lock,
    FileText,
} from 'lucide-react'

export function UserProfilePage() {
    const [isEditing, setIsEditing] = useState(false)
    const [activeTab, setActiveTab] = useState('personal')
    const [showPassword, setShowPassword] = useState(false)
    const [profileCompletion, setProfileCompletion] = useState(0)
    const [uploadingPhoto, setUploadingPhoto] = useState(false)

    const safeParseJson = (value, fallback) => {
        if (!value) return fallback
        try {
            return JSON.parse(value)
        } catch {
            return fallback
        }
    }

    const user = safeParseJson(localStorage.getItem('user'), {})
    const [formData, setFormData] = useState({
        fullName: user.fullname || 'Shehara',
        email: user.email || 'surani@gmail.com',
        phone: user.phone || '+94 70 1234 567',
        department: user.department || 'Computer Science',
        year: user.year || '3rd Year',
        bio: user.bio || '',
        address: user.address || '',
        university: user.university || 'University Name',
        joinDate: user.joinDate || 'March 2026',
        newPassword: '',
        confirmPassword: '',
    })

    const [stats] = useState({
        booksActive: 5,
        booksRead: 24,
        reservations: 3,
        spaces: 2,
    })

    // Calculate profile completion
    useEffect(() => {
        const fields = [
            formData.fullName,
            formData.email,
            formData.phone,
            formData.department,
            formData.year,
            formData.bio,
            formData.address,
            formData.university,
        ]
        const completed = fields.filter((field) => field && field.trim()).length
        setProfileCompletion(Math.round((completed / fields.length) * 100))
    }, [formData])

    const handleSave = () => {
        const validations = [
            {
                condition: !formData.fullName.trim(),
                message: 'Full name is required',
            },
            {
                condition: formData.fullName.length < 3,
                message: 'Full name must be at least 3 characters',
            },
            {
                condition: !/^[A-Za-z][A-Za-z\s.'-]*$/.test(formData.fullName),
                message: 'Full name contains invalid characters',
            },
            {
                condition: formData.phone && !/^[+0-9\s()-]*$/.test(formData.phone),
                message: 'Phone number format is invalid',
            },
            {
                condition: formData.newPassword !== formData.confirmPassword && formData.newPassword,
                message: 'Passwords do not match',
            },
        ]

        for (const validation of validations) {
            if (validation.condition) {
                toast.error(validation.message)
                return
            }
        }

        const storedUser = safeParseJson(localStorage.getItem('user'), {})
        const nextUser = {
            ...storedUser,
            fullname: formData.fullName,
            fullName: formData.fullName,
            phone: formData.phone,
            department: formData.department,
            year: formData.year,
            bio: formData.bio,
            address: formData.address,
            university: formData.university,
            joinDate: formData.joinDate,
        }
        localStorage.setItem('user', JSON.stringify(nextUser))
        toast.success('Profile updated successfully!')
        setIsEditing(false)
        // Reset password fields
        setFormData((prev) => ({
            ...prev,
            newPassword: '',
            confirmPassword: '',
        }))
    }

    const handlePhotoUpload = (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            toast.error('Only JPG, PNG, and WebP images allowed')
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size must be less than 5MB')
            return
        }

        setUploadingPhoto(true)
        setTimeout(() => {
            toast.success('Profile photo updated!')
            setUploadingPhoto(false)
        }, 1500)
    }

    const tabData = [
        { id: 'personal', label: 'Personal Info', icon: UserIcon },
        { id: 'academic', label: 'Academic', icon: GraduationCap },
        { id: 'security', label: 'Security', icon: ShieldIcon },
        { id: 'activity', label: 'Activity', icon: BookOpenIcon },
    ]

    const renderPersonalTab = () => (
        <motion.div
            key="personal"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
            <FormField
                label="Full Name"
                value={formData.fullName}
                onChange={(value) => setFormData({ ...formData, fullName: value })}
                disabled={!isEditing}
                icon={UserIcon}
                placeholder="Enter your full name"
            />
            <FormField
                label="Email Address"
                type="email"
                value={formData.email}
                disabled
                icon={MailIcon}
                placeholder="Your email"
            />
            <FormField
                label="Phone Number"
                value={formData.phone}
                onChange={(value) => setFormData({ ...formData, phone: value })}
                disabled={!isEditing}
                icon={Phone}
                placeholder="+94 70 1234 567"
            />
            <FormField
                label="Address"
                value={formData.address}
                onChange={(value) => setFormData({ ...formData, address: value })}
                disabled={!isEditing}
                icon={MapPin}
                placeholder="Your address"
            />
            <div className="md:col-span-2">
                <FormField
                    label="Bio"
                    value={formData.bio}
                    onChange={(value) => setFormData({ ...formData, bio: value })}
                    disabled={!isEditing}
                    icon={FileText}
                    placeholder="Tell us about yourself"
                    isTextarea
                    maxLength={200}
                />
                <p className="text-xs text-medium mt-1">
                    {formData.bio.length}/200 characters
                </p>
            </div>
        </motion.div>
    )

    const renderAcademicTab = () => (
        <motion.div
            key="academic"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
            <FormField
                label="University"
                value={formData.university}
                onChange={(value) => setFormData({ ...formData, university: value })}
                disabled={!isEditing}
                icon={Award}
                placeholder="Your university"
            />
            <FormField
                label="Department"
                value={formData.department}
                onChange={(value) => setFormData({ ...formData, department: value })}
                disabled={!isEditing}
                icon={GraduationCap}
                placeholder="Computer Science"
            />
            <FormField
                label="Year of Study"
                value={formData.year}
                onChange={(value) => setFormData({ ...formData, year: value })}
                disabled={!isEditing}
                icon={BookOpenIcon}
                placeholder="3rd Year"
            />
            <FormField
                label="Member Since"
                value={formData.joinDate}
                disabled
                icon={CalendarIcon}
                placeholder="Join date"
            />
        </motion.div>
    )

    const renderSecurityTab = () => (
        <motion.div
            key="security"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-md space-y-6"
        >
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-3">
                <ShieldIcon className="text-blue-600 flex-shrink-0" size={20} />
                <p className="text-sm text-blue-700">
                    Keep your account secure by using a strong password
                </p>
            </div>

            <FormField
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={(value) => setFormData({ ...formData, newPassword: value })}
                disabled={!isEditing}
                icon={Lock}
                placeholder="Enter new password"
                rightIcon={showPassword ? EyeOff : Eye}
                onRightIconClick={() => setShowPassword(!showPassword)}
            />

            <FormField
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(value) => setFormData({ ...formData, confirmPassword: value })}
                disabled={!isEditing}
                icon={Lock}
                placeholder="Confirm password"
                rightIcon={showPassword ? EyeOff : Eye}
                onRightIconClick={() => setShowPassword(!showPassword)}
            />

            <PasswordStrengthIndicator password={formData.newPassword} />
        </motion.div>
    )

    const renderActivityTab = () => (
        <motion.div
            key="activity"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
            <StatCard
                icon={BookOpenIcon}
                label="Books Active"
                value={stats.booksActive}
                color="teal"
            />
            <StatCard
                icon={CheckCircleIcon}
                label="Books Read"
                value={stats.booksRead}
                color="green"
            />
            <StatCard
                icon={CalendarIcon}
                label="Active Reservations"
                value={stats.reservations}
                color="blue"
            />
            <StatCard
                icon={MapPin}
                label="Spaces Visited"
                value={stats.spaces}
                color="purple"
            />
        </motion.div>
    )

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Profile Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200 mb-8 relative overflow-hidden"
                >
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-teal/10 rounded-full -mr-16 -mt-16"></div>

                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6 relative z-10">
                        {/* Avatar with photo upload */}
                        <div className="relative">
                            <div className="w-32 h-32 bg-gradient-to-br from-teal to-teal-600 rounded-full flex items-center justify-center text-white text-4xl font-extrabold shadow-lg shadow-teal/30 capitalize cursor-pointer hover:shadow-xl transition-all relative group">
                                {formData.fullName.slice(0, 2)}
                                {isEditing && (
                                    <label className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                                        <Camera className="text-white" size={24} />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handlePhotoUpload}
                                            disabled={uploadingPhoto}
                                            className="hidden"
                                        />
                                    </label>
                                )}
                            </div>
                            <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                        </div>

                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-3 mb-3">
                                <h1 className="text-3xl md:text-4xl font-extrabold text-dark">
                                    {formData.fullName}
                                </h1>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-4">
                                <Badge label={formData.department} color="teal" />
                                <Badge label={formData.year} color="golden" />
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-medium text-gray-600">
                                <span className="flex items-center gap-1.5">
                                    <MailIcon size={16} />
                                    {formData.email}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <CalendarIcon size={16} />
                                    Member since {formData.joinDate}
                                </span>
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsEditing(!isEditing)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold shadow-lg transition-all whitespace-nowrap ${
                                isEditing
                                    ? 'bg-coral text-white hover:bg-coral/90'
                                    : 'bg-teal text-white hover:bg-teal/90'
                            }`}
                        >
                            <EditIcon size={18} />
                            {isEditing ? 'Cancel' : 'Edit Profile'}
                        </motion.button>
                    </div>

                    {/* Profile Completion Bar */}
                    {isEditing && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6 pt-6 border-t border-gray-200"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-bold text-dark">Profile Completion</p>
                                <p className="text-sm font-bold text-teal">{profileCompletion}%</p>
                            </div>
                            <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${profileCompletion}%` }}
                                    className="h-full bg-gradient-to-r from-teal to-teal-600"
                                />
                            </div>
                        </motion.div>
                    )}
                </motion.div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {tabData.map((tab) => {
                        const Icon = tab.icon
                        return (
                            <motion.button
                                key={tab.id}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-bold transition-all whitespace-nowrap ${
                                    activeTab === tab.id
                                        ? 'bg-teal text-white shadow-lg'
                                        : 'bg-white text-dark border border-gray-200 hover:border-teal'
                                }`}
                            >
                                <Icon size={18} />
                                {tab.label}
                            </motion.button>
                        )
                    })}
                </div>

                {/* Tab Content */}
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200"
                >
                    {activeTab === 'personal' && renderPersonalTab()}
                    {activeTab === 'academic' && renderAcademicTab()}
                    {activeTab === 'security' && renderSecurityTab()}
                    {activeTab === 'activity' && renderActivityTab()}

                    {isEditing && (activeTab === 'personal' || activeTab === 'academic' || activeTab === 'security') && (
                        <div className="mt-8 flex gap-4 flex-wrap">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleSave}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal to-teal-600 text-white rounded-full font-bold shadow-lg hover:shadow-xl transition-all"
                            >
                                <SaveIcon size={18} />
                                Save Changes
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setIsEditing(false)}
                                className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-dark rounded-full font-bold hover:bg-gray-300 transition-all"
                            >
                                Discard
                            </motion.button>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    )
}

// Helper Components
function FormField({
    label,
    type = 'text',
    value,
    onChange,
    disabled,
    icon: Icon,
    placeholder,
    isTextarea,
    maxLength,
    rightIcon: RightIcon,
    onRightIconClick,
}) {
    return (
        <div>
            <label className="block text-sm font-bold text-dark mb-2 flex items-center gap-2">
                {Icon && <Icon size={16} className="text-teal" />}
                {label}
            </label>
            {isTextarea ? (
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    placeholder={placeholder}
                    maxLength={maxLength}
                    rows={4}
                    className={`w-full px-4 py-3 bg-light border border-gray-200 rounded-2xl focus:ring-2 focus:ring-teal outline-none resize-none transition-all ${
                        disabled ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                />
            ) : (
                <div className="relative">
                    <input
                        type={type}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        disabled={disabled}
                        placeholder={placeholder}
                        className={`w-full px-4 py-3 bg-light border border-gray-200 rounded-2xl focus:ring-2 focus:ring-teal outline-none transition-all ${
                            disabled ? 'opacity-70 cursor-not-allowed' : ''
                        } ${RightIcon ? 'pr-10' : ''}`}
                    />
                    {RightIcon && !disabled && (
                        <button
                            type="button"
                            onClick={onRightIconClick}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-medium hover:text-dark transition-colors"
                        >
                            <RightIcon size={18} />
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}

function Badge({ label, color }) {
    const colorClasses = {
        teal: 'bg-teal/10 text-teal',
        golden: 'bg-golden/20 text-yellow-700',
        green: 'bg-green-100 text-green-700',
        blue: 'bg-blue-100 text-blue-700',
        purple: 'bg-purple-100 text-purple-700',
    }

    return (
        <span
            className={`px-3 py-1 ${colorClasses[color]} text-sm font-bold rounded-full`}
        >
            {label}
        </span>
    )
}

function StatCard({ icon: Icon, label, value, color }) {
    const colorClasses = {
        teal: 'from-teal/10 to-teal/5 text-teal',
        green: 'from-green-100 to-green-50 text-green-700',
        blue: 'from-blue-100 to-blue-50 text-blue-700',
        purple: 'from-purple-100 to-purple-50 text-purple-700',
    }

    return (
        <motion.div
            whileHover={{ y: -4 }}
            className={`bg-gradient-to-br ${colorClasses[color]} p-6 rounded-2xl border border-gray-100`}
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-bold opacity-75 mb-1">{label}</p>
                    <p className="text-3xl font-extrabold">{value}</p>
                </div>
                <Icon size={32} className="opacity-30" />
            </div>
        </motion.div>
    )
}

function PasswordStrengthIndicator({ password }) {
    const getStrength = () => {
        if (!password) return { level: 0, text: '', color: 'bg-gray-300' }
        const hasUpper = /[A-Z]/.test(password)
        const hasLower = /[a-z]/.test(password)
        const hasNumber = /\d/.test(password)
        const hasSpecial = /[!@#$%^&*]/.test(password)
        const isLong = password.length >= 8

        const strength = [hasUpper, hasLower, hasNumber, hasSpecial, isLong].filter(Boolean).length

        if (strength <= 1) return { level: 1, text: 'Weak', color: 'bg-red-500' }
        if (strength <= 2) return { level: 2, text: 'Fair', color: 'bg-yellow-500' }
        if (strength <= 3) return { level: 3, text: 'Good', color: 'bg-yellow-600' }
        return { level: 4, text: 'Strong', color: 'bg-green-500' }
    }

    const strength = getStrength()

    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-dark">Password Strength</p>
                {strength.text && (
                    <p className={`text-xs font-bold ${strength.color} text-white px-2 py-1 rounded`}>
                        {strength.text}
                    </p>
                )}
            </div>
            <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all ${
                            i <= strength.level ? strength.color : 'bg-gray-200'
                        }`}
                    />
                ))}
            </div>
        </div>
    )
}
