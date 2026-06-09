// Delete a user by email (admin). Usage: npx tsx scripts/del-user.ts someone@example.com
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
const { data } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 })
const u = data.users.find((x) => x.email === email)
if (!u) { console.log('not found'); process.exit(0) }
const { error } = await db.auth.admin.deleteUser(u.id)
console.log(error ? '✗ ' + error.message : '✓ deleted ' + email)
