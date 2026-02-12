// Database types for Supabase
// Optimized for Nigerian market with home visit + salon visit support

// Nigerian states list
export const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu',
  'FCT (Abuja)', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina',
  'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo',
  'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
] as const

export type NigerianState = typeof NIGERIAN_STATES[number]

// Major cities/areas for popular states
export const POPULAR_AREAS: Record<string, string[]> = {
  'Lagos': [
    'Lekki', 'Victoria Island', 'Ikoyi', 'Ikeja', 'Surulere', 'Yaba',
    'Ajah', 'Gbagada', 'Maryland', 'Magodo', 'Ogba', 'Festac',
    'Oshodi', 'Mushin', 'Ikorodu', 'Epe', 'Badagry', 'Apapa',
    'Berger', 'Ogudu', 'Ojota', 'Sangotedo', 'Ibeju-Lekki'
  ],
  'FCT (Abuja)': [
    'Wuse', 'Garki', 'Maitama', 'Asokoro', 'Gwarinpa', 'Jabi',
    'Kubwa', 'Lugbe', 'Nyanya', 'Karu', 'Utako', 'Lokogoma',
    'Kado', 'Life Camp', 'Durumi', 'Gudu', 'Apo'
  ],
  'Rivers': [
    'Port Harcourt', 'GRA Phase 1', 'GRA Phase 2', 'Trans Amadi',
    'Rumuola', 'Eleme', 'Obio-Akpor', 'Woji', 'D/Line',
    'Old GRA', 'Peter Odili Road', 'Ada George'
  ],
  'Oyo': [
    'Ibadan', 'Bodija', 'Ring Road', 'UI', 'Dugbe', 'Challenge',
    'Oluyole', 'Akobo', 'Agodi', 'Jericho'
  ],
  'Edo': [
    'Benin City', 'GRA', 'Ring Road', 'Uselu', 'Ugbowo',
    'Sapele Road', 'Airport Road', 'Siluko'
  ]
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string | null
          avatar_url: string | null
          phone: string | null
          role: 'user' | 'salon_owner' | 'technician' | 'admin'
          state: string | null
          area: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          avatar_url?: string | null
          phone?: string | null
          role?: 'user' | 'salon_owner' | 'technician' | 'admin'
          state?: string | null
          area?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          avatar_url?: string | null
          phone?: string | null
          role?: 'user' | 'salon_owner' | 'technician' | 'admin'
          state?: string | null
          area?: string | null
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
          area: string
          state: NigerianState
          landmark: string | null
          latitude: number | null
          longitude: number | null
          phone: string | null
          whatsapp_phone: string | null
          email: string | null
          website: string | null
          instagram: string | null
          owner_id: string
          logo_url: string | null
          cover_image_url: string | null
          primary_color: string
          secondary_color: string
          service_type: 'salon_only' | 'home_only' | 'both'
          home_visit_fee: number // additional transport fee in NGN
          home_visit_areas: string[] // areas covered for home visits
          is_active: boolean
          is_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          address: string
          area: string
          state: NigerianState
          landmark?: string | null
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          whatsapp_phone?: string | null
          email?: string | null
          website?: string | null
          instagram?: string | null
          owner_id: string
          logo_url?: string | null
          cover_image_url?: string | null
          primary_color?: string
          secondary_color?: string
          service_type?: 'salon_only' | 'home_only' | 'both'
          home_visit_fee?: number
          home_visit_areas?: string[]
          is_active?: boolean
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          address?: string
          area?: string
          state?: NigerianState
          landmark?: string | null
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          whatsapp_phone?: string | null
          email?: string | null
          website?: string | null
          instagram?: string | null
          owner_id?: string
          logo_url?: string | null
          cover_image_url?: string | null
          primary_color?: string
          secondary_color?: string
          service_type?: 'salon_only' | 'home_only' | 'both'
          home_visit_fee?: number
          home_visit_areas?: string[]
          is_active?: boolean
          is_verified?: boolean
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
          price: number // in NGN
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
          price: number // in NGN
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
          phone: string | null
          whatsapp_phone: string | null
          skill_level: 'basic' | 'intermediate' | 'advanced'
          specialties: string[]
          hourly_rate: number // in NGN
          does_home_visits: boolean
          home_visit_areas: string[]
          available: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          salon_id: string
          profile_id?: string | null
          name: string
          phone?: string | null
          whatsapp_phone?: string | null
          skill_level?: 'basic' | 'intermediate' | 'advanced'
          specialties?: string[]
          hourly_rate?: number
          does_home_visits?: boolean
          home_visit_areas?: string[]
          available?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          salon_id?: string
          profile_id?: string | null
          name?: string
          phone?: string | null
          whatsapp_phone?: string | null
          skill_level?: 'basic' | 'intermediate' | 'advanced'
          specialties?: string[]
          hourly_rate?: number
          does_home_visits?: boolean
          home_visit_areas?: string[]
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
          category: 'french' | 'ombre' | 'geometric' | 'floral' | 'abstract' | 'seasonal' | 'ankara' | 'tribal'
          difficulty: 'basic' | 'intermediate' | 'advanced'
          description: string | null
          required_colors: string[]
          optional_colors: string[]
          required_materials: string[]
          required_skill_level: 'basic' | 'intermediate' | 'advanced'
          estimated_time: number
          base_price: number // in NGN
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
          category: 'french' | 'ombre' | 'geometric' | 'floral' | 'abstract' | 'seasonal' | 'ankara' | 'tribal'
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
          category?: 'french' | 'ombre' | 'geometric' | 'floral' | 'abstract' | 'seasonal' | 'ankara' | 'tribal'
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
          price_range_min: number | null // in NGN
          price_range_max: number | null // in NGN
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
          visit_type: 'salon' | 'home'
          appointment_date: string
          appointment_time: string
          duration_minutes: number
          service_price: number // in NGN
          home_visit_fee: number // in NGN, 0 for salon visits
          total_price: number // service_price + home_visit_fee
          status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
          payment_status: 'unpaid' | 'deposit_paid' | 'fully_paid' | 'refunded'
          payment_reference: string | null // Paystack reference
          // Home visit details
          customer_address: string | null
          customer_area: string | null
          customer_landmark: string | null
          customer_phone: string | null
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
          visit_type?: 'salon' | 'home'
          appointment_date: string
          appointment_time: string
          duration_minutes: number
          service_price: number
          home_visit_fee?: number
          total_price: number
          status?: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
          payment_status?: 'unpaid' | 'deposit_paid' | 'fully_paid' | 'refunded'
          payment_reference?: string | null
          customer_address?: string | null
          customer_area?: string | null
          customer_landmark?: string | null
          customer_phone?: string | null
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
          visit_type?: 'salon' | 'home'
          appointment_date?: string
          appointment_time?: string
          duration_minutes?: number
          service_price?: number
          home_visit_fee?: number
          total_price?: number
          status?: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
          payment_status?: 'unpaid' | 'deposit_paid' | 'fully_paid' | 'refunded'
          payment_reference?: string | null
          customer_address?: string | null
          customer_area?: string | null
          customer_landmark?: string | null
          customer_phone?: string | null
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
