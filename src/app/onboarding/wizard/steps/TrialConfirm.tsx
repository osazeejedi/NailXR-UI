'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Rocket, Edit, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useOnboarding } from '@/components/onboarding/OnboardingContext'
import { SubdomainManager } from '@/lib/subdomain'
import { PaymentService } from '@/lib/payment'

export default function TrialConfirm() {
  const router = useRouter()
  const { formData, applicationId, setIsSubmitting, goToStep } = useOnboarding()
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [provisioningError, setProvisioningError] = useState('')

  const handleSubmit = async () => {
    if (!agreedToTerms) {
      alert('Please agree to the terms and conditions to continue')
      return
    }

    if (!applicationId) {
      alert('Application ID not found. Please start over.')
      return
    }

    try {
      setIsSubmitting(true)
      setProvisioningError('')

      // Provision the tenant
      const response = await fetch('/api/onboarding/provision-tenant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId })
      })

      const result = await response.json()

      if (result.success) {
        // Clear saved progress
        localStorage.removeItem('nailxr_onboarding_progress')
        
        // Redirect to success page
        router.push('/onboarding/success')
      } else {
        setProvisioningError(result.error || 'Failed to create your platform. Please try again.')
      }
    } catch (error) {
      console.error('Error provisioning tenant:', error)
      setProvisioningError('An unexpected error occurred. Please contact support.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const plan = formData.selectedTier ? PaymentService.getPlan(formData.selectedTier) : null
  const fullUrl = formData.subdomain ? SubdomainManager.getFullUrl(formData.subdomain) : ''

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Confirm & Launch</h2>
        <p className="text-gray-600">Review your selections and start your 14-day free trial</p>
      </div>

      <div className="space-y-6">
        {/* Business Info Summary */}
        <SummaryCard
          title="Business Information"
          onEdit={() => goToStep(1)}
          items={[
            { label: 'Business Name', value: formData.businessName },
            { label: 'Contact', value: formData.contactName },
            { label: 'Email', value: formData.email },
            { label: 'Type', value: formData.businessType }
          ]}
        />

        {/* Branding Summary */}
        <SummaryCard
          title="Branding"
          onEdit={() => goToStep(2)}
          items={[
            { label: 'Tagline', value: formData.tagline },
            { label: 'Hero Title', value: formData.heroTitle }
          ]}
        >
          <div className="mt-3">
            <p className="text-sm text-gray-600 mb-2">Colors:</p>
            <div className="flex gap-2">
              {[formData.primaryColor, formData.secondaryColor, formData.accentColor].map((color, idx) => (
                color && (
                  <div key={idx} className="flex items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded border-2 border-gray-300"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs font-mono text-gray-600">{color}</span>
                  </div>
                )
              ))}
            </div>
          </div>
        </SummaryCard>

        {/* Subdomain Summary */}
        <SummaryCard
          title="Platform URL"
          onEdit={() => goToStep(3)}
          items={[
            { label: 'Subdomain', value: formData.subdomain }
          ]}
        >
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Your platform will be accessible at:</p>
            <a 
              href={fullUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 font-semibold hover:underline break-all"
            >
              {fullUrl}
            </a>
          </div>
        </SummaryCard>

        {/* Pricing Summary */}
        {plan && (
          <SummaryCard
            title="Pricing Plan"
            onEdit={() => goToStep(4)}
            items={[
              { label: 'Plan', value: plan.name },
              { label: 'Billing', value: formData.billingCycle }
            ]}
          >
            <div className="mt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Free Trial:</span>
                <span className="font-semibold text-green-600">14 days</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">After Trial:</span>
                <span className="font-semibold text-gray-900">
                  {PaymentService.formatPrice(
                    formData.billingCycle === 'annual' ? plan.annualFee : plan.monthlyFee
                  )}
                  /{formData.billingCycle === 'annual' ? 'year' : 'month'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Setup Fee (after trial):</span>
                <span className="font-semibold text-gray-900">
                  {PaymentService.formatPrice(plan.setupFee)}
                </span>
              </div>
            </div>
          </SummaryCard>
        )}

        {/* Trial Info Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-xl"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">14-Day Free Trial</h3>
              <p className="text-sm text-gray-600">No credit card required</p>
            </div>
          </div>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              Platform goes live immediately
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              Full access to all features
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              Cancel anytime during trial - no charges
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              Email reminder 3 days before trial ends
            </li>
          </ul>
        </motion.div>

        {/* Error Message */}
        {provisioningError && (
          <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
            <p className="text-red-700">{provisioningError}</p>
          </div>
        )}

        {/* Terms Agreement */}
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="terms"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
          />
          <label htmlFor="terms" className="text-sm text-gray-700">
            I agree to the{' '}
            <a href="/terms" target="_blank" className="text-blue-600 hover:underline">
              Terms of Service
            </a>
            {' '}and{' '}
            <a href="/privacy" target="_blank" className="text-blue-600 hover:underline">
              Privacy Policy
            </a>
          </label>
        </div>

        {/* Launch Button */}
        <motion.button
          whileHover={{ scale: agreedToTerms ? 1.02 : 1 }}
          whileTap={{ scale: agreedToTerms ? 0.98 : 1 }}
          onClick={handleSubmit}
          disabled={!agreedToTerms}
          className={`w-full py-5 rounded-lg text-xl font-bold shadow-xl transition-all flex items-center justify-center gap-3 ${
            agreedToTerms
              ? 'bg-gradient-to-r from-green-500 to-blue-600 text-white hover:shadow-2xl'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Rocket className="h-6 w-6" />
          Start My Free Trial
        </motion.button>

        <p className="text-center text-sm text-gray-500">
          Your platform will be ready in seconds. You&apos;ll receive login credentials via email.
        </p>
      </div>
    </div>
  )
}

function SummaryCard({
  title,
  items,
  onEdit,
  children
}: {
  title: string
  items: { label: string; value: string | undefined }[]
  onEdit: () => void
  children?: React.ReactNode
}) {
  return (
    <div className="p-6 bg-white border-2 border-gray-200 rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Check className="h-5 w-5 text-green-500" />
          {title}
        </h3>
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          <Edit className="h-4 w-4" />
          Edit
        </button>
      </div>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex justify-between text-sm">
            <span className="text-gray-600">{item.label}:</span>
            <span className="font-medium text-gray-900 capitalize">{item.value || 'N/A'}</span>
          </div>
        ))}
      </div>
      {children}
    </div>
  )
}
