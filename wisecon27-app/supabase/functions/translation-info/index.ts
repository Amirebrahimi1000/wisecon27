// WISEcon27 — translation-info edge function (Deno).
// Auto-translates an info_sections card (title + body) into EN/DA/NO/DE with
// Claude, and writes the result back to title_i18n / body_i18n. Invoked by the
// admin after saving a section. Brand names, URLs and addresses are preserved.
//
// Deploy:  supabase functions deploy translation-info
// Secrets: supabase secrets set ANTHROPIC_API_KEY=sk-ant-…
//          (optional) ANTHROPIC_MODEL — defaults to claude-opus-4-8.
import Anthropic from 'npm:@anthropic-ai/sdk'
import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } })

const LANGS = ['en', 'da', 'no', 'de'] as const
const LANG_NAMES: Record<string, string> = { en: 'English', da: 'Danish', no: 'Norwegian (Bokmål)', de: 'German' }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) return json({ error: 'ANTHROPIC_API_KEY not configured' }, 500)

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })

  // only an admin may trigger translation (keeps token spend gated)
  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!jwt) return json({ error: 'Not signed in' }, 401)
  const { data: who } = await admin.auth.getUser(jwt)
  if (!who.user) return json({ error: 'Invalid session' }, 401)
  const { data: prof } = await admin.from('profiles').select('is_admin').eq('id', who.user.id).maybeSingle()
  if (!prof?.is_admin) return json({ error: 'Admins only' }, 403)

  const { id } = await req.json().catch(() => ({}))
  if (!id) return json({ error: 'Missing id' }, 400)

  const { data: row, error } = await admin.from('info_sections').select('title, body').eq('id', id).maybeSingle()
  if (error || !row) return json({ error: 'Section not found' }, 404)

  const anthropic = new Anthropic({ apiKey })
  const prompt =
    `Translate the following event-app "info card" into these languages: ${LANGS.map((l) => LANG_NAMES[l]).join(', ')}.\n` +
    `Rules: keep brand names (WISEcon27, WISEflow, UNIwise), URLs, email addresses and street addresses EXACTLY as written; ` +
    `keep the tone short and practical; sentence case. If the body is empty, return an empty string for it in every language.\n\n` +
    `TITLE: ${row.title}\nBODY: ${row.body || '(none)'}\n\n` +
    `Respond with ONLY a JSON object, no markdown, no commentary, in exactly this shape:\n` +
    `{"title":{"en":"…","da":"…","no":"…","de":"…"},"body":{"en":"…","da":"…","no":"…","de":"…"}}`

  let parsed: { title?: Record<string, string>; body?: Record<string, string> }
  try {
    const resp = await anthropic.messages.create({
      model: Deno.env.get('ANTHROPIC_MODEL') ?? 'claude-opus-4-8',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = resp.content.filter((b: { type: string }) => b.type === 'text').map((b: { text: string }) => b.text).join('').trim()
    // tolerate a stray ```json fence if the model adds one
    const jsonText = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
    parsed = JSON.parse(jsonText)
  } catch (e) {
    return json({ error: 'Translation failed: ' + (e as Error).message }, 502)
  }

  const pick = (o: Record<string, string> | undefined, fallback: string) =>
    Object.fromEntries(LANGS.map((l) => [l, (o?.[l] ?? fallback) || fallback]))

  const { error: upErr } = await admin
    .from('info_sections')
    .update({ title_i18n: pick(parsed.title, row.title), body_i18n: pick(parsed.body, row.body || '') })
    .eq('id', id)
  if (upErr) return json({ error: upErr.message }, 500)

  return json({ ok: true })
})
