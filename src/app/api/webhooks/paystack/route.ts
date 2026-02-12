import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

/**
 * Paystack Webhook Handler
 * Handles subscription events, payment confirmations, and transfers
 * 
 * Paystack sends webhooks to this endpoint for:
 * - charge.success: Payment was successful
 * - subscription.create: New subscription created
 * - subscription.disable: Subscription cancelled/disabled
 * - invoice.create: New invoice generated
 * - invoice.payment_failed: Invoice payment failed
 * - transfer.success: Payout to salon was successful
 * - transfer.failed: Payout to salon failed
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-paystack-signature')
    const secret = process.env.PAYSTACK_WEBHOOK_SECRET

    // Verify webhook signature
    if (!secret || !signature) {
      console.error('Missing Paystack webhook secret or signature')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hash = crypto
      .createHmac('sha512', secret)
      .update(body)
      .digest('hex')

    if (hash !== signature) {
      console.error('Invalid Paystack webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(body)
    const { event: eventType, data } = event

    console.log(`Paystack webhook received: ${eventType}`)

    switch (eventType) {
      case 'charge.success':
        await handleChargeSuccess(data)
        break

      case 'subscription.create':
        await handleSubscriptionCreate(data)
        break

      case 'subscription.not_renew':
        await handleSubscriptionNotRenew(data)
        break

      case 'subscription.disable':
        await handleSubscriptionDisable(data)
        break

      case 'invoice.create':
        await handleInvoiceCreate(data)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(data)
        break

      case 'transfer.success':
        await handleTransferSuccess(data)
        break

      case 'transfer.failed':
        await handleTransferFailed(data)
        break

      default:
        console.log(`Unhandled Paystack event: ${eventType}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Paystack webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

/**
 * Handle successful charge (payment completed)
 */
async function handleChargeSuccess(data: any) {
  const {
    reference,
    amount, // in kobo
    currency,
    customer,
    metadata,
    channel, // card, bank, ussd, bank_transfer, etc.
    authorization
  } = data

  console.log(`✅ Payment success: ${reference}`)
  console.log(`   Amount: ₦${(amount / 100).toLocaleString()}`)
  console.log(`   Channel: ${channel}`)
  console.log(`   Customer: ${customer?.email}`)

  // TODO: Update database
  // 1. Find tenant by customer email or metadata.tenant_id
  // 2. Record payment transaction
  // 3. If setup fee, mark as paid
  // 4. If subscription payment, update subscription status
  // 5. If booking payment, update booking payment_status
}

/**
 * Handle new subscription created
 */
async function handleSubscriptionCreate(data: any) {
  const {
    subscription_code,
    customer,
    plan,
    status,
    next_payment_date,
    email_token
  } = data

  console.log(`📋 Subscription created: ${subscription_code}`)
  console.log(`   Plan: ${plan?.name}`)
  console.log(`   Status: ${status}`)
  console.log(`   Next payment: ${next_payment_date}`)

  // TODO: Update database
  // 1. Find tenant by customer email
  // 2. Store subscription_code, plan details
  // 3. Update tenant status to 'active'
  // 4. Send welcome email / WhatsApp message
}

/**
 * Handle subscription not renewing (customer cancelled future renewals)
 */
async function handleSubscriptionNotRenew(data: any) {
  const { subscription_code, customer } = data

  console.log(`⚠️ Subscription not renewing: ${subscription_code}`)

  // TODO: Update database
  // 1. Mark subscription as non-renewing
  // 2. Send retention email / WhatsApp message  
  // 3. Allow access until current period ends
}

/**
 * Handle subscription disabled (cancelled)
 */
async function handleSubscriptionDisable(data: any) {
  const { subscription_code, customer } = data

  console.log(`❌ Subscription disabled: ${subscription_code}`)

  // TODO: Update database
  // 1. Update tenant status to 'suspended' or 'canceled'
  // 2. Disable tenant subdomain (or show upgrade prompt)
  // 3. Send notification
}

/**
 * Handle new invoice created
 */
async function handleInvoiceCreate(data: any) {
  const { subscription, amount, description } = data

  console.log(`📄 Invoice created for subscription: ${subscription?.subscription_code}`)
  console.log(`   Amount: ₦${(amount / 100).toLocaleString()}`)

  // TODO: Record invoice in database
}

/**
 * Handle invoice payment failure
 */
async function handleInvoicePaymentFailed(data: any) {
  const { subscription, invoice } = data

  console.log(`💳 Payment failed for subscription: ${subscription?.subscription_code}`)

  // TODO: Update database
  // 1. Update tenant status to 'past_due'
  // 2. Send payment failure notification via email/WhatsApp
  // 3. Implement grace period logic
}

/**
 * Handle successful transfer (payout to salon)
 */
async function handleTransferSuccess(data: any) {
  const { reference, amount, recipient } = data

  console.log(`💰 Transfer success: ${reference}`)
  console.log(`   Amount: ₦${(amount / 100).toLocaleString()}`)

  // TODO: Update payout records in database
}

/**
 * Handle failed transfer
 */
async function handleTransferFailed(data: any) {
  const { reference, amount, recipient } = data

  console.log(`❌ Transfer failed: ${reference}`)

  // TODO: Update payout records, retry or notify admin
}
