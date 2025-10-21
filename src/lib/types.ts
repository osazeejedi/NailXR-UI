// Database types for Supabase
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string | null
          avatar_url: string | null
          role: 'user' | 'salon_owner' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          avatar_url?: string | null
          role?: 'user' | 'salon_owner' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          avatar_url?: string | null
          role?: 'user' | 'salon_owner' | 'admin'
          created_at?: string
          updated_at?: string
        }
      }
      salons: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          address: string
          city: string
          country: string
          latitude: number | null
          longitude: number | null
          phone: string | null
          email: string | null
          website: string | null
          owner_id: string
          logo_url: string | null
          cover_image_url: string | null
          primary_color: string
          secondary_color: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          address: string
          city: string
          country: string
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          email?: string | null
          website?: string | null
          owner_id: string
          logo_url?: string | null
          cover_image_url?: string | null
          primary_color?: string
          secondary_color?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          address?: string
          city?: string
          country?: string
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          email?: string | null
          website?: string | null
          owner_id?: string
          logo_url?: string | null
          cover_image_url?: string | null
          primary_color?: string
          secondary_color?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      nail_colors: {
        Row: {
          id: string
          salon_id: string
          name: string
          brand: string
          hex: string
          finish: 'glossy' | 'matte' | 'glitter' | 'metallic'
          quantity: number
          price: number
          in_stock: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          salon_id: string
          name: string
          brand: string
          hex: string
          finish?: 'glossy' | 'matte' | 'glitter' | 'metallic'
          quantity?: number
          price?: number
          in_stock?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          salon_id?: string
          name?: string
          brand?: string
          hex?: string
          finish?: 'glossy' | 'matte' | 'glitter' | 'metallic'
          quantity?: number
          price?: number
          in_stock?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      materials: {
        Row: {
          id: string
          salon_id: string
          name: string
          type: 'gem' | 'sticker' | 'foil' | 'glitter' | 'charm' | 'tool'
          quantity: number
          price: number
          image_url: string | null
          in_stock: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          salon_id: string
          name: string
          type: 'gem' | 'sticker' | 'foil' | 'glitter' | 'charm' | 'tool'
          quantity?: number
          price?: number
          image_url?: string | null
          in_stock?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          salon_id?: string
          name?: string
          type?: 'gem' | 'sticker' | 'foil' | 'glitter' | 'charm' | 'tool'
          quantity?: number
          price?: number
          image_url?: string | null
          in_stock?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      technicians: {
        Row: {
          id: string
          salon_id: string
          profile_id: string | null
          name: string
          skill_level: 'basic' | 'intermediate' | 'advanced'
          specialties: string[]
          hourly_rate: number
          available: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          salon_id: string
          profile_id?: string | null
          name: string
          skill_level?: 'basic' | 'intermediate' | 'advanced'
          specialties?: string[]
          hourly_rate?: number
          available?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          salon_id?: string
          profile_id?: string | null
          name?: string
          skill_level?: 'basic' | 'intermediate' | 'advanced'
          specialties?: string[]
          hourly_rate?: number
          available?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      design_templates: {
        Row: {
          id: string
          salon_id: string
          name: string
          category: 'french' | 'ombre' | 'geometric' | 'floral' | 'abstract' | 'seasonal'
          difficulty: 'basic' | 'intermediate' | 'advanced'
          description: string | null
          required_colors: string[]
          optional_colors: string[]
          required_materials: string[]
          required_skill_level: 'basic' | 'intermediate' | 'advanced'
          estimated_time: number
          base_price: number
          image_url: string | null
          steps: string[]
          popularity_score: number
          is_featured: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          salon_id: string
          name: string
          category: 'french' | 'ombre' | 'geometric' | 'floral' | 'abstract' | 'seasonal'
          difficulty?: 'basic' | 'intermediate' | 'advanced'
          description?: string | null
          required_colors?: string[]
          optional_colors?: string[]
          required_materials?: string[]
          required_skill_level?: 'basic' | 'intermediate' | 'advanced'
          estimated_time?: number
          base_price?: number
          image_url?: string | null
          steps?: string[]
          popularity_score?: number
          is_featured?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          salon_id?: string
          name?: string
          category?: 'french' | 'ombre' | 'geometric' | 'floral' | 'abstract' | 'seasonal'
          difficulty?: 'basic' | 'intermediate' | 'advanced'
          description?: string | null
          required_colors?: string[]
          optional_colors?: string[]
          required_materials?: string[]
          required_skill_level?: 'basic' | 'intermediate' | 'advanced'
          estimated_time?: number
          base_price?: number
          image_url?: string | null
          steps?: string[]
          popularity_score?: number
          is_featured?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      nail_styles: {
        Row: {
          id: string
          name: string
          description: string | null
          category: string
          image_url: string
          price_range_min: number | null
          price_range_max: number | null
          duration_minutes: number | null
          is_featured: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          category: string
          image_url: string
          price_range_min?: number | null
          price_range_max?: number | null
          duration_minutes?: number | null
          is_featured?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          category?: string
          image_url?: string
          price_range_min?: number | null
          price_range_max?: number | null
          duration_minutes?: number | null
          is_featured?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      saved_looks: {
        Row: {
          id: string
          user_id: string
          name: string
          nail_style_id: string | null
          design_template_id: string | null
          color_hex: string
          hand_model_config: any
          preview_image_url: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          nail_style_id?: string | null
          design_template_id?: string | null
          color_hex: string
          hand_model_config?: any
          preview_image_url?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          nail_style_id?: string | null
          design_template_id?: string | null
          color_hex?: string
          hand_model_config?: any
          preview_image_url?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          user_id: string
          salon_id: string
          technician_id: string | null
          nail_style_id: string | null
          design_template_id: string | null
          saved_look_id: string | null
          appointment_date: string
          appointment_time: string
          duration_minutes: number
          price: number
          status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          salon_id: string
          technician_id?: string | null
          nail_style_id?: string | null
          design_template_id?: string | null
          saved_look_id?: string | null
          appointment_date: string
          appointment_time: string
          duration_minutes: number
          price: number
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          salon_id?: string
          technician_id?: string | null
          nail_style_id?: string | null
          design_template_id?: string | null
          saved_look_id?: string | null
          appointment_date?: string
          appointment_time?: string
          duration_minutes?: number
          price?: number
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
