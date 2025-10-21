export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          appointment_date: string
          appointment_time: string
          created_at: string | null
          design_template_id: string | null
          duration_minutes: number
          id: string
          nail_style_id: string | null
          notes: string | null
          price: number
          salon_id: string | null
          saved_look_id: string | null
          status: Database["public"]["Enums"]["booking_status"] | null
          technician_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          created_at?: string | null
          design_template_id?: string | null
          duration_minutes: number
          id?: string
          nail_style_id?: string | null
          notes?: string | null
          price: number
          salon_id?: string | null
          saved_look_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"] | null
          technician_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          created_at?: string | null
          design_template_id?: string | null
          duration_minutes?: number
          id?: string
          nail_style_id?: string | null
          notes?: string | null
          price?: number
          salon_id?: string | null
          saved_look_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"] | null
          technician_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_design_template_id_fkey"
            columns: ["design_template_id"]
            isOneToOne: false
            referencedRelation: "design_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_nail_style_id_fkey"
            columns: ["nail_style_id"]
            isOneToOne: false
            referencedRelation: "nail_styles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_saved_look_id_fkey"
            columns: ["saved_look_id"]
            isOneToOne: false
            referencedRelation: "saved_looks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      design_templates: {
        Row: {
          base_price: number | null
          category: Database["public"]["Enums"]["design_category"]
          created_at: string | null
          description: string | null
          difficulty: Database["public"]["Enums"]["skill_level"] | null
          estimated_time: number | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          name: string
          optional_colors: string[] | null
          popularity_score: number | null
          required_colors: string[] | null
          required_materials: string[] | null
          required_skill_level:
            | Database["public"]["Enums"]["skill_level"]
            | null
          salon_id: string | null
          steps: string[] | null
          updated_at: string | null
        }
        Insert: {
          base_price?: number | null
          category: Database["public"]["Enums"]["design_category"]
          created_at?: string | null
          description?: string | null
          difficulty?: Database["public"]["Enums"]["skill_level"] | null
          estimated_time?: number | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          name: string
          optional_colors?: string[] | null
          popularity_score?: number | null
          required_colors?: string[] | null
          required_materials?: string[] | null
          required_skill_level?:
            | Database["public"]["Enums"]["skill_level"]
            | null
          salon_id?: string | null
          steps?: string[] | null
          updated_at?: string | null
        }
        Update: {
          base_price?: number | null
          category?: Database["public"]["Enums"]["design_category"]
          created_at?: string | null
          description?: string | null
          difficulty?: Database["public"]["Enums"]["skill_level"] | null
          estimated_time?: number | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          name?: string
          optional_colors?: string[] | null
          popularity_score?: number | null
          required_colors?: string[] | null
          required_materials?: string[] | null
          required_skill_level?:
            | Database["public"]["Enums"]["skill_level"]
            | null
          salon_id?: string | null
          steps?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "design_templates_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          created_at: string | null
          id: string
          image_url: string | null
          in_stock: boolean | null
          name: string
          price: number | null
          quantity: number | null
          salon_id: string | null
          type: Database["public"]["Enums"]["material_type"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean | null
          name: string
          price?: number | null
          quantity?: number | null
          salon_id?: string | null
          type: Database["public"]["Enums"]["material_type"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean | null
          name?: string
          price?: number | null
          quantity?: number | null
          salon_id?: string | null
          type?: Database["public"]["Enums"]["material_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "materials_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      nail_colors: {
        Row: {
          brand: string
          created_at: string | null
          finish: Database["public"]["Enums"]["nail_finish"] | null
          hex: string
          id: string
          in_stock: boolean | null
          name: string
          price: number | null
          quantity: number | null
          salon_id: string | null
          updated_at: string | null
        }
        Insert: {
          brand: string
          created_at?: string | null
          finish?: Database["public"]["Enums"]["nail_finish"] | null
          hex: string
          id?: string
          in_stock?: boolean | null
          name: string
          price?: number | null
          quantity?: number | null
          salon_id?: string | null
          updated_at?: string | null
        }
        Update: {
          brand?: string
          created_at?: string | null
          finish?: Database["public"]["Enums"]["nail_finish"] | null
          hex?: string
          id?: string
          in_stock?: boolean | null
          name?: string
          price?: number | null
          quantity?: number | null
          salon_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nail_colors_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      nail_styles: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          image_url: string
          is_featured: boolean | null
          name: string
          price_range_max: number | null
          price_range_min: number | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          image_url: string
          is_featured?: boolean | null
          name: string
          price_range_max?: number | null
          price_range_min?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          image_url?: string
          is_featured?: boolean | null
          name?: string
          price_range_max?: number | null
          price_range_min?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      onboarding_applications: {
        Row: {
          business_name: string
          created_at: string | null
          email: string
          form_data: Json | null
          id: string
          status: string | null
          step_completed: number | null
          subdomain: string
          updated_at: string | null
        }
        Insert: {
          business_name: string
          created_at?: string | null
          email: string
          form_data?: Json | null
          id?: string
          status?: string | null
          step_completed?: number | null
          subdomain: string
          updated_at?: string | null
        }
        Update: {
          business_name?: string
          created_at?: string | null
          email?: string
          form_data?: Json | null
          id?: string
          status?: string | null
          step_completed?: number | null
          subdomain?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          metadata: Json | null
          status: string
          stripe_payment_intent_id: string | null
          tenant_id: string
          type: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          status: string
          stripe_payment_intent_id?: string | null
          tenant_id: string
          type: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          stripe_payment_intent_id?: string | null
          tenant_id?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          id: string
          name: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          id: string
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      salons: {
        Row: {
          address: string
          city: string
          country: string
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          email: string | null
          id: string
          is_active: boolean | null
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          name: string
          owner_id: string | null
          phone: string | null
          primary_color: string | null
          secondary_color: string | null
          slug: string
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address: string
          city: string
          country: string
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name: string
          owner_id?: string | null
          phone?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          slug: string
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string
          city?: string
          country?: string
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          owner_id?: string | null
          phone?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          slug?: string
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salons_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_looks: {
        Row: {
          color_hex: string
          created_at: string | null
          design_template_id: string | null
          hand_model_config: Json | null
          id: string
          nail_style_id: string | null
          name: string
          notes: string | null
          preview_image_url: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          color_hex: string
          created_at?: string | null
          design_template_id?: string | null
          hand_model_config?: Json | null
          id?: string
          nail_style_id?: string | null
          name: string
          notes?: string | null
          preview_image_url?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          color_hex?: string
          created_at?: string | null
          design_template_id?: string | null
          hand_model_config?: Json | null
          id?: string
          nail_style_id?: string | null
          name?: string
          notes?: string | null
          preview_image_url?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saved_looks_design_template_id_fkey"
            columns: ["design_template_id"]
            isOneToOne: false
            referencedRelation: "design_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_looks_nail_style_id_fkey"
            columns: ["nail_style_id"]
            isOneToOne: false
            referencedRelation: "nail_styles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_looks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subdomain_reservations: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          status: string | null
          subdomain: string
          tenant_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          status?: string | null
          subdomain: string
          tenant_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          status?: string | null
          subdomain?: string
          tenant_id?: string | null
        }
        Relationships: []
      }
      technicians: {
        Row: {
          available: boolean | null
          created_at: string | null
          hourly_rate: number | null
          id: string
          name: string
          profile_id: string | null
          salon_id: string | null
          skill_level: Database["public"]["Enums"]["skill_level"] | null
          specialties: string[] | null
          updated_at: string | null
        }
        Insert: {
          available?: boolean | null
          created_at?: string | null
          hourly_rate?: number | null
          id?: string
          name: string
          profile_id?: string | null
          salon_id?: string | null
          skill_level?: Database["public"]["Enums"]["skill_level"] | null
          specialties?: string[] | null
          updated_at?: string | null
        }
        Update: {
          available?: boolean | null
          created_at?: string | null
          hourly_rate?: number | null
          id?: string
          name?: string
          profile_id?: string | null
          salon_id?: string | null
          skill_level?: Database["public"]["Enums"]["skill_level"] | null
          specialties?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "technicians_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technicians_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_analytics: {
        Row: {
          bookings_created: number | null
          created_at: string | null
          date: string
          id: string
          metadata: Json | null
          revenue_generated: number | null
          saved_looks: number | null
          tenant_id: string
          total_visitors: number | null
          try_on_sessions: number | null
          unique_visitors: number | null
        }
        Insert: {
          bookings_created?: number | null
          created_at?: string | null
          date: string
          id?: string
          metadata?: Json | null
          revenue_generated?: number | null
          saved_looks?: number | null
          tenant_id: string
          total_visitors?: number | null
          try_on_sessions?: number | null
          unique_visitors?: number | null
        }
        Update: {
          bookings_created?: number | null
          created_at?: string | null
          date?: string
          id?: string
          metadata?: Json | null
          revenue_generated?: number | null
          saved_looks?: number | null
          tenant_id?: string
          total_visitors?: number | null
          try_on_sessions?: number | null
          unique_visitors?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_analytics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_payments: {
        Row: {
          created_at: string | null
          id: string
          monthly_fee_active: boolean | null
          setup_fee_paid: boolean | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          monthly_fee_active?: boolean | null
          setup_fee_paid?: boolean | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          monthly_fee_active?: boolean | null
          setup_fee_paid?: boolean | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tenant_id?: string
        }
        Relationships: []
      }
      tenant_users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          invitation_expires_at: string | null
          invitation_status: string | null
          invitation_token: string | null
          is_primary: boolean | null
          role: string | null
          tenant_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          invitation_expires_at?: string | null
          invitation_status?: string | null
          invitation_token?: string | null
          is_primary?: boolean | null
          role?: string | null
          tenant_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          invitation_expires_at?: string | null
          invitation_status?: string | null
          invitation_token?: string | null
          is_primary?: boolean | null
          role?: string | null
          tenant_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          config: Json
          created_at: string | null
          domain: string
          id: string
          is_active: boolean | null
          name: string
          status: string | null
          subdomain: string
          trial_end_date: string | null
          updated_at: string | null
        }
        Insert: {
          config: Json
          created_at?: string | null
          domain: string
          id: string
          is_active?: boolean | null
          name: string
          status?: string | null
          subdomain: string
          trial_end_date?: string | null
          updated_at?: string | null
        }
        Update: {
          config?: Json
          created_at?: string | null
          domain?: string
          id?: string
          is_active?: boolean | null
          name?: string
          status?: string | null
          subdomain?: string
          trial_end_date?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      trial_notifications: {
        Row: {
          created_at: string | null
          email_to: string
          id: string
          metadata: Json | null
          notification_type: string
          sent_at: string | null
          status: string | null
          subject: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          email_to: string
          id?: string
          metadata?: Json | null
          notification_type: string
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          email_to?: string
          id?: string
          metadata?: Json | null
          notification_type?: string
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trial_notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_reservations: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_active_tenants_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_trials_expiring_soon: {
        Args: Record<PropertyKey, never>
        Returns: {
          days_remaining: number
          subdomain: string
          tenant_id: string
          tenant_name: string
          trial_end_date: string
        }[]
      }
    }
    Enums: {
      booking_status: "pending" | "confirmed" | "completed" | "cancelled"
      design_category:
        | "french"
        | "ombre"
        | "geometric"
        | "floral"
        | "abstract"
        | "seasonal"
      material_type: "gem" | "sticker" | "foil" | "glitter" | "charm" | "tool"
      nail_finish: "glossy" | "matte" | "glitter" | "metallic"
      skill_level: "basic" | "intermediate" | "advanced"
      user_role: "user" | "salon_owner" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      booking_status: ["pending", "confirmed", "completed", "cancelled"],
      design_category: [
        "french",
        "ombre",
        "geometric",
        "floral",
        "abstract",
        "seasonal",
      ],
      material_type: ["gem", "sticker", "foil", "glitter", "charm", "tool"],
      nail_finish: ["glossy", "matte", "glitter", "metallic"],
      skill_level: ["basic", "intermediate", "advanced"],
      user_role: ["user", "salon_owner", "admin"],
    },
  },
} as const
