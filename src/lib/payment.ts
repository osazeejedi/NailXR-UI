/**
 * Payment Processing Service
 * Handles Paystack integration for subscriptions and one-time payments
 * Optimized for Nigerian market (NGN currency)
 */

export interface PaystackConfig {
  publicKey: string
  secretKey: string
  webhookSecret: string
}

export interface SubscriptionPlan {
  id: string
  name: string
  tier: 'starter' | 'professional' | 'enterprise'
  setupFee: number // in NGN
  monthlyFee: number // in NGN
  annualFee: number // in NGN
  trialDays: number
  features: string[]
  paystackPlanCode?: string // Paystack plan code for recurring billing
}

export interface PaymentIntent {
  id: string
  amount: number // in kobo (NGN smallest unit)
  currency: string
  status: string
  accessCode: string // Paystack access code
  authorizationUrl: string // Paystack checkout URL
  reference: string
}

export interface Subscription {
  id: string
  customerCode: string
  status: string
  nextPaymentDate: Date
  cancelAtPeriodEnd: boolean
  trialEnd?: Date
  subscriptionCode: string
  emailToken: string
}

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  starter: {
    id: 'plan_starter_monthly',
    name: 'Starter',
    tier: 'starter',
    setupFee: 25000, // ₦25,000
    monthlyFee: 15000, // ₦15,000
    annualFee: 150000, // ₦150,000 (~17% discount)
    trialDays: 14,
    features: [
      'Virtual Try-On Technology',
      'Up to 20 Saved Looks',
      'Salon & Home Visit Booking',
      'WhatsApp Chat Link',
      'Email Support',
      'Subdomain Hosting'
    ]
  },
  professional: {
    id: 'plan_professional_monthly',
    name: 'Professional',
    tier: 'professional',
    setupFee: 50000, // ₦50,000
    monthlyFee: 35000, // ₦35,000
    annualFee: 350000, // ₦350,000 (~17% discount)
    trialDays: 14,
    features: [
      'Everything in Starter',
      'Up to 50 Saved Looks',
      'Custom Branding & Colors',
      'Analytics Dashboard',
      'WhatsApp Business Integration',
      'Priority Support',
      'Multiple Technician Profiles'
    ]
  },
  enterprise: {
    id: 'plan_enterprise_monthly',
    name: 'Enterprise',
    tier: 'enterprise',
    setupFee: 100000, // ₦100,000
    monthlyFee: 75000, // ₦75,000
    annualFee: 750000, // ₦750,000 (~17% discount)
    trialDays: 14,
    features: [
      'Everything in Professional',
      'Unlimited Saved Looks',
      'Advanced Analytics & Reporting',
      'API Access',
      'Dedicated Account Manager',
      'White-glove Onboarding',
      'Multiple Branches Support',
      'Priority Phone & Chat Support'
    ]
  }
}

export class PaymentService {
  /**
   * Get Paystack configuration from environment
   */
  static getConfig(): PaystackConfig {
    return {
      publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
      secretKey: process.env.PAYSTACK_SECRET_KEY || '',
      webhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET || ''
    }
  }

  /**
   * Validate Paystack configuration
   */
  static isConfigured(): boolean {
    const config = this.getConfig()
    return !!(config.publicKey && config.secretKey)
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
   * Format price for display in Naira
   */
  static formatPrice(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  /**
   * Convert NGN to kobo (Paystack uses kobo)
   */
  static toKobo(amount: number): number {
    return Math.round(amount * 100)
  }

  /**
   * Convert kobo to NGN
   */
  static fromKobo(amountInKobo: number): number {
    return amountInKobo / 100
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
      'non-renewing': 'yellow',
      attention: 'orange',
      completed: 'gray'
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
      canceled: 'Cancelled',
      'non-renewing': 'Cancelling',
      attention: 'Needs Attention',
      completed: 'Completed'
    }
    return labels[status] || status
  }

  /**
   * Validate Nigerian phone number
   */
  static validateNigerianPhone(phone: string): boolean {
    // Nigerian phone: +234XXXXXXXXXX or 0XXXXXXXXXX
    const cleaned = phone.replace(/[\s\-\(\)]/g, '')
    return /^(\+234|234|0)[789]\d{9}$/.test(cleaned)
  }

  /**
   * Format Nigerian phone number
   */
  static formatNigerianPhone(phone: string): string {
    const cleaned = phone.replace(/[\s\-\(\)]/g, '')
    if (cleaned.startsWith('0')) {
      return '+234' + cleaned.substring(1)
    }
    if (cleaned.startsWith('234')) {
      return '+' + cleaned
    }
    return cleaned
  }

  /**
   * Generate WhatsApp chat link
   */
  static generateWhatsAppLink(phone: string, message?: string): string {
    const formattedPhone = this.formatNigerianPhone(phone).replace('+', '')
    const encodedMessage = message ? `?text=${encodeURIComponent(message)}` : ''
    return `https://wa.me/${formattedPhone}${encodedMessage}`
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
  static getNextBillingDate(nextPaymentDate: Date): string {
    return new Intl.DateTimeFormat('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(nextPaymentDate)
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

  /**
   * Get supported payment channels for Paystack
   */
  static getSupportedChannels(): string[] {
    return ['card', 'bank', 'ussd', 'bank_transfer', 'mobile_money']
  }
}

/**
 * Helper functions for Paystack webhook handling
 */
export class WebhookHandler {
  /**
   * Verify Paystack webhook signature
   */
  static verifySignature(payload: string, signature: string, secret: string): boolean {
    // In the API route, you'd use crypto.createHmac('sha512', secret).update(payload).digest('hex')
    // Then compare with the x-paystack-signature header
    return true // Placeholder — actual impl in API route
  }

  /**
   * Handle subscription created event
   */
  static async handleSubscriptionCreated(data: any): Promise<void> {
    console.log('Paystack subscription created:', data.subscription_code)
    // Update database with subscription details
  }

  /**
   * Handle charge success event (payment completed)
   */
  static async handleChargeSuccess(data: any): Promise<void> {
    console.log('Paystack charge success:', data.reference)
    // Update payment records, activate subscription
  }

  /**
   * Handle subscription disabled/cancelled
   */
  static async handleSubscriptionDisabled(data: any): Promise<void> {
    console.log('Paystack subscription disabled:', data.subscription_code)
    // Mark tenant as inactive or suspended
  }

  /**
   * Handle invoice payment failed
   */
  static async handleInvoiceFailed(data: any): Promise<void> {
    console.log('Paystack invoice failed:', data.reference)
    // Send notification to tenant via WhatsApp/email
  }

  /**
   * Handle transfer success (payouts to salons)
   */
  static async handleTransferSuccess(data: any): Promise<void> {
    console.log('Paystack transfer success:', data.reference)
    // Update payout records
  }
}
