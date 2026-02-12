'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { OnboardingProvider, useOnboarding } from '@/components/onboarding/OnboardingContext'
import StepIndicator from '@/components/onboarding/StepIndicator'

// Step components (we'll create these next)
import BusinessInfo from './steps/BusinessInfo'
import BrandingSetup from './steps/BrandingSetup'
import SubdomainSelect from './steps/SubdomainSelect'
import PricingPlan from './steps/PricingPlan'
import TrialConfirm from './steps/TrialConfirm'

const STEP_LABELS = [
  'Business Info',
  'Branding',
  'Subdomain',
  'Pricing',
  'Confirm'
]

function WizardContent() {
  const {
    currentStep,
    previousStep,
    isSubmitting,
    goToStep
  } = useOnboarding()

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <BusinessInfo />
      case 2:
        return <BrandingSetup />
      case 3:
        return <SubdomainSelect />
      case 4:
        return <PricingPlan />
      case 5:
        return <TrialConfirm />
      default:
        return <BusinessInfo />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Set Up Your White-Label Platform
          </h1>
          <p className="text-gray-600">
            Complete these steps to launch your branded nail AR platform
          </p>
        </motion.div>

        {/* Progress Indicator */}
        <StepIndicator
          currentStep={currentStep}
          totalSteps={5}
          stepLabels={STEP_LABELS}
          onStepClick={goToStep}
        />

        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Buttons */}
        {currentStep > 1 && currentStep < 5 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 flex justify-start"
          >
            <button
              onClick={previousStep}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-3 text-gray-700 hover:text-gray-900 disabled:opacity-50"
            >
              <ArrowLeft className="h-5 w-5" />
              Previous Step
            </button>
          </motion.div>
        )}

        {/* Loading Overlay */}
        {isSubmitting && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
              <p className="text-lg font-medium text-gray-900">Setting up your platform...</p>
              <p className="text-sm text-gray-600">This will only take a moment</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function OnboardingWizard() {
  return (
    <OnboardingProvider>
      <WizardContent />
    </OnboardingProvider>
  )
}
