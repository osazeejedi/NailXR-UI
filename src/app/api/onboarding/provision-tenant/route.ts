import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { SubdomainManager } from '@/lib/subdomain'
import { TenantManager, TenantConfig } from '@/lib/tenant'

/**
 * POST /api/onboarding/provision-tenant
 * Provisions a new tenant from a completed onboarding application
 * This endpoint:
 * 1. Validates the application is complete
 * 2. Creates the tenant configuration
 * 3. Starts the 14-day free trial
 * 4. Generates login credentials
 * 5. Activates the subdomain
 * 6. Sends welcome email (handled separately)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { applicationId } = body

    // Validate required field
    if (!applicationId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Application ID is required'
        },
        { status: 400 }
      )
    }

    // Get the application using admin client
    const { data: application, error: getError } = await supabaseAdmin
      .from('onboarding_applications')
      .select('*')
      .eq('id', applicationId)
      .single()

    if (getError || !application) {
      return NextResponse.json(
        {
          success: false,
          error: 'Application not found'
        },
        { status: 404 }
      )
    }

    // Check if application is already completed
    if (application.status === 'completed') {
      return NextResponse.json(
        {
          success: false,
          error: 'Application has already been provisioned'
        },
        { status: 409 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formData = application.form_data as any

    // Debug: Log what we actually have
    console.log('🔍 DEBUG - Application form data:')
    console.log('Full application object:', JSON.stringify(application, null, 2))
    console.log('Form data:', JSON.stringify(formData, null, 2))
    console.log('Form data keys:', Object.keys(formData || {}))

    // Validate application data is complete
    const validationError = validateApplicationData(formData)
    if (validationError) {
      console.log('❌ Validation failed:', validationError)
      console.log('Missing fields check:')
      console.log('- businessName:', formData?.businessName)
      console.log('- contactName:', formData?.contactName)
      console.log('- email:', formData?.email)
      console.log('- businessType:', formData?.businessType)
      
      return NextResponse.json(
        {
          success: false,
          error: `Incomplete application: ${validationError}`,
          debug: {
            formData,
            missingFields: {
              businessName: !formData?.businessName,
              contactName: !formData?.contactName,
              email: !formData?.email,
              businessType: !formData?.businessType
            }
          }
        },
        { status: 400 }
      )
    }

    // Double-check subdomain availability
    const subdomainCheck = await SubdomainManager.checkAvailability(formData.subdomain)
    if (!subdomainCheck.available) {
      return NextResponse.json(
        {
          success: false,
          error: 'Subdomain is no longer available',
          suggestions: subdomainCheck.suggestions
        },
        { status: 409 }
      )
    }

    // Generate tenant ID
    const tenantId = `tenant-${formData.subdomain}-${Date.now()}`

    // Create tenant configuration
    const tenantConfig: Omit<TenantConfig, 'createdAt' | 'updatedAt'> = {
      id: tenantId,
      name: formData.businessName,
      domain: `${formData.subdomain}.nailxr.com`,
      subdomain: formData.subdomain,
      branding: {
        logo: '/NailXR-symbol.png',
        logoWhite: '/NailXR-white.png',
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
        homeVisits: formData.selectedTier !== 'starter',
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
      serviceType: formData.serviceType || 'both',
      location: {
        state: formData.state || 'Lagos',
        area: formData.area || '',
        address: formData.address || '',
        landmark: formData.landmark || '',
        homeVisitAreas: formData.homeVisitAreas || [],
        homeVisitFee: formData.homeVisitFee || 0
      },
      pricing: getPricingForTier(formData.selectedTier),
      settings: {
        allowCustomColors: formData.selectedTier !== 'starter',
        maxSavedLooks: getMaxSavedLooks(formData.selectedTier),
        enableNotifications: true,
        timezone: 'Africa/Lagos',
        currency: 'NGN',
        locale: 'en-NG'
      },
      social: {
        instagram: formData.instagram || undefined,
        facebook: formData.facebook || undefined,
        tiktok: formData.tiktok || undefined,
        twitter: formData.twitter || undefined
      },
      isActive: true
    }

    // Create tenant in memory
    const tenant = TenantManager.createTenant(tenantConfig)

    // Store in Supabase
    await supabaseAdmin
      .from('tenants')
      .insert({
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        domain: tenant.domain,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        config: tenant as any,
        status: 'trial',
        is_active: true
      })

    // Start trial
    const trialDays = parseInt(process.env.TRIAL_DAYS || '14')
    const trialEndDate = new Date()
    trialEndDate.setDate(trialEndDate.getDate() + trialDays)

    await supabaseAdmin
      .from('tenants')
      .update({
        trial_end_date: trialEndDate.toISOString()
      })
      .eq('id', tenant.id)

    // Update application status
    await supabaseAdmin
      .from('onboarding_applications')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId)

    // Generate temporary password
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
    let tempPassword = ''
    for (let i = 0; i < 12; i++) {
      tempPassword += chars.charAt(Math.floor(Math.random() * chars.length))
    }


    // TODO: Send welcome email via SendGrid (will be implemented in Phase 4)
    // await sendWelcomeEmail({
    //   email: application.formData.email,
    //   businessName: application.formData.businessName,
    //   subdomain: application.formData.subdomain,
    //   tempPassword,
    //   trialEndDate
    // })

    return NextResponse.json({
      success: true,
      data: {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          subdomain: tenant.subdomain,
          url: SubdomainManager.getFullUrl(tenant.subdomain)
        },
        trial: {
          startDate: new Date().toISOString(),
          endDate: trialEndDate.toISOString(),
          daysRemaining: trialDays
        },
        credentials: {
          email: formData.email,
          tempPassword, // In production, send this via email only
          loginUrl: `${SubdomainManager.getFullUrl(tenant.subdomain)}/login`
        },
        message: 'Tenant provisioned successfully! Check your email for login details.'
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error provisioning tenant:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to provision tenant. Please contact support.'
      },
      { status: 500 }
    )
  }
}

/**
 * Validate that application has all required data
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function validateApplicationData(data: any): string | null {
  // Step 1: Business Info
  if (!data.businessName || !data.contactName || !data.email || !data.businessType) {
    return 'Missing business information'
  }

  // Step 2: Branding
  if (!data.primaryColor || !data.secondaryColor || !data.accentColor) {
    return 'Missing branding colors'
  }
  if (!data.tagline || !data.heroTitle || !data.heroSubtitle) {
    return 'Missing branding content'
  }

  // Step 3: Subdomain
  if (!data.subdomain) {
    return 'Missing subdomain'
  }

  // Step 4: Pricing
  if (!data.selectedTier || !['starter', 'professional', 'enterprise'].includes(data.selectedTier)) {
    return 'Invalid pricing tier'
  }
  if (!data.billingCycle || !['monthly', 'annual'].includes(data.billingCycle)) {
    return 'Invalid billing cycle'
  }

  return null
}

/**
 * Get pricing configuration for tier
 */
function getPricingForTier(tier: 'starter' | 'professional' | 'enterprise') {
  const pricing = {
    starter: {
      commissionRate: 12.0,
      setupFee: 199,
      monthlyFee: 49,
      tier: 'starter' as const
    },
    professional: {
      commissionRate: 8.5,
      setupFee: 499,
      monthlyFee: 99,
      tier: 'professional' as const
    },
    enterprise: {
      commissionRate: 5.0,
      setupFee: 999,
      monthlyFee: 199,
      tier: 'enterprise' as const
    }
  }
  return pricing[tier]
}

/**
 * Get max saved looks for tier
 */
function getMaxSavedLooks(tier: 'starter' | 'professional' | 'enterprise'): number {
  const limits = {
    starter: 20,
    professional: 50,
    enterprise: 100
  }
  return limits[tier]
}

/**
 * OPTIONS /api/onboarding/provision-tenant
 * Handle preflight CORS requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
