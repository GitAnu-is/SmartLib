# Admin Space Card Component Documentation

## Overview

The `AdminSpaceCard` component is a React component designed for library space management in admin dashboards. It displays space information with an enhanced schedule modal featuring reservation management, statistics, and export capabilities.

---

## Features

### 1. **Space Information Display**
- Color-coded header bar (customizable colors)
- Space name, capacity, and type
- Amenities display with icons
- Operating hours/time slots
- Edit and Delete buttons

### 2. **Schedule Modal**

#### Viewing Schedule
- Date picker for viewing different days
- Complete daily reservation timeline (9:00-21:00)
- Color-coded reservation blocks
- User information for each booking
- Quick cancel button (hover activated)
- Visual "Available" indicator for empty slots

#### Room Usage Statistics
- **Total Bookings**: Number of reservations for the space
- **Booked Hours**: Total hours of all reservations
- **Occupancy Rate**: Percentage of operating hours with bookings
- **Peak Hour**: Hour with the most reservations

#### Add New Reservation
- Expandable form with input fields:
  - Start time and end time (with validation)
  - User name (required)
  - User email (required)
- Automatic time slot conflict detection
- Form validation with error messages
- Confirmation button with feedback

#### Cancel Reservations
- One-click cancellation from timeline
- Toast notification feedback
- Maintains data consistency

#### Export Functions
- **Export as CSV**: Download booking data for spreadsheet analysis
- **Export as Report**: Generate text format report

---

## Installation & Setup

### 1. Copy Component File
```bash
# Component file location
src/components/AdminSpaceCard.jsx
```

### 2. Import in Your Page
```jsx
import AdminSpaceCard from '../components/AdminSpaceCard'
import { motion } from 'framer-motion'

// Ensure you have these dependencies installed:
// - react@19+
// - framer-motion@12+
// - lucide-react
// - react-hot-toast
// - tailwindcss@4+
```

---

## Usage Example

### Basic Usage
```jsx
import AdminSpaceCard from '../components/AdminSpaceCard'

function AdminSpacesPage() {
  const space = {
    id: 1,
    name: 'Reading Room A',
    type: 'Quiet Zone',
    capacity: 30,
    color: 'teal',
    amenities: ['wifi', 'quiet', 'power'],
    timeSlots: ['09:00-11:00', '11:00-13:00', '14:00-16:00'],
  }

  const reservations = [
    {
      id: 1,
      spaceId: 1,
      date: '2024-04-04',
      startTime: '09:00',
      endTime: '10:00',
      userName: 'John Doe',
      userEmail: 'john@example.com',
    },
    // ... more reservations
  ]

  const handleEdit = (space) => {
    console.log('Edit space:', space)
    // Your edit logic here
  }

  const handleDelete = (space) => {
    console.log('Delete space:', space)
    // Your delete logic here
  }

  const handleAddReservation = (reservation) => {
    console.log('Add reservation:', reservation)
    // Save to database
  }

  const handleCancelReservation = (reservationId) => {
    console.log('Cancel reservation:', reservationId)
    // Delete from database
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      <AdminSpaceCard
        space={space}
        reservations={reservations}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAddReservation={handleAddReservation}
        onCancelReservation={handleCancelReservation}
      />
    </div>
  )
}
```

### With Multiple Spaces
```jsx
function AdminSpacesPage() {
  const [spaces, setSpaces] = useState([...])
  const [reservations, setReservations] = useState([...])

  const handleAddReservation = (newReservation) => {
    setReservations([...reservations, newReservation])
    // Call API: await api.addReservation(newReservation)
  }

  const handleCancelReservation = (reservationId) => {
    setReservations(reservations.filter(r => r.id !== reservationId))
    // Call API: await api.cancelReservation(reservationId)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {spaces.map(space => (
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
  )
}
```

---

## Component Props

```typescript
interface AdminSpaceCardProps {
  // Space configuration
  space: {
    id: number | string
    name: string
    type: string // e.g., "Quiet Zone", "Collaborative"
    capacity: number
    color?: 'teal' | 'coral' | 'golden' | 'dark' // Header background color
    amenities?: string[] // e.g., ['wifi', 'quiet', 'power', 'monitor']
    timeSlots?: string[] // e.g., ['09:00-11:00', '11:00-13:00']
  }

  // Reservation data
  reservations?: Array<{
    id: number | string
    spaceId: number | string
    date: string // YYYY-MM-DD format
    startTime: string // HH:MM format
    endTime: string // HH:MM format
    userName: string
    userEmail: string
  }>

  // Callback functions
  onEdit?: (space: any) => void
  onDelete?: (space: any) => void
  onAddReservation?: (reservation: any) => void
  onCancelReservation?: (reservationId: any) => void
}
```

---

## State Management

The component manages its own internal state for:
- Schedule modal visibility
- Selected date for viewing
- Reservation form inputs
- Add form visibility
- Editing/selected reservation

Parent component should manage:
- Spaces list
- Reservations data
- API calls to backend
- Global error/success feedback

---

## Styling & Customization

### Color Schemes
The component supports four color themes:

```jsx
color: 'teal'   // #0d9488 to #0f766e
color: 'coral'  // #ff6b6b to #fa5252
color: 'golden' // #f59e0b to #d97706
color: 'dark'   // #1f2937 to #111827
```

### Responsive Breakpoints
- Mobile: Single column layout, stacked modal
- Tablet (md): 2-3 columns
- Desktop (lg): 3+ columns

### Tailwind Classes Used
- Primary colors: `from-teal`, `to-cyan`, `text-teal`, `bg-teal`
- Utility colors: `text-dark`, `text-medium`, `bg-light`
- Border radius: `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-3xl`

---

## Validation & Error Handling

### Built-in Validations
1. **Time Conflict Detection**
   - Prevents overlapping reservations
   - Shows error toast: "Time slot conflicts with existing reservation"

2. **Form Validation**
   - Required fields: Name, Email
   - Time validation: End time > Start time
   - Email format: Basic regex validation

3. **User Feedback**
   - All operations use react-hot-toast
   - Success: "Reservation added successfully"
   - Error: Descriptive messages
   - Info: Export confirmations

### Error Messages
```
"Please enter name and email" - Missing required fields
"End time must be after start time" - Invalid time range
"Time slot conflicts with existing reservation" - Overlap detection
"Schedule exported as CSV" - Success confirmation
```

---

## Statistics Calculation

### Total Bookings
Simple count of reservations for the selected date.

### Booked Hours
Sum of duration (end time - start time) for all reservations.

```javascript
bookedHours = reservations.reduce((sum, res) => {
  const start = parseInt(res.startTime.split(':')[0])
  const end = parseInt(res.endTime.split(':')[0])
  return sum + (end - start)
}, 0)
```

### Occupancy Rate
Percentage of operating hours (9:00-21:00) with bookings.

```javascript
occupancyRate = (bookedHours / 12) * 100 // 12 hours operating time
```

### Peak Hour
Hour with the most reservations.

```javascript
const hourCounts = {}
reservations.forEach(res => {
  const hour = res.startTime.split(':')[0]
  hourCounts[hour] = (hourCounts[hour] || 0) + 1
})
peakHour = Object.entries(hourCounts).reduce((a, b) => b[1] > a[1] ? b : a)[0]
```

---

## Export Functionality

### CSV Export
```
Generates a CSV file with:
- Headers: Date, Start Time, End Time, User Name, User Email, Duration
- Rows: One per reservation
- Filename: {SpaceName}_schedule_{Date}.csv

Example:
Date,Start Time,End Time,User Name,User Email,Duration
2024-04-04,09:00,10:00,John Doe,john@example.com,1h
```

### PDF/Report Export
```
Generates a text report with:
- Title: Schedule Report for {Space Name}
- Date
- Total Bookings Count
- All reservations listed by time

Example filename: {SpaceName}_schedule_{Date}.txt
```

---

## Integration with Backend

### Recommended API Endpoints

```javascript
// Add new reservation
POST /api/reservations
Body: { spaceId, date, startTime, endTime, userName, userEmail }

// Get all reservations for a space
GET /api/reservations?spaceId={id}

// Cancel reservation
DELETE /api/reservations/{id}

// Update reservation (for modifications)
PATCH /api/reservations/{id}
Body: { startTime, endTime, userName, userEmail }
```

### Example Integration

```jsx
const handleAddReservation = async (reservation) => {
  try {
    const response = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reservation),
    })
    
    if (response.ok) {
      const saved = await response.json()
      setReservations([...reservations, saved])
      toast.success('Reservation added successfully')
    }
  } catch (error) {
    toast.error('Failed to add reservation')
  }
}
```

---

## Performance Considerations

### useMemo Hooks
- Statistics are memoized to prevent recalculation on every render
- Depends on: `[reservations]`

### AnimatePresence
- Modal animations are optimized with Framer Motion
- Prevents unnecessary DOM operations

### Conditional Rendering
- Export preview only shown when available
- Add form only rendered when active

---

## Accessibility

### Keyboard Navigation
- All buttons are tab-focusable
- Modal closes with Escape key (can be added)
- Form inputs are properly labeled

### Screen Readers
- Semantic HTML structure
- Title attributes on amenity icons
- ARIA-friendly button labels

### Visual Design
- Sufficient color contrast
- Icon + text labels (not icon-only)
- Focus states visible

---

## Troubleshooting

### Modal not opening
- Check `onClick` event on "View Schedule" button
- Verify `showScheduleModal` state updates

### Reservations not displaying
- Ensure reservations array is passed with correct structure
- Check date format (YYYY-MM-DD)
- Verify time format (HH:MM)

### Conflict detection not working
- Check time string parsing logic
- Ensure all reservations have startTime/endTime

### Export not working
- Check browser console for errors
- Verify Blob API support (should be fine in modern browsers)
- Check file download permissions

---

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (iOS 13+)
- IE11: Not supported (uses modern JavaScript features)

---

## Future Enhancements

1. **Recurring Reservations**
   - Support for weekly/monthly patterns
   - Bulk operations on recurring bookings

2. **Advanced Scheduling**
   - Drag-and-drop timeline editing
   - Drag slots between times
   - Visual conflicts highlighted

3. **Notifications**
   - Email reminders before reservation
   - Cancellation notifications
   - Waitlist management

4. **Analytics**
   - Usage trends over time
   - Popular time slots
   - Underutilized spaces

5. **Integration**
   - Google Calendar sync
   - Outlook integration
   - iCal export

6. **User Selection**
   - Dropdown list of registered users
   - User search functionality

---

## Component Structure

```
AdminSpaceCard
├── Space Card (display)
│   ├── Color Header
│   ├── Space Info
│   │   ├── Name
│   │   ├── Capacity & Type
│   │   └── Amenities
│   ├── Time Slots
│   └── Action Buttons
│       ├── View Schedule
│       ├── Edit
│       └── Delete
└── Schedule Modal
    ├── Header with close button
    ├── Statistics Grid (4 columns)
    ├── Date Picker
    ├── Daily Schedule Timeline
    │   └── Hourly slots with reservations
    ├── Add Reservation Form
    └── Export Buttons
```

---

## Code Comments

The component includes detailed comments covering:
- Section headers (===== SECTION NAME =====)
- Function purposes
- State variables
- Event handlers
- Conditional logic
- Styling rationale

---

## License & Attribution

This component is part of the SmartLib project and follows the project's licensing guidelines.

For questions or feature requests, refer to the project documentation or contact the development team.
