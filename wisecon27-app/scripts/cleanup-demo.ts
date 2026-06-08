// One-off: remove the demo/test data created while building. Safe to re-run.
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

const run = async () => {
  const s = await db.from('sessions').delete().like('id', 'sx-%').select('id')
  console.log(`✓ removed ${s.data?.length ?? 0} test session(s)`)
  const a = await db.from('announcements').delete().eq('title', 'Lunch is served').select('id')
  console.log(`✓ removed ${a.data?.length ?? 0} test announcement(s)`)
  const q = await db.from('questions').delete().ilike('body', 'How should we communicate detection thresholds%').select('id')
  console.log(`✓ removed ${q.data?.length ?? 0} test question(s)`)
  // remove any poll votes (test) so the seeded poll starts at zero
  const pv = await db.from('poll_votes').delete().neq('poll_id', '00000000-0000-0000-0000-000000000000').select('user_id')
  console.log(`✓ cleared ${pv.data?.length ?? 0} poll vote(s)`)
  const { data: list } = await db.auth.admin.listUsers()
  const demo = list.users.find((u) => u.email === 'demo@example.com')
  if (demo) {
    await db.auth.admin.deleteUser(demo.id)
    console.log('✓ deleted demo@example.com account (cascades its data)')
  } else {
    console.log('• no demo account found')
  }
}
run().catch((e) => { console.error(e.message); process.exit(1) })
