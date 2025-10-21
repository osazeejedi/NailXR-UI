'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, DollarSign, TrendingUp, Settings, Plus, Search, 
  Filter, MoreVertical, Edit, Trash2, Eye, Building, 
  CreditCard, Calendar, Globe, Shield, AlertTriangle
} from 'lucide-react'
import { TenantManager, TenantConfig, sampleTenants } from '@/lib/tenant'
import { RevenueTracker, formatCurrency, formatPercent, formatDate } from '@/lib/revenue'

interface AdminMetrics {
  totalTenants: number
  activeTenants: number
  totalRevenue: number
  monthlyGrowth: number
  totalBookings: number
  averageCommissionRate: number
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'tenants' | 'revenue' | 'settings'>('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTenant, setSelectedTenant] = useState<TenantConfig | null>(null)
  const [showTenantModal, setShowTenantModal] = useState(false)

  // Mock admin metrics
  const adminMetrics: AdminMetrics = {
    totalTenants: 15,
    activeTenants: 12,
    totalRevenue: 28450.75,
    monthlyGrowth: 15.3,
    totalBookings: 324,
    averageCommissionRate: 8.2
  }

  const allTenants = TenantManager.getAllTenants()
  const filteredTenants = allTenants.filter(tenant =>
    tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.domain.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'tenants', label: 'White-Label Clients', icon: Building },
    { id: 'revenue', label: 'Revenue Analytics', icon: DollarSign },
    { id: 'settings', label: 'Platform Settings', icon: Settings }
  ]

  const MetricCard = ({ title, value, change, icon: Icon, format = 'number' }: {
    title: string
    value: number
    change?: number
    icon: any
    format?: 'number' | 'currency' | 'percent'
  }) => (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-blue-100 rounded-lg">
          <Icon className="h-6 w-6 text-blue-600" />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-medium ${
            change >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            <span>{formatPercent(change)}</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">
          {format === 'currency' ? formatCurrency(value) : 
           format === 'percent' ? `${value}%` : 
           value.toLocaleString()}
        </p>
      </div>
    </motion.div>
  )

  const TenantCard = ({ tenant }: { tenant: TenantConfig }) => {
    const metrics = RevenueTracker.getDashboardMetrics(tenant.id)
    
    return (
      <motion.div
        whileHover={{ y: -2 }}
        className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center"
                 style={{ backgroundColor: tenant.branding.primaryColor + '20' }}>
              <Building className="h-6 w-6" style={{ color: tenant.branding.primaryColor }} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{tenant.name}</h3>
              <p className="text-sm text-gray-600">{tenant.domain}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              tenant.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {tenant.isActive ? 'Active' : 'Inactive'}
            </span>
            <button className="p-1 hover:bg-gray-100 rounded">
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">{formatCurrency(metrics.revenue.thisMonth)}</div>
            <div className="text-xs text-gray-600">Revenue</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">{metrics.bookings.thisMonth}</div>
            <div className="text-xs text-gray-600">Bookings</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">{tenant.pricing.commissionRate}%</div>
            <div className="text-xs text-gray-600">Commission</div>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Tier: {tenant.pricing.tier}</span>
          <span className="text-gray-600">Joined: {formatDate(tenant.createdAt)}</span>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setSelectedTenant(tenant)}
            className="flex-1 bg-blue-50 text-blue-600 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-1 hover:bg-blue-100"
          >
            <Eye className="h-4 w-4" />
            View Details
          </button>
          <button className="flex-1 border border-gray-300 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-1 hover:bg-gray-50">
            <Edit className="h-4 w-4" />
            Edit
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">NailXR Admin Dashboard</h1>
              <p className="text-gray-600">White-Label Platform Management</p>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <AlertTriangle className="h-6 w-6" />
              </button>
              <button 
                onClick={() => setShowTenantModal(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:bg-blue-700"
              >
                <Plus className="h-5 w-5" />
                Add White-Label Client
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
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
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
            {/* Metrics Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Total Clients"
                value={adminMetrics.totalTenants}
                change={12.5}
                icon={Building}
              />
              <MetricCard
                title="Active Clients"
                value={adminMetrics.activeTenants}
                change={8.3}
                icon={Users}
              />
              <MetricCard
                title="Platform Revenue"
                value={adminMetrics.totalRevenue}
                change={15.3}
                icon={DollarSign}
                format="currency"
              />
              <MetricCard
                title="Avg Commission"
                value={adminMetrics.averageCommissionRate}
                change={2.1}
                icon={TrendingUp}
                format="percent"
              />
            </div>

            {/* Recent Activity */}
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Client Activity</h3>
                <div className="space-y-4">
                  {sampleTenants.slice(0, 3).map((tenant, index) => (
                    <div key={tenant.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                             style={{ backgroundColor: tenant.branding.primaryColor + '20' }}>
                          <Building className="h-5 w-5" style={{ color: tenant.branding.primaryColor }} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{tenant.name}</p>
                          <p className="text-sm text-gray-600">New booking confirmed</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">$85.00</p>
                        <p className="text-xs text-gray-500">2 min ago</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Revenue Trends</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">This Month</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(15420)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Last Month</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(13250)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Growth</span>
                    <span className="font-semibold text-green-600">{formatPercent(16.4)}</span>
                  </div>
                  <div className="pt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">75% of monthly target achieved</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tenants' && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Filter className="h-4 w-4" />
                  Filter
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Plus className="h-4 w-4" />
                  Add Client
                </button>
              </div>
            </div>

            {/* Clients Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTenants.map(tenant => (
                <TenantCard key={tenant.id} tenant={tenant} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'revenue' && (
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Revenue Analytics</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">{formatCurrency(28450)}</div>
                  <div className="text-gray-600">Total Platform Revenue</div>
                  <div className="text-green-600 text-sm mt-1">{formatPercent(15.3)} from last month</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">324</div>
                  <div className="text-gray-600">Total Bookings</div>
                  <div className="text-green-600 text-sm mt-1">{formatPercent(22.1)} from last month</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">8.2%</div>
                  <div className="text-gray-600">Average Commission</div>
                  <div className="text-blue-600 text-sm mt-1">Across all clients</div>
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Transactions</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Client</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Service Amount</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Commission</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Date</th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sampleTenants.slice(0, 5).map((tenant, index) => (
                      <tr key={tenant.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                 style={{ backgroundColor: tenant.branding.primaryColor + '20' }}>
                              <Building className="h-4 w-4" style={{ color: tenant.branding.primaryColor }} />
                            </div>
                            <span className="font-medium text-gray-900">{tenant.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-900">{formatCurrency(85 + index * 15)}</td>
                        <td className="px-6 py-4 font-semibold text-green-600">{formatCurrency((85 + index * 15) * tenant.pricing.commissionRate / 100)}</td>
                        <td className="px-6 py-4 text-gray-600">{formatDate(new Date())}</td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            Confirmed
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Platform Settings</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Commission Rate
                  </label>
                  <input
                    type="number"
                    defaultValue="8.5"
                    step="0.1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Setup Fee
                  </label>
                  <input
                    type="number"
                    defaultValue="299"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Platform Domain
                  </label>
                  <input
                    type="text"
                    defaultValue="nailxr.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Support Email
                  </label>
                  <input
                    type="email"
                    defaultValue="support@nailxr.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700">
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
