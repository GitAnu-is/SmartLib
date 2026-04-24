import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  EditIcon,
  TrashIcon,
  CalendarIcon,
  PlusIcon,
  XIcon,
  DownloadIcon,
  BarChart3Icon,
  UsersIcon,
  WifiIcon,
  VolumeXIcon,
  MonitorIcon,
  CoffeeIcon,
  TrendingUpIcon,
  ClockIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  FileTextIcon,
} from 'lucide-react'

/**
 * AdminSpaceCard Component
 * 
 * Display library space information with an enhanced schedule modal featuring:
 * - View full schedule with visual timeline
 * - Add new reservations (date, time, user selection)
 * - Modify or cancel existing reservations
 * - Export schedule as CSV or PDF
 * - Display room usage statistics (bookings, peak hours, occupancy)
 * 
 * Props:
 * @param {Object} space - Space object containing id, name, type, capacity, amenities, timeSlots
 * @param {Function} onEdit - Callback when edit button is clicked
 * @param {Function} onDelete - Callback when delete button is clicked
 * @param {Array} reservations - Existing reservations for this space
 * @param {Function} onAddReservation - Callback to add new reservation
 * @param {Function} onCancelReservation - Callback to cancel reservation
 */
const AdminSpaceCard = ({
  space = {},
  onEdit = () => {},
  onDelete = () => {},
  reservations = [],
  onAddReservation = () => {},
  onCancelReservation = () => {},
}) => {
  // ===== STATE MANAGEMENT =====
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [reservationForm, setReservationForm] = useState({
    startTime: '09:00',
    endTime: '10:00',
    userName: '',
    userEmail: '',
  })
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingReservation, setEditingReservation] = useState(null)

  // ===== AMENITY ICONS MAPPING =====
  const amenityIcons = {
    wifi: WifiIcon,
    quiet: VolumeXIcon,
    monitor: MonitorIcon,
    coffee: CoffeeIcon,
    video: FileTextIcon,
    power: TrendingUpIcon,
    whiteboard: ClockIcon,
  }

  // ===== CALCULATED STATISTICS =====
  const roomStats = useMemo(() => {
    const totalBookings = reservations.length
    const bookedHours = reservations.reduce((sum, res) => {
      const start = parseInt(res.startTime.split(':')[0])
      const end = parseInt(res.endTime.split(':')[0])
      return sum + (end - start)
    }, 0)
    const totalHours = 12 // Assuming 9:00 to 21:00 operating hours
    const occupancyRate = totalHours > 0 ? Math.round((bookedHours / totalHours) * 100) : 0

    // Find peak hour (hour with most bookings)
    const hourCounts = {}
    reservations.forEach((res) => {
      const hour = res.startTime.split(':')[0]
      hourCounts[hour] = (hourCounts[hour] || 0) + 1
    })
    const peakHour = Object.keys(hourCounts).length > 0
      ? Object.entries(hourCounts).reduce((a, b) => (b[1] > a[1] ? b : a))[0]
      : 'N/A'

    return {
      totalBookings,
      bookedHours,
      occupancyRate,
      peakHour: peakHour !== 'N/A' ? `${peakHour}:00` : peakHour,
    }
  }, [reservations])

  // ===== FILTER RESERVATIONS BY DATE =====
  const dailyReservations = useMemo(() => {
    return reservations.filter((res) => res.date === selectedDate).sort((a, b) => a.startTime.localeCompare(b.startTime))
  }, [reservations, selectedDate])

  // ===== EVENT HANDLERS =====
  const handleAddReservation = () => {
    // Validate form
    if (!reservationForm.userName.trim() || !reservationForm.userEmail.trim()) {
      toast.error('Please enter name and email')
      return
    }

    if (reservationForm.startTime >= reservationForm.endTime) {
      toast.error('End time must be after start time')
      return
    }

    // Check for time conflicts
    const hasConflict = dailyReservations.some((res) => {
      const resStart = res.startTime
      const resEnd = res.endTime
      const newStart = reservationForm.startTime
      const newEnd = reservationForm.endTime

      return (newStart < resEnd && newEnd > resStart)
    })

    if (hasConflict) {
      toast.error('Time slot conflicts with existing reservation')
      return
    }

    const newReservation = {
      id: Date.now(),
      spaceId: space.id,
      date: selectedDate,
      ...reservationForm,
    }

    onAddReservation(newReservation)
    setReservationForm({ startTime: '09:00', endTime: '10:00', userName: '', userEmail: '' })
    setShowAddForm(false)
    toast.success('Reservation added successfully')
  }

  const handleCancelReservation = (reservationId) => {
    onCancelReservation(reservationId)
    toast.success('Reservation cancelled')
  }

  // ===== EXPORT FUNCTIONS =====
  const exportAsCSV = () => {
    const headers = ['Date', 'Start Time', 'End Time', 'User Name', 'User Email', 'Duration']
    const data = dailyReservations.map((res) => {
      const start = parseInt(res.endTime.split(':')[0])
      const end = parseInt(res.startTime.split(':')[0])
      const duration = Math.abs(start - end)
      return [res.date, res.startTime, res.endTime, res.userName, res.userEmail, `${duration}h`]
    })

    const csv = [headers, ...data].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${space.name}_schedule_${selectedDate}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success('Schedule exported as CSV')
  }

  const exportAsPDF = () => {
    // Simple PDF export (in production, use libraries like jsPDF)
    const pdfContent = `
    Schedule Report: ${space.name}
    Date: ${selectedDate}
    Total Bookings: ${dailyReservations.length}
    
    ${dailyReservations.map((res) => `${res.startTime} - ${res.endTime}: ${res.userName}`).join('\n')}
    `

    const blob = new Blob([pdfContent], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${space.name}_schedule_${selectedDate}.txt`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success('Schedule exported as text')
  }

  // ===== TIME SLOT VISUALIZATION =====
  const hours = Array.from({ length: 12 }, (_, i) => `${String(9 + i).padStart(2, '0')}:00`)

  // ===== UI RENDERER =====
  return (
    <>
      {/* ===== SPACE CARD ===== */}
      <motion.div
        className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow h-full flex flex-col"
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
      >
        {/* Color Header Bar */}
        <div
          className={`h-24 bg-gradient-to-br from-${space.color} to-${space.color}/80`}
          style={{
            background:
              space.color === 'teal'
                ? 'linear-gradient(135deg, #0d9488, #0f766e)'
                : space.color === 'coral'
                  ? 'linear-gradient(135deg, #ff6b6b, #fa5252)'
                  : space.color === 'golden'
                    ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                    : 'linear-gradient(135deg, #1f2937, #111827)',
          }}
        />

        {/* Card Content */}
        <div className="p-5 flex-1 flex flex-col">
          {/* Space Name & Info */}
          <h3 className="font-extrabold text-dark text-lg mb-1">{space.name}</h3>
          <div className="flex items-center gap-3 text-sm text-medium mb-3">
            <span className="flex items-center gap-1">
              <UsersIcon size={14} /> {space.capacity} seats
            </span>
            <span>•</span>
            <span>{space.type}</span>
          </div>

          {/* Amenities Display */}
          <div className="flex gap-2 mb-3 flex-wrap">
            {(space.amenities || []).map((amenity) => {
              const Icon = amenityIcons[amenity] || WifiIcon
              return (
                <div
                  key={amenity}
                  className="w-8 h-8 bg-light rounded-lg flex items-center justify-center"
                  title={amenity}
                >
                  <Icon size={14} className="text-medium" />
                </div>
              )
            })}
          </div>

          {/* Time Slots Display */}
          {(space.timeSlots || []).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {space.timeSlots.map((slot) => (
                <span
                  key={slot}
                  className="px-2.5 py-1 bg-light rounded-full text-xs font-semibold text-medium"
                >
                  {slot}
                </span>
              ))}
            </div>
          )}

          {/* Action Footer */}
          <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
            <button
              onClick={() => setShowScheduleModal(true)}
              className="text-sm font-bold text-teal hover:underline flex items-center gap-1"
            >
              <CalendarIcon size={14} />
              View Schedule
            </button>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={onEdit}
                className="p-2 text-medium hover:text-teal hover:bg-teal/10 rounded-full transition-colors"
                title="Edit space"
              >
                <EditIcon size={16} />
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="p-2 text-medium hover:text-coral hover:bg-coral/10 rounded-full transition-colors"
                title="Delete space"
              >
                <TrashIcon size={16} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ===== SCHEDULE MODAL ===== */}
      <AnimatePresence>
        {showScheduleModal && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-teal to-cyan p-6 flex justify-between items-center sticky top-0 z-40">
                <div>
                  <h2 className="text-2xl font-extrabold text-white">{space.name} - Schedule</h2>
                  <p className="text-cyan-100 text-sm mt-1">{space.type} • {space.capacity} seats</p>
                </div>
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <XIcon size={24} className="text-white" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* ===== STATS SECTION ===== */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-200">
                    <div className="text-3xl font-extrabold text-blue-600">{roomStats.totalBookings}</div>
                    <div className="text-sm text-blue-600 mt-1 font-semibold">Total Bookings</div>
                  </div>
                  <div className="bg-gradient-to-br from-teal-50 to-teal-100/50 rounded-xl p-4 border border-teal-200">
                    <div className="text-3xl font-extrabold text-teal-600">{roomStats.bookedHours}h</div>
                    <div className="text-sm text-teal-600 mt-1 font-semibold">Booked Hours</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-4 border border-green-200">
                    <div className="text-3xl font-extrabold text-green-600">{roomStats.occupancyRate}%</div>
                    <div className="text-sm text-green-600 mt-1 font-semibold">Occupancy Rate</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-4 border border-purple-200">
                    <div className="text-2xl font-extrabold text-purple-600">{roomStats.peakHour}</div>
                    <div className="text-sm text-purple-600 mt-1 font-semibold">Peak Hour</div>
                  </div>
                </div>

                {/* ===== DATE PICKER ===== */}
                <div className="border-t pt-6">
                  <label className="block text-sm font-bold text-dark mb-2">Select Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full md:w-48 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal focus:border-transparent outline-none"
                  />
                </div>

                {/* ===== SCHEDULE TIMELINE ===== */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-extrabold text-dark mb-4">Daily Schedule</h3>

                  <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200 overflow-x-auto">
                    <div className="space-y-2 min-w-max">
                      {hours.map((hour) => {
                        const hourRes = dailyReservations.filter((res) => res.startTime.startsWith(hour.split(':')[0]))
                        return (
                          <div key={hour} className="flex items-start gap-3">
                            <div className="w-16 text-sm font-bold text-medium flex-shrink-0">{hour}</div>
                            <div className="flex-1 bg-white rounded-lg p-2 border border-gray-200 min-h-12 flex items-center">
                              {hourRes.length > 0 ? (
                                <div className="space-y-1 w-full">
                                  {hourRes.map((res) => (
                                    <div
                                      key={res.id}
                                      className="bg-teal/20 border border-teal rounded px-2 py-1 text-xs flex justify-between items-center group"
                                    >
                                      <span>
                                        <strong>{res.startTime}-{res.endTime}</strong>: {res.userName}
                                      </span>
                                      <button
                                        onClick={() => handleCancelReservation(res.id)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-coral hover:bg-coral/10 p-1 rounded"
                                        title="Cancel reservation"
                                      >
                                        <XIcon size={14} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-gray-400 text-xs">Available</span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Message if no reservations */}
                  {dailyReservations.length === 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-2 text-blue-700">
                      <AlertCircleIcon size={18} />
                      <span className="text-sm">No reservations for this date. All time slots are available.</span>
                    </div>
                  )}
                </div>

                {/* ===== ADD NEW RESERVATION ===== */}
                <div className="border-t pt-6">
                  <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="flex items-center gap-2 px-4 py-2 bg-teal text-white rounded-lg font-semibold hover:bg-teal/90 transition-colors"
                  >
                    <PlusIcon size={18} />
                    Add New Reservation
                  </button>

                  {showAddForm && (
                    <motion.div
                      className="mt-4 p-4 bg-light rounded-lg border border-gray-300 space-y-3"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                    >
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-dark mb-1">Start Time</label>
                          <input
                            type="time"
                            value={reservationForm.startTime}
                            onChange={(e) =>
                              setReservationForm({ ...reservationForm, startTime: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-dark mb-1">End Time</label>
                          <input
                            type="time"
                            value={reservationForm.endTime}
                            onChange={(e) =>
                              setReservationForm({ ...reservationForm, endTime: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-dark mb-1">User Name</label>
                        <input
                          type="text"
                          placeholder="Enter user name"
                          value={reservationForm.userName}
                          onChange={(e) =>
                            setReservationForm({ ...reservationForm, userName: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-dark mb-1">User Email</label>
                        <input
                          type="email"
                          placeholder="user@example.com"
                          value={reservationForm.userEmail}
                          onChange={(e) =>
                            setReservationForm({ ...reservationForm, userEmail: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal outline-none"
                        />
                      </div>

                      <button
                        onClick={handleAddReservation}
                        className="w-full py-2 bg-teal text-white font-semibold rounded-lg hover:bg-teal/90 transition-colors"
                      >
                        Confirm Reservation
                      </button>
                    </motion.div>
                  )}
                </div>

                {/* ===== EXPORT BUTTONS ===== */}
                <div className="border-t pt-6 flex gap-3">
                  <button
                    onClick={exportAsCSV}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-semibold hover:bg-blue-200 transition-colors"
                  >
                    <DownloadIcon size={18} />
                    Export CSV
                  </button>
                  <button
                    onClick={exportAsPDF}
                    className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg font-semibold hover:bg-green-200 transition-colors"
                  >
                    <FileTextIcon size={18} />
                    Export Report
                  </button>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 p-4 border-t flex justify-end gap-3">
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 text-dark font-semibold hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default AdminSpaceCard
