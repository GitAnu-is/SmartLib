import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  MapPinIcon,
  GraduationCapIcon,
  UsersIcon,
  WifiIcon,
  MonitorIcon,
  CoffeeIcon,
  VolumeXIcon,
  CalendarIcon,
  ClockIcon,
  XIcon,
  PlayIcon,
  DownloadIcon,
  FileTextIcon,
  VideoIcon,
  BookOpenIcon,
  FolderIcon,
  TrendingUpIcon,
  CheckCircleIcon,
} from 'lucide-react'
import { fetchResourcesPublic } from '../api/resources'
import { fetchSpacesPublic } from '../api/spaces'
import {
  cancelReservation,
  createReservation,
  fetchMyReservations,
} from '../api/reservations'

const formatShortDate = (date) =>
  new Date(date || Date.now()).toLocaleDateString(undefined, {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })

const getSpaceBg = (color) => {
  const map = {
    teal: 'bg-teal',
    coral: 'bg-coral',
    golden: 'bg-golden',
    dark: 'bg-dark',
  }
  return map[color] || 'bg-teal'
}

const parseDurationHours = (timeRange) => {
  // expects: HH:MM-HH:MM
  const str = String(timeRange || '')
  const [start, end] = str.split('-')
  if (!start || !end) return 0
  const [sh, sm] = start.split(':').map((n) => Number(n))
  const [eh, em] = end.split(':').map((n) => Number(n))
  if (![sh, sm, eh, em].every((n) => Number.isFinite(n))) return 0
  const mins = (eh * 60 + em) - (sh * 60 + sm)
  return mins > 0 ? mins / 60 : 0
}
const DEFAULT_CATEGORIES = [
  'All',
  'Computer Science',
  'Mathematics',
  'Literature',
  'Science',
  'Business',
]
const amenityIcons = {
  wifi: WifiIcon,
  quiet: VolumeXIcon,
  power: MonitorIcon,
  monitor: MonitorIcon,
  whiteboard: FileTextIcon,
  computers: MonitorIcon,
  printer: FileTextIcon,
  coffee: CoffeeIcon,
}
export function SpaceELearningPage({ onNavigate: _onNavigate }) {
  const [activeTab, setActiveTab] = useState('spaces')
  const [selectedSpace, setSelectedSpace] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)

  const [spaces, setSpaces] = useState([])
  const [spacesLoading, setSpacesLoading] = useState(false)
  const [spacesError, setSpacesError] = useState('')

  const [myReservations, setMyReservations] = useState([])
  const [reservationsLoading, setReservationsLoading] = useState(false)
  const [reserving, setReserving] = useState(false)
  const [activeCategory, setActiveCategory] = useState('All')

  const [resources, setResources] = useState([])
  const [resourcesLoading, setResourcesLoading] = useState(false)
  const [resourcesError, setResourcesError] = useState('')
  const [featuredVideo, setFeaturedVideo] = useState(null)

  const backendOrigin = import.meta?.env?.VITE_API_ORIGIN || 'http://localhost:5000'

  const getResourceThumb = (type) => {
    switch (type) {
      case 'video':
        return 'bg-coral'
      case 'pdf':
        return 'bg-teal'
      case 'notes':
        return 'bg-golden'
      default:
        return 'bg-dark'
    }
  }

  const openResourceFile = (resource) => {
    const url = resource?.fileUrl
    if (!url) {
      toast.error('File not available')
      return
    }
    window.open(`${backendOrigin}${url}`, '_blank', 'noopener,noreferrer')
  }

  const loadSpaces = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setSpaces([])
      return
    }

    setSpacesError('')
    setSpacesLoading(true)
    try {
      const data = await fetchSpacesPublic()
      setSpaces(Array.isArray(data) ? data : [])
    } catch (e) {
      setSpacesError(e?.response?.data?.message || 'Failed to load spaces')
    } finally {
      setSpacesLoading(false)
    }
  }

  const loadMyReservations = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setMyReservations([])
      return
    }

    setReservationsLoading(true)
    try {
      const data = await fetchMyReservations()
      setMyReservations(Array.isArray(data) ? data : [])
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to load reservations')
    } finally {
      setReservationsLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'spaces') {
      loadSpaces()
      loadMyReservations()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  const handleReserveNow = async () => {
    if (!selectedSpace || !selectedSlot) return

    const date = formatShortDate(new Date())
    const payload = {
      spaceId: selectedSpace._id || selectedSpace.id,
      spaceName: selectedSpace.name,
      date,
      time: selectedSlot,
    }

    setReserving(true)
    try {
      const created = await createReservation(payload)
      setMyReservations((prev) => [created, ...prev])
      toast.success('Reservation created')
      setSelectedSlot(null)
      setSelectedSpace(null)
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to reserve space')
    } finally {
      setReserving(false)
    }
  }

  const handleCancelMyReservation = async (reservation) => {
    const id = reservation?._id || reservation?.id
    if (!id) return

    try {
      const updated = await cancelReservation(id)
      setMyReservations((prev) =>
        prev.map((r) => ((r?._id || r?.id) === id ? updated : r))
      )
      toast.success('Reservation cancelled')
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to cancel reservation')
    }
  }
  const containerVariants = {
    hidden: {
      opacity: 0,
    },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
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
  const loadResources = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setResources([])
      return
    }

    setResourcesError('')
    setResourcesLoading(true)
    try {
      const data = await fetchResourcesPublic()
      const list = (Array.isArray(data) ? data : []).map((r) => ({
        id: r._id || r.id,
        title: r.title || '',
        type: r.type || 'pdf',
        category: r.category || 'General',
        size: r.sizeLabel || '',
        description: r.description || '',
        thumbnail: getResourceThumb(r.type),
        fileUrl: r.fileUrl || '',
        views: Number(r.views) || 0,
        createdAt: r.createdAt,
      }))

      setResources(list)
      const firstVideo = list.find((x) => x.type === 'video') || null
      setFeaturedVideo((prev) => prev || firstVideo)
    } catch (e) {
      setResourcesError(e?.response?.data?.message || 'Failed to load resources')
    } finally {
      setResourcesLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'elearning') {
      loadResources()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  const categories = useMemo(() => {
    const set = new Set()
    resources.forEach((r) => {
      if (r?.category) set.add(r.category)
    })
    const list = ['All', ...Array.from(set).sort()]
    return list.length > 1 ? list : DEFAULT_CATEGORIES
  }, [resources])

  const filteredResources = useMemo(() => {
    const list = Array.isArray(resources) ? resources : []
    if (activeCategory === 'All') return list
    return list.filter((r) => r.category === activeCategory)
  }, [resources, activeCategory])

  const recentResources = useMemo(() => {
    const list = Array.isArray(resources) ? resources : []
    return [...list]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 3)
  }, [resources])

  const learningStats = useMemo(() => {
    const list = Array.isArray(resources) ? resources : []
    const videos = list.filter((r) => r.type === 'video').length
    const pdfs = list.filter((r) => r.type === 'pdf').length
    const counts = new Map()
    list.forEach((r) => {
      if (!r?.category) return
      counts.set(r.category, (counts.get(r.category) || 0) + 1)
    })
    const topCategory = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || '-'
    return { total: list.length, videos, pdfs, topCategory }
  }, [resources])

  const upcomingReservations = useMemo(() => {
    const list = Array.isArray(myReservations) ? myReservations : []
    return list.filter((r) => r?.status === 'Upcoming' || r?.status === 'Active')
  }, [myReservations])

  const userStats = useMemo(() => {
    const list = Array.isArray(myReservations) ? myReservations : []
    const now = new Date()
    const month = now.getMonth()
    const year = now.getFullYear()
    const thisMonth = list.filter((r) => {
      const d = new Date(r.createdAt || 0)
      return d.getMonth() === month && d.getFullYear() === year
    })

    const hours = list
      .filter((r) => r?.status !== 'Cancelled')
      .reduce((sum, r) => sum + parseDurationHours(r?.time), 0)

    const counts = new Map()
    list.forEach((r) => {
      const name = r?.spaceName
      if (!name) return
      counts.set(name, (counts.get(name) || 0) + 1)
    })
    const mostUsed = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || '-'

    return {
      monthCount: thisMonth.length,
      hoursStudied: Math.round(hours * 10) / 10,
      mostUsed,
    }
  }, [myReservations])
  const getTypeIcon = (type) => {
    switch (type) {
      case 'pdf':
        return FileTextIcon
      case 'video':
        return VideoIcon
      case 'notes':
        return BookOpenIcon
      default:
        return FileTextIcon
    }
  }
  const getTypeBadgeColor = (type) => {
    switch (type) {
      case 'pdf':
        return 'bg-coral/10 text-coral'
      case 'video':
        return 'bg-teal/10 text-teal'
      case 'notes':
        return 'bg-golden/20 text-yellow-700'
      default:
        return 'bg-medium/20 text-medium'
    }
  }
  return (
    <div className="min-h-screen bg-light p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{
            opacity: 0,
            y: -20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="mb-8"
        >
          <h1 className="text-3xl font-extrabold text-dark mb-2">
            Spaces & E-Learning 🎓
          </h1>
          <p className="text-medium">
            Reserve study spaces and access digital learning resources.
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          className="flex gap-2 mb-8"
        >
          <motion.button
            onClick={() => setActiveTab('spaces')}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-lg transition-all ${activeTab === 'spaces' ? 'bg-teal text-white shadow-lg shadow-teal/30' : 'bg-white text-medium border border-gray-200'}`}
            whileHover={{
              scale: 1.02,
            }}
            whileTap={{
              scale: 0.98,
            }}
          >
            <MapPinIcon size={20} />
            Library Spaces
          </motion.button>
          <motion.button
            onClick={() => setActiveTab('elearning')}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-lg transition-all ${activeTab === 'elearning' ? 'bg-coral text-white shadow-lg shadow-coral/30' : 'bg-white text-medium border border-gray-200'}`}
            whileHover={{
              scale: 1.02,
            }}
            whileTap={{
              scale: 0.98,
            }}
          >
            <GraduationCapIcon size={20} />
            E-Learning Resources
          </motion.button>
        </motion.div>

        {/* Library Spaces Tab */}
        {activeTab === 'spaces' && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Spaces Grid */}
              <div className="lg:col-span-2">
                <motion.div variants={itemVariants} className="mb-6">
                  <h2 className="text-xl font-extrabold text-dark mb-2">
                    Available Spaces
                  </h2>
                  <p className="text-medium text-sm">
                    Select a space and time slot to reserve.
                  </p>
                </motion.div>

                <motion.div
                  variants={itemVariants}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                  {spacesLoading ? (
                    <div className="col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 text-medium">
                      Loading spaces...
                    </div>
                  ) : spacesError ? (
                    <div className="col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 text-coral font-semibold">
                      {spacesError}
                    </div>
                  ) : spaces.length === 0 ? (
                    <div className="col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 text-medium">
                      No spaces available.
                    </div>
                  ) : (
                    spaces.map((space) => (
                    <motion.div
                      key={space._id || space.id}
                      className={`bg-white rounded-3xl p-6 shadow-sm border-2 transition-all cursor-pointer ${selectedSpace?.id === space.id ? 'border-teal' : 'border-gray-100 hover:border-gray-200'}`}
                      whileHover={{
                        y: -4,
                      }}
                      onClick={() => {
                        setSelectedSpace(space)
                        setSelectedSlot(null)
                      }}
                    >
                      <div
                        className={`w-full h-24 ${getSpaceBg(space.color)} rounded-2xl mb-4 flex items-center justify-center`}
                      >
                        <MapPinIcon size={32} className="text-white/50" />
                      </div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-dark">{space.name}</h3>
                        <span className="text-xs bg-light px-2 py-1 rounded-full text-medium font-semibold">
                          {space.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-medium mb-3">
                        <UsersIcon size={14} />
                        <span>Capacity: {space.capacity}</span>
                      </div>
                      <div className="flex gap-2 mb-4">
                        {space.amenities.map((amenity) => {
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
                      <div className="flex flex-wrap gap-2">
                        {(Array.isArray(space.timeSlots) ? space.timeSlots : []).map((slot) => (
                          <button
                            key={slot}
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedSpace(space)
                              setSelectedSlot(slot)
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${selectedSpace?.id === space.id && selectedSlot === slot ? 'bg-teal text-white' : 'bg-light text-medium hover:bg-teal/10 hover:text-teal'}`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                    ))
                  )}
                </motion.div>

                {/* Reserve Button */}
                {selectedSpace && selectedSlot && (
                  <motion.div
                    initial={{
                      opacity: 0,
                      y: 20,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    className="mt-6 bg-teal/10 rounded-3xl p-6 border border-teal/20"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-dark text-lg">
                          {selectedSpace.name}
                        </p>
                        <p className="text-teal font-semibold">
                          {selectedSlot}
                        </p>
                      </div>
                      <motion.button
                        whileHover={{
                          scale: 1.05,
                        }}
                        whileTap={{
                          scale: 0.95,
                        }}
                        onClick={handleReserveNow}
                        disabled={reserving}
                        className={`px-6 py-3 bg-teal text-white rounded-full font-bold shadow-lg shadow-teal/30 ${reserving ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        {reserving ? 'Reserving...' : 'Reserve Now'}
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* My Reservations */}
                <motion.div
                  variants={itemVariants}
                  className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
                >
                  <h3 className="font-extrabold text-dark mb-4 flex items-center gap-2">
                    <CalendarIcon size={20} className="text-teal" />
                    My Reservations
                  </h3>
                  <div className="space-y-3">
                    {reservationsLoading ? (
                      <div className="p-3 bg-light rounded-2xl text-sm text-medium">
                        Loading reservations...
                      </div>
                    ) : upcomingReservations.length === 0 ? (
                      <div className="p-3 bg-light rounded-2xl text-sm text-medium">
                        No upcoming reservations.
                      </div>
                    ) : (
                      upcomingReservations.map((res) => (
                        <div
                          key={res._id || res.id}
                          className="flex items-center justify-between p-3 bg-light rounded-2xl"
                        >
                          <div>
                            <p className="font-bold text-dark text-sm">
                              {res.spaceName}
                            </p>
                            <p className="text-xs text-medium">
                              {res.date} • {res.time}
                            </p>
                          </div>
                          <motion.button
                            whileHover={{
                              scale: 1.1,
                            }}
                            whileTap={{
                              scale: 0.9,
                            }}
                            onClick={() => handleCancelMyReservation(res)}
                            className="p-2 text-coral hover:bg-coral/10 rounded-full"
                          >
                            <XIcon size={16} />
                          </motion.button>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>

                {/* Auto-release Notice */}
                <motion.div
                  variants={itemVariants}
                  className="bg-golden/10 rounded-3xl p-6 border border-golden/20"
                >
                  <div className="flex items-start gap-3">
                    <ClockIcon
                      size={20}
                      className="text-yellow-700 flex-shrink-0 mt-0.5"
                    />
                    <div>
                      <p className="font-bold text-dark text-sm mb-1">
                        Auto-Release Policy
                      </p>
                      <p className="text-sm text-medium">
                        Unused reservations are automatically released after 15
                        minutes of the start time.
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Usage Stats */}
                <motion.div
                  variants={itemVariants}
                  className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
                >
                  <h3 className="font-extrabold text-dark mb-4 flex items-center gap-2">
                    <TrendingUpIcon size={20} className="text-coral" />
                    Your Stats
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-medium text-sm">
                        Reservations this month
                      </span>
                      <span className="font-bold text-dark">{userStats.monthCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-medium text-sm">Hours studied</span>
                      <span className="font-bold text-dark">{userStats.hoursStudied}h</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-medium text-sm">
                        Most used space
                      </span>
                      <span className="font-bold text-teal">{userStats.mostUsed}</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}

        {/* E-Learning Tab */}
        {activeTab === 'elearning' && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {/* Category Filter */}
            <motion.div
              variants={itemVariants}
              className="flex flex-wrap gap-2 mb-8"
            >
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${activeCategory === cat ? 'bg-coral text-white shadow-md' : 'bg-white text-medium hover:text-dark border border-gray-200'}`}
                >
                  {cat}
                </button>
              ))}
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Resources Grid */}
              <div className="lg:col-span-2">
                {/* Featured Video */}
                {featuredVideo && (
                  <motion.div
                    variants={itemVariants}
                    className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 mb-8"
                  >
                    <div
                      className={`w-full h-64 ${featuredVideo.thumbnail} relative flex items-center justify-center`}
                    >
                      <motion.button
                        whileHover={{
                          scale: 1.1,
                        }}
                        whileTap={{
                          scale: 0.9,
                        }}
                        onClick={() => openResourceFile(featuredVideo)}
                        className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center shadow-lg"
                      >
                        <PlayIcon size={32} className="text-coral ml-1" />
                      </motion.button>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${getTypeBadgeColor(featuredVideo.type)}`}
                        >
                          {featuredVideo.type.toUpperCase()}
                        </span>
                        <span className="text-sm text-medium">
                          {featuredVideo.size}
                        </span>
                      </div>
                      <h3 className="text-xl font-extrabold text-dark mb-2">
                        {featuredVideo.title}
                      </h3>
                      {featuredVideo.description && (
                        <p className="text-medium">
                          {featuredVideo.description}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Resources Grid */}
                <motion.div variants={itemVariants}>
                  <h2 className="text-xl font-extrabold text-dark mb-4">
                    All Resources
                  </h2>
                  {resourcesLoading ? (
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 text-medium">
                      Loading resources...
                    </div>
                  ) : resourcesError ? (
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 text-coral font-semibold">
                      {resourcesError}
                    </div>
                  ) : filteredResources.length === 0 ? (
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 text-medium">
                      No resources available.
                    </div>
                  ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredResources.map((resource) => {
                      const TypeIcon = getTypeIcon(resource.type)
                      return (
                        <motion.div
                          key={resource.id}
                          className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer"
                          whileHover={{
                            y: -2,
                          }}
                          onClick={() => resource.type === 'video' && setFeaturedVideo(resource)}
                        >
                          <div className="flex items-start gap-4">
                            <div
                              className={`w-14 h-14 ${resource.thumbnail} rounded-2xl flex items-center justify-center flex-shrink-0`}
                            >
                              <TypeIcon size={24} className="text-white/70" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-dark text-sm truncate">
                                {resource.title}
                              </h4>
                              <p className="text-xs text-medium mb-2">
                                {resource.category}
                              </p>
                              <div className="flex items-center justify-between">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${getTypeBadgeColor(resource.type)}`}
                                >
                                  {resource.type.toUpperCase()}
                                </span>
                                <span className="text-xs text-medium">
                                  {resource.size}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 flex gap-2">
                            {resource.type === 'video' ? (
                              <motion.button
                                whileHover={{
                                  scale: 1.02,
                                }}
                                whileTap={{
                                  scale: 0.98,
                                }}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openResourceFile(resource)
                                }}
                                className="flex-1 py-2 bg-teal text-white rounded-full text-sm font-bold flex items-center justify-center gap-1"
                              >
                                <PlayIcon size={14} /> Watch
                              </motion.button>
                            ) : (
                              <motion.button
                                whileHover={{
                                  scale: 1.02,
                                }}
                                whileTap={{
                                  scale: 0.98,
                                }}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openResourceFile(resource)
                                }}
                                className="flex-1 py-2 bg-coral text-white rounded-full text-sm font-bold flex items-center justify-center gap-1"
                              >
                                <DownloadIcon size={14} /> Download
                              </motion.button>
                            )}
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                  )}
                </motion.div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Recently Accessed */}
                <motion.div
                  variants={itemVariants}
                  className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
                >
                  <h3 className="font-extrabold text-dark mb-4 flex items-center gap-2">
                    <ClockIcon size={20} className="text-golden" />
                    Recently Accessed
                  </h3>
                  <div className="space-y-3">
                    {recentResources.length === 0 ? (
                      <div className="p-3 bg-light rounded-2xl text-sm text-medium">
                        No resources yet.
                      </div>
                    ) : (
                    recentResources.map((resource) => {
                      const TypeIcon = getTypeIcon(resource.type)
                      return (
                        <div
                          key={resource.id}
                          className="flex items-center gap-3 p-2 hover:bg-light rounded-xl transition-colors cursor-pointer"
                          onClick={() => openResourceFile(resource)}
                        >
                          <div
                            className={`w-10 h-10 ${resource.thumbnail} rounded-xl flex items-center justify-center`}
                          >
                            <TypeIcon size={16} className="text-white/70" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-dark text-sm truncate">
                              {resource.title}
                            </p>
                            <p className="text-xs text-medium">
                              {resource.category}
                            </p>
                          </div>
                        </div>
                      )
                    }))}
                  </div>
                </motion.div>

                {/* Learning Stats */}
                <motion.div
                  variants={itemVariants}
                  className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
                >
                  <h3 className="font-extrabold text-dark mb-4 flex items-center gap-2">
                    <TrendingUpIcon size={20} className="text-teal" />
                    Learning Stats
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-medium text-sm">
                        Resources accessed
                      </span>
                      <span className="font-bold text-dark">{learningStats.total}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-medium text-sm">
                        Videos watched
                      </span>
                      <span className="font-bold text-dark">{learningStats.videos}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-medium text-sm">
                        PDFs downloaded
                      </span>
                      <span className="font-bold text-dark">{learningStats.pdfs}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-medium text-sm">Top category</span>
                      <span className="font-bold text-coral">{learningStats.topCategory}</span>
                    </div>
                  </div>
                </motion.div>

                {/* Categories */}
                <motion.div
                  variants={itemVariants}
                  className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
                >
                  <h3 className="font-extrabold text-dark mb-4 flex items-center gap-2">
                    <FolderIcon size={20} className="text-coral" />
                    Browse by Category
                  </h3>
                  <div className="space-y-2">
                    {categories.slice(1).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className="w-full flex items-center justify-between p-3 bg-light rounded-xl hover:bg-teal/10 transition-colors text-left"
                      >
                        <span className="font-semibold text-dark text-sm">
                          {cat}
                        </span>
                        <span className="text-xs text-medium bg-white px-2 py-1 rounded-full">
                          {
                            resources.filter((r) => r.category === cat).length
                          }
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
