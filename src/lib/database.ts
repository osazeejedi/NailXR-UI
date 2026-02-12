/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { supabase } from './supabase-typed'
import type { 
  SalonRow, 
  NailColorRow, 
  MaterialRow, 
  TechnicianRow, 
  DesignTemplateRow, 
  SavedLookRow, 
  BookingRow,
  BookingInsert,
  SavedLookInsert
} from './supabase-typed'

// Re-export types for other modules
export type { 
  SalonRow, 
  NailColorRow, 
  MaterialRow, 
  TechnicianRow, 
  DesignTemplateRow, 
  SavedLookRow, 
  BookingRow 
}

// Enhanced types with computed fields
export interface EnhancedDesignTemplate extends Omit<DesignTemplateRow, 'required_colors' | 'optional_colors' | 'required_materials'> {
  required_colors: NailColorRow[]
  optional_colors: NailColorRow[]
  required_materials: MaterialRow[]
  available_technicians: TechnicianRow[]
  estimated_price: number
  available: boolean
  missing_colors: string[]
  missing_materials: string[]
}

export interface SalonInventory {
  salon: SalonRow
  colors: NailColorRow[]
  materials: MaterialRow[]
  technicians: TechnicianRow[]
  design_templates: EnhancedDesignTemplate[]
}

export class DatabaseService {
  // Salon operations
  static async getSalon(salonId: string): Promise<SalonRow | null> {
    const { data, error } = await supabase
      .from('salons')
      .select('*')
      .eq('id', salonId)
      .single()

    if (error) {
      console.error('Error fetching salon:', error)
      return null
    }

    return data
  }

  static async getSalonBySlug(slug: string): Promise<SalonRow | null> {
    const { data, error } = await supabase
      .from('salons')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) {
      console.error('Error fetching salon by slug:', error)
      return null
    }

    return data
  }

  // Inventory operations
  static async getSalonColors(salonId: string): Promise<NailColorRow[]> {
    const { data, error } = await supabase
      .from('nail_colors')
      .select('*')
      .eq('salon_id', salonId)
      .eq('in_stock', true)
      .order('name')

    if (error) {
      console.error('Error fetching salon colors:', error)
      return []
    }

    return data || []
  }

  static async getSalonMaterials(salonId: string): Promise<MaterialRow[]> {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('salon_id', salonId)
      .eq('in_stock', true)
      .order('name')

    if (error) {
      console.error('Error fetching salon materials:', error)
      return []
    }

    return data || []
  }

  static async getSalonTechnicians(salonId: string): Promise<TechnicianRow[]> {
    const { data, error } = await supabase
      .from('technicians')
      .select('*')
      .eq('salon_id', salonId)
      .eq('available', true)
      .order('name')

    if (error) {
      console.error('Error fetching salon technicians:', error)
      return []
    }

    return data || []
  }

  // Design template operations
  static async getSalonDesignTemplates(salonId: string): Promise<DesignTemplateRow[]> {
    const { data, error } = await supabase
      .from('design_templates')
      .select('*')
      .eq('salon_id', salonId)
      .order('popularity_score', { ascending: false })

    if (error) {
      console.error('Error fetching design templates:', error)
      return []
    }

    return data || []
  }

  static async getEnhancedDesignTemplate(
    salonId: string, 
    designId: string
  ): Promise<EnhancedDesignTemplate | null> {
    // Get the base design template
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: template, error: templateError } = await (supabase
      .from('design_templates') as any)
      .select('*')
      .eq('id', designId)
      .eq('salon_id', salonId)
      .single()

    if (templateError || !template) {
      console.error('Error fetching design template:', templateError)
      return null
    }

    // Get salon inventory
    const [colors, materials, technicians] = await Promise.all([
      this.getSalonColors(salonId),
      this.getSalonMaterials(salonId),
      this.getSalonTechnicians(salonId)
    ])

    // Find required colors
    const requiredColors = colors.filter(color => 
      template.required_colors.includes(color.id)
    )

    // Find optional colors
    const optionalColors = colors.filter(color => 
      template.optional_colors.includes(color.id)
    )

    // Find required materials
    const requiredMaterials = materials.filter(material => 
      template.required_materials.includes(material.id)
    )

    // Check availability
    const missingColors = template.required_colors.filter((colorId: string) => 
      !colors.some(color => color.id === colorId && color.in_stock)
    )

    const missingMaterials = template.required_materials.filter((materialId: string) =>
      !materials.some(material => material.id === materialId && material.in_stock)
    )

    // Find available technicians based on skill level
    const skillLevels: Record<'basic' | 'intermediate' | 'advanced', number> = { 
      basic: 1, 
      intermediate: 2, 
      advanced: 3 
    }
    const availableTechnicians = technicians.filter(tech => 
      skillLevels[tech.skill_level] >= skillLevels[template.required_skill_level as keyof typeof skillLevels]
    )

    const available = missingColors.length === 0 && 
                     missingMaterials.length === 0 && 
                     availableTechnicians.length > 0

    // Calculate estimated price
    const materialCosts = requiredMaterials.reduce((cost, material) => 
      cost + (material.price || 0), 0
    )
    const estimatedPrice = (template.base_price || 0) + materialCosts

    return {
      ...template,
      required_colors: requiredColors,
      optional_colors: optionalColors,
      required_materials: requiredMaterials,
      available_technicians: availableTechnicians,
      estimated_price: estimatedPrice,
      available,
      missing_colors: missingColors,
      missing_materials: missingMaterials
    }
  }

  static async getAvailableDesigns(salonId: string): Promise<EnhancedDesignTemplate[]> {
    const templates = await this.getSalonDesignTemplates(salonId)
    const enhancedTemplates: EnhancedDesignTemplate[] = []

    for (const template of templates) {
      const enhanced = await this.getEnhancedDesignTemplate(salonId, template.id)
      if (enhanced && enhanced.available) {
        enhancedTemplates.push(enhanced)
      }
    }

    return enhancedTemplates
  }

  // Full salon inventory
  static async getSalonInventory(salonId: string): Promise<SalonInventory | null> {
    const salon = await this.getSalon(salonId)
    if (!salon) return null

    const [colors, materials, technicians, templates] = await Promise.all([
      this.getSalonColors(salonId),
      this.getSalonMaterials(salonId),
      this.getSalonTechnicians(salonId),
      this.getAvailableDesigns(salonId)
    ])

    return {
      salon,
      colors,
      materials,
      technicians,
      design_templates: templates
    }
  }

  // Search and filter operations
  static async searchDesigns(
    salonId: string,
    query?: string,
    filters?: {
      category?: string
      maxPrice?: number
      maxTime?: number
      difficulty?: string
    }
  ): Promise<EnhancedDesignTemplate[]> {
    let queryBuilder = supabase
      .from('design_templates')
      .select('*')
      .eq('salon_id', salonId)

    // Apply filters
    if (filters?.category) {
      queryBuilder = queryBuilder.eq('category', filters.category)
    }

    if (filters?.difficulty) {
      queryBuilder = queryBuilder.eq('difficulty', filters.difficulty)
    }

    if (filters?.maxTime) {
      queryBuilder = queryBuilder.lte('estimated_time', filters.maxTime)
    }

    if (filters?.maxPrice) {
      queryBuilder = queryBuilder.lte('base_price', filters.maxPrice)
    }

    // Text search
    if (query) {
      queryBuilder = queryBuilder.or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    }

    const { data: templates, error } = await queryBuilder
      .order('popularity_score', { ascending: false })

    if (error) {
      console.error('Error searching designs:', error)
      return []
    }

    // Enhance each template with availability data
    const enhancedTemplates: EnhancedDesignTemplate[] = []
    for (const template of templates || []) {
      const enhanced = await this.getEnhancedDesignTemplate(salonId, template.id)
      if (enhanced) {
        enhancedTemplates.push(enhanced)
      }
    }

    return enhancedTemplates
  }

  // Inventory management
  static async updateColorStock(salonId: string, colorId: string, quantity: number): Promise<boolean> {
    const { error } = await supabase
      .from('nail_colors')
      .update({ 
        quantity, 
        in_stock: quantity > 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', colorId)
      .eq('salon_id', salonId)

    if (error) {
      console.error('Error updating color stock:', error)
      return false
    }

    return true
  }

  static async updateMaterialStock(salonId: string, materialId: string, quantity: number): Promise<boolean> {
    const { error } = await supabase
      .from('materials')
      .update({ 
        quantity, 
        in_stock: quantity > 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', materialId)
      .eq('salon_id', salonId)

    if (error) {
      console.error('Error updating material stock:', error)
      return false
    }

    return true
  }

  // Booking operations
  static async createBooking(booking: {
    user_id: string
    salon_id: string
    design_template_id?: string
    appointment_date: string
    appointment_time: string
    duration_minutes: number
    price: number
    notes?: string
  }): Promise<BookingRow | null> {
    const { data, error } = await supabase
      .from('bookings')
      .insert(booking)
      .select()
      .single()

    if (error) {
      console.error('Error creating booking:', error)
      return null
    }

    return data
  }

  static async getUserBookings(userId: string): Promise<BookingRow[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        salon:salons(*),
        design_template:design_templates(*)
      `)
      .eq('user_id', userId)
      .order('appointment_date', { ascending: false })

    if (error) {
      console.error('Error fetching user bookings:', error)
      return []
    }

    return data || []
  }

  static async getSalonBookings(salonId: string): Promise<BookingRow[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        user:profiles(*),
        design_template:design_templates(*)
      `)
      .eq('salon_id', salonId)
      .order('appointment_date', { ascending: true })

    if (error) {
      console.error('Error fetching salon bookings:', error)
      return []
    }

    return data || []
  }

  // Saved looks operations
  static async saveUserLook(look: {
    user_id: string
    name: string
    design_template_id?: string
    color_hex: string
    hand_model_config: any
    preview_image_url?: string
    notes?: string
  }): Promise<SavedLookRow | null> {
    const { data, error } = await supabase
      .from('saved_looks')
      .insert(look)
      .select()
      .single()

    if (error) {
      console.error('Error saving look:', error)
      return null
    }

    return data
  }

  static async getUserSavedLooks(userId: string): Promise<SavedLookRow[]> {
    const { data, error } = await supabase
      .from('saved_looks')
      .select(`
        *,
        design_template:design_templates(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching saved looks:', error)
      return []
    }

    return data || []
  }

  // Popular designs
  static async getPopularDesigns(salonId: string, limit: number = 5): Promise<EnhancedDesignTemplate[]> {
    const { data: templates, error } = await supabase
      .from('design_templates')
      .select('*')
      .eq('salon_id', salonId)
      .order('popularity_score', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching popular designs:', error)
      return []
    }

    // Enhance each template
    const enhancedTemplates: EnhancedDesignTemplate[] = []
    for (const template of templates || []) {
      const enhanced = await this.getEnhancedDesignTemplate(salonId, template.id)
      if (enhanced && enhanced.available) {
        enhancedTemplates.push(enhanced)
      }
    }

    return enhancedTemplates
  }
}
