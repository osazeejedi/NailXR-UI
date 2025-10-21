import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Client-side Supabase client for use in client components
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Export types for convenience
export type { Database }
export type ProfilesTable = Database['public']['Tables']['profiles']
export type SalonsTable = Database['public']['Tables']['salons']
export type NailColorsTable = Database['public']['Tables']['nail_colors']
export type MaterialsTable = Database['public']['Tables']['materials']
export type TechniciansTable = Database['public']['Tables']['technicians']
export type DesignTemplatesTable = Database['public']['Tables']['design_templates']
export type SavedLooksTable = Database['public']['Tables']['saved_looks']
export type BookingsTable = Database['public']['Tables']['bookings']

// Export the client for compatibility
export default supabase
