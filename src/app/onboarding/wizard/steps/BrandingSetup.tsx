'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Palette, ArrowRight, Sparkles } from 'lucide-react'
import { useOnboarding } from '@/components/onboarding/OnboardingContext'

const brandingSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
  tagline: z.string().min(5, 'Tagline must be at least 5 characters').max(50, 'Tagline must be 50 characters or less'),
  heroTitle: z.string().min(5, 'Hero title must be at least 5 characters'),
  heroSubtitle: z.string().min(10, 'Hero subtitle must be at least 10 characters').max(200, 'Subtitle must be 200 characters or less')
})

type BrandingForm = z.infer<typeof brandingSchema>

const COLOR_PRESETS = [
  { name: 'Royal Purple', primary: '#8b5cf6', secondary: '#ec4899', accent: '#f472b6' },
  { name: 'Ocean Blue', primary: '#0ea5e9', secondary: '#06b6d4', accent: '#67e8f9' },
  { name: 'Forest Green', primary: '#10b981', secondary: '#059669', accent: '#34d399' },
  { name: 'Sunset Orange', primary: '#f97316', secondary: '#fb923c', accent: '#fdba74' },
  { name: 'Royal Gold', primary: '#d4af37', secondary: '#1a1a1a', accent: '#f5e6d3' },
  { name: 'Rose Pink', primary: '#ff6b9d', secondary: '#45b7d1', accent: '#96ceb4' }
]

export default function BrandingSetup() {
  const { formData, updateFormData, nextStep, applicationId, setIsSubmitting } = useOnboarding()
  const [previewColors, setPreviewColors] = useState({
    primary: formData.primaryColor || '#ec4899',
    secondary: formData.secondaryColor || '#8b5cf6',
    accent: formData.accentColor || '#f472b6'
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<BrandingForm>({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      primaryColor: formData.primaryColor || '#ec4899',
      secondaryColor: formData.secondaryColor || '#8b5cf6',
      accentColor: formData.accentColor || '#f472b6',
      tagline: formData.tagline || 'AI-Powered Nail Visualization',
      heroTitle: formData.heroTitle || 'Try Before You Apply',
      heroSubtitle: formData.heroSubtitle || 'Experience the future of nail art with virtual try-on technology'
    }
  })

  // Watch color changes for live preview
  const watchedColors = watch(['primaryColor', 'secondaryColor', 'accentColor'])
  React.useEffect(() => {
    setPreviewColors({
      primary: watchedColors[0],
      secondary: watchedColors[1],
      accent: watchedColors[2]
    })
  }, [watchedColors])

  const applyColorPreset = (preset: typeof COLOR_PRESETS[0]) => {
    setValue('primaryColor', preset.primary)
    setValue('secondaryColor', preset.secondary)
    setValue('accentColor', preset.accent)
  }

  const onSubmit = async (data: BrandingForm) => {
    try {
      setIsSubmitting(true)

      // Update application in database
      if (applicationId) {
        await fetch('/api/onboarding/update-application', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            applicationId,
            step: 2,
            data
          })
        })
      }

      // Update context
      updateFormData(data)

      // Move to next step
      nextStep()
    } catch (error) {
      console.error('Error saving branding:', error)
      alert('Failed to save branding. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Customize Your Branding</h2>
        <p className="text-gray-600">Choose colors and messaging that represent your brand</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Color Presets */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Quick Color Presets
            </label>
            <div className="grid grid-cols-3 gap-2">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => applyColorPreset(preset)}
                  className="p-3 border-2 border-gray-200 rounded-lg hover:border-blue-400 transition-colors"
                >
                  <div className="flex gap-1 mb-2">
                    <div className="w-6 h-6 rounded" style={{ backgroundColor: preset.primary }} />
                    <div className="w-6 h-6 rounded" style={{ backgroundColor: preset.secondary }} />
                    <div className="w-6 h-6 rounded" style={{ backgroundColor: preset.accent }} />
                  </div>
                  <p className="text-xs text-gray-600">{preset.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Primary Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Primary Color <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-3">
              <input
                {...register('primaryColor')}
                type="color"
                className="h-12 w-20 rounded-lg cursor-pointer border-2 border-gray-200"
              />
              <input
                {...register('primaryColor')}
                type="text"
                placeholder="#ec4899"
                className={`flex-1 px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono ${
                  errors.primaryColor ? 'border-red-500' : 'border-gray-200'
                }`}
              />
            </div>
            {errors.primaryColor && (
              <p className="mt-1 text-sm text-red-600">{errors.primaryColor.message}</p>
            )}
          </div>

          {/* Secondary Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Secondary Color <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-3">
              <input
                {...register('secondaryColor')}
                type="color"
                className="h-12 w-20 rounded-lg cursor-pointer border-2 border-gray-200"
              />
              <input
                {...register('secondaryColor')}
                type="text"
                placeholder="#8b5cf6"
                className={`flex-1 px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono ${
                  errors.secondaryColor ? 'border-red-500' : 'border-gray-200'
                }`}
              />
            </div>
            {errors.secondaryColor && (
              <p className="mt-1 text-sm text-red-600">{errors.secondaryColor.message}</p>
            )}
          </div>

          {/* Accent Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Accent Color <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-3">
              <input
                {...register('accentColor')}
                type="color"
                className="h-12 w-20 rounded-lg cursor-pointer border-2 border-gray-200"
              />
              <input
                {...register('accentColor')}
                type="text"
                placeholder="#f472b6"
                className={`flex-1 px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono ${
                  errors.accentColor ? 'border-red-500' : 'border-gray-200'
                }`}
              />
            </div>
            {errors.accentColor && (
              <p className="mt-1 text-sm text-red-600">{errors.accentColor.message}</p>
            )}
          </div>

          {/* Tagline */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tagline <span className="text-red-500">*</span>
            </label>
            <input
              {...register('tagline')}
              type="text"
              placeholder="AI-Powered Nail Visualization"
              maxLength={50}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.tagline ? 'border-red-500' : 'border-gray-200'
              }`}
            />
            {errors.tagline && (
              <p className="mt-1 text-sm text-red-600">{errors.tagline.message}</p>
            )}
          </div>

          {/* Hero Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hero Title <span className="text-red-500">*</span>
            </label>
            <input
              {...register('heroTitle')}
              type="text"
              placeholder="Try Before You Apply"
              className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.heroTitle ? 'border-red-500' : 'border-gray-200'
              }`}
            />
            {errors.heroTitle && (
              <p className="mt-1 text-sm text-red-600">{errors.heroTitle.message}</p>
            )}
          </div>

          {/* Hero Subtitle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hero Subtitle <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register('heroSubtitle')}
              rows={3}
              maxLength={200}
              placeholder="Experience the future of nail art with virtual try-on technology"
              className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                errors.heroSubtitle ? 'border-red-500' : 'border-gray-200'
              }`}
            />
            {errors.heroSubtitle && (
              <p className="mt-1 text-sm text-red-600">{errors.heroSubtitle.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg text-lg font-semibold shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center gap-2"
          >
            Continue to Subdomain
            <ArrowRight className="h-5 w-5" />
          </motion.button>
        </form>

        {/* Live Preview */}
        <div className="lg:sticky lg:top-8 h-fit">
          <div className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Live Preview</h3>
            </div>
            
            <div 
              className="rounded-xl p-8 shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${previewColors.primary}, ${previewColors.secondary})`
              }}
            >
              <p className="text-white text-sm font-medium mb-2 opacity-90">
                {watch('tagline') || 'Your Tagline Here'}
              </p>
              <h2 className="text-3xl font-bold text-white mb-3">
                {watch('heroTitle') || 'Your Hero Title'}
              </h2>
              <p className="text-white opacity-90 mb-6">
                {watch('heroSubtitle') || 'Your hero subtitle goes here...'}
              </p>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  className="px-6 py-3 rounded-lg font-semibold text-white transition-transform hover:scale-105"
                  style={{ backgroundColor: previewColors.accent }}
                >
                  Primary Button
                </button>
                <button
                  type="button"
                  className="px-6 py-3 bg-white rounded-lg font-semibold transition-transform hover:scale-105"
                  style={{ color: previewColors.primary }}
                >
                  Secondary
                </button>
              </div>
            </div>

            <div className="mt-4 p-4 bg-white rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Color Palette:</p>
              <div className="flex gap-2">
                <div className="flex-1 text-center">
                  <div 
                    className="h-16 rounded-lg mb-1"
                    style={{ backgroundColor: previewColors.primary }}
                  />
                  <p className="text-xs text-gray-600 font-mono">{previewColors.primary}</p>
                </div>
                <div className="flex-1 text-center">
                  <div 
                    className="h-16 rounded-lg mb-1"
                    style={{ backgroundColor: previewColors.secondary }}
                  />
                  <p className="text-xs text-gray-600 font-mono">{previewColors.secondary}</p>
                </div>
                <div className="flex-1 text-center">
                  <div 
                    className="h-16 rounded-lg mb-1"
                    style={{ backgroundColor: previewColors.accent }}
                  />
                  <p className="text-xs text-gray-600 font-mono">{previewColors.accent}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
