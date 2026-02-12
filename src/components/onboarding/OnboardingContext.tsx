'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { OnboardingApplicationData } from '@/lib/onboarding'

interface OnboardingContextType {
  currentStep: number
  applicationId: string | null
  formData: Partial<OnboardingApplicationData>
  isSubmitting: boolean
  errors: Record<string, string>
  
  setCurrentStep: (step: number) => void
  setApplicationId: (id: string) => void
  updateFormData: (data: Partial<OnboardingApplicationData>) => void
  setIsSubmitting: (submitting: boolean) => void
  setError: (field: string, error: string) => void
  clearError: (field: string) => void
  clearAllErrors: () => void
  nextStep: () => void
  previousStep: () => void
  goToStep: (step: number) => void
  saveProgress: () => void
  loadProgress: () => void
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider')
  }
  return context
}

const STORAGE_KEY = 'nailxr_onboarding_progress'
const MAX_STEPS = 5

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [currentStep, setCurrentStep] = useState(1)
  const [applicationId, setApplicationId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<OnboardingApplicationData>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Define functions first
  const saveProgress = useCallback(() => {
    const progress = {
      currentStep,
      applicationId,
      formData,
      savedAt: new Date().toISOString()
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  }, [currentStep, applicationId, formData])

  const loadProgress = useCallback(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const progress = JSON.parse(saved)
        
        // Only load if saved within last 24 hours
        const savedAt = new Date(progress.savedAt)
        const now = new Date()
        const hoursSinceSave = (now.getTime() - savedAt.getTime()) / (1000 * 60 * 60)
        
        if (hoursSinceSave < 24) {
          setCurrentStep(progress.currentStep || 1)
          setApplicationId(progress.applicationId || null)
          setFormData(progress.formData || {})
        } else {
          // Clear old progress
          localStorage.removeItem(STORAGE_KEY)
        }
      }
    } catch (error) {
      console.error('Error loading progress:', error)
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  // Load progress from localStorage on mount (no dependencies to avoid loops)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const progress = JSON.parse(saved)
        
        // Only load if saved within last 24 hours
        const savedAt = new Date(progress.savedAt)
        const now = new Date()
        const hoursSinceSave = (now.getTime() - savedAt.getTime()) / (1000 * 60 * 60)
        
        if (hoursSinceSave < 24) {
          setCurrentStep(progress.currentStep || 1)
          setApplicationId(progress.applicationId || null)
          setFormData(progress.formData || {})
        } else {
          // Clear old progress
          localStorage.removeItem(STORAGE_KEY)
        }
      }
    } catch (error) {
      console.error('Error loading progress:', error)
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  const updateFormData = useCallback((data: Partial<OnboardingApplicationData>) => {
    setFormData(prev => ({ ...prev, ...data }))
  }, [])

  const setError = useCallback((field: string, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }))
  }, [])

  const clearError = useCallback((field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
  }, [])

  const clearAllErrors = useCallback(() => {
    setErrors({})
  }, [])

  const nextStep = useCallback(() => {
    if (currentStep < MAX_STEPS) {
      setCurrentStep(prev => prev + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [currentStep])

  const previousStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [currentStep])

  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= MAX_STEPS) {
      setCurrentStep(step)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [])


  const value: OnboardingContextType = {
    currentStep,
    applicationId,
    formData,
    isSubmitting,
    errors,
    setCurrentStep,
    setApplicationId,
    updateFormData,
    setIsSubmitting,
    setError,
    clearError,
    clearAllErrors,
    nextStep,
    previousStep,
    goToStep,
    saveProgress,
    loadProgress
  }

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  )
}
