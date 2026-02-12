'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, MapPin, Star, Clock, Calendar, ChevronLeft, ChevronRight,
  Phone, Globe, Navigation, Filter, Search, Check, Heart,
  Home, MessageCircle, Building2
} from 'lucide-react'
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, addWeeks, subWeeks } from 'date-fns'

interface Salon {
  id: string
  name: string
  address: string
  area: string
  state: string
  landmark?: string
  distance: number
  rating: number
  reviewCount: number
  priceRange: '₦' | '₦₦' | '₦₦₦' | '₦₦₦₦'
  phone: string
  whatsappPhone?: string
  instagram?: string
  website?: string
  image: string
  services: string[]
  serviceType: 'salon_only' | 'home_only' | 'both'
  homeVisitFee: number
  homeVisitAreas: string[]
  openingHours: {
    [key: string]: { open: string; close: string } | null
  }
  specialties: string[]
  verified: boolean
}

interface TimeSlot {
  time: string
  available: boolean
  price: number
  technician?: string
}

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  selectedLook?: {
    name: string
    nailColor: string
    nailStyle: string
    estimatedPrice: number
    estimatedDuration: number
  }
}

const mockSalons: Salon[] = [
  {
    id: '1',
    name: 'Luxe Nails Lagos',
    address: '12 Admiralty Way, Lekki Phase 1',
    area: 'Lekki',
    state: 'Lagos',
    landmark: 'Beside Mega Chicken',
    distance: 0.5,
    rating: 4.9,
    reviewCount: 156,
    priceRange: '₦₦₦',
    phone: '+234 812 345 6789',
    whatsappPhone: '+2348123456789',
    instagram: '@luxenailslagos',
    image: '/api/placeholder/300/200',
    services: ['Classic Manicure', 'Gel Polish', 'Nail Art', 'French Tips', 'Acrylic Extensions'],
    serviceType: 'both',
    homeVisitFee: 5000,
    homeVisitAreas: ['Lekki', 'Victoria Island', 'Ikoyi', 'Ajah'],
    openingHours: {
      monday: { open: '09:00', close: '19:00' },
      tuesday: { open: '09:00', close: '19:00' },
      wednesday: { open: '09:00', close: '19:00' },
      thursday: { open: '09:00', close: '20:00' },
      friday: { open: '09:00', close: '20:00' },
      saturday: { open: '08:00', close: '18:00' },
      sunday: { open: '10:00', close: '17:00' }
    },
    specialties: ['Luxury treatments', 'Custom nail art'],
    verified: true
  },
  {
    id: '2',
    name: 'Glam Fingers',
    address: 'Mobile Service',
    area: 'Wuse',
    state: 'FCT (Abuja)',
    distance: 1.2,
    rating: 4.7,
    reviewCount: 89,
    priceRange: '₦₦',
    phone: '+234 903 456 7890',
    whatsappPhone: '+2349034567890',
    instagram: '@glamfingers_abj',
    image: '/api/placeholder/300/200',
    services: ['Gel Polish', 'Nail Art', 'Pedicure', 'Press-On Nails'],
    serviceType: 'home_only',
    homeVisitFee: 3000,
    homeVisitAreas: ['Wuse', 'Maitama', 'Gwarinpa', 'Jabi', 'Utako', 'Life Camp'],
    openingHours: {
      monday: { open: '10:00', close: '18:00' },
      tuesday: { open: '10:00', close: '18:00' },
      wednesday: { open: '10:00', close: '18:00' },
      thursday: { open: '10:00', close: '19:00' },
      friday: { open: '10:00', close: '19:00' },
      saturday: { open: '09:00', close: '17:00' },
      sunday: null
    },
    specialties: ['Home service', 'Quick turnaround'],
    verified: true
  },
  {
    id: '3',
    name: 'The Nail Bar PH',
    address: '5 Tombia Street, GRA Phase 2',
    area: 'GRA Phase 2',
    state: 'Rivers',
    landmark: 'Off Peter Odili Road',
    distance: 2.1,
    rating: 4.8,
    reviewCount: 234,
    priceRange: '₦₦₦₦',
    phone: '+234 706 789 0123',
    whatsappPhone: '+2347067890123',
    instagram: '@thenailbarph',
    website: 'nailbarph.com',
    image: '/api/placeholder/300/200',
    services: ['Premium Manicure', 'Gel Extensions', 'Nail Art', 'Spa Pedicure'],
    serviceType: 'both',
    homeVisitFee: 4000,
    homeVisitAreas: ['GRA Phase 1', 'GRA Phase 2', 'Trans Amadi', 'Rumuola'],
    openingHours: {
      monday: { open: '09:00', close: '20:00' },
      tuesday: { open: '09:00', close: '20:00' },
      wednesday: { open: '09:00', close: '20:00' },
      thursday: { open: '09:00', close: '20:00' },
      friday: { open: '09:00', close: '20:00' },
      saturday: { open: '08:00', close: '19:00' },
      sunday: { open: '10:00', close: '18:00' }
    },
    specialties: ['Premium nail art', 'Bridal packages'],
    verified: true
  }
]

const generateTimeSlots = (date: Date): TimeSlot[] => {
  const slots: TimeSlot[] = []
  const dayOfWeek = format(date, 'EEEE').toLowerCase()
  
  // Generate slots from 9 AM to 6 PM
  for (let hour = 9; hour <= 18; hour++) {
    for (const minute of [0, 30]) {
      if (hour === 18 && minute === 30) break
      
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      slots.push({
        time,
        available: Math.random() > 0.3, // 70% availability
        price: 5000 + Math.floor(Math.random() * 10000),
        technician: ['Amara', 'Chidinma', 'Funke', 'Blessing'][Math.floor(Math.random() * 4)]
      })
    }
  }
  
  return slots
}

export default function BookingModal({ isOpen, onClose, selectedLook }: BookingModalProps) {
  const [step, setStep] = useState<'salon' | 'datetime' | 'confirmation'>('salon')
  const [selectedSalon, setSelectedSalon] = useState<Salon | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedTime, setSelectedTime] = useState<TimeSlot | null>(null)
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'price'>('distance')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedPriceRange, setSelectedPriceRange] = useState<string[]>([])
  const [favorites, setFavorites] = useState<string[]>([])

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 })
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

  const timeSlots = selectedDate ? generateTimeSlots(selectedDate) : []

  const filteredSalons = mockSalons
    .filter(salon => {
      const matchesSearch = salon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          salon.address.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesPrice = selectedPriceRange.length === 0 || selectedPriceRange.includes(salon.priceRange)
      return matchesSearch && matchesPrice
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'distance':
          return a.distance - b.distance
        case 'rating':
          return b.rating - a.rating
        case 'price':
          return a.priceRange.length - b.priceRange.length
        default:
          return 0
      }
    })

  const handleBooking = () => {
    if (!selectedSalon || !selectedTime) return
    
    // Here you would normally send the booking to your backend
    console.log('Booking:', {
      salon: selectedSalon,
      date: selectedDate,
      time: selectedTime,
      look: selectedLook
    })
    
    // Show confirmation
    setStep('confirmation')
  }

  const toggleFavorite = (salonId: string) => {
    setFavorites(prev => 
      prev.includes(salonId) 
        ? prev.filter(id => id !== salonId)
        : [...prev, salonId]
    )
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {step !== 'salon' && (
                  <button
                    onClick={() => setStep(step === 'datetime' ? 'salon' : 'datetime')}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                )}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {step === 'salon' && 'Choose Salon'}
                    {step === 'datetime' && 'Select Date & Time'}
                    {step === 'confirmation' && 'Booking Confirmation'}
                  </h2>
                  {selectedLook && (
                    <p className="text-gray-600">Booking for: {selectedLook.name}</p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center gap-2 mt-4">
              <div className={`flex-1 h-2 rounded-full ${
                step === 'salon' ? 'bg-pink-500' : 'bg-gray-200'
              }`} />
              <div className={`flex-1 h-2 rounded-full ${
                step === 'datetime' ? 'bg-pink-500' : 'bg-gray-200'
              }`} />
              <div className={`flex-1 h-2 rounded-full ${
                step === 'confirmation' ? 'bg-pink-500' : 'bg-gray-200'
              }`} />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {step === 'salon' && (
              <div className="h-full flex">
                {/* Sidebar */}
                <div className="w-80 border-r border-gray-200 p-6 overflow-y-auto">
                  <div className="space-y-4">
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search salons..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      />
                    </div>

                    {/* Sort */}
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'distance' | 'rating' | 'price')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    >
                      <option value="distance">Sort by Distance</option>
                      <option value="rating">Sort by Rating</option>
                      <option value="price">Sort by Price</option>
                    </select>

                    {/* Filters */}
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <Filter className="h-5 w-5" />
                      Filters
                    </button>

                    {showFilters && (
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Price Range</h4>
                          <div className="space-y-2">
                            {['₦', '₦₦', '₦₦₦', '₦₦₦₦'].map(range => (
                              <label key={range} className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={selectedPriceRange.includes(range)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedPriceRange([...selectedPriceRange, range])
                                    } else {
                                      setSelectedPriceRange(selectedPriceRange.filter(r => r !== range))
                                    }
                                  }}
                                  className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                                />
                                <span className="ml-2 text-sm text-gray-700">{range}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Salon List */}
                <div className="flex-1 p-6 overflow-y-auto">
                  <div className="space-y-4">
                    {filteredSalons.map((salon) => (
                      <motion.div
                        key={salon.id}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => setSelectedSalon(salon)}
                        className={`p-6 border-2 rounded-xl cursor-pointer transition-colors ${
                          selectedSalon?.id === salon.id
                            ? 'border-pink-500 bg-pink-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex gap-4">
                          <div className="w-24 h-24 bg-gray-200 rounded-lg flex-shrink-0"></div>
                          
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-gray-900">{salon.name}</h3>
                                  {salon.verified && (
                                    <Check className="h-4 w-4 text-green-500" />
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <MapPin className="h-4 w-4" />
                                  <span>{salon.address}</span>
                                  <span>•</span>
                                  <span>{salon.distance} km</span>
                                </div>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleFavorite(salon.id)
                                }}
                                className="p-1"
                              >
                                <Heart
                                  className={`h-5 w-5 ${
                                    favorites.includes(salon.id)
                                      ? 'text-red-500 fill-current'
                                      : 'text-gray-400'
                                  }`}
                                />
                              </button>
                            </div>

                            <div className="flex items-center gap-4 mb-3">
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                <span className="font-medium">{salon.rating}</span>
                                <span className="text-gray-600">({salon.reviewCount})</span>
                              </div>
                              <span className="text-gray-600">{salon.priceRange}</span>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-3">
                              {salon.specialties.slice(0, 2).map(specialty => (
                                <span
                                  key={specialty}
                                  className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                                >
                                  {specialty}
                                </span>
                              ))}
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                {salon.phone && (
                                  <div className="flex items-center gap-1">
                                    <Phone className="h-4 w-4" />
                                    <span>{salon.phone}</span>
                                  </div>
                                )}
                                {salon.website && (
                                  <div className="flex items-center gap-1">
                                    <Globe className="h-4 w-4" />
                                    <span>{salon.website}</span>
                                  </div>
                                )}
                              </div>
                              <button className="text-pink-600 hover:text-pink-700 font-medium text-sm">
                                View Details
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 'datetime' && selectedSalon && (
              <div className="h-full p-6 overflow-y-auto">
                <div className="max-w-4xl mx-auto">
                  <div className="grid lg:grid-cols-2 gap-8">
                    {/* Calendar */}
                    <div>
                      <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-lg font-semibold text-gray-900">Select Date</h3>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
                              className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                              <ChevronLeft className="h-5 w-5" />
                            </button>
                            <span className="font-medium text-gray-900">
                              {format(weekStart, 'MMM dd')} - {format(weekEnd, 'MMM dd, yyyy')}
                            </span>
                            <button
                              onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
                              className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                              <ChevronRight className="h-5 w-5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-7 gap-2">
                          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                            <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                              {day}
                            </div>
                          ))}
                          {weekDays.map(day => (
                            <motion.button
                              key={day.toISOString()}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setSelectedDate(day)}
                              className={`aspect-square rounded-lg text-sm font-medium transition-colors ${
                                isSameDay(day, selectedDate)
                                  ? 'bg-pink-500 text-white'
                                  : isToday(day)
                                  ? 'bg-pink-100 text-pink-700 border-2 border-pink-500'
                                  : 'hover:bg-gray-100 text-gray-700'
                              }`}
                            >
                              {format(day, 'd')}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Time Slots */}
                    <div>
                      <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6">
                          Available Times - {format(selectedDate, 'EEEE, MMM dd')}
                        </h3>
                        
                        <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                          {timeSlots.map((slot) => (
                            <motion.button
                              key={slot.time}
                              whileHover={{ scale: slot.available ? 1.02 : 1 }}
                              whileTap={{ scale: slot.available ? 0.98 : 1 }}
                              onClick={() => slot.available && setSelectedTime(slot)}
                              disabled={!slot.available}
                              className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                                selectedTime?.time === slot.time
                                  ? 'bg-pink-500 text-white'
                                  : slot.available
                                  ? 'border border-gray-300 hover:border-pink-300 hover:bg-pink-50'
                                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              }`}
                            >
                              <div>{slot.time}</div>
                              {slot.available && (
                                <div className="text-xs opacity-75">
                                  ₦{slot.price.toLocaleString()} • {slot.technician}
                                </div>
                              )}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Booking Summary */}
                  {selectedTime && (
                    <div className="mt-8 bg-gray-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Summary</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Salon:</span>
                          <span className="font-medium">{selectedSalon.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Service:</span>
                          <span className="font-medium">{selectedLook?.name || 'Nail Art'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Date & Time:</span>
                          <span className="font-medium">
                            {format(selectedDate, 'MMM dd, yyyy')} at {selectedTime.time}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Technician:</span>
                          <span className="font-medium">{selectedTime.technician}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Duration:</span>
                          <span className="font-medium">{selectedLook?.estimatedDuration || 60} minutes</span>
                        </div>
                        <div className="border-t border-gray-200 pt-3">
                          <div className="flex justify-between">
                            <span className="font-semibold">Total:</span>
                            <span className="font-semibold text-lg">₦{selectedTime.price.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 'confirmation' && (
              <div className="h-full flex items-center justify-center p-6">
                <div className="text-center max-w-md">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Check className="h-8 w-8 text-green-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Booking Confirmed!</h3>
                  <p className="text-gray-600 mb-6">
                    Your appointment has been successfully booked. You&apos;ll receive a confirmation email shortly.
                  </p>
                  
                  <div className="bg-gray-50 rounded-xl p-6 mb-6 text-left">
                    <h4 className="font-semibold text-gray-900 mb-3">Appointment Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Salon:</span>
                        <span>{selectedSalon?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date:</span>
                        <span>{format(selectedDate, 'MMM dd, yyyy')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Time:</span>
                        <span>{selectedTime?.time}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Service:</span>
                        <span>{selectedLook?.name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={onClose}
                      className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg font-semibold"
                    >
                      Done
                    </button>
                    <button className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-medium">
                      Add to Calendar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {step !== 'confirmation' && (
            <div className="p-6 border-t border-gray-200">
              <div className="flex justify-between">
                <button
                  onClick={onClose}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (step === 'salon' && selectedSalon) {
                      setStep('datetime')
                    } else if (step === 'datetime' && selectedTime) {
                      handleBooking()
                    }
                  }}
                  disabled={
                    (step === 'salon' && !selectedSalon) ||
                    (step === 'datetime' && !selectedTime)
                  }
                  className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {step === 'salon' ? 'Continue' : 'Book Appointment'}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
