// WISEcon27 — in-app admin (only reachable when profile.is_admin = true).
// Broadcast announcements and manage sessions / speakers / sponsors. All writes
// go through Supabase under the "admin write" RLS policy; realtime + refreshContent
// propagate changes to every delegate.
import { useEffect, useState, type CSSProperties } from 'react'
import { supabase } from '../lib/supabase'
import { TRACKS } from '../data'
import { T, TABBAR_H } from '../theme'
import type { AppCtx, EventInfoItem } from '../appState'
import type { Activity, Day, Session, Speaker, Sponsor, SponsorTier, TrackId, SessionType, NotificationType } from '../types'
import { Icon, type IconName } from '../components/Icon'
import { AppHeader, Avatar, Btn, Eyebrow, Press } from '../components/primitives'
import { uploadSlides, uploadSpeakerPhoto } from '../lib/storage'
import { BADGE_TYPES, asDelegateType, type DelegateType } from '../badgeTypes'
import { Scan } from './Scan'
import { Reports } from './Reports'

/* ── small field helpers ── */
const inputStyle: CSSProperties = {
  width: '100%', boxSizing: 'border-box', border: 'none', outline: 'none', background: 'var(--wf-surface)',
  borderRadius: 'var(--radius-4)', padding: '12px 13px', fontFamily: T.sig, fontSize: 15, color: T.ink,
  boxShadow: 'inset 0 0 0 1px var(--wf-grey-6)',
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', marginBottom: 12 }}>
      <Eyebrow style={{ marginBottom: 6 }}>{label}</Eyebrow>
      {children}
    </label>
  )
}
function Text({ value, onChange, placeholder, area }: { value: string; onChange: (v: string) => void; placeholder?: string; area?: boolean }) {
  return area ? (
    <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3} style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }} />
  ) : (
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />
  )
}
function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle}>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  )
}

type AdminTab = 'dashboard' | 'reports' | 'scan' | 'event' | 'announce' | 'sessions' | 'speakers' | 'sponsors' | 'activities' | 'info' | 'delegates' | 'import'

export function Admin({ ctx }: { ctx: AppCtx }) {
  const [tab, setTab] = useState<AdminTab>('dashboard')
  const TABS: [AdminTab, string][] = [['dashboard', 'Dashboard'], ['reports', 'Reports'], ['scan', 'Scan'], ['event', 'Event'], ['announce', 'Announce'], ['sessions', 'Sessions'], ['speakers', 'Speakers'], ['sponsors', 'Sponsors'], ['activities', 'Activities'], ['delegates', 'Delegates'], ['info', 'Info'], ['import', 'Import']]
  return (
    <div>
      <AppHeader title="Admin" sub="Organiser tools" onBack={ctx.back} />
      <div className="wc-noscroll" style={{ display: 'flex', gap: 18, padding: '12px 16px 0', overflowX: 'auto' }}>
        {TABS.map(([k, l]) => (
          <Press key={k} onClick={() => setTab(k)} style={{ flexShrink: 0, whiteSpace: 'nowrap', paddingBottom: 10, fontFamily: T.sig, fontWeight: 600, fontSize: 13.5, color: tab === k ? T.green10 : T.muted, borderBottom: '2.5px solid ' + (tab === k ? T.green9 : 'transparent') }}>{l}</Press>
        ))}
      </div>
      <div style={{ padding: '16px 16px ' + (TABBAR_H + 16) + 'px' }}>
        {tab === 'dashboard' && <Dashboard ctx={ctx} />}
        {tab === 'reports' && <Reports ctx={ctx} />}
        {tab === 'scan' && <Scan ctx={ctx} />}
        {tab === 'event' && <EventSettings ctx={ctx} />}
        {tab === 'announce' && <Announce ctx={ctx} />}
        {tab === 'sessions' && <Sessions ctx={ctx} />}
        {tab === 'speakers' && <Speakers ctx={ctx} />}
        {tab === 'sponsors' && <Sponsors ctx={ctx} />}
        {tab === 'activities' && <AdminActivities ctx={ctx} />}
        {tab === 'delegates' && <Delegates ctx={ctx} />}
        {tab === 'info' && <EventInfo ctx={ctx} />}
        {tab === 'import' && <CsvImport ctx={ctx} />}
      </div>
    </div>
  )
}

/* ════════ Organiser dashboard ════════ */
function StatTile({ n, label }: { n: number | string; label: string }) {
  return (
    <div style={{ background: 'var(--wf-surface)', borderRadius: 'var(--radius-4)', boxShadow: 'var(--shadow-sm)', padding: '14px 16px' }}>
      <div style={{ fontFamily: T.onest, fontWeight: 700, fontSize: 26, color: T.ink, lineHeight: 1 }}>{n}</div>
      <div style={{ fontFamily: T.sig, fontSize: 12.5, color: T.muted, marginTop: 4 }}>{label}</div>
    </div>
  )
}
interface DashStats { delegates: number; checkedIn: number; bookmarks: number; avg: number; fbCount: number; survey: number; signups: number; top: [string, number][] }
function Dashboard({ ctx }: { ctx: AppCtx }) {
  const [s, setS] = useState<DashStats | null>(null)
  useEffect(() => {
    ;(async () => {
      const [delegates, checkedIn, bms, fb, survey, signups] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).not('checked_in_at', 'is', null),
        supabase.from('bookmarks').select('session_id'),
        supabase.from('session_feedback').select('stars'),
        supabase.from('survey_responses').select('user_id', { count: 'exact', head: true }),
        supabase.from('activity_signups').select('activity_id', { count: 'exact', head: true }),
      ])
      const bmRows = (bms.data ?? []) as { session_id: string }[]
      const tally: Record<string, number> = {}
      bmRows.forEach((b) => { tally[b.session_id] = (tally[b.session_id] ?? 0) + 1 })
      const top = Object.entries(tally).sort((a, b) => b[1] - a[1]).slice(0, 5)
      const stars = ((fb.data ?? []) as { stars: number }[]).map((r) => r.stars)
      const avg = stars.length ? stars.reduce((a, b) => a + b, 0) / stars.length : 0
      setS({ delegates: delegates.count ?? 0, checkedIn: checkedIn.count ?? 0, bookmarks: bmRows.length, avg, fbCount: stars.length, survey: survey.count ?? 0, signups: signups.count ?? 0, top })
    })()
  }, [])
  if (!s) return <div style={{ fontFamily: T.sig, color: T.muted, padding: 20, textAlign: 'center' }}>Loading…</div>
  const title = (id: string) => ctx.sessions.find((x) => x.id === id)?.title ?? id
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
        <StatTile n={s.delegates} label="Delegates" />
        <StatTile n={s.checkedIn} label="Checked in" />
        <StatTile n={ctx.sessions.length} label="Sessions" />
        <StatTile n={ctx.speakers.length} label="Speakers" />
        <StatTile n={s.bookmarks} label="Bookmarks" />
        <StatTile n={s.signups} label="Activity sign-ups" />
        <StatTile n={s.survey} label="Survey responses" />
        <StatTile n={s.fbCount ? s.avg.toFixed(1) + '★' : '–'} label={`Session ratings (${s.fbCount})`} />
        <StatTile n={ctx.attendees.filter((a) => a.status === 'connected').length} label="Your connections" />
      </div>
      <Eyebrow style={{ marginBottom: 10 }}>Most bookmarked sessions</Eyebrow>
      <div style={{ background: 'var(--wf-surface)', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
        {s.top.length === 0 && <div style={{ padding: 16, fontFamily: T.sig, fontSize: 14, color: T.muted }}>No bookmarks yet.</div>}
        {s.top.map(([id, n], i) => (
          <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: i === s.top.length - 1 ? 'none' : '1px solid ' + T.line }}>
            <span style={{ fontFamily: T.onest, fontWeight: 700, fontSize: 13, color: T.muted, width: 18 }}>{i + 1}</span>
            <span style={{ flex: 1, fontFamily: T.sig, fontWeight: 600, fontSize: 14, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title(id)}</span>
            <span style={{ fontFamily: T.onest, fontSize: 12, color: T.green10 }}>{n}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ════════ Delegates (registered attendees) ════════ */
interface DelegateRow { id: string; email: string; name: string; role: string; org: string; is_admin: boolean; avatar_url: string | null; signed_in: boolean }
function Delegates({ ctx }: { ctx: AppCtx }) {
  const [roster, setRoster] = useState<DelegateRow[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [extras, setExtras] = useState<Record<string, { delegate_type: string; gala: boolean; checked_in_at: string | null; is_staff: boolean }>>({})
  const [attFilter, setAttFilter] = useState<'all' | 'in' | 'out'>('all')

  const syncHubspot = async () => {
    if (syncing) return
    setSyncing(true)
    const { data, error } = await supabase.functions.invoke('sync-hubspot')
    setSyncing(false)
    if (error) return ctx.toast(error.message)
    const r = data as { created: number; updated: number; removed: number; failed: number; error?: string }
    if (r.error) return ctx.toast(r.error)
    ctx.toast(`HubSpot: +${r.created} new, ${r.updated} updated${r.removed ? `, ${r.removed} removed` : ''}`)
    load()
  }

  const load = async () => {
    setLoading(true)
    const [{ data, error }, profs] = await Promise.all([
      supabase.functions.invoke('import-delegates', { body: { action: 'list' } }),
      supabase.from('profiles').select('id, delegate_type, gala, checked_in_at, is_staff'),
    ])
    setLoading(false)
    if (error) return ctx.toast(error.message)
    setRoster(((data as { delegates: DelegateRow[] }).delegates) ?? [])
    const map: typeof extras = {}
    for (const p of (profs.data ?? []) as { id: string; delegate_type: string | null; gala: boolean | null; checked_in_at: string | null; is_staff: boolean | null }[]) {
      map[p.id] = { delegate_type: p.delegate_type ?? 'delegate', gala: p.gala ?? false, checked_in_at: p.checked_in_at, is_staff: p.is_staff ?? false }
    }
    setExtras(map)
  }
  useEffect(() => { load() }, [])

  const remove = async (d: DelegateRow) => {
    if (confirmId !== d.id) { setConfirmId(d.id); return }
    setConfirmId(null)
    const { error } = await supabase.functions.invoke('import-delegates', { body: { action: 'delete', id: d.id } })
    if (error) return ctx.toast(error.message)
    setRoster((r) => r.filter((x) => x.id !== d.id))
    ctx.toast('Delegate removed')
  }

  const runImport = async () => {
    if (busy) return
    const { rows } = parseCsv(text)
    const delegates = rows
      .map((r) => ({ email: r.email || r['e-mail'] || '', name: r.name || '', role: r.role || r.title || '', org: r.org || r.organisation || r.organization || r.company || '' }))
      .filter((d) => d.email.includes('@'))
    if (!delegates.length) return ctx.toast('No valid rows — need an "email" column')
    setBusy(true)
    const { data, error } = await supabase.functions.invoke('import-delegates', { body: { delegates } })
    setBusy(false)
    if (error) return ctx.toast(error.message)
    const r = data as { created: number; updated: number; failed: number }
    ctx.toast(`Added ${r.created}, updated ${r.updated}${r.failed ? `, ${r.failed} skipped` : ''}`)
    setText(''); setShowImport(false)
    load()
  }

  const filtered = roster.filter((d) => {
    if (!(d.name + d.email + d.org).toLowerCase().includes(q.toLowerCase())) return false
    const inAt = extras[d.id]?.checked_in_at
    return attFilter === 'all' ? true : attFilter === 'in' ? !!inAt : !inAt
  })
  const checkedInCount = roster.filter((d) => extras[d.id]?.checked_in_at).length
  const initials = (d: DelegateRow) => (d.name || d.email).trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 8 }}>
        <Eyebrow>{loading ? 'Loading…' : `${roster.length} delegates`}</Eyebrow>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn kind="outline" size="sm" icon="download" onClick={syncHubspot} disabled={syncing}>{syncing ? 'Syncing…' : 'HubSpot'}</Btn>
          <Btn kind={showImport ? 'default' : 'primary'} size="sm" icon={showImport ? 'close' : 'plus'} onClick={() => setShowImport((s) => !s)}>{showImport ? 'Close' : 'Import'}</Btn>
        </div>
      </div>

      {showImport && (
        <div style={{ background: 'var(--wf-surface)', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', padding: 14, marginBottom: 16 }}>
          <div style={{ fontFamily: T.onest, fontSize: 11.5, color: T.subtle, marginBottom: 8 }}>CSV columns: email (required), name, role, org</div>
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={'email,name,role,org\njane@uni.edu,Jane Doe,Lecturer,Example University'} rows={6} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'ui-monospace, monospace', fontSize: 13, lineHeight: 1.5 }} />
          <Btn kind="primary" full onClick={runImport} disabled={busy || !text.trim()} style={{ marginTop: 10 }}>{busy ? 'Importing…' : 'Import delegates'}</Btn>
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {([['all', `All · ${roster.length}`], ['in', `Checked in · ${checkedInCount}`], ['out', `Not yet · ${roster.length - checkedInCount}`]] as const).map(([k, l]) => (
          <Press key={k} onClick={() => setAttFilter(k)} style={{ fontFamily: T.sig, fontWeight: 600, fontSize: 12.5, borderRadius: 999, padding: '6px 12px', background: attFilter === k ? T.green9 : 'var(--wf-surface)', color: attFilter === k ? '#fff' : T.body, boxShadow: attFilter === k ? 'none' : 'inset 0 0 0 1px var(--wf-grey-6)' }}>{l}</Press>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--wf-surface)', borderRadius: 'var(--radius-4)', padding: '0 12px', boxShadow: 'inset 0 0 0 1px var(--wf-grey-6)', marginBottom: 12 }}>
        <Icon name="search" size={18} style={{ color: T.muted }} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search delegates" style={{ flex: 1, border: 'none', outline: 'none', padding: '11px 0', fontFamily: T.sig, fontSize: 15, color: T.ink, background: 'transparent' }} />
      </div>

      <div style={{ background: 'var(--wf-surface)', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
        {filtered.map((d, i) => {
          const ex = extras[d.id] ?? { delegate_type: 'delegate', gala: false, checked_in_at: null, is_staff: false }
          const bt = BADGE_TYPES[asDelegateType(ex.delegate_type)]
          const setExtra = async (patch: Partial<typeof ex>) => {
            setExtras((m) => ({ ...m, [d.id]: { ...ex, ...patch } }))
            const { error } = await supabase.from('profiles').update(patch).eq('id', d.id)
            if (error) ctx.toast(error.message)
          }
          return (
            <div key={d.id} style={{ borderBottom: i === filtered.length - 1 ? 'none' : '1px solid ' + T.line }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px' }}>
                <Avatar initials={initials(d)} color={d.is_admin ? 'var(--wf-green-9)' : 'var(--wf-blue-9)'} size={38} src={d.avatar_url} />
                <Press onClick={() => setEditId(editId === d.id ? null : d.id)} style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                  <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 14.5, color: T.ink, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {d.name || d.email.split('@')[0]}
                    {d.is_admin && <span style={{ fontFamily: T.onest, fontSize: 10, color: T.green10, background: T.green1, borderRadius: 999, padding: '1px 7px' }}>ADMIN</span>}
                    {ex.is_staff && !d.is_admin && <span style={{ fontFamily: T.onest, fontSize: 10, color: 'var(--wf-blue-10)', background: 'var(--wf-blue-1)', borderRadius: 999, padding: '1px 7px' }}>STAFF</span>}
                    {ex.delegate_type !== 'delegate' && <span style={{ fontFamily: T.onest, fontSize: 10, color: bt.chipText, background: bt.chipBg, borderRadius: 999, padding: '1px 7px', whiteSpace: 'nowrap' }}>{bt.label.toUpperCase()}</span>}
                    {ex.gala && <Icon name="star" size={12} style={{ color: '#c9a227', flexShrink: 0 }} />}
                  </div>
                  <div style={{ fontFamily: T.sig, fontSize: 12.5, color: T.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.email}{d.org ? ' · ' + d.org : ''}</div>
                </Press>
                <span style={{ fontFamily: T.onest, fontSize: 10.5, color: ex.checked_in_at ? T.green10 : d.signed_in ? T.body : T.subtle, whiteSpace: 'nowrap', fontWeight: ex.checked_in_at ? 700 : 400 }}>{ex.checked_in_at ? '✓ In ' + new Date(ex.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : d.signed_in ? 'Signed in' : 'Not yet'}</span>
                <Press onClick={() => remove(d)} style={{ color: confirmId === d.id ? 'var(--wf-negative-9)' : T.line2, padding: 4, fontFamily: T.sig, fontWeight: 600, fontSize: 12.5 }}>
                  {confirmId === d.id ? 'Remove?' : <Icon name="close" size={17} />}
                </Press>
              </div>
              {editId === d.id && (
                <div style={{ padding: '0 14px 13px', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <select
                    value={asDelegateType(ex.delegate_type)}
                    onChange={(e) => setExtra({ delegate_type: e.target.value as DelegateType })}
                    style={{ ...inputStyle, flex: 1, padding: '9px 10px', fontSize: 13.5 }}
                  >
                    {(Object.keys(BADGE_TYPES) as DelegateType[]).map((k) => (
                      <option key={k} value={k}>{BADGE_TYPES[k].label}</option>
                    ))}
                  </select>
                  <Btn kind={ex.gala ? 'dark' : 'outline'} size="sm" icon="star" onClick={() => setExtra({ gala: !ex.gala })}>
                    {ex.gala ? 'Gala ✓' : 'Gala'}
                  </Btn>
                  <Btn kind={ex.is_staff ? 'secondary' : 'outline'} size="sm" icon="qr" onClick={() => setExtra({ is_staff: !ex.is_staff })}>
                    {ex.is_staff ? 'Staff ✓' : 'Staff'}
                  </Btn>
                </div>
              )}
            </div>
          )
        })}
        {!loading && filtered.length === 0 && <div style={{ padding: 20, textAlign: 'center', fontFamily: T.sig, fontSize: 14, color: T.muted }}>{roster.length === 0 ? 'No delegates yet — import your list.' : 'No matches.'}</div>}
      </div>
    </div>
  )
}

/* ════════ CSV import ════════ */
function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim())
  if (!lines.length) return { headers: [], rows: [] }
  const split = (line: string) => {
    const out: string[] = []
    let cur = '', q = false
    for (let i = 0; i < line.length; i++) {
      const c = line[i]
      if (q) { if (c === '"') { if (line[i + 1] === '"') { cur += '"'; i++ } else q = false } else cur += c }
      else if (c === '"') q = true
      else if (c === ',') { out.push(cur); cur = '' }
      else cur += c
    }
    out.push(cur)
    return out.map((x) => x.trim())
  }
  const headers = split(lines[0]).map((h) => h.toLowerCase())
  const rows = lines.slice(1).map((l) => {
    const cells = split(l)
    const o: Record<string, string> = {}
    headers.forEach((h, j) => (o[h] = cells[j] ?? ''))
    return o
  })
  return { headers, rows }
}
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const initialsOf = (s: string) => s.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')

function CsvImport({ ctx }: { ctx: AppCtx }) {
  const [kind, setKind] = useState<'sessions' | 'speakers' | 'sponsors'>('sessions')
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const HINT: Record<string, string> = {
    sessions: 'Columns: title, day_id, start, end, type, track, room, desc  (id optional)',
    speakers: 'Columns: name, role, org, bio, topics  (topics separated by ; — id optional)',
    sponsors: 'Columns: name, tier, blurb, booth, website, description  (id optional)',
  }
  const run = async () => {
    if (busy) return
    const { rows } = parseCsv(text)
    if (!rows.length) return ctx.toast('No rows found — paste CSV with a header row')
    setBusy(true)
    let payload: Record<string, unknown>[] = []
    if (kind === 'sessions') {
      payload = rows.filter((r) => r.title).map((r, i) => ({
        id: r.id || 'sx-' + Date.now() + '-' + i, title: r.title, day_id: r.day_id || r.day || ctx.days[0]?.id,
        start: r.start || '09:00', end: r.end || '09:45', type: r.type || 'talk', track: r.track || 'plenary',
        room: r.room || '', desc: r.desc || r.description || '', tags: [], going: 0,
      }))
    } else if (kind === 'speakers') {
      payload = rows.filter((r) => r.name).map((r, i) => ({
        id: r.id || 'spx-' + Date.now() + '-' + i, name: r.name, role: r.role || '', org: r.org || '',
        initials: initialsOf(r.name), color: 'var(--wf-green-9)', bio: r.bio || '',
        topics: (r.topics || '').split(/[;|]/).map((t) => t.trim()).filter(Boolean),
      }))
    } else {
      payload = rows.filter((r) => r.name).map((r) => ({
        id: r.id || slugify(r.name), name: r.name, tier: r.tier || 'Gold', blurb: r.blurb || '',
        initials: initialsOf(r.name), color: 'var(--wf-green-7)', booth: r.booth || '', website: r.website || '', description: r.description || '',
      }))
    }
    const { error } = await supabase.from(kind).upsert(payload)
    setBusy(false)
    if (error) return ctx.toast(error.message)
    await ctx.refreshContent()
    setText('')
    ctx.toast(`Imported ${payload.length} ${kind}`)
  }
  return (
    <div>
      <div style={{ fontFamily: T.sig, fontSize: 14, color: T.muted, marginBottom: 16, lineHeight: 1.5 }}>
        Paste CSV (with a header row) to bulk add or update content. Existing rows with a matching <code>id</code> are updated.
      </div>
      <Field label="Type"><Select value={kind} onChange={(v) => setKind(v as typeof kind)} options={[['sessions', 'Sessions'], ['speakers', 'Speakers'], ['sponsors', 'Sponsors']]} /></Field>
      <div style={{ fontFamily: T.onest, fontSize: 11.5, color: T.subtle, margin: '-4px 0 10px' }}>{HINT[kind]}</div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={'title,day_id,start,end,type,track,room\nClosing remarks,d3,16:00,16:30,plenary,plenary,Main Stage'} rows={8} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'ui-monospace, monospace', fontSize: 13, lineHeight: 1.5 }} />
      <Btn kind="primary" full size="lg" onClick={run} disabled={busy || !text.trim()} style={{ marginTop: 12 }}>{busy ? 'Importing…' : 'Import CSV'}</Btn>
    </div>
  )
}

/* ════════ Event details: headline (dates + location) + days ════════ */
type DayDraft = Day & { sort?: number }
function EventSettings({ ctx }: { ctx: AppCtx }) {
  const [dateline, setDateline] = useState(ctx.event.dateline)
  const [location, setLocation] = useState(ctx.event.location)
  const [startISO, setStartISO] = useState(ctx.event.startISO)
  const [endISO, setEndISO] = useState(ctx.event.endISO)
  const [savingHead, setSavingHead] = useState(false)
  useEffect(() => {
    setDateline(ctx.event.dateline); setLocation(ctx.event.location)
    setStartISO(ctx.event.startISO); setEndISO(ctx.event.endISO)
  }, [ctx.event.dateline, ctx.event.location, ctx.event.startISO, ctx.event.endISO])

  const [days, setDays] = useState<DayDraft[]>(ctx.days.map((d) => ({ ...d })))
  const [savingDays, setSavingDays] = useState(false)
  useEffect(() => { setDays(ctx.days.map((d) => ({ ...d }))) }, [ctx.days])

  const sessionsOnDay = (id: string) => ctx.sessions.filter((s) => s.day === id).length

  const saveHeadline = async () => {
    if (savingHead) return
    setSavingHead(true)
    const { error } = await supabase.from('settings').upsert([
      { key: 'event_dateline', value: dateline.trim() },
      { key: 'event_location', value: location.trim() },
      { key: 'event_start', value: startISO },
      { key: 'event_end', value: endISO },
    ])
    setSavingHead(false)
    if (error) return ctx.toast(error.message)
    await ctx.refreshContent()
    ctx.toast('Event details saved')
  }

  const setDay = (i: number, patch: Partial<DayDraft>) => setDays((ds) => ds.map((d, j) => (j === i ? { ...d, ...patch } : d)))
  const addDay = () => {
    const ids = new Set(days.map((d) => d.id))
    let n = days.length + 1
    while (ids.has('d' + n)) n++
    setDays((ds) => [...ds, { id: 'd' + n, dow: '', date: '', long: '', sort: ds.length }])
  }
  const removeDay = (i: number) => {
    const d = days[i]
    const count = sessionsOnDay(d.id)
    if (count > 0 && !window.confirm(`Day "${d.date || d.id}" has ${count} session(s). Removing it will also delete those sessions. Continue?`)) return
    setDays((ds) => ds.filter((_, j) => j !== i))
  }
  const saveDays = async () => {
    if (savingDays) return
    setSavingDays(true)
    const rows = days.map((d, i) => ({ id: d.id, dow: d.dow.trim(), date: d.date.trim(), long: d.long.trim(), sort: i }))
    const keep = new Set(rows.map((r) => r.id))
    const removed = ctx.days.filter((d) => !keep.has(d.id)).map((d) => d.id)
    let error = null
    if (rows.length) error = (await supabase.from('days').upsert(rows)).error
    if (!error && removed.length) error = (await supabase.from('days').delete().in('id', removed)).error
    setSavingDays(false)
    if (error) return ctx.toast(error.message)
    await ctx.refreshContent()
    ctx.toast('Days saved')
  }

  return (
    <div>
      <Eyebrow style={{ marginBottom: 10 }}>Event headline</Eyebrow>
      <div style={{ background: 'var(--wf-surface)', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', padding: 16, marginBottom: 10 }}>
        <Field label="Dates (shown on sign-in, agenda & badge)"><Text value={dateline} onChange={setDateline} placeholder="e.g. 2–3 March 2027" /></Field>
        <Field label="Location"><Text value={location} onChange={setLocation} placeholder="e.g. Aarhus" /></Field>
        <div style={{ display: 'flex', gap: 10 }}>
          <label style={{ flex: 1 }}>
            <Eyebrow style={{ marginBottom: 6 }}>Starts</Eyebrow>
            <input type="datetime-local" value={startISO} onChange={(e) => setStartISO(e.target.value)} style={inputStyle} />
          </label>
          <label style={{ flex: 1 }}>
            <Eyebrow style={{ marginBottom: 6 }}>Ends</Eyebrow>
            <input type="datetime-local" value={endISO} onChange={(e) => setEndISO(e.target.value)} style={inputStyle} />
          </label>
        </div>
        <Btn kind="primary" full size="lg" onClick={saveHeadline} disabled={savingHead} style={{ marginTop: 12 }}>{savingHead ? 'Saving…' : 'Save event details'}</Btn>
      </div>
      <div style={{ fontFamily: T.onest, fontSize: 11.5, color: T.muted, marginBottom: 24, paddingLeft: 2, lineHeight: 1.5 }}>
        The <b>Dates</b> text is what delegates see. <b>Starts/Ends</b> drive the live status &amp; countdown on Home — set them to the real first-session start and last-session end.
      </div>

      <Eyebrow style={{ marginBottom: 10 }}>Days</Eyebrow>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 12 }}>
        {days.map((d, i) => (
          <div key={d.id} style={{ background: 'var(--wf-surface)', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontFamily: T.onest, fontWeight: 700, fontSize: 12, color: T.muted }}>Day {i + 1}{sessionsOnDay(d.id) ? ` · ${sessionsOnDay(d.id)} session(s)` : ''}</span>
              <Press onClick={() => removeDay(i)} style={{ fontFamily: T.sig, fontWeight: 600, fontSize: 13, color: 'var(--wf-negative-9)' }}>Remove</Press>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ width: 78 }}><Text value={d.dow} onChange={(v) => setDay(i, { dow: v })} placeholder="Mon" /></div>
              <div style={{ flex: 1 }}><Text value={d.date} onChange={(v) => setDay(i, { date: v })} placeholder="2 Mar" /></div>
            </div>
            <div style={{ marginTop: 8 }}><Text value={d.long} onChange={(v) => setDay(i, { long: v })} placeholder="Monday, 2 March" /></div>
          </div>
        ))}
      </div>
      <Btn kind="outline" full icon="plus" onClick={addDay} style={{ marginBottom: 12 }}>Add day</Btn>
      <Btn kind="primary" full size="lg" onClick={saveDays} disabled={savingDays}>{savingDays ? 'Saving…' : 'Save days'}</Btn>
      <div style={{ fontFamily: T.onest, fontSize: 11.5, color: T.muted, marginTop: 12, paddingLeft: 2, lineHeight: 1.5 }}>
        “Mon / 2 Mar” show on the agenda day tabs; the long label shows on Home. Sessions stay attached to their day as you rename it.
      </div>
    </div>
  )
}

/* ════════ Broadcast announcement ════════ */
function Announce({ ctx }: { ctx: AppCtx }) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [type, setType] = useState<NotificationType>('announce')
  const [saving, setSaving] = useState(false)
  const send = async () => {
    if (!title.trim() || saving) return
    setSaving(true)
    const { error } = await supabase.from('announcements').insert({ title: title.trim(), body: body.trim(), type })
    if (error) {
      setSaving(false)
      return ctx.toast(error.message)
    }
    // also fire device push (no-op if the edge function isn't deployed yet)
    try {
      await supabase.functions.invoke('send-push', { body: { title: title.trim(), body: body.trim() } })
    } catch {
      /* in-app announcement already delivered; push is best-effort */
    }
    setSaving(false)
    setTitle(''); setBody('')
    ctx.toast('Announcement sent to all delegates')
  }
  return (
    <div>
      <div style={{ fontFamily: T.sig, fontSize: 14, color: T.muted, marginBottom: 16, lineHeight: 1.5 }}>
        Push a message to every delegate's Notifications — instantly, live.
      </div>
      <Field label="Type">
        <Select value={type} onChange={(v) => setType(v as NotificationType)} options={[['announce', 'Announcement'], ['reminder', 'Reminder'], ['social', 'Social'], ['feedback', 'Feedback']]} />
      </Field>
      <Field label="Title"><Text value={title} onChange={setTitle} placeholder="e.g. Room change" /></Field>
      <Field label="Message"><Text value={body} onChange={setBody} placeholder="Details…" area /></Field>
      <Btn kind="primary" full size="lg" onClick={send} disabled={!title.trim() || saving} icon="send">{saving ? 'Sending…' : 'Send to all'}</Btn>
    </div>
  )
}

/* ════════ Event info & Wi-Fi ════════ */
const INFO_ICONS: IconName[] = ['wifi', 'shield', 'pin', 'clock', 'coffee', 'info', 'map', 'ticket', 'star', 'heart']
function EventInfo({ ctx }: { ctx: AppCtx }) {
  const [editing, setEditing] = useState<(Partial<EventInfoItem> & { id?: string }) | null>(null)
  if (editing) return <EventInfoEditor ctx={ctx} initial={editing} onDone={() => setEditing(null)} />
  return (
    <div>
      <Btn kind="primary" full icon="plus" onClick={() => setEditing({ icon: 'info', label: '', detail: '' })} style={{ marginBottom: 14 }}>New info item</Btn>
      <div style={{ background: 'var(--wf-surface)', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
        {ctx.eventInfo.map((it, i) => (
          <Press key={it.id} onClick={() => setEditing(it)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderBottom: i === ctx.eventInfo.length - 1 ? 'none' : '1px solid ' + T.line }}>
            <div style={{ width: 30, height: 30, borderRadius: 'var(--radius-3)', background: T.sunken, display: 'grid', placeItems: 'center', color: T.body }}><Icon name={it.icon as IconName} size={16} /></div>
            <span style={{ flex: 1, fontFamily: T.sig, fontWeight: 600, fontSize: 14.5, color: T.ink }}>{it.label}</span>
            <span style={{ fontFamily: T.sig, fontSize: 12.5, color: T.muted, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.detail}</span>
          </Press>
        ))}
      </div>
    </div>
  )
}
function EventInfoEditor({ ctx, initial, onDone }: { ctx: AppCtx; initial: Partial<EventInfoItem> & { id?: string }; onDone: () => void }) {
  const [it, setIt] = useState(initial)
  const [saving, setSaving] = useState(false)
  const set = (patch: Partial<EventInfoItem>) => setIt((x) => ({ ...x, ...patch }))
  const save = async () => {
    if (!it.label?.trim() || saving) return
    setSaving(true)
    const row = {
      id: it.id ?? 'ei-' + Date.now(),
      icon: it.icon || 'info', label: it.label?.trim(), detail: it.detail ?? '',
      sort: ctx.eventInfo.length,
    }
    const { error } = await supabase.from('event_info').upsert(row)
    setSaving(false)
    if (error) return ctx.toast(error.message)
    await ctx.refreshContent()
    ctx.toast('Info saved')
    onDone()
  }
  return (
    <div>
      <Press onClick={onDone} style={{ fontFamily: T.sig, fontWeight: 600, fontSize: 14, color: T.green10, marginBottom: 12 }}>‹ Back to list</Press>
      <Field label="Icon"><Select value={it.icon ?? 'info'} onChange={(v) => set({ icon: v })} options={INFO_ICONS.map((i) => [i, i])} /></Field>
      <Field label="Label"><Text value={it.label ?? ''} onChange={(v) => set({ label: v })} placeholder="e.g. Wi-Fi password" /></Field>
      <Field label="Detail"><Text value={it.detail ?? ''} onChange={(v) => set({ detail: v })} placeholder="e.g. assessment27" /></Field>
      <Btn kind="primary" full size="lg" onClick={save} disabled={!it.label?.trim() || saving}>{saving ? 'Saving…' : 'Save'}</Btn>
    </div>
  )
}

/* ════════ Activities ════════ */
function AdminActivities({ ctx }: { ctx: AppCtx }) {
  const [editing, setEditing] = useState<(Partial<Activity> & { id?: string }) | null>(null)
  if (editing) return <ActivityEditor ctx={ctx} initial={editing} onDone={() => setEditing(null)} />
  return (
    <div>
      <Btn kind="primary" full icon="plus" onClick={() => setEditing({ title: '', description: '', location: '', day: ctx.days[0]?.id ?? null, start: '', end: '', capacity: null })} style={{ marginBottom: 14 }}>New activity</Btn>
      <div style={{ background: 'var(--wf-surface)', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
        {ctx.activities.map((a, i) => (
          <Press key={a.id} onClick={() => setEditing(a)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: i === ctx.activities.length - 1 ? 'none' : '1px solid ' + T.line }}>
            <span style={{ flex: 1, fontFamily: T.sig, fontWeight: 600, fontSize: 14.5, color: T.ink }}>{a.title}</span>
            <span style={{ fontFamily: T.onest, fontSize: 11, color: T.muted }}>{a.capacity != null ? `${a.going}/${a.capacity}` : `${a.going}`}</span>
          </Press>
        ))}
      </div>
    </div>
  )
}
function ActivityEditor({ ctx, initial, onDone }: { ctx: AppCtx; initial: Partial<Activity> & { id?: string }; onDone: () => void }) {
  const [a, setA] = useState(initial)
  const [cap, setCap] = useState(initial.capacity != null ? String(initial.capacity) : '')
  const [saving, setSaving] = useState(false)
  const set = (patch: Partial<Activity>) => setA((x) => ({ ...x, ...patch }))
  const save = async () => {
    if (!a.title?.trim() || saving) return
    setSaving(true)
    const row = {
      id: a.id ?? 'ac-' + Date.now(), title: a.title?.trim(), description: a.description ?? '',
      location: a.location ?? '', day_id: a.day || null, start: a.start ?? '', end: a.end ?? '',
      capacity: cap.trim() === '' ? null : Math.max(0, parseInt(cap, 10) || 0),
    }
    const { error } = await supabase.from('activities').upsert(row)
    setSaving(false)
    if (error) return ctx.toast(error.message)
    await ctx.refreshContent()
    ctx.toast('Activity saved')
    onDone()
  }
  return (
    <div>
      <Press onClick={onDone} style={{ fontFamily: T.sig, fontWeight: 600, fontSize: 14, color: T.green10, marginBottom: 12 }}>‹ Back to list</Press>
      <Field label="Title"><Text value={a.title ?? ''} onChange={(v) => set({ title: v })} placeholder="Activity name" /></Field>
      <Field label="Description"><Text value={a.description ?? ''} onChange={(v) => set({ description: v })} area /></Field>
      <Field label="Location"><Text value={a.location ?? ''} onChange={(v) => set({ location: v })} placeholder="e.g. Rooftop Terrace" /></Field>
      <Field label="Day"><Select value={a.day ?? ''} onChange={(v) => set({ day: v || null })} options={[['', 'No specific day'], ...ctx.days.map((d) => [d.id, d.long] as [string, string])]} /></Field>
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}><Field label="Start"><Text value={a.start ?? ''} onChange={(v) => set({ start: v })} placeholder="08:00" /></Field></div>
        <div style={{ flex: 1 }}><Field label="End"><Text value={a.end ?? ''} onChange={(v) => set({ end: v })} placeholder="08:40" /></Field></div>
      </div>
      <Field label="Capacity (blank = unlimited)"><Text value={cap} onChange={setCap} placeholder="e.g. 40" /></Field>
      <Btn kind="primary" full size="lg" onClick={save} disabled={!a.title?.trim() || saving}>{saving ? 'Saving…' : 'Save activity'}</Btn>
    </div>
  )
}

/* ════════ Sessions ════════ */
const blankSession = (dayId: string): Partial<Session> & { id?: string } => ({
  title: '', day: dayId, start: '09:00', end: '09:45', type: 'talk', track: 'pedagogy', room: '', desc: '', tags: [],
})
function Sessions({ ctx }: { ctx: AppCtx }) {
  const [editing, setEditing] = useState<(Partial<Session> & { id?: string }) | null>(null)
  if (editing) return <SessionEditor ctx={ctx} initial={editing} onDone={() => setEditing(null)} />
  return (
    <div>
      <Btn kind="primary" full icon="plus" onClick={() => setEditing(blankSession(ctx.days[0]?.id || 'd1'))} style={{ marginBottom: 14 }}>New session</Btn>
      {ctx.days.map((d) => {
        const list = ctx.sessions.filter((s) => s.day === d.id).sort((a, b) => a.start.localeCompare(b.start))
        if (!list.length) return null
        return (
          <div key={d.id} style={{ marginBottom: 14 }}>
            <Eyebrow style={{ marginBottom: 8 }}>{d.long}</Eyebrow>
            <div style={{ background: 'var(--wf-surface)', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
              {list.map((s, i) => (
                <Press key={s.id} onClick={() => setEditing(s)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: i === list.length - 1 ? 'none' : '1px solid ' + T.line }}>
                  <span style={{ fontFamily: T.onest, fontSize: 12, color: T.muted, width: 42 }}>{s.start}</span>
                  <span style={{ flex: 1, fontFamily: T.sig, fontWeight: 600, fontSize: 14.5, color: T.ink }}>{s.title}</span>
                  <span style={{ fontFamily: T.sig, fontSize: 12.5, color: T.muted }}>Edit</span>
                </Press>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
interface PollOptRow { id?: string; label: string }
function SessionEditor({ ctx, initial, onDone }: { ctx: AppCtx; initial: Partial<Session> & { id?: string }; onDone: () => void }) {
  const [s, setS] = useState(initial)
  const [saving, setSaving] = useState(false)
  const set = (patch: Partial<Session>) => setS((p) => ({ ...p, ...patch }))
  // fixed id for this editor session (so speakers/poll can reference new sessions)
  const [sid] = useState(initial.id ?? 'sx-' + Date.now())

  // speaker assignment
  const [speakerIds, setSpeakerIds] = useState<string[]>(initial.speakers ?? [])
  const toggleSpeaker = (id: string) =>
    setSpeakerIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  // poll builder
  const [pollId, setPollId] = useState<string | null>(null)
  const [pollQuestion, setPollQuestion] = useState('')
  const [pollOpts, setPollOpts] = useState<PollOptRow[]>([{ label: '' }, { label: '' }])
  const [removedOptIds, setRemovedOptIds] = useState<string[]>([])

  // slides
  const [slides, setSlides] = useState<{ path: string | null; name: string | null }>({ path: initial.slidesPath ?? null, name: initial.slidesName ?? null })
  const [uploadingSlides, setUploadingSlides] = useState(false)
  const onPickSlides = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingSlides(true)
    const r = await uploadSlides(sid, file)
    setUploadingSlides(false)
    if (r.error) return ctx.toast(r.error)
    setSlides({ path: r.path, name: r.name })
    ctx.toast('Slides uploaded')
  }

  useEffect(() => {
    if (!initial.id) return
    ;(async () => {
      const { data: poll } = await supabase.from('polls').select('id, question').eq('session_id', initial.id).maybeSingle()
      if (!poll) return
      setPollId(poll.id as string)
      setPollQuestion(poll.question as string)
      const { data: opts } = await supabase.from('poll_options').select('id, label, sort').eq('poll_id', poll.id).order('sort')
      if (opts?.length) setPollOpts(opts.map((o) => ({ id: o.id as string, label: o.label as string })))
    })()
  }, [initial.id])

  const save = async () => {
    if (!s.title?.trim() || saving) return
    setSaving(true)
    const { error } = await supabase.from('sessions').upsert({
      id: sid, day_id: s.day, start: s.start, end: s.end, title: s.title?.trim(), type: s.type,
      track: s.track, room: s.room ?? '', desc: s.desc ?? '', tags: s.tags ?? [],
      slides_path: slides.path, slides_name: slides.name,
    })
    if (error) { setSaving(false); return ctx.toast(error.message) }

    // sync speaker assignments
    await supabase.from('session_speakers').delete().eq('session_id', sid)
    if (speakerIds.length)
      await supabase.from('session_speakers').insert(speakerIds.map((id, ord) => ({ session_id: sid, speaker_id: id, ord })))

    // sync poll (needs a question + at least 2 non-empty options)
    const q = pollQuestion.trim()
    const opts = pollOpts.map((o) => ({ ...o, label: o.label.trim() })).filter((o) => o.label)
    if (q && opts.length >= 2) {
      let pid = pollId
      if (!pid) {
        const { data } = await supabase.from('polls').insert({ session_id: sid, question: q, is_live: true }).select('id').single()
        pid = (data?.id as string) ?? null
      } else {
        await supabase.from('polls').update({ question: q }).eq('id', pid)
      }
      if (pid) {
        if (removedOptIds.length) await supabase.from('poll_options').delete().in('id', removedOptIds)
        await supabase.from('poll_options').upsert(
          opts.map((o, i) => (o.id ? { id: o.id, poll_id: pid, label: o.label, sort: i } : { poll_id: pid, label: o.label, sort: i })),
        )
      }
    }

    setSaving(false)
    await ctx.refreshContent()
    ctx.toast(initial.id ? 'Session updated' : 'Session added')
    onDone()
  }

  return (
    <div>
      <Press onClick={onDone} style={{ fontFamily: T.sig, fontWeight: 600, fontSize: 14, color: T.green10, marginBottom: 12 }}>‹ Back to list</Press>
      <Field label="Title"><Text value={s.title ?? ''} onChange={(v) => set({ title: v })} placeholder="Session title" /></Field>
      <Field label="Day"><Select value={s.day ?? ''} onChange={(v) => set({ day: v })} options={ctx.days.map((d) => [d.id, d.long])} /></Field>
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}><Field label="Start"><Text value={s.start ?? ''} onChange={(v) => set({ start: v })} placeholder="09:00" /></Field></div>
        <div style={{ flex: 1 }}><Field label="End"><Text value={s.end ?? ''} onChange={(v) => set({ end: v })} placeholder="09:45" /></Field></div>
      </div>
      <Field label="Type"><Select value={s.type ?? 'talk'} onChange={(v) => set({ type: v as SessionType })} options={(['keynote', 'talk', 'panel', 'workshop', 'break', 'social', 'plenary'] as SessionType[]).map((t) => [t, t])} /></Field>
      <Field label="Track"><Select value={s.track ?? 'pedagogy'} onChange={(v) => set({ track: v as TrackId })} options={(Object.keys(TRACKS) as TrackId[]).map((k) => [k, TRACKS[k].name])} /></Field>
      <Field label="Room"><Text value={s.room ?? ''} onChange={(v) => set({ room: v })} placeholder="e.g. Main Stage" /></Field>
      <Field label="Description"><Text value={s.desc ?? ''} onChange={(v) => set({ desc: v })} area /></Field>

      {/* slides upload */}
      <Eyebrow style={{ marginBottom: 8 }}>Speaker slides</Eyebrow>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 42, padding: '0 16px', borderRadius: 'var(--radius-2)', background: 'var(--wf-surface)', boxShadow: 'inset 0 0 0 1px var(--wf-grey-6)', fontFamily: T.sig, fontWeight: 600, fontSize: 14, color: T.ink, cursor: 'pointer' }}>
          <Icon name="download" size={16} stroke={2} />{uploadingSlides ? 'Uploading…' : slides.path ? 'Replace file' : 'Upload slides'}
          <input type="file" accept=".pdf,.ppt,.pptx,.key" onChange={onPickSlides} style={{ display: 'none' }} />
        </label>
        {slides.name && (
          <span style={{ flex: 1, minWidth: 0, fontFamily: T.sig, fontSize: 13, color: T.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{slides.name}</span>
        )}
        {slides.path && <Press onClick={() => setSlides({ path: null, name: null })} style={{ color: T.muted, padding: 4 }}><Icon name="close" size={16} /></Press>}
      </div>

      {/* speaker assignment */}
      <Eyebrow style={{ marginBottom: 8, marginTop: 4 }}>Speakers</Eyebrow>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {ctx.speakers.map((p) => {
          const on = speakerIds.includes(p.id)
          return (
            <Press key={p.id} onClick={() => toggleSpeaker(p.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 999, fontFamily: T.sig, fontWeight: 600, fontSize: 13, background: on ? T.green9 : 'var(--wf-surface)', color: on ? '#fff' : T.body, boxShadow: on ? 'none' : 'inset 0 0 0 1px var(--wf-grey-6)' }}>
              {on && <Icon name="check" size={13} stroke={2.6} />}{p.name}
            </Press>
          )
        })}
      </div>

      {/* live poll builder */}
      <Eyebrow style={{ marginBottom: 8 }}>Live poll (optional)</Eyebrow>
      <div style={{ background: 'var(--wf-surface)', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', padding: 14, marginBottom: 18 }}>
        <Text value={pollQuestion} onChange={setPollQuestion} placeholder="Poll question (leave blank for none)" />
        <div style={{ height: 10 }} />
        {pollOpts.map((o, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <div style={{ flex: 1 }}><Text value={o.label} onChange={(v) => setPollOpts((prev) => prev.map((x, j) => (j === i ? { ...x, label: v } : x)))} placeholder={`Option ${i + 1}`} /></div>
            <Press onClick={() => { if (o.id) setRemovedOptIds((r) => [...r, o.id!]); setPollOpts((prev) => prev.filter((_, j) => j !== i)) }} style={{ color: T.muted, padding: 6 }}><Icon name="close" size={18} /></Press>
          </div>
        ))}
        <Press onClick={() => setPollOpts((prev) => [...prev, { label: '' }])} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: T.green10, fontFamily: T.sig, fontWeight: 600, fontSize: 13.5, marginTop: 2 }}>
          <Icon name="plus" size={15} stroke={2.2} />Add option
        </Press>
      </div>

      <Btn kind="primary" full size="lg" onClick={save} disabled={!s.title?.trim() || saving}>{saving ? 'Saving…' : 'Save session'}</Btn>
    </div>
  )
}

/* ════════ Speakers ════════ */
function Speakers({ ctx }: { ctx: AppCtx }) {
  const [editing, setEditing] = useState<(Partial<Speaker> & { id?: string }) | null>(null)
  if (editing) return <SpeakerEditor ctx={ctx} initial={editing} onDone={() => setEditing(null)} />
  return (
    <div>
      <Btn kind="primary" full icon="plus" onClick={() => setEditing({ name: '', role: '', org: '', bio: '', topics: [], color: 'var(--wf-green-9)' })} style={{ marginBottom: 14 }}>New speaker</Btn>
      <div style={{ background: 'var(--wf-surface)', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
        {ctx.speakers.map((p, i) => (
          <Press key={p.id} onClick={() => setEditing(p)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: i === ctx.speakers.length - 1 ? 'none' : '1px solid ' + T.line }}>
            <span style={{ flex: 1, fontFamily: T.sig, fontWeight: 600, fontSize: 14.5, color: T.ink }}>{p.name}</span>
            <span style={{ fontFamily: T.sig, fontSize: 12.5, color: T.muted }}>Edit</span>
          </Press>
        ))}
      </div>
    </div>
  )
}
function SpeakerEditor({ ctx, initial, onDone }: { ctx: AppCtx; initial: Partial<Speaker> & { id?: string }; onDone: () => void }) {
  const [p, setP] = useState(initial)
  const [topics, setTopics] = useState((initial.topics ?? []).join(', '))
  const [saving, setSaving] = useState(false)
  const [sid] = useState(initial.id ?? 'spx-' + Date.now())
  const [photoUrl, setPhotoUrl] = useState<string | null>(initial.photoUrl ?? null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const set = (patch: Partial<Speaker>) => setP((x) => ({ ...x, ...patch }))
  const initials = (p.name ?? '').trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')
  const onPickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPhoto(true)
    const r = await uploadSpeakerPhoto(sid, file)
    setUploadingPhoto(false)
    if (r.error) return ctx.toast(r.error)
    setPhotoUrl(r.url)
  }
  const save = async () => {
    if (!p.name?.trim() || saving) return
    setSaving(true)
    const row = {
      id: sid, name: p.name?.trim(), role: p.role ?? '', org: p.org ?? '',
      initials, color: p.color ?? 'var(--wf-green-9)', bio: p.bio ?? '',
      topics: topics.split(',').map((t) => t.trim()).filter(Boolean), photo_url: photoUrl,
    }
    const { error } = await supabase.from('speakers').upsert(row)
    setSaving(false)
    if (error) return ctx.toast(error.message)
    await ctx.refreshContent()
    ctx.toast(p.id ? 'Speaker updated' : 'Speaker added')
    onDone()
  }
  return (
    <div>
      <Press onClick={onDone} style={{ fontFamily: T.sig, fontWeight: 600, fontSize: 14, color: T.green10, marginBottom: 12 }}>‹ Back to list</Press>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        <Avatar initials={initials || '·'} color={p.color ?? 'var(--wf-green-9)'} size={60} src={photoUrl} />
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 38, padding: '0 14px', borderRadius: 'var(--radius-2)', background: 'var(--wf-surface)', boxShadow: 'inset 0 0 0 1px var(--wf-grey-6)', fontFamily: T.sig, fontWeight: 600, fontSize: 13.5, color: T.ink, cursor: 'pointer' }}>
          {uploadingPhoto ? 'Uploading…' : photoUrl ? 'Replace photo' : 'Upload photo'}
          <input type="file" accept="image/*" onChange={onPickPhoto} style={{ display: 'none' }} />
        </label>
      </div>
      <Field label="Name"><Text value={p.name ?? ''} onChange={(v) => set({ name: v })} placeholder="Dr. Jane Doe" /></Field>
      <Field label="Role"><Text value={p.role ?? ''} onChange={(v) => set({ role: v })} placeholder="Professor of …" /></Field>
      <Field label="Organisation"><Text value={p.org ?? ''} onChange={(v) => set({ org: v })} placeholder="University of …" /></Field>
      <Field label="Bio"><Text value={p.bio ?? ''} onChange={(v) => set({ bio: v })} area /></Field>
      <Field label="Topics (comma-separated)"><Text value={topics} onChange={setTopics} placeholder="Integrity, AI" /></Field>
      <Btn kind="primary" full size="lg" onClick={save} disabled={!p.name?.trim() || saving}>{saving ? 'Saving…' : 'Save speaker'}</Btn>
    </div>
  )
}

/* ════════ Sponsors ════════ */
function Sponsors({ ctx }: { ctx: AppCtx }) {
  const [editing, setEditing] = useState<(Partial<Sponsor> & { id?: string }) | null>(null)
  if (editing) return <SponsorEditor ctx={ctx} initial={editing} onDone={() => setEditing(null)} />
  return (
    <div>
      <Btn kind="primary" full icon="plus" onClick={() => setEditing({ name: '', tier: 'Gold', blurb: '', color: 'var(--wf-green-7)' })} style={{ marginBottom: 14 }}>New sponsor</Btn>
      <div style={{ background: 'var(--wf-surface)', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
        {ctx.sponsors.map((sp, i) => (
          <Press key={sp.name} onClick={() => setEditing(sp)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: i === ctx.sponsors.length - 1 ? 'none' : '1px solid ' + T.line }}>
            <span style={{ flex: 1, fontFamily: T.sig, fontWeight: 600, fontSize: 14.5, color: T.ink }}>{sp.name}</span>
            <span style={{ fontFamily: T.onest, fontSize: 11, color: T.muted }}>{sp.tier}</span>
          </Press>
        ))}
      </div>
    </div>
  )
}
function SponsorEditor({ ctx, initial, onDone }: { ctx: AppCtx; initial: Partial<Sponsor> & { id?: string }; onDone: () => void }) {
  const [sp, setSp] = useState(initial)
  const [saving, setSaving] = useState(false)
  const set = (patch: Partial<Sponsor>) => setSp((x) => ({ ...x, ...patch }))
  const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const initials = (sp.name ?? '').trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')
  const save = async () => {
    if (!sp.name?.trim() || saving) return
    setSaving(true)
    const row = {
      id: (initial as Sponsor & { id?: string }).id ?? slug(sp.name!), name: sp.name?.trim(),
      tier: sp.tier ?? 'Gold', blurb: sp.blurb ?? '', initials, color: sp.color ?? 'var(--wf-green-7)',
      description: sp.description ?? '', booth: sp.booth ?? '', website: sp.website ?? '',
    }
    const { error } = await supabase.from('sponsors').upsert(row)
    setSaving(false)
    if (error) return ctx.toast(error.message)
    await ctx.refreshContent()
    ctx.toast('Sponsor saved')
    onDone()
  }
  return (
    <div>
      <Press onClick={onDone} style={{ fontFamily: T.sig, fontWeight: 600, fontSize: 14, color: T.green10, marginBottom: 12 }}>‹ Back to list</Press>
      <Field label="Name"><Text value={sp.name ?? ''} onChange={(v) => set({ name: v })} placeholder="Company name" /></Field>
      <Field label="Tier"><Select value={sp.tier ?? 'Gold'} onChange={(v) => set({ tier: v as SponsorTier })} options={(['Host', 'Platinum', 'Gold', 'Silver'] as SponsorTier[]).map((t) => [t, t])} /></Field>
      <Field label="Blurb"><Text value={sp.blurb ?? ''} onChange={(v) => set({ blurb: v })} placeholder="Short tagline" /></Field>
      <Field label="Booth"><Text value={sp.booth ?? ''} onChange={(v) => set({ booth: v })} placeholder="e.g. B12" /></Field>
      <Field label="Website"><Text value={sp.website ?? ''} onChange={(v) => set({ website: v })} placeholder="https://…" /></Field>
      <Field label="About (exhibitor profile)"><Text value={sp.description ?? ''} onChange={(v) => set({ description: v })} area /></Field>
      <Btn kind="primary" full size="lg" onClick={save} disabled={!sp.name?.trim() || saving}>{saving ? 'Saving…' : 'Save sponsor'}</Btn>
    </div>
  )
}
