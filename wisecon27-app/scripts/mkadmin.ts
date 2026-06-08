// Grant admin to a user by email.  Usage: npm run mkadmin -- you@example.com
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
const email = process.argv[2]
if (!email) { console.error('Pass an email.'); process.exit(1) }

const { data: list } = await db.auth.admin.listUsers()
const user = list.users.find((u) => u.email === email)
if (!user) { console.error('No user with email ' + email); process.exit(1) }
const { error } = await db.from('profiles').update({ is_admin: true }).eq('id', user.id)
console.log(error ? '✗ ' + error.message : `✓ ${email} is now an admin`)
