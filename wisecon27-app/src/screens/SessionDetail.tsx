// WISEcon27 — Session Detail: hero, action bar, Details / Q&A / Live poll tabs.
// Speakers linked to a delegate account can share slides/resources here.
import { useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { trackOf } from '../data'
import { T, STATUS_INSET, TABBAR_H } from '../theme'
import type { AppCtx } from '../appState'
import type { Session, Speaker } from '../types'
import { Icon } from '../components/Icon'
import { Avatar, Btn, Eyebrow, IconBtn, Press, TYPE_META } from '../components/primitives'
import { useQA, usePoll, type QAItem } from '../sessionLive'
import { slidesPublicUrl, uploadResource } from '../lib/storage'
import { shareOrCopy } from '../lib/share'
import { conflictsFor, sessionStartMs } from '../sessionTime'
import { hasReminder, toggleReminder, syncReminderToServer, REMINDER_LEAD_MIN } from '../reminders'
import { getNote, setNote } from '../notes'
import { useT } from '../i18n'

export function SessionDetail({ ctx }: { ctx: AppCtx }) {
  const s = ctx.params.session!
  const { t: tr } = useT()
  const t = trackOf(s.track)
  const sp = ctx.speakersOf(s)
  const isBreak = s.type === 'break' || s.type === 'social'
  const [tab, setTab] = useState<'details' | 'qa' | 'poll'>('details')
  const bm = ctx.isBookmarked(s.id)
  const [reminded, setReminded] = useState(() => hasReminder(ctx.userId, s.id))
  const day = ctx.days.find((d) => d.id === s.day)!
  const qa = useQA(s.id, ctx.userId)
  const clashes = conflictsFor(ctx, s)

  const toggleRemind = () => {
    const on = toggleReminder(ctx.userId, s.id)
    syncReminderToServer(ctx.userId, s.id, on, sessionStartMs(ctx, s) - REMINDER_LEAD_MIN * 60000)
    setReminded(on)
    ctx.toast(on ? tr('session.reminderSet') + `${REMINDER_LEAD_MIN} min before` : tr('session.reminderOff'))
  }

  const share = async () => {
    const r = await shareOrCopy('WISEcon27', `${s.title} — ${day.dow} ${day.date}, ${s.start}–${s.end} in ${s.room} · WISEcon27`)
    if (r === 'copied') ctx.toast('Session details copied')
    else if (r === 'failed') ctx.toast('Sharing isn’t available on this device')
  }

  return (
    <div style={{ paddingBottom: TABBAR_H + 16 }}>
      {/* hero */}
      <div
        style={{
          position: 'relative',
          padding: STATUS_INSET + 8 + 'px 18px 22px',
          background: isBreak
            ? 'var(--wf-grey-12)'
            : `color-mix(in srgb, ${t.dot} 78%, #000)`,
          color: '#fff',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <IconBtn name="chevronLeft" onClick={ctx.back} stroke={2.2} color="#fff" bg="rgba(255,255,255,0.16)" />
          <IconBtn name="share" onClick={share} color="#fff" bg="rgba(255,255,255,0.16)" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.2)', borderRadius: 999, padding: '4px 11px', fontFamily: T.onest, fontWeight: 600, fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <Icon name={TYPE_META[s.type].icon} size={14} stroke={2} />
            {TYPE_META[s.type].label}
          </span>
        </div>
        <h2 style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 27, lineHeight: 1.15, color: '#fff', letterSpacing: '-0.01em' }}>{s.title}</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', marginTop: 14, fontFamily: T.sig, fontSize: 14, color: 'rgba(255,255,255,0.92)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="calendar" size={16} />{day.dow} {day.date}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="clock" size={16} />{s.start}–{s.end}</span>
          <Press onClick={() => ctx.push('venuemap', { room: s.room })} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'underline dotted', textUnderlineOffset: 3 }}>
            <Icon name="pin" size={16} />{s.room}
          </Press>
        </div>
      </div>

      {/* action bar */}
      {!isBreak && (
        <div style={{ background: 'var(--wf-surface)', borderBottom: '1px solid ' + T.line }}>
          <div style={{ display: 'flex', gap: 10, padding: '14px 16px' }}>
            <Btn kind={bm ? 'default' : 'primary'} full icon={bm ? 'check' : 'plus'} onClick={() => ctx.toggleBookmark(s.id)}>
              {bm ? tr('session.inSchedule') : tr('session.addSchedule')}
            </Btn>
            <Btn kind={reminded ? 'default' : 'outline'} icon={reminded ? 'checkCircle' : 'bell'} onClick={toggleRemind} style={{ flexShrink: 0 }}>
              {reminded ? tr('session.reminding') : tr('session.remind')}
            </Btn>
          </div>
          {clashes.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, margin: '0 16px 14px', padding: '10px 12px', background: 'var(--wf-amber-2, #fff7e6)', border: '1px solid var(--wf-amber-6, #f0d089)', borderRadius: 'var(--radius-4)' }}>
              <Icon name="clock" size={16} stroke={2} style={{ color: 'var(--wf-amber-10, #8a6516)', flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontFamily: T.sig, fontSize: 12.5, color: 'var(--wf-amber-11, #6b4e10)', lineHeight: 1.4 }}>
                {tr('session.clash')}: {clashes.map((c) => c.title).join(', ')}
              </div>
            </div>
          )}
        </div>
      )}

      {/* tabs */}
      {!isBreak && (
        <div style={{ display: 'flex', gap: 4, padding: '12px 16px 0', background: 'var(--wf-surface)', position: 'sticky', top: 0, zIndex: 20 }}>
          {([['details', 'Details'], ['qa', 'Q&A'], ['poll', 'Live poll']] as const).map(([k, label]) => (
            <Press key={k} onClick={() => setTab(k)} style={{ flex: 1, textAlign: 'center', paddingBottom: 10, fontFamily: T.sig, fontWeight: 600, fontSize: 14, color: tab === k ? T.green10 : T.muted, borderBottom: '2.5px solid ' + (tab === k ? T.green9 : 'transparent') }}>
              {label}
              {k === 'qa' && qa.items.length > 0 && <span style={{ fontFamily: T.onest, fontSize: 11, color: tab === k ? T.green9 : T.muted, marginLeft: 5 }}>{qa.items.length}</span>}
            </Press>
          ))}
        </div>
      )}

      <div style={{ padding: '18px 16px 0' }}>
        {(isBreak || tab === 'details') && <DetailsTab s={s} sp={sp} ctx={ctx} />}
        {!isBreak && tab === 'qa' && <QATab ctx={ctx} qa={qa} />}
        {!isBreak && tab === 'poll' && <PollTab sessionId={s.id} ctx={ctx} />}
      </div>
    </div>
  )
}

function DetailsTab({ s, sp, ctx }: { s: Session; sp: Speaker[]; ctx: AppCtx }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <p style={{ fontFamily: T.sig, fontSize: 15.5, lineHeight: 1.55, color: T.body }}>{s.desc}</p>
      {s.tags && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {/* tappable: jump to the Agenda pre-searched on this topic */}
          {s.tags.map((tag) => (
            <Press key={tag} onClick={() => ctx.openAgendaSearch(tag, s.day)} ariaLabel={'Find sessions about ' + tag} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: T.sig, fontSize: 12.5, fontWeight: 600, color: T.subtle, background: T.sunken, borderRadius: 999, padding: '5px 12px' }}>
              #{tag}
              <Icon name="search" size={11} stroke={2.2} />
            </Press>
          ))}
        </div>
      )}
      {sp.length > 0 && (
        <div>
          <Eyebrow style={{ marginBottom: 10 }}>{sp.length > 1 ? 'Speakers' : 'Speaker'}</Eyebrow>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sp.map((p) => (
              <Press key={p.id} onClick={() => ctx.push('speaker', { speaker: p })} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--wf-surface)', borderRadius: 'var(--radius-4)', padding: 12, boxShadow: 'var(--shadow-sm)' }}>
                <Avatar initials={p.initials} color={p.color} size={44} src={p.photoUrl} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 15, color: T.ink }}>{p.name}</div>
                  <div style={{ fontFamily: T.sig, fontSize: 13, color: T.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.role} · {p.org}</div>
                </div>
                <Icon name="chevronRight" size={18} stroke={2} style={{ color: T.line2 }} />
              </Press>
            ))}
          </div>
        </div>
      )}
      {s.going > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: T.muted, fontFamily: T.sig, fontSize: 13.5 }}>
          <Icon name="speakers" size={17} /> {s.going.toLocaleString('en')} delegates planning to attend
        </div>
      )}
      <SessionResources s={s} sp={sp} ctx={ctx} />
      <NotesSection s={s} ctx={ctx} />
      <SessionFeedback s={s} ctx={ctx} />
    </div>
  )
}

/* ── private per-session notes (device-local) ── */
function NotesSection({ s, ctx }: { s: Session; ctx: AppCtx }) {
  const { t: tr } = useT()
  const [text, setText] = useState(() => getNote(ctx.userId, s.id))
  const onChange = (v: string) => {
    setText(v)
    setNote(ctx.userId, s.id, v)
  }
  return (
    <div>
      <Eyebrow style={{ marginBottom: 10 }}>{tr('session.notes')}</Eyebrow>
      <textarea
        value={text}
        onChange={(e) => onChange(e.target.value)}
        placeholder={tr('notes.placeholder')}
        rows={4}
        style={{ width: '100%', boxSizing: 'border-box', border: 'none', outline: 'none', resize: 'vertical', background: 'var(--wf-surface)', borderRadius: 'var(--radius-4)', padding: '12px 13px', fontFamily: T.sig, fontSize: 15, color: T.ink, lineHeight: 1.5, boxShadow: 'inset 0 0 0 1px var(--wf-grey-6)' }}
      />
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 7, fontFamily: T.sig, fontSize: 12, color: T.muted }}>
        <Icon name="shield" size={13} /> {tr('notes.private')}
      </div>
    </div>
  )
}

/* ── slides + resources, with sharing tools for the session's speakers ── */
function SessionResources({ s, sp, ctx }: { s: Session; sp: Speaker[]; ctx: AppCtx }) {
  const resources = ctx.resourcesOf(s.id)
  // am I one of this session's speakers? (linked via Admin → Speakers)
  const amSpeaker = sp.some((p) => p.profileId && p.profileId === ctx.userId)
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [linkLabel, setLinkLabel] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [addingLink, setAddingLink] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const pickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const r = await uploadResource(s.id, file)
    if (r.error) {
      setUploading(false)
      return ctx.toast(r.error)
    }
    const { error } = await supabase.from('session_resources').insert({ session_id: s.id, label: r.name, path: r.path, created_by: ctx.userId })
    setUploading(false)
    if (error) return ctx.toast(error.message)
    await ctx.refreshContent()
    ctx.toast('Shared with attendees')
  }

  const addLink = async () => {
    const label = linkLabel.trim()
    const url = linkUrl.trim()
    if (!label || !url) return
    const { error } = await supabase.from('session_resources').insert({
      session_id: s.id, label, url: url.startsWith('http') ? url : 'https://' + url, created_by: ctx.userId,
    })
    if (error) return ctx.toast(error.message)
    setLinkLabel(''); setLinkUrl(''); setAddingLink(false)
    await ctx.refreshContent()
    ctx.toast('Link shared with attendees')
  }

  const remove = async (id: string) => {
    if (confirmId !== id) return setConfirmId(id)
    setConfirmId(null)
    const { error } = await supabase.from('session_resources').delete().eq('id', id)
    if (error) return ctx.toast(error.message)
    await ctx.refreshContent()
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', border: 'none', outline: 'none', background: 'var(--wf-surface)',
    borderRadius: 'var(--radius-2)', padding: '10px 12px', fontFamily: T.sig, fontSize: 14, color: T.ink,
    boxShadow: 'inset 0 0 0 1px var(--wf-grey-6)', marginBottom: 8,
  }

  if (!s.slidesPath && resources.length === 0 && !amSpeaker) return null
  return (
    <div>
      <Eyebrow style={{ marginBottom: 10 }}>Slides & resources</Eyebrow>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {s.slidesPath && (
          <a
            href={slidesPublicUrl(s.slidesPath)}
            target="_blank"
            rel="noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--wf-surface)', borderRadius: 'var(--radius-4)', padding: 14, boxShadow: 'var(--shadow-sm)', textDecoration: 'none' }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-2)', background: T.green1, color: T.green10, display: 'grid', placeItems: 'center' }}><Icon name="download" size={20} /></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 14.5, color: T.ink }}>Download slides</div>
              <div style={{ fontFamily: T.sig, fontSize: 12.5, color: T.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.slidesName || 'Presentation'}</div>
            </div>
            <Icon name="chevronRight" size={18} stroke={2} style={{ color: T.line2 }} />
          </a>
        )}
        {resources.map((r) => (
          <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--wf-surface)', borderRadius: 'var(--radius-4)', padding: '12px 14px', boxShadow: 'var(--shadow-sm)' }}>
            <a
              href={r.path ? slidesPublicUrl(r.path) : r.url ?? '#'}
              target="_blank"
              rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0, textDecoration: 'none' }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-2)', background: T.green1, color: T.green10, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <Icon name={r.path ? 'download' : 'arrowRight'} size={18} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: T.sig, fontWeight: 600, fontSize: 14, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.label}</div>
                <div style={{ fontFamily: T.onest, fontSize: 11, color: T.muted }}>{r.path ? 'File · shared by the speaker' : 'Link · shared by the speaker'}</div>
              </div>
            </a>
            {(amSpeaker || ctx.isAdmin) && (
              <Press onClick={() => remove(r.id)} style={{ color: confirmId === r.id ? 'var(--wf-negative-9)' : T.line2, padding: 4, fontFamily: T.sig, fontWeight: 600, fontSize: 12.5, flexShrink: 0 }}>
                {confirmId === r.id ? 'Remove?' : <Icon name="close" size={16} />}
              </Press>
            )}
          </div>
        ))}
      </div>

      {/* speaker tools */}
      {amSpeaker && (
        <div style={{ marginTop: 12, background: T.green1, borderRadius: 'var(--radius-4)', padding: 14 }}>
          <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 13.5, color: T.green11, marginBottom: 10 }}>
            You're speaking at this session — share materials with attendees.
          </div>
          <input ref={fileRef} type="file" onChange={pickFile} style={{ display: 'none' }} />
          {addingLink ? (
            <div>
              <input value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} placeholder="Label, e.g. Slides on Google Drive" style={inputStyle} />
              <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://…" style={inputStyle} />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <Btn kind="default" size="sm" onClick={() => setAddingLink(false)}>Cancel</Btn>
                <Btn kind="primary" size="sm" onClick={addLink} disabled={!linkLabel.trim() || !linkUrl.trim()}>Share link</Btn>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn kind="primary" size="sm" full icon="download" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? 'Uploading…' : 'Upload a file'}
              </Btn>
              <Btn kind="outline" size="sm" full icon="share" onClick={() => setAddingLink(true)}>Share a link</Btn>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const FB_CHIPS = ['Great speaker', 'Insightful', 'Practical', 'Too short', 'Right level', 'Loved it']
function SessionFeedback({ s, ctx }: { s: Session; ctx: AppCtx }) {
  const existing = ctx.myFeedback[s.id]
  const [stars, setStars] = useState(existing?.stars ?? 0)
  const [tags, setTags] = useState<string[]>(existing?.tags ?? [])
  const [comment, setComment] = useState(existing?.comment ?? '')
  const [saved, setSaved] = useState(!!existing)
  const toggle = (c: string) => setTags((t) => (t.includes(c) ? t.filter((x) => x !== c) : [...t, c]))
  const submit = async () => {
    if (!stars) return
    await ctx.submitSessionFeedback(s.id, stars, tags, comment)
    setSaved(true)
    ctx.toast('Thanks for your feedback')
  }
  return (
    <div style={{ borderTop: '1px solid ' + T.line, paddingTop: 18 }}>
      <Eyebrow style={{ marginBottom: 10 }}>{saved ? 'Your rating' : 'Rate this session'}</Eyebrow>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Press key={i} onClick={() => { setStars(i); setSaved(false) }} style={{ color: i <= stars ? 'var(--wf-yellow-8)' : T.line2 }}>
            <Icon name={i <= stars ? 'starFill' : 'star'} size={30} />
          </Press>
        ))}
      </div>
      {stars > 0 && (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {FB_CHIPS.map((c) => (
              <Press key={c} onClick={() => { toggle(c); setSaved(false) }} style={{ fontFamily: T.sig, fontWeight: 600, fontSize: 13, padding: '6px 12px', borderRadius: 999, background: tags.includes(c) ? T.green9 : 'var(--wf-surface)', color: tags.includes(c) ? '#fff' : T.body, boxShadow: tags.includes(c) ? 'none' : 'inset 0 0 0 1px var(--wf-grey-6)' }}>{c}</Press>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => { setComment(e.target.value); setSaved(false) }}
            placeholder="Comments for the speaker (optional)"
            rows={2}
            style={{ width: '100%', boxSizing: 'border-box', resize: 'none', border: '1px solid var(--wf-grey-6)', borderRadius: 'var(--radius-4)', padding: 12, fontFamily: T.sig, fontSize: 14.5, color: T.ink, outline: 'none', lineHeight: 1.5, marginBottom: 12 }}
          />
          <Btn kind={saved ? 'default' : 'primary'} full icon={saved ? 'check' : undefined} onClick={submit}>{saved ? 'Saved — update' : 'Submit feedback'}</Btn>
        </>
      )}
    </div>
  )
}

function QATab({ ctx, qa }: { ctx: AppCtx; qa: ReturnType<typeof useQA> }) {
  const [text, setText] = useState('')
  const [anon, setAnon] = useState(false)
  const submit = () => {
    if (!text.trim()) return
    qa.submit(text, anon)
    setText('')
    ctx.toast('Question submitted')
  }
  const who = (it: QAItem) =>
    it.anonymous ? 'Anonymous' : it.userId === ctx.userId ? 'You' : ctx.nameFor(it.userId ?? '')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ask the speaker a question…"
          rows={1}
          style={{ flex: 1, resize: 'none', border: '1px solid var(--wf-grey-6)', borderRadius: 'var(--radius-4)', padding: '11px 13px', fontFamily: T.sig, fontSize: 14.5, color: T.ink, outline: 'none', lineHeight: 1.4 }}
        />
        <Btn kind="primary" onClick={submit} icon="send" style={{ height: 44, padding: '0 14px' }} />
      </div>
      <Press onClick={() => setAnon((a) => !a)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, alignSelf: 'flex-start', color: anon ? T.green9 : T.muted }}>
        <Icon name={anon ? 'checkCircle' : 'user'} size={16} stroke={2} />
        <span style={{ fontFamily: T.sig, fontSize: 12.5, fontWeight: 600 }}>Ask anonymously</span>
      </Press>
      {qa.items.length === 0 && (
        <div style={{ textAlign: 'center', color: T.muted, padding: '20px 0', fontFamily: T.sig, fontSize: 14 }}>
          No questions yet — be the first to ask.
        </div>
      )}
      {qa.items.map((it) => (
        <div key={it.id} style={{ display: 'flex', gap: 12, background: 'var(--wf-surface)', borderRadius: 'var(--radius-4)', padding: '13px 14px', boxShadow: 'var(--shadow-sm)' }}>
          <Press
            onClick={() => qa.toggleVote(it)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, width: 38, flexShrink: 0, color: it.voted ? T.green9 : T.muted, background: it.voted ? T.green1 : T.sunken, borderRadius: 'var(--radius-2)', padding: '6px 0' }}
          >
            <Icon name="arrowUp" size={17} stroke={2.2} />
            <span style={{ fontFamily: T.onest, fontWeight: 700, fontSize: 13 }}>{it.up}</span>
          </Press>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.sig, fontSize: 14.5, color: T.ink, lineHeight: 1.4 }}>{it.body}</div>
            <div style={{ fontFamily: T.onest, fontSize: 11.5, color: T.muted, marginTop: 5 }}>{who(it)}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function PollTab({ sessionId, ctx }: { sessionId: string; ctx: AppCtx }) {
  const poll = usePoll(sessionId, ctx.userId)
  if (poll.loading) return null
  if (!poll.pollId) {
    return (
      <div style={{ textAlign: 'center', color: T.muted, padding: '32px 0', fontFamily: T.sig, fontSize: 14.5 }}>
        No live poll for this session.
      </div>
    )
  }
  const picked = poll.myOption
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--wf-green-9)' }} className="wc-pulse" />
        <Eyebrow color="var(--wf-green-11)">Live now</Eyebrow>
      </div>
      <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 18, color: T.ink, lineHeight: 1.3, marginBottom: 16 }}>{poll.question}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {poll.options.map((o) => {
          const pct = poll.total ? Math.round((o.votes / poll.total) * 100) : 0
          const mine = picked === o.id
          return (
            <Press key={o.id} onClick={() => !picked && poll.vote(poll.pollId!, o.id)} style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-4)', border: '1.5px solid ' + (mine ? T.green9 : 'var(--wf-grey-6)'), padding: '13px 14px', background: 'var(--wf-surface)' }}>
              {picked && <div style={{ position: 'absolute', inset: 0, width: pct + '%', background: mine ? T.green1 : T.sunken, transition: 'width .6s var(--ease-out)' }} />}
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: T.sig, fontWeight: 600, fontSize: 14.5, color: T.ink, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {mine && <Icon name="check" size={16} stroke={2.4} style={{ color: T.green9 }} />}
                  {o.label}
                </span>
                {picked && <span style={{ fontFamily: T.onest, fontWeight: 700, fontSize: 14, color: mine ? T.green10 : T.subtle }}>{pct}%</span>}
              </div>
            </Press>
          )
        })}
      </div>
      <div style={{ fontFamily: T.onest, fontSize: 12, color: T.muted, marginTop: 14, textAlign: 'center' }}>
        {picked ? `${poll.total} votes · thanks for voting` : `${poll.total} votes · tap to cast yours`}
      </div>
    </div>
  )
}
