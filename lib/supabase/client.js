import { createBrowserClient } from '@supabase/ssr'

// Cache the client instance to avoid recreating it
let supabaseClient = null

export function createClient() {
  // Reuse existing client if available
  if (supabaseClient) {
    return supabaseClient
  }

  supabaseClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  
  return supabaseClient
}

