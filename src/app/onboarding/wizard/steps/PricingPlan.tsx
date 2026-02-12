'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Check, ArrowRight, Zap } from 'lucide-react'
import { useOnboarding } from '@/components/onboarding/OnboardingContext'
import { SUBSCRIPTION_PLANS, PaymentService } from '@/lib/payment'

const pricingSchema = z.object({
  selectedTier: z.enum(['starter', 'professional', 'enterprise']),
  billingCycle: z.enum(['monthly', 'annual'])
})

type PricingForm = z.infer<typeof pricingSchema>

export default function PricingPlan() {
  const { formData, updateFormData, nextStep, applicationId, setIsSubmitting } = useOnboarding()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>(
    formData.billingCycle || 'monthly'
  )

  const {
    register,
    handleSubmit,
    setValue,
    watch
  } = useForm<PricingForm>({
    resolver: zodResolver(pricingSchema),
    defaultValues: {
      selectedTier: formData.selectedTier || 'professional',
      billingCycle: formData.billingCycle || 'monthly'
    }
  })

  const selectedTier = watch('selectedTier')

  const handleBillingCycleChange = (cycle: 'monthly' | 'annual') => {
    setBillingCycle(cycle)
    setValue('billingCycle', cycle)
  }

  const onSubmit = async (data: PricingForm) => {
    try {
      setIsSubmitting(true)

      // Update application in database
      if (applicationId) {
        await fetch('/api/onboarding/update-application', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            applicationId,
            step: 4,
            data
          })
        })
      }

      // Update context
      updateFormData(data)

      // Move to next step
      nextStep()
    } catch (error) {
      console.error('Error saving pricing plan:', error)
      alert('Failed to save pricing plan. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const plans = [
    SUBSCRIPTION_PLANS.starter,
    SUBSCRIPTION_PLANS.professional,
    SUBSCRIPTION_PLANS.enterprise
  ]

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Select Your Plan</h2>
        <p className="text-gray-600">Choose the plan that best fits your business needs</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Billing Cycle Toggle */}
        <div className="flex justify-center">
          <div className="inline-flex bg-gray-100 rounded-full p-1">
            <button
              type="button"
              onClick={() => handleBillingCycleChange('monthly')}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => handleBillingCycleChange('annual')}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                billingCycle === 'annual'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Annual
              <span className="ml-2 text-xs text-green-600 font-semibold">Save 16%</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isSelected = selectedTier === plan.tier
            const price = billingCycle === 'annual' 
              ? plan.annualFee 
              : plan.monthlyFee
            const savings = billingCycle === 'annual'
              ? PaymentService.formatPrice((plan.monthlyFee * 12) - plan.annualFee)
              : null

            return (
              <motion.div
                key={plan.tier}
                whileHover={{ y: -4 }}
                className={`relative bg-white rounded-2xl p-6 cursor-pointer transition-all ${
                  isSelected
                    ? 'ring-2 ring-blue-600 shadow-2xl'
                    : 'border-2 border-gray-200 shadow-lg hover:border-blue-300'
                } ${plan.tier === 'professional' ? 'md:scale-105' : ''}`}
                onClick={() => setValue('selectedTier', plan.tier)}
              >
                {/* Popular Badge */}
                {plan.tier === 'professional' && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Radio Button */}
                <div className="absolute top-4 right-4">
                  <input
                    {...register('selectedTier')}
                    type="radio"
                    value={plan.tier}
                    className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                  />
                </div>

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{plan.name}</h3>
                  
                  {/* Price */}
                  <div className="mb-2">
                    <span className="text-4xl font-bold text-gray-900">
                      {PaymentService.formatPrice(price)}
                    </span>
                    <span className="text-gray-600">
                      /{billingCycle === 'annual' ? 'year' : 'month'}
                    </span>
                  </div>

                  {savings && (
                    <p className="text-sm text-green-600 font-medium">
                      Save {savings} per year
                    </p>
                  )}

                  <p className="text-sm text-gray-600 mt-2">
                    + {PaymentService.formatPrice(plan.setupFee)} one-time setup
                  </p>

                  <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-700">
                      ✓ {plan.trialDays} days free trial
                    </p>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )
          })}
        </div>

        {/* Selected Plan Summary */}
        <div className="p-6 bg-blue-50 border-2 border-blue-200 rounded-xl">
          <h3 className="font-semibold text-gray-900 mb-3">Your Selection:</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Plan:</p>
              <p className="font-semibold text-gray-900 capitalize">{selectedTier}</p>
            </div>
            <div>
              <p className="text-gray-600">Billing:</p>
              <p className="font-semibold text-gray-900 capitalize">{billingCycle}</p>
            </div>
            <div>
              <p className="text-gray-600">Free Trial:</p>
              <p className="font-semibold text-green-600">14 days - No payment required</p>
            </div>
            <div>
              <p className="text-gray-600">After Trial:</p>
              <p className="font-semibold text-gray-900">
                {PaymentService.formatPrice(
                  billingCycle === 'annual'
                    ? SUBSCRIPTION_PLANS[selectedTier].annualFee
                    : SUBSCRIPTION_PLANS[selectedTier].monthlyFee
                )}
                /{billingCycle === 'annual' ? 'year' : 'month'}
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg text-lg font-semibold shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center gap-2"
        >
          Continue to Confirmation
          <ArrowRight className="h-5 w-5" />
        </motion.button>
      </form>
    </div>
  )
}
