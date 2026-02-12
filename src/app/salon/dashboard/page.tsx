'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Calendar, Users, TrendingUp, DollarSign, Clock, Star, 
  Settings, Bell, Search, Filter, MoreVertical, Eye, 
  Edit, Trash2, Plus, Download, ChevronDown, MapPin,
  Phone, Mail, Globe, Palette, Image
} from 'lucide-react'
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns'

interface DashboardStats {
  totalBookings: number
  totalRevenue: number
  averageRating: number
  totalClients: number
  bookingsChange: number
  revenueChange: number
  ratingChange: number
  clientsChange: number
}

interface Booking {
  id: string
  clientName: string
  clientEmail: string
  service: string
  date: Date
  time: string
  duration: number
  price: number
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled'
  technician: string
  notes?: string
}

interface Client {
  id: string
  name: string
  email: string
  phone: string
  joinDate: Date
  totalBookings: number
  totalSpent: number
  lastVisit: Date
  favoriteServices: string[]
  notes?: string
  avatar?: string
}

const mockStats: DashboardStats = {
  totalBookings: 234,
  totalRevenue: 18450,
  averageRating: 4.8,
  totalClients: 156,
  bookingsChange: 12.5,
  revenueChange: 8.3,
  ratingChange: 0.2,
  clientsChange: 15.7
}

const mockBookings: Booking[] = [
  {
    id: '1',
    clientName: 'Sarah Johnson',
    clientEmail: 'sarah@email.com',
    service: 'Gel Manicure',
    date: new Date(),
    time: '10:00',
    duration: 60,
    price: 65,
    status: 'confirmed',
    technician: 'Emma',
    notes: 'First time client'
  },
  {
    id: '2',
    clientName: 'Maria Garcia',
    clientEmail: 'maria@email.com',
    service: 'French Manicure',
    date: new Date(),
    time: '14:30',
    duration: 75,
    price: 55,
    status: 'confirmed',
    technician: 'Lisa'
  },
  {
    id: '3',
    clientName: 'Emma Wilson',
    clientEmail: 'emma@email.com',
    service: 'Nail Art Design',
    date: subDays(new Date(), 1),
    time: '16:00',
    duration: 90,
    price: 85,
    status: 'completed',
    technician: 'Sarah'
  }
]

const mockClients: Client[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah@email.com',
    phone: '+1 (555) 123-4567',
    joinDate: new Date('2023-10-15'),
    totalBookings: 8,
    totalSpent: 520,
    lastVisit: new Date(),
    favoriteServices: ['Gel Manicure', 'French Tips'],
    notes: 'Prefers minimal designs'
  },
  {
    id: '2',
    name: 'Maria Garcia',
    email: 'maria@email.com',
    phone: '+1 (555) 987-6543',
    joinDate: new Date('2023-08-22'),
    totalBookings: 12,
    totalSpent: 780,
    lastVisit: subDays(new Date(), 5),
    favoriteServices: ['French Manicure', 'Classic Polish'],
    notes: 'Regular client, books monthly'
  }
]

export default function SalonDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'clients' | 'analytics' | 'settings'>('overview')
  const [bookingFilter, setBookingFilter] = useState<'all' | 'today' | 'upcoming' | 'completed'>('all')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings }
  ]

  const filteredBookings = mockBookings.filter(booking => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const bookingDate = new Date(booking.date)
    bookingDate.setHours(0, 0, 0, 0)

    switch (bookingFilter) {
      case 'today':
        return bookingDate.getTime() === today.getTime()
      case 'upcoming':
        return bookingDate.getTime() >= today.getTime() && booking.status !== 'completed'
      case 'completed':
        return booking.status === 'completed'
      default:
        return true
    }
  })

  const StatCard = ({ title, value, change, icon: Icon, format = 'number' }: {
    title: string
    value: number
    change: number
    icon: any
    format?: 'number' | 'currency' | 'rating'
  }) => (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-pink-100 rounded-lg">
          <Icon className="h-6 w-6 text-pink-600" />
        </div>
        <div className={`flex items-center gap-1 text-sm font-medium ${
          change >= 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          <span>{change >= 0 ? '+' : ''}{change}%</span>
        </div>
      </div>
      <div>
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">
          {format === 'currency' && '$'}
          {format === 'rating' ? value.toFixed(1) : value.toLocaleString()}
          {format === 'rating' && '★'}
        </p>
      </div>
    </motion.div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center gap-3">
              <img 
                src="/NailXR-white.png" 
                alt="NailXR" 
                className="h-10 w-auto"
              />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Salon Dashboard</h1>
                <p className="text-gray-600">Luxe Nail Studio</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <Bell className="h-6 w-6" />
              </button>
              <button className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2">
                <Plus className="h-5 w-5" />
                New Booking
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-8 border-b border-gray-200">
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'overview' | 'bookings' | 'clients' | 'analytics' | 'settings')}
                  className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-pink-500 text-pink-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Bookings"
                value={mockStats.totalBookings}
                change={mockStats.bookingsChange}
                icon={Calendar}
              />
              <StatCard
                title="Total Revenue"
                value={mockStats.totalRevenue}
                change={mockStats.revenueChange}
                icon={DollarSign}
                format="currency"
              />
              <StatCard
                title="Average Rating"
                value={mockStats.averageRating}
                change={mockStats.ratingChange}
                icon={Star}
                format="rating"
              />
              <StatCard
                title="Total Clients"
                value={mockStats.totalClients}
                change={mockStats.clientsChange}
                icon={Users}
              />
            </div>

            {/* Quick Actions */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Recent Bookings */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Bookings</h3>
                  <button className="text-pink-600 hover:text-pink-700 font-medium text-sm">
                    View All
                  </button>
                </div>
                <div className="space-y-4">
                  {mockBookings.slice(0, 3).map(booking => (
                    <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{booking.clientName}</p>
                        <p className="text-sm text-gray-600">{booking.service}</p>
                        <p className="text-xs text-gray-500">
                          {format(booking.date, 'MMM dd')} at {booking.time}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">${booking.price}</p>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          booking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Services */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Popular Services</h3>
                <div className="space-y-4">
                  {[
                    { name: 'Gel Manicure', bookings: 45, revenue: 2925 },
                    { name: 'French Manicure', bookings: 32, revenue: 1760 },
                    { name: 'Nail Art Design', bookings: 28, revenue: 2380 },
                    { name: 'Classic Polish', bookings: 25, revenue: 1000 }
                  ].map((service, index) => (
                    <div key={service.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
                          <span className="text-pink-600 font-semibold text-sm">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{service.name}</p>
                          <p className="text-sm text-gray-600">{service.bookings} bookings</p>
                        </div>
                      </div>
                      <p className="font-semibold text-gray-900">${service.revenue}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="flex gap-4">
                <select
                  value={bookingFilter}
                  onChange={(e) => setBookingFilter(e.target.value as 'all' | 'today' | 'upcoming' | 'completed')}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="all">All Bookings</option>
                  <option value="today">Today</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="completed">Completed</option>
                </select>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search bookings..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
              </div>

              <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium">
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>

            {/* Bookings Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Client</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Service</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Date & Time</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Technician</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Price</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredBookings.map(booking => (
                      <tr key={booking.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{booking.clientName}</p>
                            <p className="text-sm text-gray-600">{booking.clientEmail}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-900">{booking.service}</p>
                          <p className="text-sm text-gray-600">{booking.duration} min</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-900">{format(booking.date, 'MMM dd, yyyy')}</p>
                          <p className="text-sm text-gray-600">{booking.time}</p>
                        </td>
                        <td className="px-6 py-4 text-gray-900">{booking.technician}</td>
                        <td className="px-6 py-4 font-semibold text-gray-900">${booking.price}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            booking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedBooking(booking)}
                              className="p-1 text-gray-400 hover:text-gray-600 rounded"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                              <Edit className="h-4 w-4" />
                            </button>
                            <button className="p-1 text-gray-400 hover:text-red-600 rounded">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'clients' && (
          <div className="space-y-6">
            {/* Client Search */}
            <div className="flex gap-4 justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search clients..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium">
                <Plus className="h-4 w-4" />
                Add Client
              </button>
            </div>

            {/* Clients Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockClients.map(client => (
                <motion.div
                  key={client.id}
                  whileHover={{ y: -2 }}
                  className="bg-white rounded-xl shadow-lg p-6 cursor-pointer"
                  onClick={() => setSelectedClient(client)}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-pink-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{client.name}</h3>
                      <p className="text-sm text-gray-600">{client.email}</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Bookings:</span>
                      <span className="font-medium">{client.totalBookings}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Spent:</span>
                      <span className="font-medium">${client.totalSpent}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Last Visit:</span>
                      <span className="font-medium">{format(client.lastVisit, 'MMM dd')}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {client.favoriteServices.slice(0, 2).map(service => (
                      <span
                        key={service}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-8">
            {/* Salon Information */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Salon Information</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Salon Name
                  </label>
                  <input
                    type="text"
                    defaultValue="Luxe Nail Studio"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    defaultValue="+1 (555) 123-4567"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    defaultValue="info@luxenailstudio.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    type="text"
                    defaultValue="luxenailstudio.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    defaultValue="123 Fashion Street, New York, NY 10001"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Branding */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Branding</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      defaultValue="#ec4899"
                      className="w-12 h-10 rounded border border-gray-300"
                    />
                    <input
                      type="text"
                      defaultValue="#ec4899"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Secondary Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      defaultValue="#8b5cf6"
                      className="w-12 h-10 rounded border border-gray-300"
                    />
                    <input
                      type="text"
                      defaultValue="#8b5cf6"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo Upload
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Image className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Upload your salon logo</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cover Image
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Image className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Upload cover image</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold">
                Save Changes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
