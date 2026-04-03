import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  LayoutDashboardIcon,
  MapPinIcon,
  BookOpenIcon,
  CalendarIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  UploadCloudIcon,
  UsersIcon,
  TrendingUpIcon,
  ClockIcon,
  CheckCircleIcon,
  XIcon,
  SearchIcon,
  FilterIcon,
  MoreVerticalIcon,
  WifiIcon,
  VolumeXIcon,
  MonitorIcon,
  CoffeeIcon,
  FileTextIcon,
  VideoIcon,
  BarChart3Icon,
  ArrowUpRightIcon,
  DownloadIcon,
  EyeIcon,
} from 'lucide-react'

import { createSpace, deleteSpace, fetchSpacesAdmin, updateSpace } from '../api/spaces'
import { deleteResource, fetchResourcesAdmin, updateResource, uploadResource } from '../api/resources'
  import { cancelReservation, fetchReservationsAdmin } from '../api/reservations'
// --- Mock Data ---
const mockStats = {
  totalReservations: 1284,
  activeSpaces: 24,
  totalResources: 156,
  utilizationRate: '78%',
}
const mockSpaces = [
  {
    id: 1,
    name: 'Reading Room A',
    type: 'Quiet Zone',
    capacity: 30,
    status: 'Active',
    color: 'teal',
    timeSlots: ['09:00-11:00', '11:00-13:00', '14:00-16:00', '16:00-18:00'],
    amenities: ['wifi', 'quiet', 'power'],
  },
  {
    id: 2,
    name: 'Group Study Room B',
    type: 'Collaborative',
    capacity: 8,
    status: 'Active',
    color: 'coral',
    timeSlots: ['09:00-11:00', '14:00-16:00'],
    amenities: ['wifi', 'monitor', 'whiteboard'],
  },
  {
    id: 3,
    name: 'Quiet Pod 1',
    type: 'Individual',
    capacity: 1,
    status: 'Maintenance',
    color: 'golden',
    timeSlots: ['09:00-11:00', '11:00-13:00', '14:00-16:00'],
    amenities: ['wifi', 'quiet', 'power'],
  },
  {
    id: 4,
    name: 'Computer Lab',
    type: 'Tech Zone',
    capacity: 20,
    status: 'Active',
    color: 'dark',
    timeSlots: ['09:00-12:00', '13:00-17:00'],
    amenities: ['wifi', 'monitor', 'power'],
  },
  {
    id: 5,
    name: 'Café Study Area',
    type: 'Casual',
    capacity: 15,
    status: 'Active',
    color: 'teal',
    timeSlots: ['08:00-20:00'],
    amenities: ['wifi', 'coffee', 'power'],
  },
  {
    id: 6,
    name: 'Quiet Pod 2',
    type: 'Individual',
    capacity: 1,
    status: 'Active',
    color: 'golden',
    timeSlots: ['11:00-13:00', '16:00-18:00'],
    amenities: ['wifi', 'quiet', 'power'],
  },
]

  const formatCount = (value) => {
    const num = Number(value) || 0
    return new Intl.NumberFormat().format(num)
  }

  const shortId = (id) => {
    const str = String(id || '')
    if (!str) return ''
    return str.length > 6 ? str.slice(-6) : str
  }

  const buildSpaceUtilization = (reservations) => {
    const list = Array.isArray(reservations) ? reservations : []
    const counts = new Map()
    list.forEach((r) => {
      const name = r?.spaceName || r?.space || ''
      if (!name) return
      counts.set(name, (counts.get(name) || 0) + 1)
    })

    const items = Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)

    const max = items[0]?.count || 0
    return items.map((it) => ({
      name: it.name,
      percent: max ? Math.round((it.count / max) * 100) : 0,
    }))
  }

const DEFAULT_AMENITIES = ['wifi', 'quiet', 'power', 'monitor', 'whiteboard', 'coffee']
const mockResources = [
  {
    id: 1,
    title: 'Introduction to Data Structures',
    type: 'video',
    category: 'Computer Science',
    views: 342,
    size: '45 min',
    date: 'Oct 10, 2024',
  },
  {
    id: 2,
    title: 'Calculus Fundamentals',
    type: 'pdf',
    category: 'Mathematics',
    views: 856,
    size: '2.4 MB',
    date: 'Oct 8, 2024',
  },
  {
    id: 3,
    title: 'Shakespeare Analysis Notes',
    type: 'notes',
    category: 'Literature',
    views: 124,
    size: '1.2 MB',
    date: 'Oct 5, 2024',
  },
  {
    id: 4,
    title: 'Physics Lab Manual',
    type: 'pdf',
    category: 'Science',
    views: 532,
    size: '5.8 MB',
    date: 'Sep 28, 2024',
  },
  {
    id: 5,
    title: 'Marketing Principles',
    type: 'video',
    category: 'Business',
    views: 289,
    size: '32 min',
    date: 'Oct 12, 2024',
  },
  {
    id: 6,
    title: 'Python Programming Basics',
    type: 'video',
    category: 'Computer Science',
    views: 1023,
    size: '1h 20min',
    date: 'Oct 1, 2024',
  },
]
const mockReservations = [
  {
    id: 101,
    user: 'Alex Johnson',
    space: 'Group Study Room B',
    date: 'Oct 14, 2024',
    time: '14:00-16:00',
    status: 'Upcoming',
  },
  {
    id: 102,
    user: 'Sarah Smith',
    space: 'Quiet Pod 1',
    date: 'Oct 14, 2024',
    time: '09:00-12:00',
    status: 'Active',
  },
  {
    id: 103,
    user: 'Mike Brown',
    space: 'Reading Room A',
    date: 'Oct 13, 2024',
    time: '11:00-13:00',
    status: 'Completed',
  },
  {
    id: 104,
    user: 'Emily Davis',
    space: 'Computer Lab',
    date: 'Oct 15, 2024',
    time: '13:00-15:00',
    status: 'Cancelled',
  },
  {
    id: 105,
    user: 'James Wilson',
    space: 'Café Study Area',
    date: 'Oct 14, 2024',
    time: '08:00-10:00',
    status: 'Active',
  },
  {
    id: 106,
    user: 'Lisa Chen',
    space: 'Reading Room A',
    date: 'Oct 16, 2024',
    time: '09:00-11:00',
    status: 'Upcoming',
  },
  {
    id: 107,
    user: 'David Park',
    space: 'Quiet Pod 2',
    date: 'Oct 12, 2024',
    time: '14:00-16:00',
    status: 'Completed',
  },
  {
    id: 108,
    user: 'Anna Taylor',
    space: 'Group Study Room B',
    date: 'Oct 11, 2024',
    time: '09:00-11:00',
    status: 'Completed',
  },
]

function escapeCsv(value) {
  const str = String(value ?? '')
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function toCsv(headers, rows) {
  const headerLine = headers.map(escapeCsv).join(',')
  const body = rows
    .map((row) => headers.map((h) => escapeCsv(row[h])).join(','))
    .join('\n')
  return body ? `${headerLine}\n${body}\n` : `${headerLine}\n`
}

function downloadTextFile(filename, text, mimeType) {
  const blob = new Blob([text], { type: mimeType || 'text/plain;charset=utf-8' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
const spaceUtilization = [
  {
    name: 'Reading Room A',
    percent: 92,
  },
  {
    name: 'Group Study B',
    percent: 78,
  },
  {
    name: 'Quiet Pod 1',
    percent: 65,
  },
  {
    name: 'Computer Lab',
    percent: 88,
  },
  {
    name: 'Café Area',
    percent: 71,
  },
  {
    name: 'Quiet Pod 2',
    percent: 45,
  },
]
const amenityIcons = {
  wifi: WifiIcon,
  quiet: VolumeXIcon,
  power: MonitorIcon,
  monitor: MonitorIcon,
  whiteboard: FileTextIcon,
  coffee: CoffeeIcon,
}
// --- Helper Components ---
const StatusBadge = ({ status }) => {
  const styles = {
    Active: 'bg-teal/15 text-teal border border-teal/20',
    Upcoming: 'bg-golden/20 text-yellow-700 border border-golden/30',
    Completed: 'bg-gray-100 text-medium border border-gray-200',
    Maintenance: 'bg-coral/10 text-coral border border-coral/20',
    Cancelled: 'bg-coral/10 text-coral border border-coral/20',
  }
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-bold ${styles[status] || 'bg-gray-100 text-gray-600'}`}
    >
      {status}
    </span>
  )
}
const TypeBadge = ({ type }) => {
  const styles = {
    video: 'bg-teal/15 text-teal',
    pdf: 'bg-coral/15 text-coral',
    notes: 'bg-golden/20 text-yellow-700',
  }
  const icons = {
    video: VideoIcon,
    pdf: FileTextIcon,
    notes: BookOpenIcon,
  }
  const Icon = icons[type] || FileTextIcon
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${styles[type] || 'bg-gray-100 text-medium'}`}
    >
      <Icon size={12} />
      {type.toUpperCase()}
    </span>
  )
}
const getSpaceHeaderColor = (color) => {
  const map = {
    teal: 'bg-teal',
    coral: 'bg-coral',
    golden: 'bg-golden',
    dark: 'bg-dark',
  }
  return map[color] || 'bg-teal'
}
const getUserAvatarColor = (name) => {
  const colors = [
    'bg-teal/20 text-teal',
    'bg-coral/20 text-coral',
    'bg-golden/30 text-yellow-700',
    'bg-purple-100 text-purple-600',
    'bg-blue-100 text-blue-600',
    'bg-emerald-100 text-emerald-600',
  ]
  const index = name.charCodeAt(0) % colors.length
  return colors[index]
}
export function AdminSpacesELearning() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isAddingSpace, setIsAddingSpace] = useState(false)
  const [isAddingResource, setIsAddingResource] = useState(false)

  const [resources, setResources] = useState([])
  const [resourcesLoading, setResourcesLoading] = useState(false)
  const [resourcesError, setResourcesError] = useState('')

  const [resourceTitle, setResourceTitle] = useState('')
  const [resourceCategory, setResourceCategory] = useState('Computer Science')
  const [resourceType, setResourceType] = useState('pdf')
  const [resourceDescription, setResourceDescription] = useState('')
  const [resourceFile, setResourceFile] = useState(null)
  const [resourceUploading, setResourceUploading] = useState(false)
  const [editingResource, setEditingResource] = useState(null)

  const [reservations, setReservations] = useState([])
  const [reservationsLoading, setReservationsLoading] = useState(false)
  const [reservationsError, setReservationsError] = useState('')

  const [spaces, setSpaces] = useState([])
  const [spacesLoading, setSpacesLoading] = useState(false)
  const [spacesError, setSpacesError] = useState('')

  const [spaceName, setSpaceName] = useState('')
  const [spaceType, setSpaceType] = useState('Quiet Zone')
  const [spaceCapacity, setSpaceCapacity] = useState('')
  const [spaceColor, setSpaceColor] = useState('teal')
  const [spaceAmenities, setSpaceAmenities] = useState([])
  const [spaceTimeSlots, setSpaceTimeSlots] = useState([])
  const [spaceTimeSlotInput, setSpaceTimeSlotInput] = useState('')
  const [spaceSaving, setSpaceSaving] = useState(false)
  const [editingSpaceId, setEditingSpaceId] = useState(null)

  const loadSpaces = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setSpaces([])
      return
    }

    setSpacesError('')
    setSpacesLoading(true)
    try {
      const data = await fetchSpacesAdmin()
      setSpaces(Array.isArray(data) ? data : [])
    } catch (e) {
      setSpacesError(e?.response?.data?.message || 'Failed to load spaces')
    } finally {
      setSpacesLoading(false)
    }
  }

  const loadResources = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setResources([])
      return
    }

    setResourcesError('')
    setResourcesLoading(true)
    try {
      const data = await fetchResourcesAdmin()
      setResources(Array.isArray(data) ? data : [])
    } catch (e) {
      setResourcesError(e?.response?.data?.message || 'Failed to load resources')
    } finally {
      setResourcesLoading(false)
    }
  }

  const loadReservationsAdmin = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setReservations([])
      return
    }

    setReservationsError('')
    setReservationsLoading(true)
    try {
      const data = await fetchReservationsAdmin({ limit: 500 })
      setReservations(Array.isArray(data) ? data : [])
    } catch (e) {
      setReservationsError(e?.response?.data?.message || 'Failed to load reservations')
    } finally {
      setReservationsLoading(false)
    }
  }

  const resetResourceForm = () => {
    setResourceTitle('')
    setResourceCategory('Computer Science')
    setResourceType('pdf')
    setResourceDescription('')
    setResourceFile(null)
    setEditingResource(null)
  }

  const openEditResource = (resItem) => {
    if (!resItem) return
    setEditingResource(resItem)
    setResourceTitle(resItem.title || '')
    setResourceCategory(resItem.category || 'Computer Science')
    setResourceType(resItem.type || 'pdf')
    setResourceDescription(resItem.description || '')
    setResourceFile(null)
    setIsAddingResource(true)
  }

  const handlePickResourceFile = (file) => {
    if (!file) return
    const allowed = [
      'application/pdf',
      'video/mp4',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]

    if (!allowed.includes(file.type)) {
      toast.error('Only PDF, MP4, or DOCX files are allowed')
      return
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size must be 50MB or less')
      return
    }

    setResourceFile(file)
  }

  const handleUploadOrUpdateResource = async () => {
    const title = resourceTitle.trim()
    if (!title) {
      toast.error('Please enter a resource title')
      return
    }

    if (!resourceCategory) {
      toast.error('Please select a category')
      return
    }

    if (!resourceType) {
      toast.error('Please select a type')
      return
    }

    const isEdit = Boolean(editingResource)
    if (!isEdit && !resourceFile) {
      toast.error('Please choose a file to upload')
      return
    }

    const form = new FormData()
    form.append('title', title)
    form.append('category', resourceCategory)
    form.append('type', resourceType)
    form.append('description', resourceDescription)
    if (resourceFile) {
      form.append('file', resourceFile)
    }

    setResourceUploading(true)
    try {
      if (isEdit) {
        const id = editingResource?._id || editingResource?.id
        const updated = await updateResource(id, form)
        setResources((prev) =>
          prev.map((r) => {
            const rid = r?._id || r?.id
            return rid === id ? updated : r
          })
        )
        toast.success('Resource updated')
      } else {
        const created = await uploadResource(form)
        setResources((prev) => [created, ...prev])
        toast.success('Material uploaded')
      }
      setIsAddingResource(false)
      resetResourceForm()
    } catch (e) {
      toast.error(
        e?.response?.data?.message ||
          (editingResource ? 'Failed to update resource' : 'Failed to upload material')
      )
    } finally {
      setResourceUploading(false)
    }
  }

  const handleDeleteResource = async (resItem) => {
    const id = resItem?._id || resItem?.id
    if (!id) return

    const ok = window.confirm(`Delete resource "${resItem?.title || 'this resource'}"?`)
    if (!ok) return

    try {
      await deleteResource(id)
      setResources((prev) => prev.filter((r) => (r?._id || r?.id) !== id))
      toast.success('Resource deleted')
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to delete resource')
    }
  }

  const resetAddSpaceForm = () => {
    setSpaceName('')
    setSpaceType('Quiet Zone')
    setSpaceCapacity('')
    setSpaceColor('teal')
    setSpaceAmenities([])
    setSpaceTimeSlots([])
    setSpaceTimeSlotInput('')
    setEditingSpaceId(null)
  }

  const addTimeSlot = () => {
    const raw = String(spaceTimeSlotInput || '').trim()
    if (!raw) return

    const normalized = raw.replace(/\s+/g, '')
    const ok = /^\d{2}:\d{2}-\d{2}:\d{2}$/.test(normalized)
    if (!ok) {
      toast.error('Time slot format must be HH:MM-HH:MM')
      return
    }

    setSpaceTimeSlots((prev) => {
      if (prev.includes(normalized)) return prev
      return [...prev, normalized]
    })
    setSpaceTimeSlotInput('')
  }

  const removeTimeSlot = (slot) => {
    setSpaceTimeSlots((prev) => prev.filter((s) => s !== slot))
  }

  const toggleAmenity = (amenity) => {
    setSpaceAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
    )
  }

  const handleSaveSpace = async () => {
    const name = spaceName.trim()
    const capacity = Number(spaceCapacity)

    if (!name) {
      toast.error('Please enter a space name')
      return
    }

    if (!Number.isFinite(capacity) || capacity <= 0) {
      toast.error('Please enter a valid capacity')
      return
    }

    setSpaceSaving(true)
    try {
      if (editingSpaceId) {
        const updated = await updateSpace(editingSpaceId, {
          name,
          type: spaceType,
          capacity,
          color: spaceColor,
          amenities: spaceAmenities,
          timeSlots: spaceTimeSlots,
        })

        setSpaces((prev) =>
          prev.map((s) => (s._id === editingSpaceId ? updated : s))
        )
        toast.success('Space updated')
      } else {
        const created = await createSpace({
          name,
          type: spaceType,
          capacity,
          color: spaceColor,
          amenities: spaceAmenities,
          timeSlots: spaceTimeSlots,
          status: 'Active',
        })

        setSpaces((prev) => [created, ...prev])
        toast.success('Space created')
      }

      setIsAddingSpace(false)
      resetAddSpaceForm()
    } catch (e) {
      toast.error(e?.response?.data?.message || (editingSpaceId ? 'Failed to update space' : 'Failed to create space'))
    } finally {
      setSpaceSaving(false)
    }
  }

  const handleEditSpace = (space) => {
    if (!space?.id && !space?._id) return
    const id = space._id || space.id

    setEditingSpaceId(id)
    setSpaceName(space.name || '')
    setSpaceType(space.type || 'Quiet Zone')
    setSpaceCapacity(String(space.capacity ?? ''))
    setSpaceColor(space.color || 'teal')
    setSpaceAmenities(Array.isArray(space.amenities) ? space.amenities : [])
    setSpaceTimeSlots(Array.isArray(space.timeSlots) ? space.timeSlots : [])
    setSpaceTimeSlotInput('')

    setIsAddingSpace(true)
  }

  const handleDeleteSpace = async (space) => {
    const id = space?._id || space?.id
    if (!id) return

    const ok = window.confirm(`Delete space "${space?.name || 'this space'}"?`)
    if (!ok) return

    try {
      await deleteSpace(id)
      setSpaces((prev) => prev.filter((s) => s._id !== id))
      toast.success('Space deleted')

      if (editingSpaceId === id) {
        setIsAddingSpace(false)
        resetAddSpaceForm()
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to delete space')
    }
  }

  const handleExportReservations = () => {
    const headers = ['reservationId', 'user', 'space', 'date', 'time', 'status']
    const rows = (Array.isArray(reservations) ? reservations : []).map((r) => ({
      reservationId: shortId(r._id || r.id),
      user: r?.user?.fullname || r?.user?.email || 'User',
      space: r?.spaceName || '',
      date: r?.date || '',
      time: r?.time || '',
      status: r?.status || '',
    }))

    const csv = toCsv(headers, rows)
    const today = new Date().toISOString().slice(0, 10)
    downloadTextFile(`reservations-report-${today}.csv`, csv, 'text/csv;charset=utf-8')
    toast.success('Reservations report downloaded')
  }
  const containerVariants = {
    hidden: {
      opacity: 0,
      y: 20,
    },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.08,
      },
    },
  }
  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 20,
    },
    show: {
      opacity: 1,
      y: 0,
    },
  }
  const tabs = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboardIcon,
      color: 'bg-teal text-white shadow-lg shadow-teal/30',
    },
    {
      id: 'spaces',
      label: 'Manage Spaces',
      icon: MapPinIcon,
      color: 'bg-teal text-white shadow-lg shadow-teal/30',
    },
    {
      id: 'resources',
      label: 'E-Learning',
      icon: BookOpenIcon,
      color: 'bg-coral text-white shadow-lg shadow-coral/30',
    },
    {
      id: 'reservations',
      label: 'Reservations',
      icon: CalendarIcon,
      color: 'bg-golden text-dark shadow-lg shadow-golden/30',
    },
  ]

  React.useEffect(() => {
    if (activeTab === 'spaces') {
      loadSpaces()
    }
    if (activeTab === 'resources') {
      loadResources()
    }
    if (activeTab === 'dashboard' || activeTab === 'reservations') {
      loadSpaces()
      loadResources()
      loadReservationsAdmin()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  const dashboardStats = React.useMemo(() => {
    const totalReservations = reservations.length
    const activeSpaces = spaces.length
    const totalResources = resources.length
    const activeNow = reservations.filter((r) => r?.status === 'Active').length
    const utilizationRate = activeSpaces
      ? `${Math.round((activeNow / activeSpaces) * 100)}%`
      : '0%'
    return { totalReservations, activeSpaces, totalResources, utilizationRate }
  }, [reservations, spaces, resources])

  const recentReservations = React.useMemo(() => {
    const list = Array.isArray(reservations) ? reservations : []
    return [...list]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5)
  }, [reservations])

  const spaceUtilization = React.useMemo(
    () => buildSpaceUtilization(reservations),
    [reservations]
  )

  const topResources = React.useMemo(() => {
    const list = Array.isArray(resources) ? resources : []
    return [...list]
      .sort((a, b) => (Number(b.views) || 0) - (Number(a.views) || 0))
      .slice(0, 3)
  }, [resources])

  const todayReservationStats = React.useMemo(() => {
    const list = Array.isArray(reservations) ? reservations : []
    const today = new Date().toLocaleDateString(undefined, {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    })
    const todayCount = list.filter((r) => String(r?.date || '') === String(today)).length
    const upcoming = list.filter((r) => r?.status === 'Upcoming').length
    const completed = list.filter((r) => r?.status === 'Completed').length
    const cancelled = list.filter((r) => r?.status === 'Cancelled').length
    return { todayCount, upcoming, completed, cancelled }
  }, [reservations])

  const handleCancelReservation = async (resItem) => {
    const id = resItem?._id || resItem?.id
    if (!id) return

    const ok = window.confirm('Cancel this reservation?')
    if (!ok) return

    try {
      const updated = await cancelReservation(id)
      setReservations((prev) =>
        prev.map((r) => ((r?._id || r?.id) === id ? updated : r))
      )
      toast.success('Reservation cancelled')
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to cancel reservation')
    }
  }

  const displaySpaces = (Array.isArray(spaces) ? spaces : []).map((s) => ({
    id: s._id || s.id,
    name: s.name || '',
    type: s.type || '',
    capacity: Number(s.capacity) || 0,
    status: s.status || 'Active',
    color: s.color || 'teal',
    amenities: Array.isArray(s.amenities) ? s.amenities : [],
    timeSlots: Array.isArray(s.timeSlots) ? s.timeSlots : [],
  }))

  return (
    <div className="min-h-screen bg-light p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <motion.div
            initial={{
              opacity: 0,
              x: -20,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-teal rounded-xl flex items-center justify-center">
                <BookOpenIcon size={20} className="text-white" />
              </div>
              <h1 className="text-3xl font-extrabold text-dark">
                Admin Portal
              </h1>
            </div>
            <p className="text-medium">
              Manage library spaces, e-learning resources, and view reports.
            </p>
          </motion.div>

          <motion.div
            initial={{
              opacity: 0,
              x: 20,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            className="flex gap-3"
          >
            <button
              type="button"
              onClick={handleExportReservations}
              className="px-5 py-2.5 bg-white border border-gray-200 rounded-full text-sm font-bold text-dark hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm"
            >
              <DownloadIcon size={16} /> Export Report
            </button>
            <button className="px-5 py-2.5 bg-teal text-white rounded-full text-sm font-bold flex items-center gap-2 shadow-lg shadow-teal/20 hover:shadow-teal/40 transition-all">
              <PlusIcon size={16} /> Quick Add
            </button>
          </motion.div>
        </div>

        {/* Tab Navigation */}
        <motion.div
          initial={{
            opacity: 0,
            y: -10,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="flex overflow-x-auto pb-4 mb-6 gap-2"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm whitespace-nowrap transition-all ${activeTab === tab.id ? tab.color : 'bg-white text-medium border border-gray-200 hover:border-gray-300'}`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {/* ===== DASHBOARD ===== */}
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              variants={containerVariants}
              initial="hidden"
              animate="show"
              exit={{
                opacity: 0,
              }}
            >
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[
                  {
                    label: 'Total Reservations',
                    value: formatCount(dashboardStats.totalReservations),
                    icon: CalendarIcon,
                    iconColor: 'text-white',
                    iconBg: 'bg-teal',
                    trend: '+12%',
                    trendColor: 'text-teal',
                  },
                  {
                    label: 'Active Spaces',
                    value: formatCount(dashboardStats.activeSpaces),
                    icon: MapPinIcon,
                    iconColor: 'text-white',
                    iconBg: 'bg-coral',
                    trend: '+2',
                    trendColor: 'text-coral',
                  },
                  {
                    label: 'Total Resources',
                    value: formatCount(dashboardStats.totalResources),
                    icon: BookOpenIcon,
                    iconColor: 'text-white',
                    iconBg: 'bg-golden',
                    trend: '+8',
                    trendColor: 'text-yellow-700',
                  },
                  {
                    label: 'Utilization Rate',
                    value: dashboardStats.utilizationRate,
                    icon: TrendingUpIcon,
                    iconColor: 'text-white',
                    iconBg: 'bg-dark',
                    trend: '+5%',
                    trendColor: 'text-teal',
                  },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    variants={itemVariants}
                    className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.iconBg}`}
                      >
                        <stat.icon size={22} className={stat.iconColor} />
                      </div>
                      <span
                        className={`text-xs font-bold flex items-center gap-1 ${stat.trendColor}`}
                      >
                        <ArrowUpRightIcon size={14} />
                        {stat.trend}
                      </span>
                    </div>
                    <p className="text-2xl font-extrabold text-dark mb-1">
                      {stat.value}
                    </p>
                    <p className="text-sm font-semibold text-medium">
                      {stat.label}
                    </p>
                  </motion.div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Space Utilization Chart */}
                <motion.div
                  variants={itemVariants}
                  className="lg:col-span-3 bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
                >
                  <h3 className="font-extrabold text-dark mb-6 flex items-center gap-2">
                    <BarChart3Icon size={20} className="text-teal" /> Space
                    Utilization
                  </h3>
                  {spaceUtilization.length === 0 ? (
                    <div className="p-4 bg-light rounded-2xl text-sm text-medium">
                      No utilization data yet.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {spaceUtilization.map((space, i) => (
                        <div key={i}>
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-sm font-semibold text-dark">
                              {space.name}
                            </span>
                            <span className="text-sm font-bold text-dark">
                              {space.percent}%
                            </span>
                          </div>
                          <div className="w-full h-3 bg-light rounded-full overflow-hidden">
                            <motion.div
                              initial={{
                                width: 0,
                              }}
                              animate={{
                                width: `${space.percent}%`,
                              }}
                              transition={{
                                duration: 0.8,
                                delay: i * 0.1,
                                ease: 'easeOut',
                              }}
                              className={`h-full rounded-full ${space.percent >= 85 ? 'bg-teal' : space.percent >= 60 ? 'bg-golden' : 'bg-coral'}`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>

                {/* Recent Reservations */}
                <motion.div
                  variants={itemVariants}
                  className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
                >
                  <h3 className="font-extrabold text-dark mb-6 flex items-center gap-2">
                    <ClockIcon size={20} className="text-coral" /> Recent
                    Activity
                  </h3>
                  <div className="space-y-3">
                    {reservationsLoading ? (
                      <div className="p-3 bg-light rounded-2xl text-sm text-medium">
                        Loading activity...
                      </div>
                    ) : recentReservations.length === 0 ? (
                      <div className="p-3 bg-light rounded-2xl text-sm text-medium">
                        No recent activity.
                      </div>
                    ) : (
                      recentReservations.map((res) => {
                        const userName = res?.user?.fullname || res?.user?.email || 'User'
                        return (
                          <div
                            key={res._id || res.id}
                            className="flex items-center gap-3 p-3 bg-light rounded-2xl"
                          >
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${getUserAvatarColor(userName)}`}
                            >
                              {userName.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-dark text-sm truncate">
                                {userName}
                              </p>
                              <p className="text-xs text-medium truncate">
                                {res.spaceName} • {res.time}
                              </p>
                            </div>
                            <StatusBadge status={res.status} />
                          </div>
                        )
                      })
                    )}
                  </div>
                  <button
                    onClick={() => setActiveTab('reservations')}
                    className="w-full mt-4 py-3 text-sm font-bold text-teal hover:bg-teal/5 rounded-xl transition-colors"
                  >
                    View All →
                  </button>
                </motion.div>
              </div>

              {/* Popular Resources */}
              <motion.div
                variants={itemVariants}
                className="mt-8 bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-extrabold text-dark flex items-center gap-2">
                    <TrendingUpIcon size={20} className="text-golden" /> Top
                    Resources
                  </h3>
                  <button
                    onClick={() => setActiveTab('resources')}
                    className="text-sm font-bold text-coral hover:underline"
                  >
                    Manage All →
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {topResources.length === 0 ? (
                    <div className="p-4 bg-light rounded-2xl text-sm text-medium md:col-span-3">
                      No resources yet.
                    </div>
                  ) : (
                    topResources.map((res) => (
                      <div key={res._id || res.id} className="p-4 bg-light rounded-2xl">
                        <div className="flex items-center justify-between mb-3">
                          <TypeBadge type={res.type} />
                          <span className="text-xs font-bold text-medium flex items-center gap-1">
                            <EyeIcon size={12} /> {Number(res.views) || 0}
                          </span>
                        </div>
                        <h4 className="font-bold text-dark text-sm mb-1 line-clamp-2">
                          {res.title}
                        </h4>
                        <p className="text-xs text-medium">{res.category}</p>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* ===== SPACES TAB ===== */}
          {activeTab === 'spaces' && (
            <motion.div
              key="spaces"
              variants={containerVariants}
              initial="hidden"
              animate="show"
              exit={{
                opacity: 0,
              }}
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-extrabold text-dark">
                    Library Spaces
                  </h2>
                  <p className="text-sm text-medium mt-1">
                    {displaySpaces.length} spaces configured
                  </p>
                </div>
                <button
                  onClick={() => setIsAddingSpace(!isAddingSpace)}
                  className="px-5 py-2.5 bg-teal text-white rounded-full font-bold text-sm flex items-center gap-2 shadow-lg shadow-teal/20 hover:shadow-teal/40 transition-all"
                >
                  {isAddingSpace ? <XIcon size={16} /> : <PlusIcon size={16} />}
                  {isAddingSpace ? 'Cancel' : 'Add New Space'}
                </button>
              </div>

              {/* Add Space Form */}
              <AnimatePresence>
                {isAddingSpace && (
                  <motion.div
                    initial={{
                      opacity: 0,
                      height: 0,
                      marginBottom: 0,
                    }}
                    animate={{
                      opacity: 1,
                      height: 'auto',
                      marginBottom: 24,
                    }}
                    exit={{
                      opacity: 0,
                      height: 0,
                      marginBottom: 0,
                    }}
                    className="overflow-hidden"
                  >
                    <div className="bg-white rounded-3xl p-6 shadow-sm border-2 border-teal/30">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 bg-teal/10 rounded-xl flex items-center justify-center">
                          <MapPinIcon size={20} className="text-teal" />
                        </div>
                        <h3 className="font-extrabold text-dark">
                          Create New Space
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                          <label className="block text-xs font-bold text-medium mb-1.5 uppercase tracking-wider">
                            Space Name
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Study Room C"
                            value={spaceName}
                            onChange={(e) => setSpaceName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/20 transition-all bg-light text-dark"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-medium mb-1.5 uppercase tracking-wider">
                            Type
                          </label>
                          <select
                            value={spaceType}
                            onChange={(e) => setSpaceType(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/20 transition-all bg-light appearance-none text-dark"
                          >
                            <option value="Quiet Zone">Quiet Zone</option>
                            <option value="Collaborative">Collaborative</option>
                            <option value="Individual Pod">Individual Pod</option>
                            <option value="Tech Zone">Tech Zone</option>
                            <option value="Casual">Casual</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-medium mb-1.5 uppercase tracking-wider">
                            Capacity
                          </label>
                          <input
                            type="number"
                            min={1}
                            placeholder="Number of seats"
                            value={spaceCapacity}
                            onChange={(e) => setSpaceCapacity(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/20 transition-all bg-light text-dark"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-medium mb-1.5 uppercase tracking-wider">
                            Color Theme
                          </label>
                          <div className="flex gap-3 pt-2">
                            {['teal', 'coral', 'golden', 'dark'].map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => setSpaceColor(c)}
                                className={`w-10 h-10 rounded-xl ${getSpaceHeaderColor(c)} shadow-md hover:scale-110 transition-transform ${
                                  spaceColor === c ? 'ring-2 ring-teal ring-offset-2 ring-offset-white' : 'border-2 border-white'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-medium mb-1.5 uppercase tracking-wider">
                            Amenities
                          </label>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {DEFAULT_AMENITIES.map((a) => {
                              const Icon = amenityIcons[a] || WifiIcon
                              const selected = spaceAmenities.includes(a)
                              return (
                                <button
                                  key={a}
                                  type="button"
                                  onClick={() => toggleAmenity(a)}
                                  className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold transition-all ${
                                    selected
                                      ? 'border-teal text-teal bg-teal/5'
                                      : 'border-gray-200 text-medium hover:border-teal hover:text-teal hover:bg-teal/5'
                                  }`}
                                >
                                  <Icon size={14} />
                                  {a}
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-medium mb-1.5 uppercase tracking-wider">
                            Time Periods
                          </label>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              type="text"
                              placeholder="e.g. 09:00-11:00"
                              value={spaceTimeSlotInput}
                              onChange={(e) => setSpaceTimeSlotInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  addTimeSlot()
                                }
                              }}
                              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/20 transition-all bg-light text-dark"
                            />
                            <button
                              type="button"
                              onClick={addTimeSlot}
                              className="px-5 py-3 rounded-xl bg-teal text-white font-bold text-sm hover:opacity-95 transition-opacity"
                            >
                              Add
                            </button>
                          </div>

                          {spaceTimeSlots.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {spaceTimeSlots.map((slot) => (
                                <span
                                  key={slot}
                                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-white text-sm font-semibold text-dark"
                                >
                                  {slot}
                                  <button
                                    type="button"
                                    onClick={() => removeTimeSlot(slot)}
                                    className="text-medium hover:text-coral"
                                    aria-label={`Remove ${slot}`}
                                  >
                                    <XIcon size={14} />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => setIsAddingSpace(false)}
                          className="px-6 py-2.5 rounded-full font-bold text-sm text-medium hover:bg-gray-100 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveSpace}
                          disabled={spaceSaving}
                          className={`px-6 py-2.5 bg-teal text-white rounded-full font-bold text-sm shadow-lg shadow-teal/20 hover:shadow-teal/40 transition-all ${
                            spaceSaving ? 'opacity-60 cursor-not-allowed' : ''
                          }`}
                        >
                          {spaceSaving ? 'Saving...' : editingSpaceId ? 'Update Space' : 'Save Space'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {spacesError && (
                <div className="mb-6 bg-coral/10 text-coral px-4 py-3 rounded-2xl font-semibold">
                  {spacesError}
                </div>
              )}

              {/* Spaces Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {spacesLoading ? (
                  <div className="col-span-full text-center text-medium py-10">
                    Loading spaces...
                  </div>
                ) : displaySpaces.length === 0 ? (
                  <div className="col-span-full text-center text-medium py-10">
                    No spaces yet.
                  </div>
                ) : (
                  displaySpaces.map((space) => (
                  <motion.div
                    key={space.id}
                    variants={itemVariants}
                    className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col"
                  >
                    {/* Colored header bar */}
                    <div
                      className={`h-24 ${getSpaceHeaderColor(space.color)} relative flex items-center justify-center`}
                    >
                      <MapPinIcon size={32} className="text-white/40" />
                      <div className="absolute top-3 right-3">
                        <StatusBadge status={space.status} />
                      </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="font-extrabold text-dark text-lg mb-1">
                        {space.name}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-medium mb-3">
                        <span className="flex items-center gap-1">
                          <UsersIcon size={14} /> {space.capacity} seats
                        </span>
                        <span>•</span>
                        <span>{space.type}</span>
                      </div>

                      {/* Amenities */}
                      <div className="flex gap-2 mb-3">
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

                      {/* Time Slots */}
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

                      <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
                        <button className="text-sm font-bold text-teal hover:underline">
                          View Schedule
                        </button>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => handleEditSpace(space)}
                            className="p-2 text-medium hover:text-teal hover:bg-teal/10 rounded-full transition-colors"
                          >
                            <EditIcon size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSpace(space)}
                            className="p-2 text-medium hover:text-coral hover:bg-coral/10 rounded-full transition-colors"
                          >
                            <TrashIcon size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* ===== RESOURCES TAB ===== */}
          {activeTab === 'resources' && (
            <motion.div
              key="resources"
              variants={containerVariants}
              initial="hidden"
              animate="show"
              exit={{
                opacity: 0,
              }}
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-extrabold text-dark">
                    Digital Resources
                  </h2>
                  <p className="text-sm text-medium mt-1">
                    {resources.length} materials available
                  </p>
                </div>
                <button
                  onClick={() => setIsAddingResource(!isAddingResource)}
                  className="px-5 py-2.5 bg-coral text-white rounded-full font-bold text-sm flex items-center gap-2 shadow-lg shadow-coral/20 hover:shadow-coral/40 transition-all"
                >
                  {isAddingResource ? (
                    <XIcon size={16} />
                  ) : (
                    <UploadCloudIcon size={16} />
                  )}
                  {isAddingResource ? 'Cancel' : 'Upload Material'}
                </button>
              </div>

              {/* Upload Form */}
              <AnimatePresence>
                {isAddingResource && (
                  <motion.div
                    initial={{
                      opacity: 0,
                      height: 0,
                      marginBottom: 0,
                    }}
                    animate={{
                      opacity: 1,
                      height: 'auto',
                      marginBottom: 24,
                    }}
                    exit={{
                      opacity: 0,
                      height: 0,
                      marginBottom: 0,
                    }}
                    className="overflow-hidden"
                  >
                    <div className="bg-white rounded-3xl p-6 shadow-sm border-2 border-coral/30">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 bg-coral/10 rounded-xl flex items-center justify-center">
                          <UploadCloudIcon size={20} className="text-coral" />
                        </div>
                        <h3 className="font-extrabold text-dark">
                          Upload New Resource
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-medium mb-1.5 uppercase tracking-wider">
                              Resource Title
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Advanced Calculus Notes"
                              value={resourceTitle}
                              onChange={(e) => setResourceTitle(e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-coral focus:ring-2 focus:ring-coral/20 transition-all bg-light text-dark"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-medium mb-1.5 uppercase tracking-wider">
                                Category
                              </label>
                              <select
                                value={resourceCategory}
                                onChange={(e) => setResourceCategory(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-coral focus:ring-2 focus:ring-coral/20 transition-all bg-light appearance-none text-dark"
                              >
                                <option value="Computer Science">Computer Science</option>
                                <option value="Mathematics">Mathematics</option>
                                <option value="Science">Science</option>
                                <option value="Literature">Literature</option>
                                <option value="Business">Business</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-medium mb-1.5 uppercase tracking-wider">
                                Type
                              </label>
                              <select
                                value={resourceType}
                                onChange={(e) => setResourceType(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-coral focus:ring-2 focus:ring-coral/20 transition-all bg-light appearance-none text-dark"
                              >
                                <option value="pdf">PDF Document</option>
                                <option value="video">Video Lecture</option>
                                <option value="notes">Text Notes</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-medium mb-1.5 uppercase tracking-wider">
                              Description
                            </label>
                            <textarea
                              placeholder="Brief description of the resource..."
                              rows={3}
                              value={resourceDescription}
                              onChange={(e) => setResourceDescription(e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-coral focus:ring-2 focus:ring-coral/20 transition-all bg-light text-dark resize-none"
                            />
                          </div>
                        </div>

                        {/* Drop Zone */}
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => document.getElementById('resource-file-input')?.click()}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              document.getElementById('resource-file-input')?.click()
                            }
                          }}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault()
                            const f = e.dataTransfer?.files?.[0]
                            handlePickResourceFile(f)
                          }}
                          className="border-2 border-dashed border-coral/30 rounded-2xl bg-coral/5 flex flex-col items-center justify-center p-8 text-center hover:border-coral hover:bg-coral/10 transition-colors cursor-pointer"
                        >
                          <input
                            id="resource-file-input"
                            type="file"
                            accept=".pdf,.mp4,.docx"
                            className="hidden"
                            onChange={(e) => handlePickResourceFile(e.target.files?.[0])}
                          />
                          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4">
                            <UploadCloudIcon size={28} className="text-coral" />
                          </div>
                          <p className="font-bold text-dark text-sm mb-1">
                            {resourceFile
                              ? resourceFile.name
                              : editingResource
                                ? 'Click to replace file (optional)'
                                : 'Click to upload or drag and drop'}
                          </p>
                          <p className="text-xs text-medium">
                            PDF, MP4, or DOCX (max. 50MB)
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => setIsAddingResource(false)}
                          className="px-6 py-2.5 rounded-full font-bold text-sm text-medium hover:bg-gray-100 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleUploadOrUpdateResource}
                          disabled={resourceUploading}
                          className={`px-6 py-2.5 bg-coral text-white rounded-full font-bold text-sm shadow-lg shadow-coral/20 hover:shadow-coral/40 transition-all ${
                            resourceUploading ? 'opacity-60 cursor-not-allowed' : ''
                          }`}
                        >
                          {resourceUploading
                            ? editingResource
                              ? 'Updating...'
                              : 'Uploading...'
                            : editingResource
                              ? 'Update Resource'
                              : 'Publish Resource'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {resourcesError && (
                <div className="mb-6 bg-coral/10 text-coral px-4 py-3 rounded-2xl font-semibold">
                  {resourcesError}
                </div>
              )}

              {/* Resources Table */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="relative w-full sm:w-72">
                    <SearchIcon
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-medium"
                    />
                    <input
                      type="text"
                      placeholder="Search resources..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-full border border-gray-200 text-sm focus:outline-none focus:border-coral focus:ring-2 focus:ring-coral/20 bg-light"
                    />
                  </div>
                  <div className="flex gap-2">
                    {['All', 'Video', 'PDF', 'Notes'].map((f) => (
                      <button
                        key={f}
                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${f === 'All' ? 'bg-coral/10 text-coral' : 'bg-light text-medium hover:bg-gray-200'}`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 bg-light/50">
                        <th className="py-4 px-6 text-xs font-bold text-medium uppercase tracking-wider">
                          Title
                        </th>
                        <th className="py-4 px-6 text-xs font-bold text-medium uppercase tracking-wider">
                          Category
                        </th>
                        <th className="py-4 px-6 text-xs font-bold text-medium uppercase tracking-wider">
                          Type
                        </th>
                        <th className="py-4 px-6 text-xs font-bold text-medium uppercase tracking-wider">
                          Size
                        </th>
                        <th className="py-4 px-6 text-xs font-bold text-medium uppercase tracking-wider">
                          Views
                        </th>
                        <th className="py-4 px-6 text-xs font-bold text-medium uppercase tracking-wider text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {resourcesLoading ? (
                        <tr>
                          <td className="py-10 px-6 text-center text-medium" colSpan={6}>
                            Loading resources...
                          </td>
                        </tr>
                      ) : resources.length === 0 ? (
                        <tr>
                          <td className="py-10 px-6 text-center text-medium" colSpan={6}>
                            No resources yet.
                          </td>
                        </tr>
                      ) : (
                        resources.map((res) => (
                        <tr
                          key={res._id || res.id}
                          className="border-b border-gray-50 hover:bg-light/50 transition-colors"
                        >
                          <td className="py-4 px-6">
                            <p className="font-bold text-dark text-sm">
                              {res.title}
                            </p>
                            <p className="text-xs text-medium mt-0.5">
                              {res.createdAt ? new Date(res.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' }) : ''}
                            </p>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-sm text-medium">
                              {res.category}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <TypeBadge type={res.type} />
                          </td>
                          <td className="py-4 px-6 text-sm text-medium">
                            {res.sizeLabel || res.size || ''}
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-sm text-dark font-bold flex items-center gap-1">
                              <EyeIcon size={14} className="text-medium" />{' '}
                              {Number(res.views) || 0}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => openEditResource(res)}
                                className="p-2 text-medium hover:text-teal hover:bg-teal/10 rounded-full transition-colors"
                              >
                                <EditIcon size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteResource(res)}
                                className="p-2 text-medium hover:text-coral hover:bg-coral/10 rounded-full transition-colors"
                              >
                                <TrashIcon size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* ===== RESERVATIONS TAB ===== */}
          {activeTab === 'reservations' && (
            <motion.div
              key="reservations"
              variants={containerVariants}
              initial="hidden"
              animate="show"
              exit={{
                opacity: 0,
              }}
            >
              {/* Reservation Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  {
                    label: 'Today',
                    value: String(todayReservationStats.todayCount),
                    bg: 'bg-teal/10',
                    color: 'text-teal',
                  },
                  {
                    label: 'Upcoming',
                    value: formatCount(todayReservationStats.upcoming),
                    bg: 'bg-golden/15',
                    color: 'text-yellow-700',
                  },
                  {
                    label: 'Completed',
                    value: formatCount(todayReservationStats.completed),
                    bg: 'bg-gray-100',
                    color: 'text-medium',
                  },
                  {
                    label: 'Cancelled',
                    value: formatCount(todayReservationStats.cancelled),
                    bg: 'bg-coral/10',
                    color: 'text-coral',
                  },
                ].map((s, i) => (
                  <motion.div
                    key={i}
                    variants={itemVariants}
                    className={`${s.bg} rounded-2xl p-4 text-center`}
                  >
                    <p className={`text-2xl font-extrabold ${s.color}`}>
                      {s.value}
                    </p>
                    <p className="text-xs font-bold text-medium mt-1">
                      {s.label}
                    </p>
                  </motion.div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
                <div>
                  <h2 className="text-xl font-extrabold text-dark">
                    All Reservations
                  </h2>
                  <p className="text-sm text-medium mt-1">
                    Manage and track all bookings
                  </p>
                </div>
                <div className="flex gap-2">
                  <select className="px-4 py-2 rounded-full border border-gray-200 text-sm font-bold text-dark focus:outline-none bg-white">
                    <option>All Statuses</option>
                    <option>Upcoming</option>
                    <option>Active</option>
                    <option>Completed</option>
                    <option>Cancelled</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleExportReservations}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-bold text-dark hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <DownloadIcon size={14} /> Export
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 bg-light/50">
                        <th className="py-4 px-6 text-xs font-bold text-medium uppercase tracking-wider">
                          ID
                        </th>
                        <th className="py-4 px-6 text-xs font-bold text-medium uppercase tracking-wider">
                          User
                        </th>
                        <th className="py-4 px-6 text-xs font-bold text-medium uppercase tracking-wider">
                          Space
                        </th>
                        <th className="py-4 px-6 text-xs font-bold text-medium uppercase tracking-wider">
                          Date & Time
                        </th>
                        <th className="py-4 px-6 text-xs font-bold text-medium uppercase tracking-wider">
                          Status
                        </th>
                        <th className="py-4 px-6 text-xs font-bold text-medium uppercase tracking-wider text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {reservationsLoading ? (
                        <tr>
                          <td className="py-10 px-6 text-center text-medium" colSpan={6}>
                            Loading reservations...
                          </td>
                        </tr>
                      ) : reservationsError ? (
                        <tr>
                          <td className="py-10 px-6 text-center text-coral font-semibold" colSpan={6}>
                            {reservationsError}
                          </td>
                        </tr>
                      ) : reservations.length === 0 ? (
                        <tr>
                          <td className="py-10 px-6 text-center text-medium" colSpan={6}>
                            No reservations yet.
                          </td>
                        </tr>
                      ) : (
                        reservations.map((res) => {
                          const userName = res?.user?.fullname || res?.user?.email || 'User'
                          return (
                            <tr
                              key={res._id || res.id}
                              className="border-b border-gray-50 hover:bg-light/50 transition-colors"
                            >
                              <td className="py-4 px-6 text-sm text-medium font-mono">
                                #{shortId(res._id || res.id)}
                              </td>
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${getUserAvatarColor(userName)}`}
                                  >
                                    {userName.charAt(0)}
                                  </div>
                                  <p className="font-bold text-dark text-sm">
                                    {userName}
                                  </p>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-sm font-semibold text-dark">
                                {res.spaceName}
                              </td>
                              <td className="py-4 px-6">
                                <p className="text-sm text-dark font-semibold">
                                  {res.date}
                                </p>
                                <p className="text-xs text-medium">{res.time}</p>
                              </td>
                              <td className="py-4 px-6">
                                <StatusBadge status={res.status} />
                              </td>
                              <td className="py-4 px-6 text-right">
                                <div className="flex justify-end gap-1">
                                  {(res.status === 'Upcoming' || res.status === 'Active') && (
                                    <button
                                      type="button"
                                      onClick={() => handleCancelReservation(res)}
                                      className="px-3 py-1.5 text-xs font-bold text-coral bg-coral/10 rounded-full hover:bg-coral/20 transition-colors"
                                    >
                                      Cancel
                                    </button>
                                  )}
                                  <button className="p-2 text-medium hover:text-dark rounded-full transition-colors">
                                    <MoreVerticalIcon size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                {/* Pagination */}
                <div className="p-4 border-t border-gray-100 flex justify-between items-center text-sm text-medium">
                  <span>Showing 1 to 8 of 1,284 entries</span>
                  <div className="flex gap-1">
                    <button className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-medium font-semibold">
                      Prev
                    </button>
                    <button className="px-3 py-1.5 rounded-lg bg-teal text-white font-bold">
                      1
                    </button>
                    <button className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-medium font-semibold">
                      2
                    </button>
                    <button className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-medium font-semibold">
                      3
                    </button>
                    <button className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-medium font-semibold">
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
