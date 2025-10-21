import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create a properly typed Supabase client
const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Typed client wrapper to ensure proper TypeScript inference
export const supabase: SupabaseClient<Database> = supabaseClient

// Export specific table types for convenience
export type ProfileRow = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type SalonRow = Database['public']['Tables']['salons']['Row']
export type NailColorRow = Database['public']['Tables']['nail_colors']['Row']
export type MaterialRow = Database['public']['Tables']['materials']['Row']
export type TechnicianRow = Database['public']['Tables']['technicians']['Row']
export type DesignTemplateRow = Database['public']['Tables']['design_templates']['Row']
export type SavedLookRow = Database['public']['Tables']['saved_looks']['Row']
export type BookingRow = Database['public']['Tables']['bookings']['Row']

export type BookingInsert = Database['public']['Tables']['bookings']['Insert']
export type SavedLookInsert = Database['public']['Tables']['saved_looks']['Insert']

// Export the Database type
export type { Database }

export default supabase
