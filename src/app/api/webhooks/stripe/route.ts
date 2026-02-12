import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { OnboardingService } from '@/lib/onboarding'
import supabase from '@/lib/supabase-client'

/**
 * POST /api/webhooks/stripe
 * Handles Stripe webhook events for subscription and payment management
 * 
 * Events handled:
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - customer.subscription.trial_will_end
 * - invoice.payment_succeeded
 * - invoice.payment_failed
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      console.error('Missing Stripe signature')
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    // In production, you would use Stripe's library:
    // const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    
    // For now, we'll parse the body and handle events
    const event = JSON.parse(body)

    console.log('Received Stripe webhook:', event.type)

    // Handle different event types
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object)
        break

      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object)
        break

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Error processing Stripe webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

/**
 * Handle subscription created event
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionCreated(subscription: any) {
  console.log('Processing subscription.created:', subscription.id)

  try {
    const customerId = subscription.customer
    const subscriptionId = subscription.id

    // Find tenant by Stripe customer ID
    const { data: payment } = await supabase
      .from('tenant_payments')
      .select('tenant_id')
      .eq('stripe_customer_id', customerId)
      .single()

    if (payment) {
      // Update payment record with subscription ID
      await supabase
        .from('tenant_payments')
        .update({
          stripe_subscription_id: subscriptionId,
          monthly_fee_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('tenant_id', payment.tenant_id)

      console.log('Subscription created for tenant:', payment.tenant_id)
    }
  } catch (error) {
    console.error('Error handling subscription.created:', error)
  }
}

/**
 * Handle subscription updated event
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionUpdated(subscription: any) {
  console.log('Processing subscription.updated:', subscription.id)

  try {
    const subscriptionId = subscription.id
    const status = subscription.status

    // Find tenant by subscription ID
    const { data: payment } = await supabase
      .from('tenant_payments')
      .select('tenant_id')
      .eq('stripe_subscription_id', subscriptionId)
      .single()

    if (payment) {
      // Update tenant status based on subscription status
      let tenantStatus = 'active'
      if (status === 'past_due') {
        tenantStatus = 'past_due'
      } else if (status === 'canceled' || status === 'unpaid') {
        tenantStatus = 'suspended'
      } else if (status === 'trialing') {
        tenantStatus = 'trial'
      }

      await supabase
        .from('tenants')
        .update({
          status: tenantStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', payment.tenant_id)

      console.log('Subscription updated for tenant:', payment.tenant_id, 'Status:', tenantStatus)
    }
  } catch (error) {
    console.error('Error handling subscription.updated:', error)
  }
}

/**
 * Handle subscription deleted event
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionDeleted(subscription: any) {
  console.log('Processing subscription.deleted:', subscription.id)

  try {
    const subscriptionId = subscription.id

    // Find tenant by subscription ID
    const { data: payment } = await supabase
      .from('tenant_payments')
      .select('tenant_id')
      .eq('stripe_subscription_id', subscriptionId)
      .single()

    if (payment) {
      // Suspend tenant
      await supabase
        .from('tenants')
        .update({
          status: 'canceled',
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', payment.tenant_id)

      console.log('Subscription canceled for tenant:', payment.tenant_id)

      // TODO: Send cancellation email (Phase 4)
    }
  } catch (error) {
    console.error('Error handling subscription.deleted:', error)
  }
}

/**
 * Handle trial will end event (3 days before)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleTrialWillEnd(subscription: any) {
  console.log('Processing subscription.trial_will_end:', subscription.id)

  try {
    const subscriptionId = subscription.id
    const trialEnd = new Date(subscription.trial_end * 1000)

    // Find tenant by subscription ID
    const { data: payment } = await supabase
      .from('tenant_payments')
      .select('tenant_id')
      .eq('stripe_subscription_id', subscriptionId)
      .single()

    if (payment) {
      // Get tenant details for email
      const { data: tenant } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', payment.tenant_id)
        .single()

      if (tenant) {
        // Create notification record
        await supabase
          .from('trial_notifications')
          .insert({
            tenant_id: payment.tenant_id,
            notification_type: 'trial_ending',
            status: 'pending',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            email_to: (tenant.config as any)?.content?.supportEmail,
            subject: 'Your trial ends soon',
            metadata: {
              trial_end_date: trialEnd.toISOString(),
              days_remaining: 3
            }
          })

        console.log('Trial ending notification created for tenant:', payment.tenant_id)

        // TODO: Send trial ending email (Phase 4)
      }
    }
  } catch (error) {
    console.error('Error handling subscription.trial_will_end:', error)
  }
}

/**
 * Handle successful payment
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handlePaymentSucceeded(invoice: any) {
  console.log('Processing invoice.payment_succeeded:', invoice.id)

  try {
    const customerId = invoice.customer
    const amountPaid = invoice.amount_paid // in cents
    const subscriptionId = invoice.subscription

    // Find tenant by customer ID
    const { data: payment } = await supabase
      .from('tenant_payments')
      .select('tenant_id')
      .eq('stripe_customer_id', customerId)
      .single()

    if (payment) {
      // Record transaction
      await supabase
        .from('payment_transactions')
        .insert({
          tenant_id: payment.tenant_id,
          stripe_payment_intent_id: invoice.payment_intent,
          amount: amountPaid,
          currency: invoice.currency,
          type: invoice.billing_reason === 'subscription_create' ? 'setup_fee' : 'monthly_fee',
          status: 'succeeded',
          description: invoice.description || 'Payment received',
          metadata: {
            invoice_id: invoice.id,
            subscription_id: subscriptionId
          }
        })

      // If this is the first payment after trial, convert to active
      if (invoice.billing_reason === 'subscription_create') {
        await OnboardingService.convertTrialToPaid(
          payment.tenant_id,
          customerId,
          subscriptionId
        )

        console.log('Trial converted to paid for tenant:', payment.tenant_id)

        // TODO: Send subscription activated email (Phase 4)
      }

      console.log('Payment recorded for tenant:', payment.tenant_id)
    }
  } catch (error) {
    console.error('Error handling invoice.payment_succeeded:', error)
  }
}

/**
 * Handle failed payment
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handlePaymentFailed(invoice: any) {
  console.log('Processing invoice.payment_failed:', invoice.id)

  try {
    const customerId = invoice.customer
    const amountDue = invoice.amount_due

    // Find tenant by customer ID
    const { data: payment } = await supabase
      .from('tenant_payments')
      .select('tenant_id')
      .eq('stripe_customer_id', customerId)
      .single()

    if (payment) {
      // Record failed transaction
      await supabase
        .from('payment_transactions')
        .insert({
          tenant_id: payment.tenant_id,
          stripe_payment_intent_id: invoice.payment_intent,
          amount: amountDue,
          currency: invoice.currency,
          type: 'monthly_fee',
          status: 'failed',
          description: 'Payment failed',
          metadata: {
            invoice_id: invoice.id,
            error: invoice.last_finalization_error?.message
          }
        })

      // Update tenant status
      await supabase
        .from('tenants')
        .update({
          status: 'past_due',
          updated_at: new Date().toISOString()
        })
        .eq('id', payment.tenant_id)

      console.log('Payment failed for tenant:', payment.tenant_id)

      // TODO: Send payment failed email (Phase 4)
    }
  } catch (error) {
    console.error('Error handling invoice.payment_failed:', error)
  }
}

/**
 * OPTIONS /api/webhooks/stripe
 * Stripe doesn't send OPTIONS requests, but included for completeness
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, stripe-signature',
    },
  })
}
