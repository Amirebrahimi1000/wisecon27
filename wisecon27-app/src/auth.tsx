// WISEcon27 — authentication context (Supabase magic link).
// Tracks the session and exposes sign-in / sign-out. The magic-link callback
// is handled automatically by supabase-js (detectSessionInUrl), which fires
// onAuthStateChange and strips the token from the URL.
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'

interface AuthValue {
  session: Session | null
  loading: boolean
  signIn: (email: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthCtx = createContext<AuthValue | null>(null)

export function useAuth(): AuthValue {
  const v = useContext(AuthCtx)
  if (!v) throw new Error('useAuth must be used within <AuthProvider>')
  return v
}

// Where the magic link sends the user back to. Works in dev (http://localhost:5173/)
// and on GitHub Pages (https://…/wisecon27/) because it derives from the runtime
// origin + Vite base. Both are in the Supabase redirect allow-list.
const redirectTo = () => window.location.origin + import.meta.env.BASE_URL

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setLoading(false)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const signIn = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo() },
    })
    return { error: error?.message ?? null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return <AuthCtx.Provider value={{ session, loading, signIn, signOut }}>{children}</AuthCtx.Provider>
}
