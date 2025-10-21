'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Palette, Monitor, Smartphone, Building, Star, 
  ArrowRight, CheckCircle, DollarSign, Users, TrendingUp
} from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'
import { TenantManager, sampleTenants, defaultTenantConfig } from '@/lib/tenant'
import { RevenueTracker, formatCurrency } from '@/lib/revenue'

export default function WhiteLabelDemo() {
  const { tenant, setDemoMode, isDemoMode } = useTheme()
  const [selectedTenant, setSelectedTenant] = useState(defaultTenantConfig.id)

  const allTenants = [defaultTenantConfig, ...sampleTenants]

  const handleTenantSwitch = (tenantId: string) => {
    const newTenant = allTenants.find(t => t.id === tenantId)
    if (newTenant) {
      setSelectedTenant(tenantId)
      if (tenantId === defaultTenantConfig.id) {
        setDemoMode(false)
      } else {
        setDemoMode(true, newTenant)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6"
            >
              White-Label Demo
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600"> Platform</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto"
            >
              Experience how NailXR transforms with different branding. Watch the magic happen as we switch between white-label configurations in real-time.
            </motion.p>
            
            {isDemoMode && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full font-medium"
              >
                <CheckCircle className="h-5 w-5" />
                Demo Mode Active: {tenant.name}
              </motion.div>
            )}
          </div>

          {/* Tenant Selector */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Choose a White-Label Configuration
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {allTenants.map((tenantOption) => (
                <motion.div
                  key={tenantOption.id}
                  whileHover={{ y: -4 }}
                  onClick={() => handleTenantSwitch(tenantOption.id)}
                  className={`cursor-pointer rounded-xl border-2 p-6 transition-all ${
                    selectedTenant === tenantOption.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: tenantOption.branding.primaryColor + '20' }}
                    >
                      <Building 
                        className="h-6 w-6" 
                        style={{ color: tenantOption.branding.primaryColor }} 
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{tenantOption.name}</h3>
                      <p className="text-sm text-gray-600">{tenantOption.domain}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Primary Color:</span>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full border border-gray-300"
                          style={{ backgroundColor: tenantOption.branding.primaryColor }}
                        />
                        <span className="font-mono text-xs">{tenantOption.branding.primaryColor}</span>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Commission:</span>
                      <span className="font-medium">{tenantOption.pricing.commissionRate}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tier:</span>
                      <span className="font-medium capitalize">{tenantOption.pricing.tier}</span>
                    </div>
                  </div>

                  <div className="text-center">
                    <button 
                      className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                        selectedTenant === tenantOption.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {selectedTenant === tenantOption.id ? 'Active' : 'Select'}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Live Preview */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Preview Content */}
            <motion.div
              key={tenant.id} // Force re-render on tenant change
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-xl p-8"
            >
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <img 
                    src={tenant.branding.logo} 
                    alt={tenant.name}
                    className="h-8 w-8"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                  <span 
                    className="font-semibold"
                    style={{ color: tenant.branding.primaryColor }}
                  >
                    {tenant.content.tagline}
                  </span>
                </div>
                
                <h3 className="text-3xl font-bold text-gray-900 mb-2">
                  {tenant.content.heroTitle}
                </h3>
                <p className="text-gray-600 mb-6">
                  {tenant.content.heroSubtitle}
                </p>
              </div>

              {/* Sample UI Elements */}
              <div className="space-y-4">
                <button 
                  className="w-full py-3 px-6 rounded-lg font-semibold text-white transition-transform hover:scale-105"
                  style={{ 
                    background: `linear-gradient(135deg, ${tenant.branding.primaryColor}, ${tenant.branding.secondaryColor})` 
                  }}
                >
                  Try Virtual Try-On
                  <ArrowRight className="inline h-5 w-5 ml-2" />
                </button>

                <div className="flex gap-3">
                  <button 
                    className="flex-1 py-2 px-4 rounded-lg font-medium transition-colors"
                    style={{ 
                      backgroundColor: tenant.branding.primaryColor + '10',
                      color: tenant.branding.primaryColor,
                      border: `2px solid ${tenant.branding.primaryColor}`
                    }}
                  >
                    Save Look
                  </button>
                  <button 
                    className="flex-1 py-2 px-4 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Find Salon
                  </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 pt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">500+</div>
                    <div className="text-sm text-gray-600">Designs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">50+</div>
                    <div className="text-sm text-gray-600">Salons</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">4.9★</div>
                    <div className="text-sm text-gray-600">Rating</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Configuration Details */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Brand Configuration
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Company Name:</span>
                    <span className="font-medium">{tenant.content.companyName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Domain:</span>
                    <span className="font-medium">{tenant.domain}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Primary Color:</span>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full border border-gray-300"
                        style={{ backgroundColor: tenant.branding.primaryColor }}
                      />
                      <span className="font-mono text-sm">{tenant.branding.primaryColor}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Secondary Color:</span>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full border border-gray-300"
                        style={{ backgroundColor: tenant.branding.secondaryColor }}
                      />
                      <span className="font-mono text-sm">{tenant.branding.secondaryColor}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Revenue Model
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Commission Rate:</span>
                    <span className="font-bold text-green-600">{tenant.pricing.commissionRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Setup Fee:</span>
                    <span className="font-medium">{formatCurrency(tenant.pricing.setupFee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monthly Fee:</span>
                    <span className="font-medium">{formatCurrency(tenant.pricing.monthlyFee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tier:</span>
                    <span className="font-medium capitalize">{tenant.pricing.tier}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Sample Metrics
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monthly Revenue:</span>
                    <span className="font-bold text-green-600">{formatCurrency(2450)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Bookings:</span>
                    <span className="font-medium">142</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Booking Value:</span>
                    <span className="font-medium">{formatCurrency(85)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Commission Earned:</span>
                    <span className="font-bold text-blue-600">
                      {formatCurrency(2450 * tenant.pricing.commissionRate / 100)}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              White-Label Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to launch your own branded nail visualization platform
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Palette className="h-8 w-8" />,
                title: 'Custom Branding',
                description: 'Complete visual customization with your colors, logo, and typography'
              },
              {
                icon: <DollarSign className="h-8 w-8" />,
                title: 'Revenue Sharing',
                description: 'Flexible commission rates and automated billing systems'
              },
              {
                icon: <Building className="h-8 w-8" />,
                title: 'Multi-Tenant',
                description: 'Scalable architecture supporting unlimited white-label instances'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gray-50 p-8 rounded-xl text-center"
              >
                <div className="text-blue-600 mb-4 flex justify-center">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
