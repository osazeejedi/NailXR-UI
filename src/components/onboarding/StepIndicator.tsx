'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

interface StepIndicatorProps {
  currentStep: number
  totalSteps: number
  stepLabels: string[]
  onStepClick?: (step: number) => void
}

export default function StepIndicator({
  currentStep,
  totalSteps,
  stepLabels,
  onStepClick
}: StepIndicatorProps) {
  return (
    <div className="w-full max-w-4xl mx-auto mb-12">
      {/* Desktop: Horizontal */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step, index) => (
            <React.Fragment key={step}>
              <StepCircle
                step={step}
                label={stepLabels[index]}
                isActive={step === currentStep}
                isCompleted={step < currentStep}
                onClick={() => onStepClick && step <= currentStep && onStepClick(step)}
                clickable={!!(onStepClick && step <= currentStep)}
              />
              {step < totalSteps && (
                <StepConnector isCompleted={step < currentStep} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Mobile: Vertical */}
      <div className="md:hidden">
        <div className="flex flex-col space-y-4">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step, index) => (
            <div key={step} className="flex items-start space-x-3">
              <StepCircleMobile
                step={step}
                isActive={step === currentStep}
                isCompleted={step < currentStep}
              />
              <div className="flex-1">
                <p className={`font-medium ${
                  step === currentStep ? 'text-blue-600' : 
                  step < currentStep ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  {stepLabels[index]}
                </p>
                {step === currentStep && (
                  <p className="text-sm text-gray-600 mt-1">Current step</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StepCircle({
  step,
  label,
  isActive,
  isCompleted,
  onClick,
  clickable
}: {
  step: number
  label: string
  isActive: boolean
  isCompleted: boolean
  onClick: () => void
  clickable: boolean
}) {
  return (
    <div className="flex flex-col items-center">
      <motion.button
        whileHover={clickable ? { scale: 1.1 } : {}}
        whileTap={clickable ? { scale: 0.95 } : {}}
        onClick={onClick}
        disabled={!clickable}
        className={`relative w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all ${
          isActive
            ? 'bg-blue-600 text-white ring-4 ring-blue-100'
            : isCompleted
            ? 'bg-green-500 text-white'
            : 'bg-gray-200 text-gray-400'
        } ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
      >
        {isCompleted ? (
          <Check className="h-6 w-6" />
        ) : (
          <span>{step}</span>
        )}
      </motion.button>
      <p className={`mt-2 text-sm font-medium text-center ${
        isActive ? 'text-blue-600' : 
        isCompleted ? 'text-gray-900' : 'text-gray-400'
      }`}>
        {label}
      </p>
    </div>
  )
}

function StepCircleMobile({
  step,
  isActive,
  isCompleted
}: {
  step: number
  isActive: boolean
  isCompleted: boolean
}) {
  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold flex-shrink-0 ${
      isActive
        ? 'bg-blue-600 text-white ring-4 ring-blue-100'
        : isCompleted
        ? 'bg-green-500 text-white'
        : 'bg-gray-200 text-gray-400'
    }`}>
      {isCompleted ? (
        <Check className="h-5 w-5" />
      ) : (
        <span>{step}</span>
      )}
    </div>
  )
}

function StepConnector({ isCompleted }: { isCompleted: boolean }) {
  return (
    <div className="flex-1 h-1 mx-4">
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: isCompleted ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className={`h-full rounded-full origin-left ${
          isCompleted ? 'bg-green-500' : 'bg-gray-200'
        }`}
      />
    </div>
  )
}
