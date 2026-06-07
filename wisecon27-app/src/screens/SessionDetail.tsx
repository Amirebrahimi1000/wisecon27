// WISEcon27 — Session Detail: hero, action bar, Details / Q&A / Live poll tabs.
import { useState } from 'react'
import { DAYS, TRACKS, speakersOf } from '../data'
import { T, STATUS_INSET, TABBAR_H } from '../theme'
import type { AppCtx } from '../store'
import type { Session, Speaker } from '../types'
import { Icon } from '../components/Icon'
import { Avatar, Btn, Eyebrow, IconBtn, Press, TYPE_META } from '../components/primitives'

export function SessionDetail({ ctx }: { ctx: AppCtx }) {
  const s = ctx.params.session!
  const t = TRACKS[s.track]
  const sp = speakersOf(s)
  const isBreak = s.type === 'break' || s.type === 'social'
  const [tab, setTab] = useState<'details' | 'qa' | 'poll'>('details')
  const bm = ctx.isBookmarked(s.id)
  const day = DAYS.find((d) => d.id === s.day)!

  return (
    <div style={{ paddingBottom: TABBAR_H + 16 }}>
      {/* hero */}
      <div
        style={{
          position: 'relative',
          padding: STATUS_INSET + 8 + 'px 18px 22px',
          background: isBreak
            ? 'linear-gradient(150deg, var(--wf-grey-11), var(--wf-grey-12))'
            : `linear-gradient(150deg, ${t.dot}, color-mix(in srgb, ${t.dot} 62%, #000))`,
          color: '#fff',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <IconBtn name="chevronLeft" onClick={ctx.back} stroke={2.2} color="#fff" bg="rgba(255,255,255,0.16)" />
          <IconBtn name="share" onClick={() => ctx.toast('Share link copied')} color="#fff" bg="rgba(255,255,255,0.16)" />
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
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="pin" size={16} />{s.room}</span>
        </div>
      </div>

      {/* action bar */}
      {!isBreak && (
        <div style={{ display: 'flex', gap: 10, padding: '14px 16px', background: '#fff', borderBottom: '1px solid ' + T.line }}>
          <Btn kind={bm ? 'default' : 'primary'} full icon={bm ? 'check' : 'plus'} onClick={() => ctx.toggleBookmark(s.id)}>
            {bm ? 'In my schedule' : 'Add to schedule'}
          </Btn>
          <Btn kind="outline" icon="bell" onClick={() => ctx.toast('Reminder set for ' + s.start)} style={{ flexShrink: 0 }}>
            Remind
          </Btn>
        </div>
      )}

      {/* tabs */}
      {!isBreak && (
        <div style={{ display: 'flex', gap: 4, padding: '12px 16px 0', background: '#fff', position: 'sticky', top: 0, zIndex: 20 }}>
          {([['details', 'Details'], ['qa', 'Q&A'], ['poll', 'Live poll']] as const).map(([k, label]) => (
            <Press key={k} onClick={() => setTab(k)} style={{ flex: 1, textAlign: 'center', paddingBottom: 10, fontFamily: T.sig, fontWeight: 600, fontSize: 14, color: tab === k ? T.green10 : T.muted, borderBottom: '2.5px solid ' + (tab === k ? T.green9 : 'transparent') }}>
              {label}
              {k === 'qa' && <span style={{ fontFamily: T.onest, fontSize: 11, color: tab === k ? T.green9 : T.muted, marginLeft: 5 }}>4</span>}
            </Press>
          ))}
        </div>
      )}

      <div style={{ padding: '18px 16px 0' }}>
        {(isBreak || tab === 'details') && <DetailsTab s={s} sp={sp} ctx={ctx} />}
        {!isBreak && tab === 'qa' && <QATab ctx={ctx} />}
        {!isBreak && tab === 'poll' && <PollTab />}
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
          {s.tags.map((tag) => (
            <span key={tag} style={{ fontFamily: T.sig, fontSize: 12.5, fontWeight: 600, color: T.subtle, background: T.sunken, borderRadius: 999, padding: '5px 12px' }}>#{tag}</span>
          ))}
        </div>
      )}
      {sp.length > 0 && (
        <div>
          <Eyebrow style={{ marginBottom: 10 }}>{sp.length > 1 ? 'Speakers' : 'Speaker'}</Eyebrow>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sp.map((p) => (
              <Press key={p.id} onClick={() => ctx.push('speaker', { speaker: p })} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', borderRadius: 'var(--radius-4)', padding: 12, boxShadow: 'var(--shadow-sm)' }}>
                <Avatar initials={p.initials} color={p.color} size={44} />
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
    </div>
  )
}

interface QAItem { id: number; q: string; who: string; up: number; voted: boolean }

function QATab({ ctx }: { ctx: AppCtx }) {
  const seed: QAItem[] = [
    { id: 1, q: 'How do you handle false positives in AI detection at scale?', who: 'Camille R.', up: 18, voted: false },
    { id: 2, q: 'Is there guidance on setting thresholds for different disciplines?', who: 'Anonymous', up: 12, voted: false },
    { id: 3, q: 'Will the slides be shared afterwards?', who: 'Tom B.', up: 9, voted: false },
    { id: 4, q: 'How does this interact with open-book formats?', who: 'Daniel O.', up: 5, voted: false },
  ]
  const [items, setItems] = useState<QAItem[]>(seed)
  const [text, setText] = useState('')
  const sorted = [...items].sort((a, b) => b.up - a.up)
  const submit = () => {
    if (!text.trim()) return
    setItems([...items, { id: Date.now(), q: text.trim(), who: 'You', up: 0, voted: false }])
    setText('')
    ctx.toast('Question submitted')
  }
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
      {sorted.map((it) => (
        <div key={it.id} style={{ display: 'flex', gap: 12, background: '#fff', borderRadius: 'var(--radius-4)', padding: '13px 14px', boxShadow: 'var(--shadow-sm)' }}>
          <Press
            onClick={() => setItems(items.map((x) => (x.id === it.id ? { ...x, up: x.voted ? x.up - 1 : x.up + 1, voted: !x.voted } : x)))}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, width: 38, flexShrink: 0, color: it.voted ? T.green9 : T.muted, background: it.voted ? T.green1 : T.sunken, borderRadius: 'var(--radius-3)', padding: '6px 0' }}
          >
            <Icon name="arrowUp" size={17} stroke={2.2} />
            <span style={{ fontFamily: T.onest, fontWeight: 700, fontSize: 13 }}>{it.up}</span>
          </Press>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.sig, fontSize: 14.5, color: T.ink, lineHeight: 1.4 }}>{it.q}</div>
            <div style={{ fontFamily: T.onest, fontSize: 11.5, color: T.muted, marginTop: 5 }}>{it.who}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

interface PollOpt { id: string; label: string; v: number }

function PollTab() {
  const opts: PollOpt[] = [
    { id: 'a', label: 'Detection tools', v: 34 },
    { id: 'b', label: 'Redesigning assessments', v: 52 },
    { id: 'c', label: 'Both equally', v: 71 },
    { id: 'd', label: 'Neither — policy first', v: 19 },
  ]
  const [votes, setVotes] = useState<PollOpt[]>(opts)
  const [picked, setPicked] = useState<string | null>(null)
  const total = votes.reduce((a, b) => a + b.v, 0)
  const vote = (id: string) => {
    if (picked) return
    setPicked(id)
    setVotes(votes.map((o) => (o.id === id ? { ...o, v: o.v + 1 } : o)))
  }
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--wf-tomato-9)' }} className="wc-pulse" />
        <Eyebrow color="var(--wf-tomato-11)">Live now</Eyebrow>
      </div>
      <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 18, color: T.ink, lineHeight: 1.3, marginBottom: 16 }}>
        Where should institutions invest first to protect integrity?
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {votes.map((o) => {
          const pct = Math.round((o.v / total) * 100)
          const mine = picked === o.id
          return (
            <Press key={o.id} onClick={() => vote(o.id)} style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-4)', border: '1.5px solid ' + (mine ? T.green9 : 'var(--wf-grey-6)'), padding: '13px 14px', background: '#fff' }}>
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
        {picked ? `${total} votes · thanks for voting` : `${total} votes · tap to cast yours`}
      </div>
    </div>
  )
}
