// WISEcon27 — in-app admin (only reachable when profile.is_admin = true).
// Broadcast announcements and manage sessions / speakers / sponsors. All writes
// go through Supabase under the "admin write" RLS policy; realtime + refreshContent
// propagate changes to every delegate.
import { useEffect, useState, type CSSProperties } from 'react'
import { supabase } from '../lib/supabase'
import { TRACKS } from '../data'
import { T, TABBAR_H } from '../theme'
import type { AppCtx, EventInfoItem } from '../appState'
import type { Activity, Session, Speaker, Sponsor, SponsorTier, TrackId, SessionType, NotificationType } from '../types'
import { Icon, type IconName } from '../components/Icon'
import { AppHeader, Btn, Eyebrow, Press } from '../components/primitives'
import { uploadSlides } from '../lib/storage'

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

type AdminTab = 'announce' | 'sessions' | 'speakers' | 'sponsors' | 'activities' | 'info'

export function Admin({ ctx }: { ctx: AppCtx }) {
  const [tab, setTab] = useState<AdminTab>('announce')
  const TABS: [AdminTab, string][] = [['announce', 'Announce'], ['sessions', 'Sessions'], ['speakers', 'Speakers'], ['sponsors', 'Sponsors'], ['activities', 'Activities'], ['info', 'Info']]
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
        {tab === 'activities' && <AdminActivities ctx={ctx} />}
        {tab === 'info' && <EventInfo ctx={ctx} />}
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
      <div style={{ background: '#fff', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
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
      <div style={{ background: '#fff', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
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
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 42, padding: '0 16px', borderRadius: 'var(--radius-2)', background: '#fff', boxShadow: 'inset 0 0 0 1px var(--wf-grey-6)', fontFamily: T.sig, fontWeight: 600, fontSize: 14, color: T.ink, cursor: 'pointer' }}>
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
            <Press key={p.id} onClick={() => toggleSpeaker(p.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 999, fontFamily: T.sig, fontWeight: 600, fontSize: 13, background: on ? T.green9 : '#fff', color: on ? '#fff' : T.body, boxShadow: on ? 'none' : 'inset 0 0 0 1px var(--wf-grey-6)' }}>
              {on && <Icon name="check" size={13} stroke={2.6} />}{p.name}
            </Press>
          )
        })}
      </div>

      {/* live poll builder */}
      <Eyebrow style={{ marginBottom: 8 }}>Live poll (optional)</Eyebrow>
      <div style={{ background: '#fff', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', padding: 14, marginBottom: 18 }}>
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
