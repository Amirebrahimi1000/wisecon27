// WISEcon27 — in-app admin (only reachable when profile.is_admin = true).
// Broadcast announcements and manage sessions / speakers / sponsors. All writes
// go through Supabase under the "admin write" RLS policy; realtime + refreshContent
// propagate changes to every delegate.
import { useState, type CSSProperties } from 'react'
import { supabase } from '../lib/supabase'
import { TRACKS } from '../data'
import { T, TABBAR_H } from '../theme'
import type { AppCtx } from '../appState'
import type { Session, Speaker, Sponsor, SponsorTier, TrackId, SessionType, NotificationType } from '../types'
import { AppHeader, Btn, Eyebrow, Press } from '../components/primitives'

/* ── small field helpers ── */
const inputStyle: CSSProperties = {
  width: '100%', boxSizing: 'border-box', border: 'none', outline: 'none', background: '#fff',
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

type AdminTab = 'announce' | 'sessions' | 'speakers' | 'sponsors'

export function Admin({ ctx }: { ctx: AppCtx }) {
  const [tab, setTab] = useState<AdminTab>('announce')
  const TABS: [AdminTab, string][] = [['announce', 'Announce'], ['sessions', 'Sessions'], ['speakers', 'Speakers'], ['sponsors', 'Sponsors']]
  return (
    <div>
      <AppHeader title="Admin" sub="Organiser tools" onBack={ctx.back} />
      <div style={{ display: 'flex', gap: 4, padding: '12px 16px 0' }}>
        {TABS.map(([k, l]) => (
          <Press key={k} onClick={() => setTab(k)} style={{ flex: 1, textAlign: 'center', paddingBottom: 10, fontFamily: T.sig, fontWeight: 600, fontSize: 13, color: tab === k ? T.green10 : T.muted, borderBottom: '2.5px solid ' + (tab === k ? T.green9 : 'transparent') }}>{l}</Press>
        ))}
      </div>
      <div style={{ padding: '16px 16px ' + (TABBAR_H + 16) + 'px' }}>
        {tab === 'announce' && <Announce ctx={ctx} />}
        {tab === 'sessions' && <Sessions ctx={ctx} />}
        {tab === 'speakers' && <Speakers ctx={ctx} />}
        {tab === 'sponsors' && <Sponsors ctx={ctx} />}
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
    setSaving(false)
    if (error) return ctx.toast(error.message)
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
            <div style={{ background: '#fff', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
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
function SessionEditor({ ctx, initial, onDone }: { ctx: AppCtx; initial: Partial<Session> & { id?: string }; onDone: () => void }) {
  const [s, setS] = useState(initial)
  const [saving, setSaving] = useState(false)
  const set = (patch: Partial<Session>) => setS((p) => ({ ...p, ...patch }))
  const save = async () => {
    if (!s.title?.trim() || saving) return
    setSaving(true)
    const row = {
      id: s.id ?? 'sx-' + Date.now(),
      day_id: s.day, start: s.start, end: s.end, title: s.title?.trim(), type: s.type,
      track: s.track, room: s.room ?? '', desc: s.desc ?? '', tags: s.tags ?? [],
    }
    const { error } = await supabase.from('sessions').upsert(row)
    setSaving(false)
    if (error) return ctx.toast(error.message)
    await ctx.refreshContent()
    ctx.toast(s.id ? 'Session updated' : 'Session added')
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
      <div style={{ background: '#fff', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
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
  const set = (patch: Partial<Speaker>) => setP((x) => ({ ...x, ...patch }))
  const initials = (p.name ?? '').trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')
  const save = async () => {
    if (!p.name?.trim() || saving) return
    setSaving(true)
    const row = {
      id: p.id ?? 'spx-' + Date.now(), name: p.name?.trim(), role: p.role ?? '', org: p.org ?? '',
      initials, color: p.color ?? 'var(--wf-green-9)', bio: p.bio ?? '',
      topics: topics.split(',').map((t) => t.trim()).filter(Boolean),
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
      <div style={{ background: '#fff', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
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
      <Field label="Blurb"><Text value={sp.blurb ?? ''} onChange={(v) => set({ blurb: v })} placeholder="Short description" /></Field>
      <Btn kind="primary" full size="lg" onClick={save} disabled={!sp.name?.trim() || saving}>{saving ? 'Saving…' : 'Save sponsor'}</Btn>
    </div>
  )
}
