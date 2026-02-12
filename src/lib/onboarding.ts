/**
 * Onboarding Service
 * Handles automated tenant provisioning and trial management
 */

import supabase from '@/lib/supabase-client'
import { TenantManager, TenantConfig } from '@/lib/tenant'
import { SubdomainManager } from '@/lib/subdomain'

export interface OnboardingApplicationData {
  // Step 1: Business Info
  businessName: string
  contactName: string
  email: string
  phone?: string
  whatsappPhone?: string
  businessType: 'nail_salon' | 'home_service' | 'nail_salon_and_home' | 'spa' | 'other'
  state?: string
  area?: string
  description?: string
  
  // Step 2: Branding
  primaryColor: string
  secondaryColor: string
  accentColor: string
  logoUrl?: string
  tagline: string
  heroTitle: string
  heroSubtitle: string
  
  // Step 3: Subdomain
  subdomain: string
  
  // Step 4: Pricing
  selectedTier: 'starter' | 'professional' | 'enterprise'
  billingCycle: 'monthly' | 'annual'
  
  // Step 5: Payment (optional during trial)
  paystackCustomerCode?: string
  paystackSubscriptionCode?: string
}

export interface OnboardingApplication {
  id: string
  email: string
  businessName: string
  subdomain: string
  status: 'pending' | 'processing' | 'approved' | 'rejected' | 'completed'
  currentStep: number
  formData: OnboardingApplicationData
  trialStartDate?: Date
  trialEndDate?: Date
  createdAt: Date
  updatedAt: Date
}

export interface TrialInfo {
  isActive: boolean
  startDate: Date
  endDate: Date
  daysRemaining: number
  status: 'active' | 'ending_soon' | 'expired' | 'converted'
}

export class OnboardingService {
  /**
   * Create a new onboarding application
   */
  static async createApplication(email: string, businessName: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('onboarding_applications')
        .insert({
          email,
          business_name: businessName,
          subdomain: '', // Will be set in step 3
          status: 'pending',
          step_completed: 0,
          form_data: {}
        })
        .select('id')
        .single()

      if (error) {
        console.error('Error creating application:', error)
        return null
      }

      return data.id
    } catch (error) {
      console.error('Error creating application:', error)
      return null
    }
  }

  /**
   * Update application progress
   */
  static async updateApplication(
    applicationId: string,
    step: number,
    data: Partial<OnboardingApplicationData>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('onboarding_applications')
        .update({
          step_completed: step,
          form_data: data,
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId)

      return !error
    } catch (error) {
      console.error('Error updating application:', error)
      return false
    }
  }

  /**
   * Get application by ID
   */
  static async getApplication(applicationId: string): Promise<OnboardingApplication | null> {
    try {
      const { data, error } = await supabase
        .from('onboarding_applications')
        .select('*')
        .eq('id', applicationId)
        .single()

      if (error || !data) {
        return null
      }

      return {
        id: data.id,
        email: data.email,
        businessName: data.business_name,
        subdomain: data.subdomain,
        status: (data.status || 'pending') as 'pending' | 'processing' | 'approved' | 'rejected' | 'completed',
        currentStep: data.step_completed || 0,
        formData: (data.form_data as unknown) as OnboardingApplicationData,
        createdAt: new Date(data.created_at || Date.now()),
        updatedAt: new Date(data.updated_at || Date.now())
      }
    } catch (error) {
      console.error('Error getting application:', error)
      return null
    }
  }

  /**
   * Create tenant from completed application
   */
  static async provisionTenant(applicationId: string): Promise<TenantConfig | null> {
    try {
      const application = await this.getApplication(applicationId)
      if (!application || application.status !== 'approved') {
        return null
      }

      const formData = application.formData

      // Generate tenant ID
      const tenantId = `tenant-${formData.subdomain}-${Date.now()}`

      // Create tenant configuration
      const tenantConfig: Omit<TenantConfig, 'createdAt' | 'updatedAt'> = {
        id: tenantId,
        name: formData.businessName,
        domain: `${formData.subdomain}.nailxr.com`,
        subdomain: formData.subdomain,
        branding: {
          logo: formData.logoUrl || '/NailXR-symbol.png',
          logoWhite: formData.logoUrl || '/NailXR-white.png',
          primaryColor: formData.primaryColor,
          secondaryColor: formData.secondaryColor,
          accentColor: formData.accentColor,
          fontFamily: 'system-ui'
        },
        content: {
          heroTitle: formData.heroTitle,
          heroSubtitle: formData.heroSubtitle,
          tagline: formData.tagline,
          companyName: formData.businessName,
          supportEmail: formData.email,
          supportPhone: formData.phone
        },
        features: {
          virtualTryOn: true,
          savedLooks: true,
          salonBooking: true,
          homeVisits: true,
          analytics: formData.selectedTier !== 'starter',
          customDomain: false
        },
        whatsapp: {
          enabled: !!formData.whatsappPhone,
          phoneNumber: formData.whatsappPhone || '',
          chatLinkMessage: `Hi! I found you on NailXR and I'd like to book an appointment.`,
          bookingConfirmations: true,
          appointmentReminders: true
        },
        serviceType: formData.businessType === 'home_service' ? 'home_only'
          : formData.businessType === 'nail_salon_and_home' ? 'both'
          : 'salon_only',
        location: {
          state: formData.state || 'Lagos',
          area: formData.area || '',
          address: '',
          homeVisitAreas: [],
          homeVisitFee: 0
        },
        pricing: this.getPricingForTier(formData.selectedTier),
        social: {},
        settings: {
          allowCustomColors: formData.selectedTier !== 'starter',
          maxSavedLooks: this.getMaxSavedLooks(formData.selectedTier),
          enableNotifications: true,
          timezone: 'Africa/Lagos',
          currency: 'NGN',
          locale: 'en-NG'
        },
        isActive: true
      }

      // Create tenant in database
      const tenant = TenantManager.createTenant(tenantConfig)

      // Store in Supabase
      await supabase
        .from('tenants')
        .insert({
          id: tenant.id,
          name: tenant.name,
          subdomain: tenant.subdomain,
          domain: tenant.domain,
          config: tenant as unknown as any,
          status: 'trial',
          is_active: true
        })

      // Update application status
      await supabase
        .from('onboarding_applications')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId)

      // Activate subdomain
      await SubdomainManager.releaseSubdomain(formData.subdomain)

      return tenant
    } catch (error) {
      console.error('Error provisioning tenant:', error)
      return null
    }
  }

  /**
   * Start free trial for a tenant
   */
  static async startTrial(tenantId: string, applicationId: string): Promise<boolean> {
    try {
      const trialDays = parseInt(process.env.TRIAL_DAYS || '14')
      const startDate = new Date()
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + trialDays)

      // Update application with trial dates
      const { error } = await supabase
        .from('onboarding_applications')
        .update({
          trial_start_date: startDate.toISOString(),
          trial_end_date: endDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId)

      if (error) {
        console.error('Error starting trial:', error)
        return false
      }

      // Update tenant status
      await supabase
        .from('tenants')
        .update({
          status: 'trial',
          trial_end_date: endDate.toISOString()
        })
        .eq('id', tenantId)

      return true
    } catch (error) {
      console.error('Error starting trial:', error)
      return false
    }
  }

  /**
   * Get trial information for a tenant
   */
  static async getTrialInfo(tenantId: string): Promise<TrialInfo | null> {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('trial_end_date, status')
        .eq('id', tenantId)
        .single()

      if (error || !data || !data.trial_end_date) {
        return null
      }

      const endDate = new Date(data.trial_end_date)
      const now = new Date()
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      let status: TrialInfo['status'] = 'active'
      if (daysRemaining <= 0) {
        status = 'expired'
      } else if (daysRemaining <= 3) {
        status = 'ending_soon'
      } else if (data.status === 'active') {
        status = 'converted'
      }

      return {
        isActive: daysRemaining > 0 && data.status === 'trial',
        startDate: new Date(endDate.getTime() - 14 * 24 * 60 * 60 * 1000),
        endDate,
        daysRemaining: Math.max(0, daysRemaining),
        status
      }
    } catch (error) {
      console.error('Error getting trial info:', error)
      return null
    }
  }

  /**
   * Convert trial to paid subscription
   */
  static async convertTrialToPaid(
    tenantId: string,
    stripeCustomerId: string,
    stripeSubscriptionId: string
  ): Promise<boolean> {
    try {
      // Update tenant status
      await supabase
        .from('tenants')
        .update({
          status: 'active'
        })
        .eq('id', tenantId)

      // Create payment record
      await supabase
        .from('tenant_payments')
        .insert({
          tenant_id: tenantId,
          stripe_customer_id: stripeCustomerId,
          stripe_subscription_id: stripeSubscriptionId,
          setup_fee_paid: true,
          monthly_fee_active: true
        })

      return true
    } catch (error) {
      console.error('Error converting trial to paid:', error)
      return false
    }
  }

  /**
   * Generate temporary password for new tenant
   */
  static generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  /**
   * Get pricing configuration for tier
   */
  private static getPricingForTier(tier: 'starter' | 'professional' | 'enterprise') {
    const pricing = {
      starter: {
        commissionRate: 12.0,
        setupFee: 25000, // ₦25,000
        monthlyFee: 15000, // ₦15,000
        tier: 'starter' as const
      },
      professional: {
        commissionRate: 8.5,
        setupFee: 50000, // ₦50,000
        monthlyFee: 35000, // ₦35,000
        tier: 'professional' as const
      },
      enterprise: {
        commissionRate: 5.0,
        setupFee: 100000, // ₦100,000
        monthlyFee: 75000, // ₦75,000
        tier: 'enterprise' as const
      }
    }
    return pricing[tier]
  }

  /**
   * Get max saved looks for tier
   */
  private static getMaxSavedLooks(tier: 'starter' | 'professional' | 'enterprise'): number {
    const limits = {
      starter: 20,
      professional: 50,
      enterprise: 100
    }
    return limits[tier]
  }
}
