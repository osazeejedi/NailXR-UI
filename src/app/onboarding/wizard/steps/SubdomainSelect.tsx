'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Globe, ArrowRight, Check, X, Loader2, Lightbulb } from 'lucide-react'
import { useOnboarding } from '@/components/onboarding/OnboardingContext'
import { SubdomainManager } from '@/lib/subdomain'

const subdomainSchema = z.object({
  subdomain: z.string()
    .min(3, 'Subdomain must be at least 3 characters')
    .max(30, 'Subdomain must be 30 characters or less')
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens allowed')
})

type SubdomainForm = z.infer<typeof subdomainSchema>

export default function SubdomainSelect() {
  const { formData, updateFormData, nextStep, applicationId, setIsSubmitting } = useOnboarding()
  const [isChecking, setIsChecking] = useState(false)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [availabilityMessage, setAvailabilityMessage] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<SubdomainForm>({
    resolver: zodResolver(subdomainSchema),
    defaultValues: {
      subdomain: formData.subdomain || SubdomainManager.fromBusinessName(formData.businessName || '')
    }
  })

  const watchedSubdomain = watch('subdomain')

  // Debounced availability check
  useEffect(() => {
    if (!watchedSubdomain || watchedSubdomain.length < 3) {
      setIsAvailable(null)
      return
    }

    const timer = setTimeout(async () => {
      await checkAvailability(watchedSubdomain)
    }, 500)

    return () => clearTimeout(timer)
  }, [watchedSubdomain])

  const checkAvailability = async (subdomain: string) => {
    setIsChecking(true)
    setSuggestions([])

    try {
      const response = await fetch('/api/onboarding/check-subdomain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subdomain })
      })

      const result = await response.json()

      if (result.success && result.data.available) {
        setIsAvailable(true)
        setAvailabilityMessage('This subdomain is available!')
      } else {
        setIsAvailable(false)
        setAvailabilityMessage(result.data.error || 'This subdomain is not available')
        setSuggestions(result.data.suggestions || [])
      }
    } catch (error) {
      console.error('Error checking subdomain:', error)
      setIsAvailable(null)
      setAvailabilityMessage('Unable to check availability')
    } finally {
      setIsChecking(false)
    }
  }

  const applySuggestion = (suggestion: string) => {
    setValue('subdomain', suggestion)
  }

  const onSubmit = async (data: SubdomainForm) => {
    if (!isAvailable) {
      return
    }

    try {
      setIsSubmitting(true)

      // Update application in database
      if (applicationId) {
        await fetch('/api/onboarding/update-application', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            applicationId,
            step: 3,
            data
          })
        })
      }

      // Update context
      updateFormData(data)

      // Move to next step
      nextStep()
    } catch (error) {
      console.error('Error saving subdomain:', error)
      alert('Failed to save subdomain. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const fullUrl = watchedSubdomain 
    ? SubdomainManager.getFullUrl(watchedSubdomain)
    : 'https://yoursubdomain.nailxr.com'

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Subdomain</h2>
        <p className="text-gray-600">This will be your platform&apos;s web address</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Subdomain Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Subdomain <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
            <input
              {...register('subdomain')}
              type="text"
              placeholder="my-salon"
              className={`w-full pl-12 pr-12 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono lowercase ${
                errors.subdomain ? 'border-red-500' : 
                isAvailable === true ? 'border-green-500' :
                isAvailable === false ? 'border-red-500' :
                'border-gray-200'
              }`}
              onChange={(e) => {
                e.target.value = e.target.value.toLowerCase()
              }}
            />
            {/* Status Indicator */}
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {isChecking ? (
                <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
              ) : isAvailable === true ? (
                <Check className="h-5 w-5 text-green-500" />
              ) : isAvailable === false ? (
                <X className="h-5 w-5 text-red-500" />
              ) : null}
            </div>
          </div>
          
          {/* Validation Error */}
          {errors.subdomain && (
            <p className="mt-1 text-sm text-red-600">{errors.subdomain.message}</p>
          )}

          {/* Availability Message */}
          {!errors.subdomain && availabilityMessage && (
            <p className={`mt-1 text-sm ${
              isAvailable === true ? 'text-green-600' : 'text-red-600'
            }`}>
              {availabilityMessage}
            </p>
          )}

          {/* Full URL Preview */}
          <div className="mt-3 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Your platform URL will be:</p>
            <p className="text-lg font-semibold text-blue-600 break-all">{fullUrl}</p>
          </div>
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg"
          >
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
              <p className="font-medium text-gray-900">Suggested Alternatives:</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => applySuggestion(suggestion)}
                  className="px-4 py-2 bg-white border-2 border-yellow-300 rounded-lg text-sm font-medium text-gray-900 hover:border-yellow-400 hover:bg-yellow-50 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Help Text */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700 mb-2">
            <strong>Subdomain rules:</strong>
          </p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• 3-30 characters</li>
            <li>• Lowercase letters, numbers, and hyphens only</li>
            <li>• Must start and end with a letter or number</li>
            <li>• No consecutive hyphens</li>
          </ul>
        </div>

        {/* Submit Button */}
        <motion.button
          whileHover={{ scale: isAvailable ? 1.02 : 1 }}
          whileTap={{ scale: isAvailable ? 0.98 : 1 }}
          type="submit"
          disabled={!isAvailable || isChecking}
          className={`w-full py-4 rounded-lg text-lg font-semibold shadow-lg transition-all flex items-center justify-center gap-2 ${
            isAvailable
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-xl'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isAvailable ? (
            <>
              Continue to Pricing
              <ArrowRight className="h-5 w-5" />
            </>
          ) : (
            'Choose an available subdomain to continue'
          )}
        </motion.button>
      </form>
    </div>
  )
}
