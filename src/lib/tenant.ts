export interface TenantConfig {
  id: string
  name: string
  domain: string
  subdomain: string
  branding: {
    logo: string
    logoWhite?: string
    primaryColor: string
    secondaryColor: string
    accentColor: string
    fontFamily?: string
  }
  content: {
    heroTitle: string
    heroSubtitle: string
    tagline: string
    companyName: string
    supportEmail: string
    supportPhone?: string
  }
  features: {
    virtualTryOn: boolean
    savedLooks: boolean
    salonBooking: boolean
    analytics: boolean
    customDomain: boolean
  }
  pricing: {
    commissionRate: number // percentage (e.g., 8.5 for 8.5%)
    setupFee: number
    monthlyFee: number
    tier: 'starter' | 'professional' | 'enterprise'
  }
  settings: {
    allowCustomColors: boolean
    maxSavedLooks: number
    enableNotifications: boolean
    timezone: string
  }
  createdAt: Date
  updatedAt: Date
  isActive: boolean
}

// Default NailXR configuration
export const defaultTenantConfig: TenantConfig = {
  id: 'nailxr-default',
  name: 'NailXR',
  domain: 'nailxr.com',
  subdomain: 'app',
  branding: {
    logo: '/NailXR-symbol.png',
    logoWhite: '/NailXR-white.png',
    primaryColor: '#ec4899',
    secondaryColor: '#8b5cf6',
    accentColor: '#f472b6',
    fontFamily: 'system-ui'
  },
  content: {
    heroTitle: 'Try Before You Apply',
    heroSubtitle: 'Experience the future of nail art with NailXR. Visualize thousands of nail designs on realistic 3D hands, save your favorite looks, and book appointments with top salons near you.',
    tagline: 'AI-Powered Nail Visualization',
    companyName: 'NailXR',
    supportEmail: 'support@nailxr.com',
    supportPhone: '+1 (555) 123-4567'
  },
  features: {
    virtualTryOn: true,
    savedLooks: true,
    salonBooking: true,
    analytics: true,
    customDomain: true
  },
  pricing: {
    commissionRate: 0,
    setupFee: 0,
    monthlyFee: 0,
    tier: 'enterprise'
  },
  settings: {
    allowCustomColors: true,
    maxSavedLooks: 100,
    enableNotifications: true,
    timezone: 'UTC'
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  isActive: true
}

// Sample white-label configurations
export const sampleTenants: TenantConfig[] = [
  {
    id: 'luxe-nails',
    name: 'Luxe Nails Studio',
    domain: 'luxenails.com',
    subdomain: 'try',
    branding: {
      logo: '/logos/luxe-nails-logo.png',
      logoWhite: '/logos/luxe-nails-white.png',
      primaryColor: '#d4af37',
      secondaryColor: '#1a1a1a',
      accentColor: '#f5e6d3',
      fontFamily: 'serif'
    },
    content: {
      heroTitle: 'Luxury Nail Designs',
      heroSubtitle: 'Discover premium nail art and book your appointment at Luxe Nails Studio.',
      tagline: 'Premium Nail Artistry',
      companyName: 'Luxe Nails Studio',
      supportEmail: 'hello@luxenails.com',
      supportPhone: '+1 (555) 987-6543'
    },
    features: {
      virtualTryOn: true,
      savedLooks: true,
      salonBooking: true,
      analytics: false,
      customDomain: true
    },
    pricing: {
      commissionRate: 8.5,
      setupFee: 499,
      monthlyFee: 99,
      tier: 'professional'
    },
    settings: {
      allowCustomColors: true,
      maxSavedLooks: 50,
      enableNotifications: true,
      timezone: 'America/New_York'
    },
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
    isActive: true
  },
  {
    id: 'beauty-express',
    name: 'Beauty Express',
    domain: 'beautyexpress.com',
    subdomain: 'nails',
    branding: {
      logo: '/logos/beauty-express-logo.png',
      logoWhite: '/logos/beauty-express-white.png',
      primaryColor: '#ff6b9d',
      secondaryColor: '#45b7d1',
      accentColor: '#96ceb4',
      fontFamily: 'sans-serif'
    },
    content: {
      heroTitle: 'Express Your Beauty',
      heroSubtitle: 'Quick, affordable nail designs that fit your lifestyle. Book same-day appointments.',
      tagline: 'Fast & Fabulous Nails',
      companyName: 'Beauty Express',
      supportEmail: 'support@beautyexpress.com'
    },
    features: {
      virtualTryOn: true,
      savedLooks: true,
      salonBooking: true,
      analytics: false,
      customDomain: false
    },
    pricing: {
      commissionRate: 12.0,
      setupFee: 199,
      monthlyFee: 49,
      tier: 'starter'
    },
    settings: {
      allowCustomColors: false,
      maxSavedLooks: 20,
      enableNotifications: true,
      timezone: 'America/Los_Angeles'
    },
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-15'),
    isActive: true
  }
]

// Tenant management functions
export class TenantManager {
  private static tenants: Map<string, TenantConfig> = new Map()

  static {
    // Load default and sample tenants
    this.tenants.set(defaultTenantConfig.id, defaultTenantConfig)
    sampleTenants.forEach(tenant => {
      this.tenants.set(tenant.id, tenant)
    })
  }

  static getTenant(identifier: string): TenantConfig | null {
    // Try to find by ID first
    let tenant = this.tenants.get(identifier)
    if (tenant) return tenant

    // Try to find by subdomain
    tenant = Array.from(this.tenants.values()).find(t => t.subdomain === identifier)
    if (tenant) return tenant

    // Try to find by domain
    tenant = Array.from(this.tenants.values()).find(t => t.domain === identifier)
    if (tenant) return tenant

    return null
  }

  static getTenantByDomain(domain: string): TenantConfig | null {
    return Array.from(this.tenants.values()).find(t => 
      t.domain === domain || `${t.subdomain}.nailxr.com` === domain
    ) || null
  }

  static getAllTenants(): TenantConfig[] {
    return Array.from(this.tenants.values())
  }

  static createTenant(config: Omit<TenantConfig, 'createdAt' | 'updatedAt'>): TenantConfig {
    const tenant: TenantConfig = {
      ...config,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    this.tenants.set(tenant.id, tenant)
    return tenant
  }

  static updateTenant(id: string, updates: Partial<TenantConfig>): TenantConfig | null {
    const tenant = this.tenants.get(id)
    if (!tenant) return null

    const updatedTenant = {
      ...tenant,
      ...updates,
      updatedAt: new Date()
    }
    this.tenants.set(id, updatedTenant)
    return updatedTenant
  }

  static deleteTenant(id: string): boolean {
    return this.tenants.delete(id)
  }
}

// Hook for getting current tenant based on domain/subdomain
export function getCurrentTenant(): TenantConfig {
  // In a real app, this would check the current domain/subdomain
  // For demo purposes, return default config
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    const tenant = TenantManager.getTenantByDomain(hostname)
    if (tenant) return tenant
  }
  
  return defaultTenantConfig
}

// Revenue tracking types
export interface RevenueTransaction {
  id: string
  tenantId: string
  bookingId: string
  salonId: string
  clientId: string
  serviceAmount: number
  commissionRate: number
  commissionAmount: number
  transactionDate: Date
  status: 'pending' | 'confirmed' | 'paid' | 'refunded'
  payoutId?: string
}

export interface TenantRevenue {
  tenantId: string
  period: string // YYYY-MM format
  totalBookings: number
  totalRevenue: number
  totalCommission: number
  averageCommissionRate: number
  transactions: RevenueTransaction[]
}
