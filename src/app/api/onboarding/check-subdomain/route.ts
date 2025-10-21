import { NextRequest, NextResponse } from 'next/server'
import { SubdomainManager } from '@/lib/subdomain'

/**
 * POST /api/onboarding/check-subdomain
 * Checks if a subdomain is available for registration
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { subdomain } = body

    // Validate input
    if (!subdomain || typeof subdomain !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Subdomain is required and must be a string'
        },
        { status: 400 }
      )
    }

    // Normalize the subdomain
    const normalizedSubdomain = SubdomainManager.normalize(subdomain)

    // Check availability
    const result = await SubdomainManager.checkAvailability(normalizedSubdomain)

    if (result.available) {
      return NextResponse.json({
        success: true,
        data: {
          available: true,
          subdomain: result.subdomain,
          fullUrl: SubdomainManager.getFullUrl(result.subdomain)
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        data: {
          available: false,
          subdomain: result.subdomain,
          error: result.error,
          suggestions: result.suggestions || []
        }
      })
    }
  } catch (error) {
    console.error('Error checking subdomain availability:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check subdomain availability. Please try again.'
      },
      { status: 500 }
    )
  }
}

/**
 * OPTIONS /api/onboarding/check-subdomain
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
