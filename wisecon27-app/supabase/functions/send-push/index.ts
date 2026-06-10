// WISEcon27 — send-push edge function (Deno).
// Sends a Web Push to every stored subscription. Invoked by the admin broadcast.
//
// Deploy:  supabase functions deploy send-push --project-ref ezarvuqrwlhhejrofqtj
// Secrets: supabase secrets set VAPID_PUBLIC_KEY=… VAPID_PRIVATE_KEY=… VAPID_SUBJECT=mailto:you@org.com
// (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically.)
import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const { title, body, url } = await req.json().catch(() => ({}))

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  webpush.setVapidDetails(
    Deno.env.get('VAPID_SUBJECT') ?? 'mailto:hello@wisecon27.example',
    Deno.env.get('VAPID_PUBLIC_KEY')!,
    Deno.env.get('VAPID_PRIVATE_KEY')!,
  )

  const [{ data: allSubs }, { data: muted }] = await Promise.all([
    supabase.from('push_subscriptions').select('*'),
    supabase.from('profiles').select('id').eq('notif_prefs->>announce', 'false'),
  ])
  const mutedIds = new Set((muted ?? []).map((m: { id: string }) => m.id))
  const subs = (allSubs ?? []).filter((s: { user_id: string }) => !mutedIds.has(s.user_id))
  const payload = JSON.stringify({ title: title ?? 'WISEcon27', body: body ?? '', url })

  let sent = 0
  await Promise.all(
    (subs ?? []).map(async (s: { endpoint: string; p256dh: string; auth: string }) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
        )
        sent++
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode
        if (code === 404 || code === 410) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', s.endpoint)
        }
      }
    }),
  )

  return new Response(JSON.stringify({ sent }), {
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
})
