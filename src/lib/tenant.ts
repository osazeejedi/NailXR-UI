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
    homeVisits: boolean
    analytics: boolean
    customDomain: boolean
  }
  whatsapp: {
    enabled: boolean
    phoneNumber: string // Nigerian format +234...
    chatLinkMessage?: string // Default message when customers click WhatsApp link
    bookingConfirmations: boolean // Send booking confirmations via WhatsApp
    appointmentReminders: boolean // Send reminders via WhatsApp
  }
  serviceType: 'salon_only' | 'home_only' | 'both'
  location: {
    state: string
    area: string
    address: string
    landmark?: string
    homeVisitAreas: string[] // Areas covered for home visits
    homeVisitFee: number // Base transport fee in NGN
  }
  pricing: {
    commissionRate: number // percentage (e.g., 8.5 for 8.5%)
    setupFee: number // in NGN
    monthlyFee: number // in NGN
    tier: 'starter' | 'professional' | 'enterprise'
  }
  settings: {
    allowCustomColors: boolean
    maxSavedLooks: number
    enableNotifications: boolean
    timezone: string
    currency: string
    locale: string
  }
  social: {
    instagram?: string
    facebook?: string
    tiktok?: string
    twitter?: string
  }
  createdAt: Date
  updatedAt: Date
  isActive: boolean
}

// Default NailXR configuration (Nigeria-focused)
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
    heroSubtitle: 'Experience the future of nail art with NailXR. Visualize thousands of nail designs on realistic 3D hands, save your favourite looks, and book appointments with top nail technicians near you.',
    tagline: 'AI-Powered Nail Visualization',
    companyName: 'NailXR',
    supportEmail: 'support@nailxr.com',
    supportPhone: '+234 800 NAILXR'
  },
  features: {
    virtualTryOn: true,
    savedLooks: true,
    salonBooking: true,
    homeVisits: true,
    analytics: true,
    customDomain: true
  },
  whatsapp: {
    enabled: true,
    phoneNumber: '',
    chatLinkMessage: 'Hi! I found you on NailXR and I\'d like to book an appointment.',
    bookingConfirmations: true,
    appointmentReminders: true
  },
  serviceType: 'both',
  location: {
    state: 'Lagos',
    area: 'Lekki',
    address: '',
    homeVisitAreas: [],
    homeVisitFee: 0
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
    timezone: 'Africa/Lagos',
    currency: 'NGN',
    locale: 'en-NG'
  },
  social: {},
  createdAt: new Date(),
  updatedAt: new Date(),
  isActive: true
}

// Sample white-label configurations (Nigerian salons)
export const sampleTenants: TenantConfig[] = [
  {
    id: 'luxe-nails-lagos',
    name: 'Luxe Nails Lagos',
    domain: 'luxenailslagos.com',
    subdomain: 'luxe',
    branding: {
      logo: '/logos/luxe-nails-logo.png',
      logoWhite: '/logos/luxe-nails-white.png',
      primaryColor: '#d4af37',
      secondaryColor: '#1a1a1a',
      accentColor: '#f5e6d3',
      fontFamily: 'serif'
    },
    content: {
      heroTitle: 'Premium Nail Artistry',
      heroSubtitle: 'Discover luxury nail art and book your appointment at Luxe Nails Lagos. Salon visits and home service available across Lekki & Victoria Island.',
      tagline: 'Lagos Premium Nail Studio',
      companyName: 'Luxe Nails Lagos',
      supportEmail: 'hello@luxenailslagos.com',
      supportPhone: '+234 812 345 6789'
    },
    features: {
      virtualTryOn: true,
      savedLooks: true,
      salonBooking: true,
      homeVisits: true,
      analytics: true,
      customDomain: true
    },
    whatsapp: {
      enabled: true,
      phoneNumber: '+2348123456789',
      chatLinkMessage: 'Hi Luxe Nails! I\'d like to book a nail appointment. I found you on NailXR 💅',
      bookingConfirmations: true,
      appointmentReminders: true
    },
    serviceType: 'both',
    location: {
      state: 'Lagos',
      area: 'Lekki Phase 1',
      address: '12 Admiralty Way, Lekki Phase 1',
      landmark: 'Beside Mega Chicken',
      homeVisitAreas: ['Lekki', 'Victoria Island', 'Ikoyi', 'Ajah', 'Sangotedo'],
      homeVisitFee: 5000 // ₦5,000
    },
    pricing: {
      commissionRate: 8.5,
      setupFee: 50000,
      monthlyFee: 35000,
      tier: 'professional'
    },
    settings: {
      allowCustomColors: true,
      maxSavedLooks: 50,
      enableNotifications: true,
      timezone: 'Africa/Lagos',
      currency: 'NGN',
      locale: 'en-NG'
    },
    social: {
      instagram: '@luxenailslagos',
      tiktok: '@luxenailslagos'
    },
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
    isActive: true
  },
  {
    id: 'glam-fingers-abuja',
    name: 'Glam Fingers',
    domain: 'glamfingers.com',
    subdomain: 'glamfingers',
    branding: {
      logo: '/logos/glam-fingers-logo.png',
      logoWhite: '/logos/glam-fingers-white.png',
      primaryColor: '#ff6b9d',
      secondaryColor: '#45b7d1',
      accentColor: '#96ceb4',
      fontFamily: 'sans-serif'
    },
    content: {
      heroTitle: 'Nails That Slay ✨',
      heroSubtitle: 'Home service nail technician in Abuja. I come to you! Book your slot and get gorgeous nails in the comfort of your home.',
      tagline: 'Mobile Nail Tech · Abuja',
      companyName: 'Glam Fingers',
      supportEmail: 'glamfingers@gmail.com',
      supportPhone: '+234 903 456 7890'
    },
    features: {
      virtualTryOn: true,
      savedLooks: true,
      salonBooking: true,
      homeVisits: true,
      analytics: false,
      customDomain: false
    },
    whatsapp: {
      enabled: true,
      phoneNumber: '+2349034567890',
      chatLinkMessage: 'Hi! I saw your work on NailXR and I want to book a home visit 💅✨',
      bookingConfirmations: true,
      appointmentReminders: false
    },
    serviceType: 'home_only',
    location: {
      state: 'FCT (Abuja)',
      area: 'Wuse',
      address: '',
      homeVisitAreas: ['Wuse', 'Maitama', 'Gwarinpa', 'Jabi', 'Utako', 'Life Camp', 'Garki', 'Asokoro'],
      homeVisitFee: 3000 // ₦3,000
    },
    pricing: {
      commissionRate: 12.0,
      setupFee: 25000,
      monthlyFee: 15000,
      tier: 'starter'
    },
    settings: {
      allowCustomColors: false,
      maxSavedLooks: 20,
      enableNotifications: true,
      timezone: 'Africa/Lagos',
      currency: 'NGN',
      locale: 'en-NG'
    },
    social: {
      instagram: '@glamfingers_abj',
      tiktok: '@glamfingers'
    },
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-15'),
    isActive: true
  },
  {
    id: 'nail-bar-ph',
    name: 'The Nail Bar PH',
    domain: 'nailbarph.com',
    subdomain: 'nailbarph',
    branding: {
      logo: '/logos/nail-bar-ph-logo.png',
      logoWhite: '/logos/nail-bar-ph-white.png',
      primaryColor: '#9b59b6',
      secondaryColor: '#2c3e50',
      accentColor: '#e8d5f5',
      fontFamily: 'sans-serif'
    },
    content: {
      heroTitle: 'Port Harcourt\'s Finest Nails',
      heroSubtitle: 'Walk-in or book ahead. Salon and home service available in Port Harcourt.',
      tagline: 'Nail Salon · Port Harcourt',
      companyName: 'The Nail Bar PH',
      supportEmail: 'thenailbarph@gmail.com',
      supportPhone: '+234 706 789 0123'
    },
    features: {
      virtualTryOn: true,
      savedLooks: true,
      salonBooking: true,
      homeVisits: true,
      analytics: true,
      customDomain: false
    },
    whatsapp: {
      enabled: true,
      phoneNumber: '+2347067890123',
      chatLinkMessage: 'Hello! I want to book a nail appointment at The Nail Bar 💅',
      bookingConfirmations: true,
      appointmentReminders: true
    },
    serviceType: 'both',
    location: {
      state: 'Rivers',
      area: 'GRA Phase 2',
      address: '5 Tombia Street, GRA Phase 2',
      landmark: 'Off Peter Odili Road',
      homeVisitAreas: ['GRA Phase 1', 'GRA Phase 2', 'Trans Amadi', 'Rumuola', 'Peter Odili Road', 'Woji'],
      homeVisitFee: 4000 // ₦4,000
    },
    pricing: {
      commissionRate: 8.5,
      setupFee: 50000,
      monthlyFee: 35000,
      tier: 'professional'
    },
    settings: {
      allowCustomColors: true,
      maxSavedLooks: 50,
      enableNotifications: true,
      timezone: 'Africa/Lagos',
      currency: 'NGN',
      locale: 'en-NG'
    },
    social: {
      instagram: '@thenailbarph'
    },
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-10'),
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

  static getTenantsByState(state: string): TenantConfig[] {
    return Array.from(this.tenants.values()).filter(t => 
      t.location.state === state && t.isActive
    )
  }

  static getTenantsByServiceType(serviceType: 'salon_only' | 'home_only' | 'both'): TenantConfig[] {
    return Array.from(this.tenants.values()).filter(t => {
      if (serviceType === 'both') return true
      return t.serviceType === serviceType || t.serviceType === 'both'
    })
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

  /**
   * Generate WhatsApp chat link for a tenant
   */
  static getWhatsAppLink(tenantId: string, customMessage?: string): string | null {
    const tenant = this.tenants.get(tenantId)
    if (!tenant || !tenant.whatsapp.enabled || !tenant.whatsapp.phoneNumber) {
      return null
    }

    const phone = tenant.whatsapp.phoneNumber.replace('+', '')
    const message = customMessage || tenant.whatsapp.chatLinkMessage || ''
    const encodedMessage = message ? `?text=${encodeURIComponent(message)}` : ''
    return `https://wa.me/${phone}${encodedMessage}`
  }

  /**
   * Generate WhatsApp booking confirmation link
   */
  static getBookingWhatsAppLink(
    tenantId: string,
    bookingDetails: {
      customerName: string
      date: string
      time: string
      service: string
      visitType: 'salon' | 'home'
    }
  ): string | null {
    const tenant = this.tenants.get(tenantId)
    if (!tenant || !tenant.whatsapp.enabled || !tenant.whatsapp.phoneNumber) {
      return null
    }

    const visitLabel = bookingDetails.visitType === 'home' ? 'Home Visit' : 'Salon Visit'
    const message = `Hi ${tenant.name}! I just booked an appointment:\n\n` +
      `👤 Name: ${bookingDetails.customerName}\n` +
      `📅 Date: ${bookingDetails.date}\n` +
      `⏰ Time: ${bookingDetails.time}\n` +
      `💅 Service: ${bookingDetails.service}\n` +
      `📍 Type: ${visitLabel}\n\n` +
      `Booked via NailXR`

    const phone = tenant.whatsapp.phoneNumber.replace('+', '')
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
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
  serviceAmount: number // in NGN
  homeVisitFee: number // in NGN
  totalAmount: number // in NGN
  commissionRate: number
  commissionAmount: number // in NGN
  transactionDate: Date
  status: 'pending' | 'confirmed' | 'paid' | 'refunded'
  paymentReference?: string // Paystack reference
  payoutId?: string
}

export interface TenantRevenue {
  tenantId: string
  period: string // YYYY-MM format
  totalBookings: number
  salonVisits: number
  homeVisits: number
  totalRevenue: number // in NGN
  totalCommission: number // in NGN
  totalHomeVisitFees: number // in NGN
  averageCommissionRate: number
  transactions: RevenueTransaction[]
}
