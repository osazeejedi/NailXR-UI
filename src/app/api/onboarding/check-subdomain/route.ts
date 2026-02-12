import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
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

    // Check if reserved
    if (SubdomainManager.isReserved(normalizedSubdomain)) {
      return NextResponse.json({
        success: false,
        data: {
          available: false,
          subdomain: normalizedSubdomain,
          error: 'This subdomain is reserved for system use'
        }
      })
    }

    try {
      // Check in tenants table
      const { data: existingTenant } = await supabaseAdmin
        .from('tenants')
        .select('subdomain')
        .eq('subdomain', normalizedSubdomain)
        .single()

      if (existingTenant) {
        return NextResponse.json({
          success: false,
          data: {
            available: false,
            subdomain: normalizedSubdomain,
            error: 'This subdomain is already taken',
            suggestions: SubdomainManager.generateSuggestions(normalizedSubdomain)
          }
        })
      }

      // Check in subdomain reservations table
      const { data: reservation } = await supabaseAdmin
        .from('subdomain_reservations')
        .select('*')
        .eq('subdomain', normalizedSubdomain)
        .eq('status', 'reserved')
        .gt('expires_at', new Date().toISOString())
        .single()

      if (reservation) {
        return NextResponse.json({
          success: false,
          data: {
            available: false,
            subdomain: normalizedSubdomain,
            error: 'This subdomain is temporarily reserved',
            suggestions: SubdomainManager.generateSuggestions(normalizedSubdomain)
          }
        })
      }

      return NextResponse.json({
        success: true,
        data: {
          available: true,
          subdomain: normalizedSubdomain,
          fullUrl: SubdomainManager.getFullUrl(normalizedSubdomain)
        }
      })

    } catch (error) {
      console.error('Error checking subdomain availability:', error)
      return NextResponse.json({
        success: false,
        data: {
          available: false,
          subdomain: normalizedSubdomain,
          error: 'Unable to check availability. Please try again.'
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
