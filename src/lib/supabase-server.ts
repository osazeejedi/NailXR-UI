import { createServerComponentClient, createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from './database.types'

// Server component client (for use in server components)
export const createServerClient = () => createServerComponentClient<Database>({ cookies })

// Client component client (for use in client components that need SSR)
export const createClientComponent = () => createClientComponentClient<Database>()

// Service role client (for API routes that need to bypass RLS)
export const createServiceRoleClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase service role environment variables')
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
