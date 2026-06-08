// WISEcon27 — seed the Supabase database from the canonical data.ts.
//
//   1. Run the migration first (supabase/migrations/0001_init.sql).
//   2. Put SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local
//      (the service-role key bypasses RLS — server-side only, never shipped).
//   3. npm run seed
//
// Re-runnable: every table is upserted by primary key.
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DAYS, SPEAKERS, SESSIONS, SPONSORS, NOTIFICATIONS } from '../src/data'

// minimal .env.local loader (no extra dependency)
const here = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(here, '..', '.env.local')
try {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
} catch {
  /* no .env.local — rely on real env vars */
}

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Missing SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY (see .env.example).')
  process.exit(1)
}
const db = createClient(url, key, { auth: { persistSession: false } })

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const EVENT_INFO = [
  { id: 'wifi', icon: 'wifi', label: 'Wi-Fi network', detail: 'WISEcon27', sort: 0 },
  { id: 'wifipass', icon: 'shield', label: 'Wi-Fi password', detail: 'assessment27', sort: 1 },
  { id: 'venue', icon: 'pin', label: 'Venue', detail: 'Musikhuset Aarhus', sort: 2 },
  { id: 'reg', icon: 'clock', label: 'Registration', detail: 'Opens 08:00 daily', sort: 3 },
  { id: 'catering', icon: 'coffee', label: 'Catering', detail: 'Foyer & terrace', sort: 4 },
  { id: 'help', icon: 'info', label: 'Help desk', detail: 'Main foyer', sort: 5 },
]

async function upsert(table: string, rows: unknown[], onConflict = 'id') {
  const { error } = await db.from(table).upsert(rows as never[], { onConflict })
  if (error) {
    console.error(`✗ ${table}:`, error.message)
    process.exitCode = 1
  } else {
    console.log(`✓ ${table} (${rows.length})`)
  }
}

async function main() {
  await upsert('days', DAYS.map((d, i) => ({ ...d, sort: i })))

  await upsert('speakers', SPEAKERS.map((s, i) => ({
    id: s.id, name: s.name, role: s.role, org: s.org, initials: s.initials,
    color: s.color, bio: s.bio, topics: s.topics, sort: i,
  })))

  await upsert('sessions', SESSIONS.map((s) => ({
    id: s.id, day_id: s.day, start: s.start, end: s.end, title: s.title,
    type: s.type, track: s.track, room: s.room, desc: s.desc,
    tags: s.tags ?? [], going: s.going, capacity: s.capacity ?? null,
  })))

  const links = SESSIONS.flatMap((s) =>
    (s.speakers || []).map((sp, ord) => ({ session_id: s.id, speaker_id: sp, ord })),
  )
  await upsert('session_speakers', links, 'session_id,speaker_id')

  await upsert('sponsors', SPONSORS.map((s, i) => ({
    id: slug(s.name), name: s.name, tier: s.tier, blurb: s.blurb,
    initials: s.initials, color: s.color, sort: i,
  })))

  await upsert('event_info', EVENT_INFO)

  // Announcements have auto uuid ids, so insert the sample set only once
  // (when the table is empty) to avoid duplicates on re-runs.
  const { count } = await db.from('announcements').select('id', { count: 'exact', head: true })
  if (!count) {
    const { error } = await db
      .from('announcements')
      .insert(NOTIFICATIONS.map((n) => ({ type: n.type, title: n.title, body: n.body })))
    console.log(error ? `✗ announcements: ${error.message}` : `✓ announcements (${NOTIFICATIONS.length})`)
  } else {
    console.log(`• announcements (${count} already present — skipped)`)
  }

  // Seed one live poll for the opening keynote (only if it has none yet).
  const POLL_SESSION = 's102'
  const { data: existingPoll } = await db.from('polls').select('id').eq('session_id', POLL_SESSION).maybeSingle()
  if (!existingPoll) {
    const { data: poll } = await db
      .from('polls')
      .insert({ session_id: POLL_SESSION, question: 'Where should institutions invest first to protect integrity?', is_live: true })
      .select('id')
      .single()
    if (poll) {
      await db.from('poll_options').insert(
        ['Detection tools', 'Redesigning assessments', 'Both equally', 'Neither — policy first'].map((label, sort) => ({
          poll_id: poll.id, label, sort,
        })),
      )
      console.log('✓ poll (1) for ' + POLL_SESSION)
    }
  } else {
    console.log('• poll already present — skipped')
  }

  console.log('\nSeed complete. Tip: make yourself an admin after signing up:')
  console.log("  update public.profiles set is_admin = true where id = '<your-user-id>';")
}

main()
