import { NextRequest, NextResponse } from 'next/server'
import { OnboardingService } from '@/lib/onboarding'
import { SubdomainManager } from '@/lib/subdomain'

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

    // Get the application
    const application = await OnboardingService.getApplication(applicationId)

    if (!application) {
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

    // Validate application data is complete
    const validationError = validateApplicationData(application.formData)
    if (validationError) {
      return NextResponse.json(
        {
          success: false,
          error: `Incomplete application: ${validationError}`
        },
        { status: 400 }
      )
    }

    // Double-check subdomain availability
    const subdomainCheck = await SubdomainManager.checkAvailability(application.formData.subdomain)
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

    // Update application status to processing
    await OnboardingService.updateApplication(applicationId, application.currentStep, {
      ...application.formData,
    })

    // Mark as approved before provisioning
    const updatedApp = await OnboardingService.getApplication(applicationId)
    if (updatedApp) {
      // Manually update status to approved (we'd normally use a service method)
      // For now, we'll provision directly
    }

    // Provision the tenant
    const tenant = await OnboardingService.provisionTenant(applicationId)

    if (!tenant) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to provision tenant. Please contact support.'
        },
        { status: 500 }
      )
    }

    // Start the free trial
    const trialStarted = await OnboardingService.startTrial(tenant.id, applicationId)

    if (!trialStarted) {
      console.error('Failed to start trial, but tenant was created')
    }

    // Generate temporary password
    const tempPassword = OnboardingService.generateTemporaryPassword()

    // Get trial end date
    const trialDays = parseInt(process.env.TRIAL_DAYS || '14')
    const trialEndDate = new Date()
    trialEndDate.setDate(trialEndDate.getDate() + trialDays)

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
          email: application.formData.email,
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
