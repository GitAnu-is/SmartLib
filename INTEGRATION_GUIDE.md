/**
 * INTEGRATION GUIDE: AdminSpaceCard Component
 * 
 * This file shows exactly how to integrate AdminSpaceCard into your
 * AdminSpacesELearning.jsx file with step-by-step instructions.
 */

// ============================================================================
// STEP 1: ADD IMPORT AT THE TOP OF AdminSpacesELearning.jsx
// ============================================================================

/*
Add this line with other imports:

import AdminSpaceCard from '../components/AdminSpaceCard'
*/

// ============================================================================
// STEP 2: ADD STATE FOR MANAGING RESERVATIONS
// ============================================================================

/*
Inside the AdminSpacesELearning component function, add this state:

const [reservations, setReservations] = useState([
  // Initialize with existing reservations from API or local state
  // Format: { id, spaceId, date: 'YYYY-MM-DD', startTime: 'HH:MM', endTime: 'HH:MM', userName, userEmail }
])
*/

// ============================================================================
// STEP 3: ADD EVENT HANDLER FUNCTIONS
// ============================================================================

/*
Add these functions to handle card callbacks:

// Handler to add a new reservation
const handleAddReservation = async (newReservation) => {
  try {
    // Optional: Call API to save reservation
    // const response = await addReservation(newReservation)
    
    // Update local state
    setReservations([...reservations, newReservation])
    
    // Feedback is handled by the card component with toast
  } catch (error) {
    console.error('Failed to add reservation:', error)
  }
}

// Handler to cancel a reservation
const handleCancelReservation = async (reservationId) => {
  try {
    // Optional: Call API to delete reservation
    // await cancelReservation(reservationId)
    
    // Update local state
    setReservations(reservations.filter(r => r.id !== reservationId))
    
    // Feedback is handled by the card component with toast
  } catch (error) {
    console.error('Failed to cancel reservation:', error)
  }
}
*/

// ============================================================================
// STEP 4: REPLACE THE SPACE CARD RENDERING CODE
// ============================================================================

/*
FIND THIS IN YOUR SPACES TAB SECTION:

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {filteredSpaces.map((space) => (
    <motion.div
      key={space.id}
      className="bg-white rounded-2xl shadow-lg..."
      ...
    >
      {/* OLD CARD CODE... */}
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-extrabold text-dark text-lg mb-1">
          {space.name}
        </h3>
        {/* ... more content ... */}
      </div>
    </motion.div>
  ))}
</div>

REPLACE WITH:

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {filteredSpaces.map((space) => (
    <AdminSpaceCard
      key={space.id}
      space={space}
      reservations={reservations.filter(r => r.spaceId === space.id)}
      onEdit={() => handleEditSpace(space)}
      onDelete={() => handleDeleteSpace(space)}
      onAddReservation={handleAddReservation}
      onCancelReservation={handleCancelReservation}
    />
  ))}
</div>
*/

// ============================================================================
// FULL INTEGRATION EXAMPLE
// ============================================================================

// Import the component at the top
import AdminSpaceCard from '../components/AdminSpaceCard'

// Example of the complete integration:
export function AdminSpacesELearning() {
  // ... existing state ...
  const [spaces, setSpaces] = useState([...mockSpaces])
  const [reservations, setReservations] = useState([
    {
      id: 1,
      spaceId: 1,
      date: '2024-04-04',
      startTime: '09:00',
      endTime: '10:00',
      userName: 'Student 1',
      userEmail: 'student1@example.com',
    },
    {
      id: 2,
      spaceId: 1,
      date: '2024-04-04',
      startTime: '10:30',
      endTime: '11:30',
      userName: 'Student 2',
      userEmail: 'student2@example.com',
    },
  ])

  // ===== EVENT HANDLERS FOR RESERVATIONS =====
  
  /**
   * Handle adding a new reservation
   * @param {Object} newReservation - New reservation object
   */
  const handleAddReservation = async (newReservation) => {
    try {
      // Step 1: Add to local state
      setReservations([...reservations, newReservation])

      // Step 2 (Optional): Call backend API
      // await fetch('/api/reservations', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(newReservation),
      // })

      // Note: Toast notification is shown by the card component
    } catch (error) {
      console.error('Failed to add reservation:', error)
      toast.error('Failed to add reservation')
    }
  }

  /**
   * Handle cancelling an existing reservation
   * @param {string|number} reservationId - ID of reservation to cancel
   */
  const handleCancelReservation = async (reservationId) => {
    try {
      // Step 1: Remove from local state
      setReservations(reservations.filter(r => r.id !== reservationId))

      // Step 2 (Optional): Call backend API
      // await fetch(`/api/reservations/${reservationId}`, {
      //   method: 'DELETE',
      // })

      // Note: Toast notification is shown by the card component
    } catch (error) {
      console.error('Failed to cancel reservation:', error)
      toast.error('Failed to cancel reservation')
    }
  }

  // ... existing functions (handleEditSpace, handleDeleteSpace, etc.) ...

  return (
    <div>
      {/* Header and other UI elements */}

      {/* Spaces Grid with new AdminSpaceCard component */}
      <motion.div
        key="spaces"
        variants={containerVariants}
        initial="hidden"
        animate="show"
        exit={{ opacity: 0 }}
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-extrabold text-dark">
              Library Spaces
            </h2>
            <p className="text-sm text-medium mt-1">
              {spaces.length} spaces configured
            </p>
          </div>
          <button
            onClick={() => handleAddSpace()}
            className="flex items-center gap-2 px-4 py-2 bg-teal text-white rounded-lg..."
          >
            <PlusIcon size={18} />
            Add New Space
          </button>
        </div>

        {/* MAIN CHANGE: Replace old card rendering with AdminSpaceCard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSpaces.map((space) => (
            <AdminSpaceCard
              key={space.id}
              space={space}
              reservations={reservations.filter(r => r.spaceId === space.id)}
              onEdit={() => handleEditSpace(space)}
              onDelete={() => handleDeleteSpace(space)}
              onAddReservation={handleAddReservation}
              onCancelReservation={handleCancelReservation}
            />
          ))}
        </div>
      </motion.div>
    </div>
  )
}

// ============================================================================
// DATA FORMAT SPECIFICATIONS
// ============================================================================

/**
 * SPACE OBJECT FORMAT:
 * {
 *   id: number,                              // Unique space ID
 *   name: string,                            // Space name (e.g., "Reading Room A")
 *   type: string,                            // Room type (e.g., "Quiet Zone", "Collaborative")
 *   capacity: number,                        // Number of seats
 *   color?: 'teal' | 'coral' | 'golden' | 'dark',  // Header color
 *   amenities?: string[],                    // List of amenities
 *   timeSlots?: string[],                    // Operating hours (e.g., ['09:00-11:00'])
 *   status?: string,                         // Status (Active, Maintenance, etc.)
 * }
 */

/**
 * RESERVATION OBJECT FORMAT:
 * {
 *   id: number | string,                     // Unique reservation ID
 *   spaceId: number | string,                // Reference to space.id
 *   date: string,                            // Format: YYYY-MM-DD
 *   startTime: string,                       // Format: HH:MM (24-hour)
 *   endTime: string,                         // Format: HH:MM (24-hour)
 *   userName: string,                        // Name of person making reservation
 *   userEmail: string,                       // Email of person
 * }
 */

// ============================================================================
// LOADING DATA FROM API
// ============================================================================

/*
Example of loading spaces and reservations from your backend:

useEffect(() => {
  const loadSpaces = async () => {
    const response = await fetch('/api/spaces')
    const data = await response.json()
    setSpaces(data)
  }

  const loadReservations = async () => {
    const response = await fetch('/api/reservations')
    const data = await response.json()
    setReservations(data)
  }

  loadSpaces()
  loadReservations()
}, [])
*/

// ============================================================================
// OPTIONAL: ENHANCE WITH REAL-TIME UPDATES
// ============================================================================

/*
import { io } from 'socket.io-client'

useEffect(() => {
  const socket = io('http://your-server')

  // Listen for new reservations
  socket.on('reservationAdded', (reservation) => {
    setReservations([...reservations, reservation])
  })

  // Listen for cancelled reservations
  socket.on('reservationCancelled', (reservationId) => {
    setReservations(reservations.filter(r => r.id !== reservationId))
  })

  return () => socket.disconnect()
}, [reservations])
*/

// ============================================================================
// TESTING THE INTEGRATION
// ============================================================================

/*
To test the component without a backend:

1. Use mock data (example above)
2. Test adding a reservation:
   - Click "View Schedule" button
   - Click "Add New Reservation"
   - Fill in form fields
   - Click "Confirm Reservation"
   - Should see success toast and updated timeline

3. Test cancelling:
   - Hover over a reservation in timeline
   - Click X button
   - Should see success toast and reservation removed

4. Test exporting:
   - Click "Export CSV" or "Export Report"
   - Should download file to browser's default download folder

5. Verify stats:
   - Check that statistics update correctly:
     - Total Bookings increases/decreases
     - Booked Hours recalculates
     - Occupancy Rate updates
     - Peak Hour changes based on most bookings
*/

// ============================================================================
// COMMON ISSUES & SOLUTIONS
// ============================================================================

/*
ISSUE: Modal doesn't open
SOLUTION: Ensure Framer Motion AnimatePresence is properly configured

ISSUE: Reservations not showing in timeline
SOLUTION: Check date format (must be YYYY-MM-DD)
         Check time format (must be HH:MM in 24-hour format)
         Verify spaceId matches in reservations filter

ISSUE: Export not working
SOLUTION: Check browser console for errors
         Verify Blob API is supported (should be in all modern browsers)
         Check file permissions if running locally

ISSUE: Conflict detection failing
SOLUTION: Ensure all times are in HH:MM format
         Verify time comparison logic works with your data format
         Add console.log() to debug time parsing

ISSUE: Stats showing incorrect values
SOLUTION: Verify all reservations have startTime and endTime
         Check that hours are being calculated correctly
         Ensure date filtering is working (selected date matches reservation date)
*/

// ============================================================================
// PERFORMANCE TIPS
// ============================================================================

/*
1. Memoize space list if it's large:
   const memoizedSpaces = useMemo(() => filteredSpaces, [filteredSpaces])

2. Use pagination for many spaces:
   const [page, setPage] = useState(1)
   const itemsPerPage = 12
   const paginatedSpaces = spaces.slice((page - 1) * itemsPerPage, page * itemsPerPage)

3. Debounce search/filter:
   const debounce = (fn, delay) => {
     let timeoutId
     return (...args) => {
       clearTimeout(timeoutId)
       timeoutId = setTimeout(() => fn(...args), delay)
     }
   }

4. Consider virtual scrolling for 100+ reservations:
   Use react-window or react-virtual library

5. Cache reservation data:
   Store in localStorage or use React Query for caching
*/

export default {}
