/**
 * Subdomain Management System
 * Handles subdomain availability checking, validation, and suggestions
 */

import supabase from '@/lib/supabase-client'

export interface SubdomainCheckResult {
  available: boolean
  subdomain: string
  suggestions?: string[]
  error?: string
}

export class SubdomainManager {
  /**
   * Validate subdomain format
   * Rules: lowercase letters, numbers, hyphens only. 3-30 chars. No leading/trailing hyphens
   */
  static validateFormat(subdomain: string): { valid: boolean; error?: string } {
    if (!subdomain || subdomain.length < 3) {
      return { valid: false, error: 'Subdomain must be at least 3 characters long' }
    }

    if (subdomain.length > 30) {
      return { valid: false, error: 'Subdomain must be 30 characters or less' }
    }

    // Must start and end with alphanumeric
    if (!/^[a-z0-9]/.test(subdomain)) {
      return { valid: false, error: 'Subdomain must start with a letter or number' }
    }

    if (!/[a-z0-9]$/.test(subdomain)) {
      return { valid: false, error: 'Subdomain must end with a letter or number' }
    }

    // Only lowercase letters, numbers, and hyphens
    if (!/^[a-z0-9-]+$/.test(subdomain)) {
      return { valid: false, error: 'Subdomain can only contain lowercase letters, numbers, and hyphens' }
    }

    // No consecutive hyphens
    if (/--/.test(subdomain)) {
      return { valid: false, error: 'Subdomain cannot contain consecutive hyphens' }
    }

    return { valid: true }
  }

  /**
   * Normalize subdomain input
   */
  static normalize(input: string): string {
    return input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, '-') // Replace invalid chars with hyphen
      .replace(/--+/g, '-') // Replace multiple hyphens with single
      .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
      .slice(0, 30) // Limit length
  }

  /**
   * Check if subdomain is reserved (system subdomains)
   */
  static isReserved(subdomain: string): boolean {
    const reserved = [
      'www', 'app', 'api', 'admin', 'dashboard', 'blog', 'docs', 'help', 'support',
      'mail', 'email', 'ftp', 'cdn', 'static', 'assets', 'img', 'images',
      'test', 'dev', 'staging', 'production', 'prod', 'demo',
      'login', 'signup', 'register', 'auth', 'account',
      'nailxr', 'nail-xr', 'nail', 'xr'
    ]
    
    return reserved.includes(subdomain.toLowerCase())
  }

  /**
   * Check subdomain availability in database
   */
  static async checkAvailability(subdomain: string): Promise<SubdomainCheckResult> {
    // Validate format first
    const validation = this.validateFormat(subdomain)
    if (!validation.valid) {
      return {
        available: false,
        subdomain,
        error: validation.error
      }
    }

    // Check if reserved
    if (this.isReserved(subdomain)) {
      return {
        available: false,
        subdomain,
        error: 'This subdomain is reserved for system use'
      }
    }

    try {
      // Check in tenants table
      const { data: existingTenant } = await supabase
        .from('tenants')
        .select('subdomain')
        .eq('subdomain', subdomain)
        .single()

      if (existingTenant) {
        return {
          available: false,
          subdomain,
          error: 'This subdomain is already taken',
          suggestions: this.generateSuggestions(subdomain)
        }
      }

      // Check in subdomain reservations table
      const { data: reservation } = await supabase
        .from('subdomain_reservations')
        .select('*')
        .eq('subdomain', subdomain)
        .eq('status', 'reserved')
        .gt('expires_at', new Date().toISOString())
        .single()

      if (reservation) {
        return {
          available: false,
          subdomain,
          error: 'This subdomain is temporarily reserved',
          suggestions: this.generateSuggestions(subdomain)
        }
      }

      return {
        available: true,
        subdomain
      }
    } catch (error) {
      console.error('Error checking subdomain availability:', error)
      return {
        available: false,
        subdomain,
        error: 'Unable to check availability. Please try again.'
      }
    }
  }

  /**
   * Generate subdomain suggestions based on business name
   */
  static generateSuggestions(input: string, count: number = 3): string[] {
    const normalized = this.normalize(input)
    const suggestions: string[] = []

    // Add numbers
    for (let i = 1; i <= count; i++) {
      suggestions.push(`${normalized}${i}`)
    }

    // Add suffixes
    const suffixes = ['salon', 'nails', 'beauty', 'spa', 'studio', 'co', 'hq']
    for (let i = 0; i < Math.min(count, suffixes.length); i++) {
      suggestions.push(`${normalized}-${suffixes[i]}`)
    }

    // Add year
    const year = new Date().getFullYear()
    suggestions.push(`${normalized}${year}`)

    return suggestions.slice(0, count)
  }

  /**
   * Reserve a subdomain temporarily (24 hour hold)
   */
  static async reserveSubdomain(subdomain: string, email: string): Promise<boolean> {
    try {
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 24) // 24 hour reservation

      const { error } = await supabase
        .from('subdomain_reservations')
        .insert({
          subdomain,
          status: 'reserved',
          expires_at: expiresAt.toISOString(),
          metadata: { email }
        })

      return !error
    } catch (error) {
      console.error('Error reserving subdomain:', error)
      return false
    }
  }

  /**
   * Release a subdomain reservation
   */
  static async releaseSubdomain(subdomain: string): Promise<void> {
    try {
      await supabase
        .from('subdomain_reservations')
        .update({ status: 'released' })
        .eq('subdomain', subdomain)
        .eq('status', 'reserved')
    } catch (error) {
      console.error('Error releasing subdomain:', error)
    }
  }

  /**
   * Convert business name to suggested subdomain
   */
  static fromBusinessName(businessName: string): string {
    return this.normalize(businessName)
  }

  /**
   * Get full subdomain URL
   */
  static getFullUrl(subdomain: string): string {
    const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'nailxr.com'
    return `https://${subdomain}.${baseDomain}`
  }
}
