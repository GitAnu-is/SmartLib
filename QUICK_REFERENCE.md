/**
 * ADMIN SPACE CARD - QUICK REFERENCE GUIDE
 * 
 * Quick lookup for common tasks and code snippets
 */

// ============================================================================
// QUICK START (Copy & Paste)
// ============================================================================

/*
1. IMPORT THE COMPONENT:
*/
import AdminSpaceCard from '../components/AdminSpaceCard'

/*
2. ADD STATE:
*/
const [reservations, setReservations] = useState([])

/*
3. ADD HANDLERS:
*/
const handleAddReservation = (reservation) => {
  setReservations([...reservations, reservation])
}

const handleCancelReservation = (id) => {
  setReservations(reservations.filter(r => r.id !== id))
}

/*
4. USE IN RENDER:
*/
<AdminSpaceCard
  space={space}
  reservations={reservations.filter(r => r.spaceId === space.id)}
  onEdit={() => console.log('edit')}
  onDelete={() => console.log('delete')}
  onAddReservation={handleAddReservation}
  onCancelReservation={handleCancelReservation}
/>

// ============================================================================
// COLOR OPTIONS
// ============================================================================

const spaceColors = {
  teal: 'linear-gradient(135deg, #0d9488, #0f766e)',
  coral: 'linear-gradient(135deg, #ff6b6b, #fa5252)',
  golden: 'linear-gradient(135deg, #f59e0b, #d97706)',
  dark: 'linear-gradient(135deg, #1f2937, #111827)',
}

// Usage:
{
  id: 1,
  name: 'Room A',
  color: 'teal', // Pick one of the above
}

// ============================================================================
// AMENITY OPTIONS
// ============================================================================

const amenityOptions = [
  'wifi',      // Wi-Fi icon
  'quiet',     // Volume X icon
  'monitor',   // Monitor icon
  'coffee',    // Coffee icon
  'video',     // File text icon
  'power',     // Trending up icon
  'whiteboard',// Clock icon
]

// Usage:
{
  amenities: ['wifi', 'monitor', 'power'],
}

// ============================================================================
// SPACE OBJECT TEMPLATE
// ============================================================================

const spaceTemplate = {
  id: 1,
  name: 'Reading Room A',
  type: 'Quiet Zone',
  capacity: 30,
  status: 'Active',
  color: 'teal',
  amenities: ['wifi', 'quiet', 'power'],
  timeSlots: ['09:00-11:00', '11:00-13:00', '14:00-16:00', '16:00-18:00'],
}

// ============================================================================
// RESERVATION OBJECT TEMPLATE
// ============================================================================

const reservationTemplate = {
  id: 1,
  spaceId: 1,
  date: '2024-04-04',        // YYYY-MM-DD format
  startTime: '09:00',        // HH:MM format (24-hour)
  endTime: '10:00',          // HH:MM format (24-hour)
  userName: 'John Doe',
  userEmail: 'john@example.com',
}

// ============================================================================
// BACKEND API ENDPOINTS
// ============================================================================

/*
POST /api/reservations
Body: { spaceId, date, startTime, endTime, userName, userEmail }
Response: { id, ...reservation }

GET /api/reservations?spaceId={id}
Response: [{ id, spaceId, ... }, ...]

DELETE /api/reservations/{id}
Response: { success: true }

PATCH /api/reservations/{id}
Body: { startTime, endTime, userName, userEmail }
Response: { id, ...updated }
*/

// ============================================================================
// DATE FORMATTING
// ============================================================================

// Get today's date in YYYY-MM-DD format
const today = new Date().toISOString().split('T')[0]

// Get specific date in YYYY-MM-DD format
const getFormattedDate = (date) => date.toISOString().split('T')[0]

// Parse date string
const parseDate = (dateString) => new Date(dateString)

// ============================================================================
// TIME VALIDATION
// ============================================================================

// Check if time format is valid (HH:MM)
const isValidTime = (time) => /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(time)

// Get hours between two times
const getHoursBetween = (startTime, endTime) => {
  const start = parseInt(startTime.split(':')[0])
  const end = parseInt(endTime.split(':')[0])
  return Math.abs(end - start)
}

// Check for time conflict
const hasTimeConflict = (reservations, startTime, endTime) => {
  return reservations.some((res) => {
    const resStart = res.startTime
    const resEnd = res.endTime
    return startTime < resEnd && endTime > resStart
  })
}

// ============================================================================
// FILTERING & SORTING
// ============================================================================

// Filter reservations by space
const filterBySpace = (reservations, spaceId) => {
  return reservations.filter(r => r.spaceId === spaceId)
}

// Filter reservations by date
const filterByDate = (reservations, date) => {
  return reservations.filter(r => r.date === date)
}

// Filter by space AND date
const filterBySpaceAndDate = (reservations, spaceId, date) => {
  return reservations.filter(r => r.spaceId === spaceId && r.date === date)
}

// Sort by time
const sortByTime = (reservations) => {
  return [...reservations].sort((a, b) => a.startTime.localeCompare(b.startTime))
}

// ============================================================================
// STATS CALCULATIONS
// ============================================================================

// Calculate total bookings
const getTotalBookings = (reservations) => reservations.length

// Calculate booked hours
const getBookedHours = (reservations) => {
  return reservations.reduce((sum, res) => {
    const start = parseInt(res.startTime.split(':')[0])
    const end = parseInt(res.endTime.split(':')[0])
    return sum + (end - start)
  }, 0)
}

// Calculate occupancy rate
const getOccupancyRate = (reservations, operatingHours = 12) => {
  const bookedHours = getBookedHours(reservations)
  return Math.round((bookedHours / operatingHours) * 100)
}

// Find peak hour
const getPeakHour = (reservations) => {
  const hourCounts = {}
  reservations.forEach((res) => {
    const hour = res.startTime.split(':')[0]
    hourCounts[hour] = (hourCounts[hour] || 0) + 1
  })
  
  if (Object.keys(hourCounts).length === 0) return 'N/A'
  
  const peakEntry = Object.entries(hourCounts).reduce((a, b) => 
    b[1] > a[1] ? b : a
  )
  return `${peakEntry[0]}:00`
}

// ============================================================================
// EXPORT HELPERS
// ============================================================================

// Create CSV content
const generateCSV = (reservations, spaceName) => {
  const headers = ['Date', 'Start Time', 'End Time', 'User Name', 'Email', 'Duration']
  
  const rows = reservations.map((res) => [
    res.date,
    res.startTime,
    res.endTime,
    res.userName,
    res.userEmail,
    `${parseInt(res.endTime.split(':')[0]) - parseInt(res.startTime.split(':')[0])}h`,
  ])
  
  return [headers, ...rows].map(row => row.join(',')).join('\n')
}

// Download file
const downloadFile = (content, filename, mimeType = 'text/plain') => {
  const blob = new Blob([content], { type: mimeType })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  window.URL.revokeObjectURL(url)
}

// Full export function
const exportReservationsAsCSV = (reservations, spaceName, date) => {
  const csv = generateCSV(reservations, spaceName)
  const filename = `${spaceName}_schedule_${date}.csv`
  downloadFile(csv, filename, 'text/csv')
}

// ============================================================================
// FORM VALIDATION
// ============================================================================

// Validate reservation form
const validateReservation = (formData) => {
  const errors = []
  
  if (!formData.userName?.trim()) {
    errors.push('Name is required')
  }
  
  if (!formData.userEmail?.trim()) {
    errors.push('Email is required')
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.userEmail)) {
    errors.push('Invalid email format')
  }
  
  if (!formData.startTime) {
    errors.push('Start time is required')
  }
  
  if (!formData.endTime) {
    errors.push('End time is required')
  } else if (formData.startTime >= formData.endTime) {
    errors.push('End time must be after start time')
  }
  
  return errors
}

// ============================================================================
// STATE MANAGEMENT PATTERNS
// ============================================================================

// Load data from API
const loadReservations = async () => {
  try {
    const response = await fetch('/api/reservations')
    const data = await response.json()
    setReservations(data)
  } catch (error) {
    console.error('Failed to load reservations:', error)
    toast.error('Failed to load reservations')
  }
}

// Add reservation with API
const addReservationWithAPI = async (reservation) => {
  try {
    const response = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reservation),
    })
    
    if (!response.ok) throw new Error('Failed to add')
    
    const saved = await response.json()
    setReservations([...reservations, saved])
    toast.success('Reservation added')
  } catch (error) {
    toast.error('Failed to add reservation')
  }
}

// Cancel reservation with API
const cancelReservationWithAPI = async (reservationId) => {
  try {
    const response = await fetch(`/api/reservations/${reservationId}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) throw new Error('Failed to cancel')
    
    setReservations(reservations.filter(r => r.id !== reservationId))
    toast.success('Reservation cancelled')
  } catch (error) {
    toast.error('Failed to cancel reservation')
  }
}

// ============================================================================
// MOCK DATA GENERATOR
// ============================================================================

// Generate mock reservations for testing
const generateMockReservations = (spaceId, count = 5) => {
  const today = new Date().toISOString().split('T')[0]
  const mockNames = ['Alice Brown', 'Bob Smith', 'Carol White', 'David Lee', 'Eva Garcia']
  
  return Array.from({ length: count }, (_, i) => ({
    id: Math.random(),
    spaceId,
    date: today,
    startTime: `${String(9 + i).padStart(2, '0')}:00`,
    endTime: `${String(10 + i).padStart(2, '0')}:00`,
    userName: mockNames[i % mockNames.length],
    userEmail: `user${i}@example.com`,
  }))
}

// ============================================================================
// COMPONENT REFS & ADVANCED PATTERNS
// ============================================================================

// Using useCallback for optimized handlers
import { useCallback } from 'react'

const handleAddReservationMemo = useCallback((reservation) => {
  setReservations(prev => [...prev, reservation])
}, [])

// Using useRef for modal operations
import { useRef } from 'react'

const modalRef = useRef(null)

const closeModal = () => {
  if (modalRef.current) {
    modalRef.current.scrollTop = 0
  }
}

// ============================================================================
// TESTING SNIPPETS
// ============================================================================

// Test adding reservation
const testAddReservation = () => {
  const newRes = {
    id: Date.now(),
    spaceId: 1,
    date: '2024-04-04',
    startTime: '09:00',
    endTime: '10:00',
    userName: 'Test User',
    userEmail: 'test@example.com',
  }
  setReservations([...reservations, newRes])
}

// Test conflict detection
const testConflict = () => {
  const conflicting = {
    startTime: '09:30',
    endTime: '10:30',
  }
  const has Conflict = hasTimeConflict(reservations, conflicting.startTime, conflicting.endTime)
  console.log('Has conflict:', hasConflict)
}

// ============================================================================
// KEYBOARD SHORTCUTS (Can be added)
// ============================================================================

/*
Escape - Close modal
Enter - Submit form
Ctrl+E - Export
Ctrl+N - Add new reservation
*/

// ============================================================================
// USEFUL LIBRARIES
// ============================================================================

/*
react-hook-form - Better form handling instead of useState
zod / yup - Schema validation for forms
date-fns - Better date manipulation
xlsx - Advanced Excel export
jsPDF - Professional PDF generation
react-query - Data fetching & caching
zustand / Redux - Complex state management
socket.io-client - Real-time updates
*/

// ============================================================================
// COMMON PATTERNS
// ============================================================================

// Pattern: Fetch and Set
useEffect(() => {
  const fetch Data = async () => {
    const res = await fetch('/api/reservations')
    setReservations(await res.json())
  }
  fetchData()
}, [])

// Pattern: Search/Filter
const [search, setSearch] = useState('')
const filtered = reservations.filter(r => 
  r.userName.toLowerCase().includes(search.toLowerCase())
)

// Pattern: Pagination
const [page, setPage] = useState(1)
const itemsPerPage = 10
const paginated = reservations.slice(
  (page - 1) * itemsPerPage,
  page * itemsPerPage
)

// ============================================================================
// END OF QUICK REFERENCE
// ============================================================================
