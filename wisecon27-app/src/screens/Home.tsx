// WISEcon27 — Home (Bold layout).
import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { trackOf } from '../data'
import { T, STATUS_INSET, TABBAR_H } from '../theme'
import type { AppCtx } from '../appState'
import type { IconName } from '../components/Icon'
import { Icon } from '../components/Icon'
import { Avatar, BookmarkBtn, Btn, Eyebrow, IconBtn, Press, TrackTag } from '../components/primitives'
import { InstallBanner } from '../install'
import { useHasUnreadPosts } from '../feed'
import { useEventClock, type EventClock } from '../eventClock'
import { slidesPublicUrl } from '../lib/storage'
import { downloadCsv } from '../lib/csv'
import type { Session } from '../types'

// The hero's date line: today's long name while live, the dateline otherwise.
const heroDateLine = (ctx: AppCtx, clock: EventClock) =>
  clock.phase === 'live' ? ctx.days[clock.dayIndex - 1]?.long || ctx.event.dateline : ctx.event.dateline

interface PlanItem {
  id: string
  start: string
  end: string
  title: string
  place: string
  kind: 'session' | 'activity' | 'meeting'
  session?: Session
}

// The delegate's plan = bookmarked sessions + activity sign-ups, for the
// current event day against the real clock. Before the event this previews
// day 1; while live it follows the actual day, and "up next" is the first
// item that hasn't finished yet.
function planForHome(ctx: AppCtx, clock: EventClock) {
  const dayId =
    clock.phase === 'before'
      ? ctx.days[0]?.id
      : ctx.days[Math.min(Math.max(clock.dayIndex, 1), Math.max(ctx.days.length, 1)) - 1]?.id
  const pad = (n: number) => String(n).padStart(2, '0')
  const now =
    clock.phase === 'live' ? `${pad(new Date().getHours())}:${pad(new Date().getMinutes())}`
    : clock.phase === 'ended' ? '23:59'
    : '00:00'
  const sess: PlanItem[] = ctx.sessions
    .filter((s) => ctx.isBookmarked(s.id) && s.day === dayId)
    .map((s) => ({ id: s.id, start: s.start, end: s.end, title: s.title, place: s.room, kind: 'session', session: s }))
  const acts: PlanItem[] = ctx.activities
    .filter((a) => a.signedUp && a.day === dayId)
    .map((a) => ({ id: a.id, start: a.start, end: a.end, title: a.title, place: a.location, kind: 'activity' }))
  const mtgs: PlanItem[] = ctx.meetings
    .filter((m) => m.status === 'accepted' && m.day === dayId)
    .map((m) => ({
      id: m.id, start: m.start, end: m.end,
      title: 'Meeting with ' + ctx.nameFor(m.requesterId === ctx.userId ? m.inviteeId : m.requesterId),
      place: ctx.meetingPoints.find((p) => p.id === m.pointId)?.label ?? 'Meeting point TBC',
      kind: 'meeting',
    }))
  const mine = [...sess, ...acts, ...mtgs].sort((a, b) => a.start.localeCompare(b.start))
  const upNext = mine.find((i) => i.end > now) || mine[0]
  const later = mine.filter((i) => i !== upNext)
  return { mine, upNext, later }
}

interface QuickAction {
  icon: IconName
  label: string
  tab?: 'agenda' | 'speakers' | 'connect' | 'activities'
  push?: 'ticket' | 'info' | 'activities' | 'community' | 'venuemap'
}
// only destinations the tab bar does NOT already offer — no duplicates.
// My badge is omitted here: it has its own always-visible QR button in the hero.
const QUICK: QuickAction[] = [
  { icon: 'message', label: 'Community', push: 'community' },
  { icon: 'map', label: 'Venue map', push: 'venuemap' },
  { icon: 'speakers', label: 'Speakers', tab: 'speakers' },
  { icon: 'info', label: 'Info', push: 'info' },
]
const runQuick = (ctx: AppCtx, q: QuickAction) => (q.tab ? ctx.setTab(q.tab) : ctx.push(q.push!, {}))

/* ════════ Suggested for you (personalised recommendations) ════════ */
// Sessions are matched against my interests (tags, track name, speaker topics).
// No interests = no guessing: we invite the delegate to add some instead of
// padding the section with generic picks.
function suggestionsFor(ctx: AppCtx) {
  const myInts = ctx.me.interests.map((i) => i.toLowerCase()).filter(Boolean)
  const eligible = (s: Session) => !ctx.isBookmarked(s.id) && s.type !== 'break' && s.type !== 'social'
  // exact matches (chip-picked interests) outrank incidental substring hits
  const score = (s: Session) => {
    const hay = [...(s.tags ?? []), trackOf(s.track).name, ...ctx.speakersOf(s).flatMap((p) => p.topics)].map((x) => x.toLowerCase())
    return myInts.reduce((n, i) => n + (hay.includes(i) ? 2 : hay.some((h) => h.includes(i) || i.includes(h)) ? 1 : 0), 0)
  }
  const sessions = ctx.sessions
    .filter(eligible)
    .map((s) => ({ s, n: score(s) }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n || b.s.going - a.s.going)
    .slice(0, 4)
    .map((x) => x.s)
  const people = ctx.attendees
    .filter((a) => a.status === 'connect' && !a.hidden && a.mutual > 0)
    .sort((a, b) => b.mutual - a.mutual)
    .slice(0, 3)
  return { sessions, people, hasInterests: myInts.length > 0 }
}

function SuggestedSection({ ctx }: { ctx: AppCtx }) {
  const { sessions, people, hasInterests } = suggestionsFor(ctx)
  // no interests yet → one honest, actionable card instead of generic picks
  if (!hasInterests) {
    return (
      <div style={{ padding: '24px 16px 0' }}>
        <Press onClick={() => ctx.push('editprofile', { focus: 'interests' })} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--wf-surface)', borderRadius: 'var(--radius-4)', padding: 16, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: T.green1, color: T.green10, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="sparkles" size={19} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 14.5, color: T.ink }}>Get personal suggestions</div>
            <div style={{ fontFamily: T.sig, fontSize: 13, color: T.muted, marginTop: 1, lineHeight: 1.4 }}>Add a few interests to your profile and we'll match sessions and people for you.</div>
          </div>
          <Icon name="chevronRight" size={18} stroke={2} style={{ color: T.muted }} />
        </Press>
      </div>
    )
  }
  // interests set but nothing matches the programme → show nothing rather than guess
  if (sessions.length === 0 && people.length === 0) return null
  return (
    <div style={{ paddingTop: 24 }}>
      <div style={{ padding: '0 16px' }}>
        <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 19, color: T.ink, marginBottom: 4 }}>Suggested for you</div>
        <div style={{ fontFamily: T.sig, fontSize: 13, color: T.muted, marginBottom: 12, lineHeight: 1.4 }}>
          Matched to the interests on your profile.
        </div>
      </div>
      {sessions.length > 0 && (
        <div className="wc-noscroll" style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '0 16px' }}>
          {sessions.map((s) => {
            const d = ctx.days.find((x) => x.id === s.day)
            return (
              <Press key={s.id} onClick={() => ctx.openSession(s)} style={{ flex: '0 0 228px', background: 'var(--wf-surface)', borderRadius: 'var(--radius-4)', padding: '12px 14px', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <TrackTag track={s.track} />
                  <BookmarkBtn on={ctx.isBookmarked(s.id)} onClick={() => ctx.toggleBookmark(s.id)} size={30} />
                </div>
                <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 15, color: T.ink, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{s.title}</div>
                <div style={{ fontFamily: T.sig, fontSize: 12.5, color: T.muted, marginTop: 'auto' }}>{d?.dow} {s.start} · {s.room}</div>
              </Press>
            )
          })}
        </div>
      )}
      {people.length > 0 && (
        <div style={{ padding: '16px 16px 0' }}>
          <Eyebrow style={{ marginBottom: 10, paddingLeft: 2 }} color={T.subtle}>People you should meet</Eyebrow>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {people.map((p) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--wf-surface)', borderRadius: 'var(--radius-4)', padding: 12, boxShadow: 'var(--shadow-sm)' }}>
                <Press onClick={() => ctx.push('delegate', { peerId: p.id })}><Avatar initials={p.initials} color={p.color} size={42} src={p.avatarUrl} /></Press>
                <Press onClick={() => ctx.push('delegate', { peerId: p.id })} style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                  <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 14.5, color: T.ink }}>{p.name}</div>
                  <div style={{ fontFamily: T.sig, fontSize: 12.5, color: T.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {[p.role, p.org].filter(Boolean).join(' · ')}
                  </div>
                  <span style={{ display: 'inline-block', marginTop: 4, fontFamily: T.onest, fontSize: 11, color: T.green10, background: T.green1, borderRadius: 999, padding: '2px 8px' }}>{p.mutual} shared interests</span>
                </Press>
                <Btn kind="primary" size="sm" onClick={() => { ctx.setConnection(p.id, 'pending'); ctx.toast('Request sent to ' + p.name.split(' ')[0]) }}>Connect</Btn>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ════════ After the event (post-event mode) ════════ */
function PostEventSection({ ctx }: { ctx: AppCtx }) {
  const [exporting, setExporting] = useState(false)
  const slides = ctx.sessions.filter((s) => s.slidesPath).sort((a, b) => (a.day + a.start).localeCompare(b.day + b.start))
  const connected = ctx.attendees.filter((a) => a.status === 'connected')

  const exportConnections = async () => {
    if (exporting) return
    if (!connected.length) return ctx.toast('No connections to export yet')
    setExporting(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('name, role, org, email')
      .in('id', connected.map((a) => a.id))
    setExporting(false)
    if (error) return ctx.toast(error.message)
    const rows = (data ?? []) as { name: string; role: string; org: string; email: string }[]
    downloadCsv('wisecon27-connections.csv', [
      ['Name', 'Role', 'Organisation', 'Email'],
      ...rows.map((r) => [r.name, r.role, r.org, r.email]),
    ])
    ctx.toast('Connections exported')
  }

  return (
    <div style={{ padding: '20px 16px 0' }}>
      <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 19, color: T.ink, marginBottom: 4 }}>After the event</div>
      <div style={{ fontFamily: T.sig, fontSize: 13, color: T.muted, marginBottom: 12, lineHeight: 1.4 }}>
        Slides and the people you met — all in one place.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Press onClick={exportConnections} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--wf-surface)', borderRadius: 'var(--radius-4)', padding: 16, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: T.green1, color: T.green10, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="download" size={19} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 14.5, color: T.ink }}>{exporting ? 'Exporting…' : 'Export my connections'}</div>
            <div style={{ fontFamily: T.sig, fontSize: 12.5, color: T.muted, marginTop: 1 }}>{connected.length} contact{connected.length === 1 ? '' : 's'} as a CSV for your address book.</div>
          </div>
          <Icon name="chevronRight" size={18} stroke={2} style={{ color: T.muted }} />
        </Press>
        {slides.length > 0 && (
          <div style={{ background: 'var(--wf-surface)', borderRadius: 'var(--radius-4)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
            <Eyebrow style={{ padding: '14px 16px 4px' }}>Session slides</Eyebrow>
            {slides.map((s, i) => (
              <a
                key={s.id}
                href={slidesPublicUrl(s.slidesPath!)}
                target="_blank"
                rel="noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', textDecoration: 'none', borderBottom: i === slides.length - 1 ? 'none' : '1px solid ' + T.line }}
              >
                <Icon name="download" size={17} style={{ color: T.green10, flexShrink: 0 }} />
                <span style={{ flex: 1, fontFamily: T.sig, fontWeight: 600, fontSize: 14, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</span>
                <Icon name="chevronRight" size={16} stroke={2} style={{ color: T.line2 }} />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ════════ pending meeting requests — only shown when action is needed ════════ */
function MeetingRequestsCard({ ctx }: { ctx: AppCtx }) {
  const pending = ctx.meetings.filter((m) => m.status === 'pending' && m.inviteeId === ctx.userId)
  if (pending.length === 0) return null
  const first = pending[0]
  const d = ctx.days.find((x) => x.id === first.day)
  const detail = `${ctx.nameFor(first.requesterId)} suggested ${d ? d.dow + ' ' : ''}${first.start}–${first.end}` +
    (pending.length > 1 ? ` · +${pending.length - 1} more` : '')
  return (
    <div style={{ padding: '0 16px 18px' }}>
      <Press onClick={() => ctx.push('meetings', {})} style={{ display: 'flex', alignItems: 'center', gap: 12, background: T.green9, borderRadius: 'var(--radius-5)', padding: 16, color: '#fff', boxShadow: 'var(--shadow-card)' }}>
        <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <Icon name="clock" size={19} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 14.5 }}>
            {pending.length} meeting request{pending.length === 1 ? '' : 's'} waiting
          </div>
          <div style={{ fontFamily: T.sig, fontSize: 12.5, opacity: 0.88, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{detail}</div>
        </div>
        <span style={{ fontFamily: T.sig, fontWeight: 600, fontSize: 13, flexShrink: 0 }}>Respond</span>
        <Icon name="chevronRight" size={17} stroke={2} />
      </Press>
    </div>
  )
}

function HeroStat({ n, label }: { n: number; label: string }) {
  return (
    <div style={{ flex: 1, background: 'rgba(255,255,255,0.14)', borderRadius: 'var(--radius-4)', padding: '12px 12px', backdropFilter: 'blur(4px)' }}>
      <div style={{ fontFamily: T.onest, fontWeight: 700, fontSize: 24, color: '#fff', lineHeight: 1 }}>{n}</div>
      <div style={{ fontFamily: T.sig, fontSize: 11.5, color: 'rgba(255,255,255,0.82)', marginTop: 4, lineHeight: 1.2 }}>{label}</div>
    </div>
  )
}

/* ════════ Home (Bold) ════════ */
function HomeBold({ ctx }: { ctx: AppCtx }) {
  const clock = useEventClock(ctx.event.startISO, ctx.event.endISO, ctx.days.length)
  const me = ctx.me
  const communityUnread = useHasUnreadPosts(ctx.userId)
  // show a "more tiles this way" hint until the quick-action row is scrolled to the end
  const quickRef = useRef<HTMLDivElement>(null)
  const [moreQuick, setMoreQuick] = useState(false)
  const checkQuick = () => {
    const el = quickRef.current
    if (el) setMoreQuick(el.scrollLeft + el.clientWidth < el.scrollWidth - 8)
  }
  useEffect(() => {
    checkQuick()
    window.addEventListener('resize', checkQuick)
    return () => window.removeEventListener('resize', checkQuick)
  }, [])
  const { upNext, later, mine } = planForHome(ctx, clock)
  const t = upNext && upNext.kind === 'session' && upNext.session ? trackOf(upNext.session.track) : null
  const dateLine = heroDateLine(ctx, clock)
  const live = clock.phase === 'live'
  return (
    <div style={{ background: 'var(--wf-grey-2)', minHeight: '100%', paddingBottom: TABBAR_H + 16 }}>
      {/* hero */}
      <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(160deg, var(--wf-green-8) 0%, var(--wf-green-10) 55%, var(--wf-green-12) 130%)', padding: STATUS_INSET + 'px 20px 56px' }}>
        <img src={import.meta.env.BASE_URL + 'wisecon27-logo.svg'} alt="" style={{ position: 'absolute', right: -24, top: 18, width: 260, opacity: 0.13, filter: 'brightness(0) invert(1)', transform: 'rotate(-8deg)' }} />
        <div style={{ position: 'relative' }}>
          {/* top bar: event status (left) · notifications + profile (right) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: T.onest, fontWeight: 600, fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap' }}>
              {live && <span className="wc-pulse" style={{ width: 7, height: 7, borderRadius: 999, background: 'var(--wf-lime-9)' }} />}
              {live ? `Live · Day ${clock.dayIndex} of ${clock.total}`
                : clock.phase === 'before' ? 'Counting down'
                : clock.phase === 'ended' ? 'Event ended'
                : ctx.event.dateline}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <IconBtn name="qr" onClick={() => ctx.push('ticket', {})} color="#fff" bg="rgba(255,255,255,0.16)" />
              <IconBtn name="bell" badge={ctx.unread > 0} onClick={() => ctx.push('notifications', {})} color="#fff" bg="rgba(255,255,255,0.16)" />
              <Press onClick={() => ctx.push('editprofile', {})} aria-label="Your profile" style={{ flexShrink: 0 }}>
                <Avatar initials={me.initials} color={me.color} size={38} src={me.avatarUrl} style={{ boxShadow: '0 0 0 2px rgba(255,255,255,0.45)' }} />
              </Press>
            </div>
          </div>

          {/* headline — only what's relevant to the current phase */}
          <div style={{ marginTop: clock.phase === 'before' ? 26 : 22 }}>
            {clock.phase === 'before' ? (
              <>
                <h1 style={{ fontFamily: T.onest, fontWeight: 700, fontSize: 40, color: '#fff', lineHeight: 1.0, letterSpacing: '-0.02em' }}>
                  Assessment,<br />reimagined.
                </h1>
                {dateLine && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 12, fontFamily: T.sig, fontSize: 14, color: 'rgba(255,255,255,0.92)' }}>
                    <Icon name="calendar" size={15} style={{ opacity: 0.9 }} />
                    {dateLine}
                  </div>
                )}
              </>
            ) : clock.phase === 'ended' ? (
              <>
                <div style={{ fontFamily: T.onest, fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>Thanks for joining, {me.name.split(' ')[0]}</div>
                <h1 style={{ fontFamily: T.onest, fontWeight: 700, fontSize: 32, color: '#fff', lineHeight: 1.05, letterSpacing: '-0.02em', marginTop: 6 }}>See you at WISEcon28.</h1>
              </>
            ) : (
              <div style={{ fontFamily: T.onest, fontWeight: 700, fontSize: 26, color: '#fff', letterSpacing: '-0.01em' }}>Good morning, {me.name.split(' ')[0]}</div>
            )}
          </div>

          {/* phase focus: countdown before · today's numbers while live · the survey after */}
          {clock.phase === 'before' && clock.countdown ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginTop: 20, background: 'rgba(255,255,255,0.15)', borderRadius: 'var(--radius-4)', padding: '14px 16px', backdropFilter: 'blur(4px)' }}>
              <Icon name="clock" size={26} style={{ color: '#fff', flexShrink: 0 }} />
              <div>
                <div style={{ fontFamily: T.onest, fontWeight: 700, fontSize: 22, color: '#fff', lineHeight: 1 }}>{clock.countdown}</div>
                <div style={{ fontFamily: T.sig, fontSize: 12.5, color: 'rgba(255,255,255,0.82)', marginTop: 3 }}>until WISEcon27 begins</div>
              </div>
            </div>
          ) : clock.phase === 'ended' ? (
            ctx.surveyDone ? (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 18, fontFamily: T.sig, fontSize: 13.5, color: 'rgba(255,255,255,0.92)' }}>
                <Icon name="checkCircle" size={16} /> Thanks for sharing your feedback
              </div>
            ) : (
              <Press onClick={() => ctx.push('survey', {})} style={{ display: 'flex', alignItems: 'center', gap: 13, marginTop: 20, background: '#fff', borderRadius: 'var(--radius-4)', padding: '14px 16px', boxShadow: 'var(--shadow-card)' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: T.green1, color: T.green10, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="poll" size={20} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 15, color: T.ink }}>How was WISEcon27?</div>
                  <div style={{ fontFamily: T.sig, fontSize: 12.5, color: T.muted, marginTop: 1 }}>Take the 2-minute post-conference survey.</div>
                </div>
                <Icon name="chevronRight" size={18} stroke={2} style={{ color: T.muted }} />
              </Press>
            )
          ) : (
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <HeroStat n={ctx.sessions.filter((s) => s.day === ctx.days[clock.dayIndex - 1]?.id && s.type !== 'break').length} label="sessions today" />
              <HeroStat n={mine.length} label="in your plan" />
              <HeroStat n={ctx.speakers.length} label="speakers" />
            </div>
          )}
        </div>
      </div>

      {/* sheet */}
      <div style={{ marginTop: -34, background: 'var(--wf-grey-2)', borderRadius: '24px 24px 0 0', position: 'relative', paddingTop: 22 }}>
        <div style={{ padding: '0 16px' }}>
          <InstallBanner />
        </div>
        <MeetingRequestsCard ctx={ctx} />
        {clock.phase === 'ended' && <PostEventSection ctx={ctx} />}
        {upNext && clock.phase !== 'ended' && (
          <div style={{ padding: '0 16px' }}>
            <Eyebrow style={{ marginBottom: 10, paddingLeft: 2 }} color={T.subtle}>Up next at {upNext.start}</Eyebrow>
            <Press onClick={() => (upNext.kind === 'session' ? ctx.openSession(upNext.session!) : ctx.push(upNext.kind === 'meeting' ? 'meetings' : 'activities', {}))} style={{ background: 'var(--wf-surface)', borderRadius: 'var(--radius-5)', overflow: 'hidden', boxShadow: 'var(--shadow-card)', display: 'flex' }}>
              <div style={{ width: 6, background: t ? t.dot : T.green9, flexShrink: 0 }} />
              <div style={{ flex: 1, padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  {upNext.kind === 'session' ? (
                    <TrackTag track={upNext.session!.track} size="lg" />
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: T.onest, fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em', color: T.green10, background: T.green1, borderRadius: 999, padding: '4px 11px' }}>
                      <Icon name={upNext.kind === 'meeting' ? 'connect' : 'sparkles'} size={13} /> {upNext.kind === 'meeting' ? '1:1 meeting' : 'Activity'}
                    </span>
                  )}
                  {upNext.kind === 'session' && (
                    <BookmarkBtn on={ctx.isBookmarked(upNext.id)} onClick={() => ctx.toggleBookmark(upNext.id)} />
                  )}
                </div>
                <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 21, color: T.ink, lineHeight: 1.2 }}>{upNext.title}</div>
                <div style={{ display: 'flex', gap: 16, marginTop: 12, fontFamily: T.sig, fontSize: 13.5, color: T.muted }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="clock" size={15} />{upNext.start}–{upNext.end}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="pin" size={15} />{upNext.place}</span>
                </div>
              </div>
            </Press>
          </div>
        )}

        <div style={{ position: 'relative' }}>
          <div ref={quickRef} onScroll={checkQuick} className="wc-noscroll" style={{ display: 'flex', gap: 10, padding: '18px 16px 0', overflowX: 'auto' }}>
            {QUICK.map((q, i) => (
              <Press key={q.label} onClick={() => runQuick(ctx, q)} style={{ position: 'relative', flex: '1 0 92px', display: 'flex', flexDirection: 'column', gap: 12, padding: 14, borderRadius: 'var(--radius-4)', background: i === 0 ? T.green9 : 'var(--wf-surface)', color: i === 0 ? '#fff' : T.ink, boxShadow: i === 0 ? 'none' : 'var(--shadow-sm)' }}>
                <Icon name={q.icon} size={22} style={{ color: i === 0 ? '#fff' : T.green10 }} />
                <span style={{ fontFamily: T.sig, fontWeight: 600, fontSize: 12.5 }}>{q.label}</span>
                {q.push === 'community' && communityUnread && (
                  <span style={{ position: 'absolute', top: 10, right: 10, width: 9, height: 9, borderRadius: 999, background: 'var(--wf-lime-9)', boxShadow: '0 0 0 2px ' + (i === 0 ? 'var(--wf-green-9)' : 'var(--wf-surface)') }} />
                )}
              </Press>
            ))}
          </div>
          {moreQuick && (
            <div style={{ position: 'absolute', top: 18, bottom: 0, right: 0, width: 54, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 3, background: 'linear-gradient(90deg, transparent, var(--wf-grey-2) 75%)' }}>
              <span className="wc-nudge-x" style={{ display: 'inline-flex', color: T.muted }}>
                <Icon name="chevronRight" size={18} stroke={2.2} />
              </span>
            </div>
          )}
        </div>

        {clock.phase !== 'ended' && <SuggestedSection ctx={ctx} />}

        <div style={{ padding: '24px 16px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
            <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 19, color: T.ink }}>Your plan</div>
            <Press onClick={() => ctx.setTab('agenda')} style={{ fontFamily: T.sig, fontWeight: 600, fontSize: 13.5, color: T.green10 }}>Full programme</Press>
          </div>
          <div style={{ fontFamily: T.sig, fontSize: 13, color: T.muted, marginBottom: 12, lineHeight: 1.4 }}>
            {live ? 'Your bookmarked sessions and activity sign-ups for today — not the full schedule.' : 'Your bookmarked sessions and activity sign-ups. Browse the full programme in the Agenda.'}
          </div>
          {mine.length === 0 ? (
            <Press onClick={() => ctx.setTab('agenda')} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--wf-surface)', borderRadius: 'var(--radius-4)', padding: 16, boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: T.green1, color: T.green10, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="calendar" size={19} /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 14.5, color: T.ink }}>No saved sessions yet</div>
                <div style={{ fontFamily: T.sig, fontSize: 13, color: T.muted, marginTop: 1 }}>Bookmark sessions in the Agenda to build your plan.</div>
              </div>
              <Icon name="chevronRight" size={18} stroke={2} style={{ color: T.muted }} />
            </Press>
          ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {later.map((item) => {
              const dot = item.kind === 'session' && item.session ? trackOf(item.session.track).dot : T.green9
              return (
                <Press key={item.id} onClick={() => (item.kind === 'session' ? ctx.openSession(item.session!) : ctx.push(item.kind === 'meeting' ? 'meetings' : 'activities', {}))} style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--wf-surface)', borderRadius: 'var(--radius-4)', padding: 14, boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 16, color: T.ink }}>{item.start}</div>
                    <div style={{ width: 8, height: 8, borderRadius: 999, background: dot, margin: '4px auto 0' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 15.5, color: T.ink, lineHeight: 1.25 }}>{item.title}</div>
                    <div style={{ fontFamily: T.sig, fontSize: 12.5, color: T.muted, marginTop: 3 }}>{item.place}</div>
                  </div>
                  {item.kind === 'session' ? (
                    <BookmarkBtn on={ctx.isBookmarked(item.id)} onClick={() => ctx.toggleBookmark(item.id)} />
                  ) : (
                    <Icon name={item.kind === 'meeting' ? 'connect' : 'sparkles'} size={18} style={{ color: T.green10 }} />
                  )}
                </Press>
              )
            })}
            {later.length === 0 && (
              <div style={{ fontFamily: T.sig, fontSize: 13.5, color: T.muted, padding: '4px 2px', lineHeight: 1.45 }}>That’s your only saved session so far — add more from the Agenda.</div>
            )}
          </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function Home({ ctx }: { ctx: AppCtx }) {
  return <HomeBold ctx={ctx} />
}
