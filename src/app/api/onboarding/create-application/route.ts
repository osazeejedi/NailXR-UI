import { NextRequest, NextResponse } from 'next/server'
import { OnboardingService } from '@/lib/onboarding'
import { SubdomainManager } from '@/lib/subdomain'

/**
 * POST /api/onboarding/create-application
 * Creates a new onboarding application and reserves subdomain
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, businessName, subdomain } = body

    // Validate required fields
    if (!email || !businessName || !subdomain) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email, business name, and subdomain are required'
        },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email format'
        },
        { status: 400 }
      )
    }

    // Normalize and validate subdomain
    const normalizedSubdomain = SubdomainManager.normalize(subdomain)
    const subdomainCheck = await SubdomainManager.checkAvailability(normalizedSubdomain)

    if (!subdomainCheck.available) {
      return NextResponse.json(
        {
          success: false,
          error: subdomainCheck.error || 'Subdomain is not available',
          suggestions: subdomainCheck.suggestions
        },
        { status: 409 }
      )
    }

    // Create the application
    const applicationId = await OnboardingService.createApplication(email, businessName)

    if (!applicationId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create application. Please try again.'
        },
        { status: 500 }
      )
    }

    // Reserve the subdomain
    const reserved = await SubdomainManager.reserveSubdomain(normalizedSubdomain, email)

    if (!reserved) {
      console.warn('Failed to reserve subdomain, but application was created')
    }

    return NextResponse.json({
      success: true,
      data: {
        applicationId,
        subdomain: normalizedSubdomain,
        email,
        businessName,
        message: 'Application created successfully'
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating onboarding application:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create application. Please try again.'
      },
      { status: 500 }
    )
  }
}

/**
 * OPTIONS /api/onboarding/create-application
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
