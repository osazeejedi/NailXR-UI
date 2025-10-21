import { TenantConfig, RevenueTransaction, TenantRevenue } from './tenant'

export interface Booking {
  id: string
  tenantId: string
  salonId: string
  clientId: string
  serviceId: string
  serviceName: string
  serviceAmount: number
  appointmentDate: Date
  createdAt: Date
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show'
  paymentStatus: 'pending' | 'paid' | 'refunded'
  notes?: string
}

export interface Salon {
  id: string
  tenantId: string
  name: string
  email: string
  phone: string
  address: string
  commissionRate: number // Override tenant rate if needed
  isActive: boolean
  joinedAt: Date
}

export class RevenueTracker {
  private static transactions: Map<string, RevenueTransaction> = new Map()
  private static bookings: Map<string, Booking> = new Map()
  private static salons: Map<string, Salon> = new Map()

  // Mock data for demonstration
  static {
    this.initializeMockData()
  }

  private static initializeMockData() {
    // Sample salons
    const sampleSalons: Salon[] = [
      {
        id: 'salon-1',
        tenantId: 'luxe-nails',
        name: 'Downtown Luxe Location',
        email: 'downtown@luxenails.com',
        phone: '+1 (555) 123-4567',
        address: '123 Main St, New York, NY 10001',
        commissionRate: 8.5,
        isActive: true,
        joinedAt: new Date('2024-01-01')
      },
      {
        id: 'salon-2',
        tenantId: 'beauty-express',
        name: 'Beauty Express Mall',
        email: 'mall@beautyexpress.com',
        phone: '+1 (555) 987-6543',
        address: '456 Mall Ave, Los Angeles, CA 90210',
        commissionRate: 12.0,
        isActive: true,
        joinedAt: new Date('2024-02-01')
      }
    ]

    sampleSalons.forEach(salon => this.salons.set(salon.id, salon))

    // Sample bookings
    const sampleBookings: Booking[] = [
      {
        id: 'booking-1',
        tenantId: 'luxe-nails',
        salonId: 'salon-1',
        clientId: 'client-1',
        serviceId: 'service-1',
        serviceName: 'Premium Gel Manicure',
        serviceAmount: 85,
        appointmentDate: new Date('2024-10-15'),
        createdAt: new Date('2024-10-10'),
        status: 'completed',
        paymentStatus: 'paid'
      },
      {
        id: 'booking-2',
        tenantId: 'beauty-express',
        salonId: 'salon-2',
        clientId: 'client-2',
        serviceId: 'service-2',
        serviceName: 'Express Manicure',
        serviceAmount: 35,
        appointmentDate: new Date('2024-10-12'),
        createdAt: new Date('2024-10-08'),
        status: 'completed',
        paymentStatus: 'paid'
      },
      {
        id: 'booking-3',
        tenantId: 'luxe-nails',
        salonId: 'salon-1',
        clientId: 'client-3',
        serviceId: 'service-3',
        serviceName: 'Nail Art Design',
        serviceAmount: 120,
        appointmentDate: new Date('2024-10-20'),
        createdAt: new Date('2024-10-15'),
        status: 'confirmed',
        paymentStatus: 'pending'
      }
    ]

    sampleBookings.forEach(booking => {
      this.bookings.set(booking.id, booking)
      // Generate revenue transaction if booking is completed
      if (booking.status === 'completed' && booking.paymentStatus === 'paid') {
        this.generateRevenueTransaction(booking)
      }
    })
  }

  static confirmBooking(bookingId: string): RevenueTransaction | null {
    const booking = this.bookings.get(bookingId)
    if (!booking) return null

    // Update booking status
    booking.status = 'confirmed'
    this.bookings.set(bookingId, booking)

    // Generate revenue transaction
    return this.generateRevenueTransaction(booking)
  }

  static completeBooking(bookingId: string): RevenueTransaction | null {
    const booking = this.bookings.get(bookingId)
    if (!booking) return null

    // Update booking status
    booking.status = 'completed'
    booking.paymentStatus = 'paid'
    this.bookings.set(bookingId, booking)

    // Generate or update revenue transaction
    return this.generateRevenueTransaction(booking)
  }

  private static generateRevenueTransaction(booking: Booking): RevenueTransaction {
    const salon = this.salons.get(booking.salonId)
    if (!salon) throw new Error('Salon not found')

    // Use salon-specific commission rate or default tenant rate
    const commissionRate = salon.commissionRate
    const commissionAmount = Math.round((booking.serviceAmount * commissionRate / 100) * 100) / 100

    const transaction: RevenueTransaction = {
      id: `txn-${booking.id}`,
      tenantId: booking.tenantId,
      bookingId: booking.id,
      salonId: booking.salonId,
      clientId: booking.clientId,
      serviceAmount: booking.serviceAmount,
      commissionRate,
      commissionAmount,
      transactionDate: new Date(),
      status: booking.status === 'completed' ? 'confirmed' : 'pending'
    }

    this.transactions.set(transaction.id, transaction)
    return transaction
  }

  static getTransactionsByTenant(tenantId: string): RevenueTransaction[] {
    return Array.from(this.transactions.values()).filter(t => t.tenantId === tenantId)
  }

  static getTenantRevenue(tenantId: string, period?: string): TenantRevenue {
    let transactions = this.getTransactionsByTenant(tenantId)
    
    // Filter by period if specified (YYYY-MM format)
    if (period) {
      transactions = transactions.filter(t => {
        const transactionMonth = t.transactionDate.toISOString().substring(0, 7)
        return transactionMonth === period
      })
    }

    const totalBookings = transactions.length
    const totalRevenue = transactions.reduce((sum, t) => sum + t.serviceAmount, 0)
    const totalCommission = transactions.reduce((sum, t) => sum + t.commissionAmount, 0)
    const averageCommissionRate = totalBookings > 0 
      ? transactions.reduce((sum, t) => sum + t.commissionRate, 0) / totalBookings 
      : 0

    return {
      tenantId,
      period: period || new Date().toISOString().substring(0, 7),
      totalBookings,
      totalRevenue,
      totalCommission,
      averageCommissionRate,
      transactions
    }
  }

  static getRevenueAnalytics(tenantId: string) {
    const now = new Date()
    const currentMonth = now.toISOString().substring(0, 7)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().substring(0, 7)

    const currentMonthRevenue = this.getTenantRevenue(tenantId, currentMonth)
    const lastMonthRevenue = this.getTenantRevenue(tenantId, lastMonth)
    const allTimeRevenue = this.getTenantRevenue(tenantId)

    // Calculate growth rates
    const revenueGrowth = lastMonthRevenue.totalRevenue > 0 
      ? ((currentMonthRevenue.totalRevenue - lastMonthRevenue.totalRevenue) / lastMonthRevenue.totalRevenue) * 100
      : 0

    const bookingGrowth = lastMonthRevenue.totalBookings > 0
      ? ((currentMonthRevenue.totalBookings - lastMonthRevenue.totalBookings) / lastMonthRevenue.totalBookings) * 100
      : 0

    return {
      currentMonth: currentMonthRevenue,
      lastMonth: lastMonthRevenue,
      allTime: allTimeRevenue,
      growth: {
        revenue: Math.round(revenueGrowth * 100) / 100,
        bookings: Math.round(bookingGrowth * 100) / 100
      }
    }
  }

  static getBookingsByTenant(tenantId: string): Booking[] {
    return Array.from(this.bookings.values()).filter(b => b.tenantId === tenantId)
  }

  static getSalonsByTenant(tenantId: string): Salon[] {
    return Array.from(this.salons.values()).filter(s => s.tenantId === tenantId)
  }

  static getRecentTransactions(tenantId: string, limit: number = 10): RevenueTransaction[] {
    return this.getTransactionsByTenant(tenantId)
      .sort((a, b) => b.transactionDate.getTime() - a.transactionDate.getTime())
      .slice(0, limit)
  }

  // Payout management
  static generatePayout(tenantId: string, period: string) {
    const revenue = this.getTenantRevenue(tenantId, period)
    const paidTransactions = revenue.transactions.filter(t => t.status === 'confirmed')
    
    if (paidTransactions.length === 0) {
      return null
    }

    const payoutId = `payout-${tenantId}-${period}`
    const totalPayout = paidTransactions.reduce((sum, t) => sum + t.commissionAmount, 0)

    // Mark transactions as paid
    paidTransactions.forEach(transaction => {
      transaction.status = 'paid'
      transaction.payoutId = payoutId
      this.transactions.set(transaction.id, transaction)
    })

    return {
      id: payoutId,
      tenantId,
      period,
      amount: totalPayout,
      transactionCount: paidTransactions.length,
      generatedAt: new Date(),
      status: 'pending' as const
    }
  }

  // Dashboard metrics
  static getDashboardMetrics(tenantId: string) {
    const analytics = this.getRevenueAnalytics(tenantId)
    const recentTransactions = this.getRecentTransactions(tenantId, 5)
    const salons = this.getSalonsByTenant(tenantId)
    
    return {
      revenue: {
        thisMonth: analytics.currentMonth.totalCommission,
        lastMonth: analytics.lastMonth.totalCommission,
        growth: analytics.growth.revenue
      },
      bookings: {
        thisMonth: analytics.currentMonth.totalBookings,
        lastMonth: analytics.lastMonth.totalBookings,
        growth: analytics.growth.bookings
      },
      salons: {
        total: salons.length,
        active: salons.filter(s => s.isActive).length
      },
      recentTransactions,
      averageCommissionRate: analytics.currentMonth.averageCommissionRate
    }
  }
}

// Utility functions for formatting
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

export function formatPercent(percent: number): string {
  return `${percent >= 0 ? '+' : ''}${percent.toFixed(1)}%`
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}
