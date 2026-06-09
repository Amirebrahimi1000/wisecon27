// WISEcon27 — sync-hubspot edge function (Deno). Admin-only.
// Pulls members of a HubSpot active list (registrants who consented) and
// creates/updates them as delegates. The list rule (submitted "WISEcon27
// pre-regist" AND app-consent = yes) lives in HubSpot, so consent is enforced
// there and only consented registrants ever enter the app.
//
// Secrets to set:  HUBSPOT_TOKEN (private-app token, scope crm.objects.contacts.read + crm.lists.read)
//                  HUBSPOT_LIST_ID (the ILS list id of the registrants list)
import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } })
const initialsOf = (n: string) => n.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })

  // admin gate
  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!jwt) return json({ error: 'Not signed in' }, 401)
  const { data: who } = await admin.auth.getUser(jwt)
  if (!who.user) return json({ error: 'Invalid session' }, 401)
  const { data: prof } = await admin.from('profiles').select('is_admin').eq('id', who.user.id).single()
  if (!prof?.is_admin) return json({ error: 'Admins only' }, 403)

  const token = Deno.env.get('HUBSPOT_TOKEN')
  const listId = Deno.env.get('HUBSPOT_LIST_ID')
  if (!token || !listId) return json({ error: 'HubSpot is not configured (missing token or list id)' }, 400)
  const hs = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  // 1) list memberships → contact record ids (paginated)
  const ids: string[] = []
  let after: string | undefined
  do {
    const u = new URL(`https://api.hubapi.com/crm/v3/lists/${listId}/memberships`)
    u.searchParams.set('limit', '100')
    if (after) u.searchParams.set('after', after)
    const res = await fetch(u, { headers: hs })
    if (!res.ok) return json({ error: `HubSpot list error ${res.status}: ${await res.text()}` }, 400)
    const body = await res.json()
    for (const r of body.results ?? []) ids.push(String(r.recordId))
    after = body.paging?.next?.after
  } while (after)

  if (!ids.length) return json({ created: 0, updated: 0, failed: 0, total: 0 })

  // 2) batch-read contact properties (100 per call)
  const contacts: { email?: string; firstname?: string; lastname?: string; company?: string; jobtitle?: string }[] = []
  for (let i = 0; i < ids.length; i += 100) {
    const res = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/batch/read', {
      method: 'POST', headers: hs,
      body: JSON.stringify({ properties: ['email', 'firstname', 'lastname', 'company', 'jobtitle'], inputs: ids.slice(i, i + 100).map((id) => ({ id })) }),
    })
    if (!res.ok) return json({ error: `HubSpot read error ${res.status}` }, 400)
    const body = await res.json()
    for (const r of body.results ?? []) contacts.push(r.properties ?? {})
  }

  // 3) existing accounts map
  const byEmail = new Map<string, string>()
  for (let page = 1; ; page++) {
    const { data } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    const users = data?.users ?? []
    users.forEach((u) => u.email && byEmail.set(u.email.toLowerCase(), u.id))
    if (users.length < 1000) break
  }

  // 4) create / update delegates (and remember who's currently on the list)
  const syncedEmails = new Set<string>()
  let created = 0, updated = 0, failed = 0
  for (const c of contacts) {
    const email = (c.email || '').trim().toLowerCase()
    if (!email.includes('@')) { failed++; continue }
    syncedEmails.add(email)
    const name = [c.firstname, c.lastname].filter(Boolean).join(' ').trim()
    let userId = byEmail.get(email)
    if (!userId) {
      const { data: cu, error } = await admin.auth.admin.createUser({ email, email_confirm: true })
      if (error || !cu.user) { failed++; continue }
      userId = cu.user.id; byEmail.set(email, userId); created++
    } else updated++
    const patch: Record<string, unknown> = { from_hubspot: true }
    if (name) { patch.name = name; patch.initials = initialsOf(name) }
    if (c.jobtitle) patch.role = c.jobtitle
    if (c.company) patch.org = c.company
    await admin.from('profiles').update(patch).eq('id', userId)
  }

  // 5) reconcile: remove delegates we previously synced from HubSpot who are no
  //    longer on the list. Never touches admins, the caller, or manually-added
  //    (from_hubspot = false) delegates.
  let removed = 0
  const { data: hsProfiles } = await admin.from('profiles').select('id, is_admin').eq('from_hubspot', true)
  const idToEmail = new Map<string, string>()
  for (const [em, id] of byEmail) idToEmail.set(id, em)
  for (const p of (hsProfiles ?? []) as { id: string; is_admin: boolean }[]) {
    if (p.is_admin || p.id === who.user.id) continue
    const em = idToEmail.get(p.id)
    if (em && !syncedEmails.has(em)) { await admin.auth.admin.deleteUser(p.id); removed++ }
  }

  return json({ created, updated, removed, failed, total: contacts.length })
})
