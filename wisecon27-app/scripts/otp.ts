// Print the current email OTP for a user (for testing the code login).
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const here = dirname(fileURLToPath(import.meta.url))
for (const line of readFileSync(resolve(here, '..', '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const db = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
const email = process.argv[2] || 'amir.ebrahimi@uniwise.no'
const { data, error } = await db.auth.admin.generateLink({ type: 'magiclink', email })
if (error) { console.error(error.message); process.exit(1) }
console.log((data.properties as { email_otp: string }).email_otp)
