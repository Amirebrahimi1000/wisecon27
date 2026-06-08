// WISEcon27 — Session Detail: hero, action bar, Details / Q&A / Live poll tabs.
import { useState } from 'react'
import { TRACKS } from '../data'
import { T, STATUS_INSET, TABBAR_H } from '../theme'
import type { AppCtx } from '../appState'
import type { Session, Speaker } from '../types'
import { Icon } from '../components/Icon'
import { Avatar, Btn, Eyebrow, IconBtn, Press, TYPE_META } from '../components/primitives'
import { useQA, usePoll, type QAItem } from '../sessionLive'
import { slidesPublicUrl } from '../lib/storage'

export function SessionDetail({ ctx }: { ctx: AppCtx }) {
  const s = ctx.params.session!
  const t = TRACKS[s.track]
  const sp = ctx.speakersOf(s)
  const isBreak = s.type === 'break' || s.type === 'social'
  const [tab, setTab] = useState<'details' | 'qa' | 'poll'>('details')
  const bm = ctx.isBookmarked(s.id)
  const day = ctx.days.find((d) => d.id === s.day)!
  const qa = useQA(s.id, ctx.userId)

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
      {s.slidesPath && (
        <a
          href={slidesPublicUrl(s.slidesPath)}
          target="_blank"
          rel="noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', borderRadius: 'var(--radius-4)', padding: 14, boxShadow: 'var(--shadow-sm)', textDecoration: 'none' }}
        >
          <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-3)', background: T.green1, color: T.green10, display: 'grid', placeItems: 'center' }}><Icon name="download" size={20} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 14.5, color: T.ink }}>Download slides</div>
            <div style={{ fontFamily: T.sig, fontSize: 12.5, color: T.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.slidesName || 'Presentation'}</div>
          </div>
          <Icon name="chevronRight" size={18} stroke={2} style={{ color: T.line2 }} />
        </a>
      )}
      <SessionFeedback s={s} ctx={ctx} />
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
              <Press key={c} onClick={() => { toggle(c); setSaved(false) }} style={{ fontFamily: T.sig, fontWeight: 600, fontSize: 13, padding: '6px 12px', borderRadius: 999, background: tags.includes(c) ? T.green9 : '#fff', color: tags.includes(c) ? '#fff' : T.body, boxShadow: tags.includes(c) ? 'none' : 'inset 0 0 0 1px var(--wf-grey-6)' }}>{c}</Press>
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
        <div key={it.id} style={{ display: 'flex', gap: 12, background: '#fff', borderRadius: 'var(--radius-4)', padding: '13px 14px', boxShadow: 'var(--shadow-sm)' }}>
          <Press
            onClick={() => qa.toggleVote(it)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, width: 38, flexShrink: 0, color: it.voted ? T.green9 : T.muted, background: it.voted ? T.green1 : T.sunken, borderRadius: 'var(--radius-3)', padding: '6px 0' }}
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
        <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--wf-tomato-9)' }} className="wc-pulse" />
        <Eyebrow color="var(--wf-tomato-11)">Live now</Eyebrow>
      </div>
      <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 18, color: T.ink, lineHeight: 1.3, marginBottom: 16 }}>{poll.question}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {poll.options.map((o) => {
          const pct = poll.total ? Math.round((o.votes / poll.total) * 100) : 0
          const mine = picked === o.id
          return (
            <Press key={o.id} onClick={() => !picked && poll.vote(poll.pollId!, o.id)} style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-4)', border: '1.5px solid ' + (mine ? T.green9 : 'var(--wf-grey-6)'), padding: '13px 14px', background: '#fff' }}>
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
