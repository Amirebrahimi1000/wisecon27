// WISEcon27 — Supabase client.
// Reads config from Vite env (set in .env.local for dev, and as GitHub
// Actions secrets for the deployed build). The anon key is safe to ship to
// the browser — access is governed by Row-Level Security in the database.
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** True once both env vars are present — lets the UI show a setup hint otherwise. */
export const isSupabaseConfigured = Boolean(url && anon)

if (!isSupabaseConfigured) {
  // Not fatal: the app still loads so you can see the "connect your backend"
  // state during setup. Auth/data calls will no-op until configured.
  console.warn(
    '[WISEcon27] Supabase env missing. Set VITE_SUPABASE_URL and ' +
      'VITE_SUPABASE_ANON_KEY in wisecon27-app/.env.local (see .env.example).',
  )
}

export const supabase: SupabaseClient = createClient(
  url ?? 'https://placeholder.supabase.co',
  anon ?? 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true, // needed for the magic-link callback
    },
  },
)
