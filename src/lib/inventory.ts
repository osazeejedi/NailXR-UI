import { DatabaseService, type EnhancedDesignTemplate, type NailColorRow, type MaterialRow, type TechnicianRow } from './database'

// Legacy interfaces for backward compatibility
export interface NailColor {
  id: string
  name: string
  brand: string
  hex: string
  finish: 'glossy' | 'matte' | 'glitter' | 'metallic'
  quantity: number
  price: number
  inStock: boolean
}

export interface Material {
  id: string
  name: string
  type: 'gem' | 'sticker' | 'foil' | 'glitter' | 'charm' | 'tool'
  quantity: number
  price: number
  imageUrl?: string
  inStock: boolean
}

export interface TechnicianSkill {
  technicianId: string
  name: string
  skillLevel: 'basic' | 'intermediate' | 'advanced'
  specialties: string[]
  hourlyRate: number
  available: boolean
}

export interface DesignTemplate {
  id: string
  name: string
  category: 'french' | 'ombre' | 'geometric' | 'floral' | 'abstract' | 'seasonal' | 'ankara' | 'tribal'
  difficulty: 'basic' | 'intermediate' | 'advanced'
  description: string
  requiredColors: string[]
  optionalColors: string[]
  requiredMaterials: string[]
  requiredSkillLevel: 'basic' | 'intermediate' | 'advanced'
  estimatedTime: number
  basePrice: number
  imageUrl: string
  steps: string[]
  popularityScore: number
  createdAt: Date
  updatedAt: Date
}

export interface DesignAvailability {
  designId: string
  available: boolean
  missingColors: string[]
  missingMaterials: string[]
  availableTechnicians: string[]
  estimatedPrice: number
  canBeModified: boolean
  alternatives: string[]
}

// Helper functions to convert database types to legacy interfaces
function convertNailColor(dbColor: NailColorRow): NailColor {
  return {
    id: dbColor.id,
    name: dbColor.name,
    brand: dbColor.brand,
    hex: dbColor.hex,
    finish: dbColor.finish,
    quantity: dbColor.quantity,
    price: dbColor.price,
    inStock: dbColor.in_stock
  }
}

function convertMaterial(dbMaterial: MaterialRow): Material {
  return {
    id: dbMaterial.id,
    name: dbMaterial.name,
    type: dbMaterial.type,
    quantity: dbMaterial.quantity,
    price: dbMaterial.price,
    imageUrl: dbMaterial.image_url || undefined,
    inStock: dbMaterial.in_stock
  }
}

function convertTechnician(dbTech: TechnicianRow): TechnicianSkill {
  return {
    technicianId: dbTech.id,
    name: dbTech.name,
    skillLevel: dbTech.skill_level,
    specialties: dbTech.specialties,
    hourlyRate: dbTech.hourly_rate,
    available: dbTech.available
  }
}

function convertDesignTemplate(dbTemplate: EnhancedDesignTemplate): DesignTemplate {
  return {
    id: dbTemplate.id,
    name: dbTemplate.name,
    category: dbTemplate.category,
    difficulty: dbTemplate.difficulty,
    description: dbTemplate.description || '',
    requiredColors: dbTemplate.required_colors.map(c => c.id),
    optionalColors: dbTemplate.optional_colors.map(c => c.id),
    requiredMaterials: dbTemplate.required_materials.map(m => m.id),
    requiredSkillLevel: dbTemplate.required_skill_level,
    estimatedTime: dbTemplate.estimated_time,
    basePrice: dbTemplate.base_price,
    imageUrl: dbTemplate.image_url || '',
    steps: dbTemplate.steps,
    popularityScore: dbTemplate.popularity_score,
    createdAt: new Date(dbTemplate.created_at),
    updatedAt: new Date(dbTemplate.updated_at)
  }
}

export class SalonInventoryManager {
  // New implementation using Supabase DatabaseService
  static async getSalonInventory(salonId: string): Promise<any> {
    try {
      const inventory = await DatabaseService.getSalonInventory(salonId)
      return inventory
    } catch (error) {
      console.error('Error fetching salon inventory:', error)
      return null
    }
  }

  static async getAvailableDesigns(salonId: string): Promise<DesignTemplate[]> {
    try {
      const designs = await DatabaseService.getAvailableDesigns(salonId)
      return designs.map(convertDesignTemplate)
    } catch (error) {
      console.error('Error fetching available designs:', error)
      return []
    }
  }

  static async checkDesignAvailability(salonId: string, designId: string): Promise<DesignAvailability> {
    try {
      const enhanced = await DatabaseService.getEnhancedDesignTemplate(salonId, designId)
      if (!enhanced) {
        return {
          designId,
          available: false,
          missingColors: [],
          missingMaterials: [],
          availableTechnicians: [],
          estimatedPrice: 0,
          canBeModified: false,
          alternatives: []
        }
      }

      return {
        designId,
        available: enhanced.available,
        missingColors: enhanced.missing_colors,
        missingMaterials: enhanced.missing_materials,
        availableTechnicians: enhanced.available_technicians.map(t => t.id),
        estimatedPrice: enhanced.estimated_price,
        canBeModified: enhanced.optional_colors.length > 0,
        alternatives: [] // Could implement alternative lookup if needed
      }
    } catch (error) {
      console.error('Error checking design availability:', error)
      return {
        designId,
        available: false,
        missingColors: [],
        missingMaterials: [],
        availableTechnicians: [],
        estimatedPrice: 0,
        canBeModified: false,
        alternatives: []
      }
    }
  }

  static async updateColorStock(salonId: string, colorId: string, quantity: number): Promise<boolean> {
    try {
      return await DatabaseService.updateColorStock(salonId, colorId, quantity)
    } catch (error) {
      console.error('Error updating color stock:', error)
      return false
    }
  }

  static async updateMaterialStock(salonId: string, materialId: string, quantity: number): Promise<boolean> {
    try {
      return await DatabaseService.updateMaterialStock(salonId, materialId, quantity)
    } catch (error) {
      console.error('Error updating material stock:', error)
      return false
    }
  }

  static async getPopularDesigns(salonId: string, limit: number = 5): Promise<DesignTemplate[]> {
    try {
      const designs = await DatabaseService.getPopularDesigns(salonId, limit)
      return designs.map(convertDesignTemplate)
    } catch (error) {
      console.error('Error fetching popular designs:', error)
      return []
    }
  }

  static async searchDesigns(salonId: string, query: string, filters?: {
    category?: string
    maxPrice?: number
    maxTime?: number
    difficulty?: string
  }): Promise<DesignTemplate[]> {
    try {
      const designs = await DatabaseService.searchDesigns(salonId, query, filters)
      return designs.map(convertDesignTemplate)
    } catch (error) {
      console.error('Error searching designs:', error)
      return []
    }
  }
}
