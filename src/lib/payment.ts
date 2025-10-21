/**
 * Payment Processing Service
 * Handles Stripe integration for subscriptions and one-time payments
 */

export interface StripeConfig {
  publishableKey: string
  secretKey: string
  webhookSecret: string
}

export interface SubscriptionPlan {
  id: string
  name: string
  tier: 'starter' | 'professional' | 'enterprise'
  setupFee: number
  monthlyFee: number
  annualFee: number
  trialDays: number
  features: string[]
}

export interface PaymentIntent {
  id: string
  amount: number
  currency: string
  status: string
  clientSecret: string
}

export interface Subscription {
  id: string
  customerId: string
  status: string
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  trialEnd?: Date
}

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  starter: {
    id: 'price_starter_monthly',
    name: 'Starter',
    tier: 'starter',
    setupFee: 199,
    monthlyFee: 49,
    annualFee: 490, // ~16% discount
    trialDays: 14,
    features: [
      'Virtual Try-On Technology',
      'Up to 20 Saved Looks',
      'Salon Booking Integration',
      'Email Support',
      'Subdomain Hosting'
    ]
  },
  professional: {
    id: 'price_professional_monthly',
    name: 'Professional',
    tier: 'professional',
    setupFee: 499,
    monthlyFee: 99,
    annualFee: 990, // ~16% discount
    trialDays: 14,
    features: [
      'Everything in Starter',
      'Up to 50 Saved Looks',
      'Custom Branding Colors',
      'Analytics Dashboard',
      'Priority Email Support',
      'Advanced Color Customization'
    ]
  },
  enterprise: {
    id: 'price_enterprise_monthly',
    name: 'Enterprise',
    tier: 'enterprise',
    setupFee: 999,
    monthlyFee: 199,
    annualFee: 1990, // ~16% discount
    trialDays: 14,
    features: [
      'Everything in Professional',
      'Unlimited Saved Looks',
      'Advanced Analytics & Reporting',
      'API Access',
      'Dedicated Account Manager',
      'White-glove Onboarding',
      'Priority Phone & Chat Support'
    ]
  }
}

export class PaymentService {
  /**
   * Get Stripe configuration from environment
   */
  static getConfig(): StripeConfig {
    return {
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
      secretKey: process.env.STRIPE_SECRET_KEY || '',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || ''
    }
  }

  /**
   * Validate Stripe configuration
   */
  static isConfigured(): boolean {
    const config = this.getConfig()
    return !!(config.publishableKey && config.secretKey)
  }

  /**
   * Get subscription plan by tier
   */
  static getPlan(tier: 'starter' | 'professional' | 'enterprise'): SubscriptionPlan {
    return SUBSCRIPTION_PLANS[tier]
  }

  /**
   * Calculate total cost for billing cycle
   */
  static calculateTotal(
    tier: 'starter' | 'professional' | 'enterprise',
    billingCycle: 'monthly' | 'annual',
    includeTrial: boolean = true
  ): { setupFee: number; recurringFee: number; total: number; savings?: number } {
    const plan = this.getPlan(tier)
    const setupFee = includeTrial ? 0 : plan.setupFee // Setup fee deferred during trial
    const recurringFee = billingCycle === 'annual' ? plan.annualFee : plan.monthlyFee
    
    let savings = 0
    if (billingCycle === 'annual') {
      savings = (plan.monthlyFee * 12) - plan.annualFee
    }

    return {
      setupFee,
      recurringFee,
      total: setupFee + recurringFee,
      savings: savings > 0 ? savings : undefined
    }
  }

  /**
   * Format price for display
   */
  static formatPrice(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  /**
   * Get trial end date
   */
  static getTrialEndDate(trialDays: number = 14): Date {
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + trialDays)
    return endDate
  }

  /**
   * Check if trial is ending soon (within 3 days)
   */
  static isTrialEndingSoon(trialEndDate: Date): boolean {
    const now = new Date()
    const daysRemaining = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysRemaining <= 3 && daysRemaining > 0
  }

  /**
   * Calculate days remaining in trial
   */
  static getTrialDaysRemaining(trialEndDate: Date): number {
    const now = new Date()
    const daysRemaining = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(0, daysRemaining)
  }

  /**
   * Get subscription status color for UI
   */
  static getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      active: 'green',
      trialing: 'blue',
      past_due: 'yellow',
      canceled: 'red',
      unpaid: 'red',
      incomplete: 'gray'
    }
    return colors[status] || 'gray'
  }

  /**
   * Get subscription status label
   */
  static getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      active: 'Active',
      trialing: 'Trial',
      past_due: 'Payment Due',
      canceled: 'Canceled',
      unpaid: 'Unpaid',
      incomplete: 'Incomplete'
    }
    return labels[status] || status
  }

  /**
   * Validate payment method details (basic client-side validation)
   */
  static validateCardNumber(cardNumber: string): boolean {
    // Remove spaces and check length
    const cleaned = cardNumber.replace(/\s/g, '')
    return /^\d{13,19}$/.test(cleaned)
  }

  /**
   * Validate expiry date (MM/YY format)
   */
  static validateExpiryDate(expiry: string): boolean {
    const match = expiry.match(/^(\d{2})\/(\d{2})$/)
    if (!match) return false

    const month = parseInt(match[1])
    const year = parseInt('20' + match[2])
    
    if (month < 1 || month > 12) return false

    const now = new Date()
    const expiryDate = new Date(year, month - 1)
    
    return expiryDate > now
  }

  /**
   * Validate CVV
   */
  static validateCVV(cvv: string): boolean {
    return /^\d{3,4}$/.test(cvv)
  }

  /**
   * Format card number for display (mask with *)
   */
  static formatCardNumber(cardNumber: string, maskAll: boolean = false): string {
    const cleaned = cardNumber.replace(/\s/g, '')
    if (maskAll) {
      return '**** **** **** ' + cleaned.slice(-4)
    }
    return cleaned.replace(/(\d{4})/g, '$1 ').trim()
  }

  /**
   * Get card brand from number
   */
  static getCardBrand(cardNumber: string): string {
    const cleaned = cardNumber.replace(/\s/g, '')
    
    if (/^4/.test(cleaned)) return 'Visa'
    if (/^5[1-5]/.test(cleaned)) return 'Mastercard'
    if (/^3[47]/.test(cleaned)) return 'American Express'
    if (/^6(?:011|5)/.test(cleaned)) return 'Discover'
    
    return 'Unknown'
  }

  /**
   * Calculate commission for a booking
   */
  static calculateCommission(
    bookingAmount: number,
    commissionRate: number
  ): { commission: number; netAmount: number } {
    const commission = Math.round(bookingAmount * (commissionRate / 100))
    const netAmount = bookingAmount - commission
    
    return {
      commission,
      netAmount
    }
  }

  /**
   * Get next billing date
   */
  static getNextBillingDate(currentPeriodEnd: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(currentPeriodEnd)
  }

  /**
   * Calculate proration amount
   */
  static calculateProration(
    oldPlanAmount: number,
    newPlanAmount: number,
    daysRemaining: number,
    totalDays: number = 30
  ): number {
    const unusedAmount = (oldPlanAmount / totalDays) * daysRemaining
    const newAmount = (newPlanAmount / totalDays) * daysRemaining
    return Math.max(0, newAmount - unusedAmount)
  }
}

/**
 * Helper functions for Stripe webhook handling
 */
export class WebhookHandler {
  /**
   * Verify webhook signature (to be used in API routes)
   */
  static verifySignature(payload: string, signature: string, secret: string): boolean {
    // This is a placeholder - actual verification would use Stripe's library
    // In the API route, you'd use: stripe.webhooks.constructEvent()
    return true
  }

  /**
   * Handle subscription created event
   */
  static async handleSubscriptionCreated(subscription: any): Promise<void> {
    console.log('Subscription created:', subscription.id)
    // Update database with subscription details
  }

  /**
   * Handle subscription updated event
   */
  static async handleSubscriptionUpdated(subscription: any): Promise<void> {
    console.log('Subscription updated:', subscription.id)
    // Update database with new subscription status
  }

  /**
   * Handle subscription deleted event
   */
  static async handleSubscriptionDeleted(subscription: any): Promise<void> {
    console.log('Subscription deleted:', subscription.id)
    // Mark tenant as inactive or suspended
  }

  /**
   * Handle payment succeeded event
   */
  static async handlePaymentSucceeded(invoice: any): Promise<void> {
    console.log('Payment succeeded:', invoice.id)
    // Update payment records
  }

  /**
   * Handle payment failed event
   */
  static async handlePaymentFailed(invoice: any): Promise<void> {
    console.log('Payment failed:', invoice.id)
    // Send notification to tenant
    // Update tenant status
  }
}
