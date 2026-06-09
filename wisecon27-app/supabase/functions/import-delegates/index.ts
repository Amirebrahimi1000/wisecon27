// WISEcon27 — import-delegates edge function (Deno).
// Admin-only. Creates delegate accounts from a list and pre-fills their profile,
// so registered attendees exist before they sign in. With open sign-up disabled,
// this is the only way new delegates are added.
//
// Deploy: supabase functions deploy import-delegates --project-ref ezarvuqrwlhhejrofqtj
// (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically.)
import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

const initialsOf = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')

interface DelegateInput { email: string; name?: string; role?: string; org?: string }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  })

  // gate: caller must be a signed-in admin
  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!jwt) return json({ error: 'Not signed in' }, 401)
  const { data: who } = await admin.auth.getUser(jwt)
  if (!who.user) return json({ error: 'Invalid session' }, 401)
  const { data: prof } = await admin.from('profiles').select('is_admin').eq('id', who.user.id).single()
  if (!prof?.is_admin) return json({ error: 'Admins only' }, 403)

  const body = (await req.json().catch(() => ({}))) as { action?: string; delegates?: DelegateInput[]; id?: string }
  const action = body.action ?? 'import'

  // ── list the full roster (profiles joined with auth: email, last sign-in) ──
  if (action === 'list') {
    const { data: profs } = await admin.from('profiles').select('id, name, role, org, is_admin, avatar_url')
    const pById = new Map((profs ?? []).map((p) => [p.id as string, p]))
    const out: unknown[] = []
    for (let page = 1; ; page++) {
      const { data } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
      const users = data?.users ?? []
      for (const u of users) {
        const p = pById.get(u.id) as { name?: string; role?: string; org?: string; is_admin?: boolean; avatar_url?: string } | undefined
        out.push({
          id: u.id, email: u.email, name: p?.name ?? '', role: p?.role ?? '', org: p?.org ?? '',
          is_admin: p?.is_admin ?? false, avatar_url: p?.avatar_url ?? null,
          signed_in: !!u.last_sign_in_at,
        })
      }
      if (users.length < 1000) break
    }
    out.sort((a, b) => ((a as { name: string }).name || (a as { email: string }).email).localeCompare((b as { name: string }).name || (b as { email: string }).email))
    return json({ delegates: out })
  }

  // ── remove a delegate ──
  if (action === 'delete') {
    if (!body.id) return json({ error: 'No id' }, 400)
    if (body.id === who.user.id) return json({ error: "You can't remove your own account" }, 400)
    const { error } = await admin.auth.admin.deleteUser(body.id)
    return error ? json({ error: error.message }, 400) : json({ ok: true })
  }

  // ── import (default) ──
  const delegates = body.delegates
  if (!Array.isArray(delegates) || !delegates.length) return json({ error: 'No delegates provided' }, 400)

  // map existing emails → id (page through all users)
  const byEmail = new Map<string, string>()
  for (let page = 1; ; page++) {
    const { data } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    const users = data?.users ?? []
    users.forEach((u) => u.email && byEmail.set(u.email.toLowerCase(), u.id))
    if (users.length < 1000) break
  }

  let created = 0, updated = 0, failed = 0
  for (const d of delegates) {
    const email = (d.email || '').trim().toLowerCase()
    if (!email || !email.includes('@')) { failed++; continue }
    let userId = byEmail.get(email)
    if (!userId) {
      const { data: cu, error } = await admin.auth.admin.createUser({ email, email_confirm: true })
      if (error || !cu.user) { failed++; continue }
      userId = cu.user.id
      byEmail.set(email, userId)
      created++
    } else {
      updated++
    }
    // pre-fill profile (only set fields we were given; keep existing otherwise)
    const patch: Record<string, unknown> = {}
    if (d.name?.trim()) { patch.name = d.name.trim(); patch.initials = initialsOf(d.name) }
    if (d.role?.trim()) patch.role = d.role.trim()
    if (d.org?.trim()) patch.org = d.org.trim()
    if (Object.keys(patch).length) await admin.from('profiles').update(patch).eq('id', userId)
  }

  return json({ created, updated, failed, total: delegates.length })
})
