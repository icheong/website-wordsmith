import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** False when .env has not been filled in yet (see .env.example). */
export const isSupabaseConfigured = Boolean(url && anonKey)

/**
 * Shared Supabase client. Null until credentials are configured — every call
 * site must check `isSupabaseConfigured` first (the login page surfaces a
 * setup notice in that case).
 */
export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null
