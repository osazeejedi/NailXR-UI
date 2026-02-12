import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { OnboardingApplicationData } from '@/lib/onboarding'

/**
 * PATCH /api/onboarding/update-application
 * Updates an onboarding application's progress and form data
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { applicationId, step, data } = body

    // Validate required fields
    if (!applicationId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Application ID is required'
        },
        { status: 400 }
      )
    }

    if (typeof step !== 'number' || step < 0 || step > 5) {
      return NextResponse.json(
        {
          success: false,
          error: 'Step must be a number between 0 and 5'
        },
        { status: 400 }
      )
    }

    if (!data || typeof data !== 'object') {
      return NextResponse.json(
        {
          success: false,
          error: 'Data must be a valid object'
        },
        { status: 400 }
      )
    }

    // Validate step-specific data
    const validationError = validateStepData(step, data)
    if (validationError) {
      return NextResponse.json(
        {
          success: false,
          error: validationError
        },
        { status: 400 }
      )
    }

    // Update the application using admin client
    const { error } = await supabaseAdmin
      .from('onboarding_applications')
      .update({
        step_completed: step,
        form_data: data,
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId)

    if (error) {
      console.error('Error updating application:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update application. Please try again.'
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        applicationId,
        step,
        message: `Application updated - Step ${step} completed`
      }
    })

  } catch (error) {
    console.error('Error updating onboarding application:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update application. Please try again.'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/onboarding/update-application?id=xxx
 * Retrieves an onboarding application by ID
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const applicationId = searchParams.get('id')

    if (!applicationId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Application ID is required'
        },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('onboarding_applications')
      .select('*')
      .eq('id', applicationId)
      .single()

    if (error || !data) {
      return NextResponse.json(
        {
          success: false,
          error: 'Application not found'
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        email: data.email,
        businessName: data.business_name,
        subdomain: data.subdomain,
        status: data.status || 'pending',
        currentStep: data.step_completed || 0,
        formData: data.form_data || {},
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    })

  } catch (error) {
    console.error('Error retrieving onboarding application:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve application. Please try again.'
      },
      { status: 500 }
    )
  }
}

/**
 * Validate step-specific data
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function validateStepData(step: number, data: any): string | null {
  switch (step) {
    case 1: // Business Info
      if (!data.businessName || !data.contactName || !data.email) {
        return 'Business name, contact name, and email are required for step 1'
      }
      if (!data.businessType || !['salon', 'spa', 'beauty_supply', 'other'].includes(data.businessType)) {
        return 'Valid business type is required for step 1'
      }
      break

    case 2: // Branding
      if (!data.primaryColor || !data.secondaryColor || !data.accentColor) {
        return 'Primary, secondary, and accent colors are required for step 2'
      }
      if (!data.tagline || !data.heroTitle || !data.heroSubtitle) {
        return 'Tagline, hero title, and hero subtitle are required for step 2'
      }
      // Validate color format (hex)
      const hexRegex = /^#[0-9A-Fa-f]{6}$/
      if (!hexRegex.test(data.primaryColor) || !hexRegex.test(data.secondaryColor) || !hexRegex.test(data.accentColor)) {
        return 'Colors must be valid hex codes (e.g., #FF5733)'
      }
      break

    case 3: // Subdomain
      if (!data.subdomain) {
        return 'Subdomain is required for step 3'
      }
      break

    case 4: // Pricing
      if (!data.selectedTier || !['starter', 'professional', 'enterprise'].includes(data.selectedTier)) {
        return 'Valid pricing tier is required for step 4'
      }
      if (!data.billingCycle || !['monthly', 'annual'].includes(data.billingCycle)) {
        return 'Valid billing cycle is required for step 4'
      }
      break

    case 5: // Payment (optional during trial)
      // Payment data is optional for trial signups
      // Validation will be done by Stripe
      break

    default:
      return 'Invalid step number'
  }

  return null
}

/**
 * OPTIONS /api/onboarding/update-application
 * Handle preflight CORS requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
