import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

/**
 * Admin/Service Role Supabase Client
 * For use in API routes and server operations that need to bypass RLS
 */
export const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase admin environment variables')
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Export a default instance for convenience
export const supabaseAdmin = createAdminClient()
