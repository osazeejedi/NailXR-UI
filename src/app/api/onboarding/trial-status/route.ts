import { NextRequest, NextResponse } from 'next/server'
import { OnboardingService } from '@/lib/onboarding'
import { PaymentService } from '@/lib/payment'

/**
 * GET /api/onboarding/trial-status?tenantId=xxx
 * Gets trial information for a specific tenant
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')

    if (!tenantId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tenant ID is required'
        },
        { status: 400 }
      )
    }

    // Get trial information
    const trialInfo = await OnboardingService.getTrialInfo(tenantId)

    if (!trialInfo) {
      return NextResponse.json(
        {
          success: false,
          error: 'Trial information not found for this tenant'
        },
        { status: 404 }
      )
    }

    // Determine if trial is ending soon
    const isEndingSoon = PaymentService.isTrialEndingSoon(trialInfo.endDate)

    return NextResponse.json({
      success: true,
      data: {
        ...trialInfo,
        isEndingSoon,
        endDateFormatted: PaymentService.getNextBillingDate(trialInfo.endDate)
      }
    })

  } catch (error) {
    console.error('Error retrieving trial status:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve trial status. Please try again.'
      },
      { status: 500 }
    )
  }
}

/**
 * OPTIONS /api/onboarding/trial-status
 * Handle preflight CORS requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
