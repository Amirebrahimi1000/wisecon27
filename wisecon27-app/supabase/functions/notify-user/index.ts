// WISEcon27 — notify-user edge function (Deno).
// Sends a Web Push to ONE delegate's devices. Used for connect requests and
// direct messages. The caller must be signed in and have a connection row
// (any status) with the target — preventing arbitrary push spam.
//
// Deploy:  supabase functions deploy notify-user
// Secrets: VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT (already set for send-push)
import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })

  // who is calling?
  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!jwt) return json({ error: 'Not signed in' }, 401)
  const { data: who } = await admin.auth.getUser(jwt)
  if (!who.user) return json({ error: 'Invalid session' }, 401)
  const me = who.user.id

  const { toUserId, kind, title, body, url } = await req.json().catch(() => ({}))
  if (!toUserId || toUserId === me) return json({ error: 'Bad request' }, 400)

  // gate: a connection row must exist between caller and target (either direction)
  const { data: rel } = await admin
    .from('connections')
    .select('status')
    .or(`and(requester_id.eq.${me},target_id.eq.${toUserId}),and(requester_id.eq.${toUserId},target_id.eq.${me})`)
    .maybeSingle()
  if (!rel) return json({ error: 'No connection with this user' }, 403)

  webpush.setVapidDetails(
    Deno.env.get('VAPID_SUBJECT') ?? 'mailto:hello@wisecon27.example',
    Deno.env.get('VAPID_PUBLIC_KEY')!,
    Deno.env.get('VAPID_PRIVATE_KEY')!,
  )

  // respect the recipient's notification topics (missing key = ON)
  if (kind === 'connect' || kind === 'message') {
    const { data: prof } = await admin.from('profiles').select('notif_prefs').eq('id', toUserId).maybeSingle()
    const prefs = (prof?.notif_prefs ?? {}) as Record<string, boolean>
    if (prefs[kind] === false) return json({ sent: 0, muted: true })
  }

  const { data: subs } = await admin.from('push_subscriptions').select('*').eq('user_id', toUserId)
  const payload = JSON.stringify({ title: title ?? 'WISEcon27', body: body ?? '', url })

  let sent = 0
  await Promise.all(
    (subs ?? []).map(async (s: { endpoint: string; p256dh: string; auth: string }) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload)
        sent++
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode
        if (code === 404 || code === 410) await admin.from('push_subscriptions').delete().eq('endpoint', s.endpoint)
      }
    }),
  )

  return json({ sent })
})
