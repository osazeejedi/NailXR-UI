'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Building, Mail, Phone, User, ArrowRight, MapPin, MessageCircle } from 'lucide-react'
import { NIGERIAN_STATES, POPULAR_AREAS } from '@/lib/types'
import { useOnboarding } from '@/components/onboarding/OnboardingContext'

const businessInfoSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  contactName: z.string().min(2, 'Contact name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  whatsappPhone: z.string().optional(),
  businessType: z.enum(['nail_salon', 'home_service', 'nail_salon_and_home', 'spa', 'other']),
  state: z.string().min(1, 'Please select a state'),
  area: z.string().min(1, 'Please enter your area'),
  description: z.string().optional()
})

type BusinessInfoForm = z.infer<typeof businessInfoSchema>

export default function BusinessInfo() {
  const { formData, updateFormData, nextStep, setIsSubmitting, setApplicationId } = useOnboarding()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<BusinessInfoForm>({
    resolver: zodResolver(businessInfoSchema),
    defaultValues: {
      businessName: formData.businessName || '',
      contactName: formData.contactName || '',
      email: formData.email || '',
      phone: formData.phone || '',
      whatsappPhone: formData.whatsappPhone || '',
      businessType: formData.businessType || 'nail_salon',
      state: formData.state || 'Lagos',
      area: formData.area || '',
      description: formData.description || ''
    }
  })

  const onSubmit = async (data: BusinessInfoForm) => {
    try {
      setIsSubmitting(true)

      // If this is the first step and we don't have an applicationId, create one
      const response = await fetch('/api/onboarding/create-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          businessName: data.businessName,
          subdomain: data.businessName.toLowerCase().replace(/[^a-z0-9]/g, '-')
        })
      })

      const result = await response.json()

      if (result.success && result.data.applicationId) {
        setApplicationId(result.data.applicationId)
      }

      // Update context with form data
      updateFormData(data)

      // Move to next step
      nextStep()
    } catch (error) {
      console.error('Error saving business info:', error)
      alert('Failed to save business information. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Business Information</h2>
        <p className="text-gray-600">Tell us about your business to get started</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Business Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              {...register('businessName')}
              type="text"
              placeholder="Luxe Nails Studio"
              className={`w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.businessName ? 'border-red-500' : 'border-gray-200'
              }`}
            />
          </div>
          {errors.businessName && (
            <p className="mt-1 text-sm text-red-600">{errors.businessName.message}</p>
          )}
        </div>

        {/* Contact Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contact Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              {...register('contactName')}
              type="text"
              placeholder="Chioma Okafor"
              className={`w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.contactName ? 'border-red-500' : 'border-gray-200'
              }`}
            />
          </div>
          {errors.contactName && (
            <p className="mt-1 text-sm text-red-600">{errors.contactName.message}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              {...register('email')}
              type="email"
              placeholder="john@luxenails.com"
              className={`w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.email ? 'border-red-500' : 'border-gray-200'
              }`}
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        {/* Phone (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number <span className="text-gray-400">(Optional)</span>
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              {...register('phone')}
              type="tel"
              placeholder="+234 812 345 6789"
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* WhatsApp Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            WhatsApp Number <span className="text-gray-400">(Recommended)</span>
          </label>
          <div className="relative">
            <MessageCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              {...register('whatsappPhone')}
              type="tel"
              placeholder="+234 812 345 6789"
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">Clients will use this to chat with you on WhatsApp</p>
        </div>

        {/* Business Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Type <span className="text-red-500">*</span>
          </label>
          <select
            {...register('businessType')}
            className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
              errors.businessType ? 'border-red-500' : 'border-gray-200'
            }`}
          >
            <option value="nail_salon">Nail Salon (Walk-in)</option>
            <option value="home_service">Home Service (Mobile Nail Tech)</option>
            <option value="nail_salon_and_home">Both Salon & Home Service</option>
            <option value="spa">Spa & Wellness</option>
            <option value="other">Other</option>
          </select>
          {errors.businessType && (
            <p className="mt-1 text-sm text-red-600">{errors.businessType.message}</p>
          )}
        </div>

        {/* State & Area */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                {...register('state')}
                className={`w-full pl-12 pr-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  errors.state ? 'border-red-500' : 'border-gray-200'
                }`}
              >
                <option value="">Select state</option>
                {NIGERIAN_STATES.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
            {errors.state && (
              <p className="mt-1 text-sm text-red-600">{errors.state.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Area / LGA <span className="text-red-500">*</span>
            </label>
            <input
              {...register('area')}
              type="text"
              placeholder="e.g. Lekki, Wuse, GRA"
              className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.area ? 'border-red-500' : 'border-gray-200'
              }`}
            />
            {errors.area && (
              <p className="mt-1 text-sm text-red-600">{errors.area.message}</p>
            )}
          </div>
        </div>

        {/* Description (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Description <span className="text-gray-400">(Optional)</span>
          </label>
          <textarea
            {...register('description')}
            rows={3}
            placeholder="Tell us a bit about your business..."
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
          />
        </div>

        {/* Submit Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg text-lg font-semibold shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center gap-2"
        >
          Continue to Branding
          <ArrowRight className="h-5 w-5" />
        </motion.button>
      </form>
    </div>
  )
}
