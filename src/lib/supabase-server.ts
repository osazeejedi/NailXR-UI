import { createServerComponentClient, createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from './types'

// Server component client (for use in server components)
export const createServerClient = () => createServerComponentClient<Database>({ cookies })

// Client component client (for use in client components that need SSR)
export const createClientComponent = () => createClientComponentClient<Database>()
