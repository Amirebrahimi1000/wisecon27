// Dev helper — create a throwaway confirmed user, complete a magic-link OTP,
// and print a real session (access_token + refresh_token) for local testing.
// Usage: npm run devlogin -- demo@example.com
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
for (const line of readFileSync(resolve(here, '..', '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

const url = process.env.VITE_SUPABASE_URL!
const anon = process.env.VITE_SUPABASE_ANON_KEY!
const secret = process.env.SUPABASE_SERVICE_ROLE_KEY!
const email = process.argv[2] || 'demo@example.com'

const admin = createClient(url, secret, { auth: { persistSession: false } })
const pub = createClient(url, anon, { auth: { persistSession: false } })

const run = async () => {
  await admin.auth.admin.createUser({ email, email_confirm: true }).catch(() => {})
  const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email })
  if (error) throw error
  const tokenHash = (data.properties as { hashed_token: string }).hashed_token
  const { data: v, error: ve } = await pub.auth.verifyOtp({ token_hash: tokenHash, type: 'magiclink' })
  if (ve) throw ve
  console.log(JSON.stringify({ access_token: v.session!.access_token, refresh_token: v.session!.refresh_token }))
}
run().catch((e) => { console.error(e.message); process.exit(1) })
