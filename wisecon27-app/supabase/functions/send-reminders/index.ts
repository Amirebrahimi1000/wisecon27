// WISEcon27 — send-reminders edge function (Deno).
// Swept on a schedule (see 0016_session_reminders.sql): finds session reminders
// that are due and not yet sent, pushes them to the delegate's devices, and
// stamps sent_at so each fires exactly once — even when the app is closed.
//
// Deploy:  supabase functions deploy send-reminders --no-verify-jwt
// Secrets: VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT (already set),
//          optionally CRON_SECRET to lock the endpoint to the scheduler.
import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-key',
}
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } })

interface DueRow {
  user_id: string
  session_id: string
  sessions: { title: string; room: string; start: string } | null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  // optional shared-secret gate: if CRON_SECRET is set, require it
  const secret = Deno.env.get('CRON_SECRET')
  if (secret && req.headers.get('x-cron-key') !== secret) return json({ error: 'Forbidden' }, 403)

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  )

  // due = remind time has passed and we haven't sent it yet. Cap the batch so a
  // backlog can't blow the function's time budget; the next sweep takes the rest.
  const nowIso = new Date().toISOString()
  const { data: due, error } = await supabase
    .from('session_reminders')
    .select('user_id, session_id, sessions(title, room, start)')
    .lte('remind_at', nowIso)
    .is('sent_at', null)
    .order('remind_at')
    .limit(500)
  if (error) return json({ error: error.message }, 500)
  const rows = (due ?? []) as DueRow[]
  if (!rows.length) return json({ sent: 0, due: 0 })

  webpush.setVapidDetails(
    Deno.env.get('VAPID_SUBJECT') ?? 'mailto:hello@wisecon27.example',
    Deno.env.get('VAPID_PUBLIC_KEY')!,
    Deno.env.get('VAPID_PRIVATE_KEY')!,
  )

  // group reminders by user so we fetch each delegate's subscriptions once
  const byUser = new Map<string, DueRow[]>()
  for (const r of rows) {
    const arr = byUser.get(r.user_id)
    if (arr) arr.push(r)
    else byUser.set(r.user_id, [r])
  }

  let sent = 0
  const stamped: { user_id: string; session_id: string }[] = []
  await Promise.all(
    [...byUser.entries()].map(async ([userId, reminders]) => {
      const { data: subs } = await supabase.from('push_subscriptions').select('*').eq('user_id', userId)
      for (const r of reminders) {
        const title = r.sessions?.title ?? 'Upcoming session'
        const body = ['Starts soon', r.sessions?.start, r.sessions?.room].filter(Boolean).join(' · ')
        const payload = JSON.stringify({ title, body, url: '' })
        await Promise.all(
          (subs ?? []).map(async (s: { endpoint: string; p256dh: string; auth: string }) => {
            try {
              await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload)
              sent++
            } catch (e) {
              const code = (e as { statusCode?: number }).statusCode
              if (code === 404 || code === 410) await supabase.from('push_subscriptions').delete().eq('endpoint', s.endpoint)
            }
          }),
        )
        // stamp regardless of subscription count so a reminder never re-fires
        stamped.push({ user_id: userId, session_id: r.session_id })
      }
    }),
  )

  // mark everything we processed as sent
  await Promise.all(
    stamped.map((r) =>
      supabase.from('session_reminders').update({ sent_at: nowIso }).eq('user_id', r.user_id).eq('session_id', r.session_id),
    ),
  )

  return json({ sent, processed: stamped.length })
})
