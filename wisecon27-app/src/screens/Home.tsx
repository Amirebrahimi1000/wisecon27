// WISEcon27 — Home (Bold layout).
import { useEffect, useRef, useState } from 'react'
import { TRACKS } from '../data'
import { T, STATUS_INSET, TABBAR_H } from '../theme'
import type { AppCtx } from '../appState'
import type { IconName } from '../components/Icon'
import { Icon } from '../components/Icon'
import { BookmarkBtn, Eyebrow, IconBtn, Press, TrackTag } from '../components/primitives'
import { InstallBanner } from '../install'
import { useEventClock, type EventClock } from '../eventClock'
import type { Session } from '../types'

// Real-time header bits derived from the event clock + live day list.
function eventHeader(ctx: AppCtx, clock: EventClock) {
  const todayLong = ctx.days[clock.dayIndex - 1]?.long ?? ''
  // primary date line shown on every variant
  const dateLine = clock.phase === 'live' ? todayLong || ctx.event.dateline : ctx.event.dateline
  // short status used in the live/Day pill
  const status =
    clock.phase === 'live' ? `Day ${clock.dayIndex} of ${clock.total}`
    : clock.phase === 'before' ? (clock.countdown ? `Starts in ${clock.countdown}` : 'Starting soon')
    : clock.phase === 'ended' ? 'Event ended'
    : ''
  // single combined line for the simpler variants
  const line = [dateLine, status].filter(Boolean).join(' · ')
  return { todayLong, dateLine, status, line }
}

interface PlanItem {
  id: string
  start: string
  end: string
  title: string
  place: string
  kind: 'session' | 'activity'
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
  const mine = [...sess, ...acts].sort((a, b) => a.start.localeCompare(b.start))
  const upNext = mine.find((i) => i.end > now) || mine[0]
  const later = mine.filter((i) => i !== upNext)
  return { mine, upNext, later }
}

interface QuickAction {
  icon: IconName
  label: string
  tab?: 'agenda' | 'speakers' | 'connect' | 'activities'
  push?: 'ticket' | 'info' | 'activities'
}
const QUICK: QuickAction[] = [
  { icon: 'calendar', label: 'Agenda', tab: 'agenda' },
  { icon: 'sparkles', label: 'Activities', tab: 'activities' },
  { icon: 'speakers', label: 'Speakers', tab: 'speakers' },
  { icon: 'connect', label: 'Connect', tab: 'connect' },
  { icon: 'qr', label: 'My badge', push: 'ticket' },
  { icon: 'info', label: 'Info', push: 'info' },
]
const runQuick = (ctx: AppCtx, q: QuickAction) => (q.tab ? ctx.setTab(q.tab) : ctx.push(q.push!, {}))

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
  const t = upNext && upNext.kind === 'session' && upNext.session ? TRACKS[upNext.session.track] : null
  const h = eventHeader(ctx, clock)
  const live = clock.phase === 'live'
  return (
    <div style={{ background: 'var(--wf-grey-2)', minHeight: '100%', paddingBottom: TABBAR_H + 16 }}>
      {/* hero */}
      <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(160deg, var(--wf-green-8) 0%, var(--wf-green-10) 55%, var(--wf-green-12) 130%)', padding: STATUS_INSET + 'px 20px 56px' }}>
        <img src={import.meta.env.BASE_URL + 'wisecon27-logo.svg'} alt="" style={{ position: 'absolute', right: -24, top: 18, width: 260, opacity: 0.13, filter: 'brightness(0) invert(1)', transform: 'rotate(-8deg)' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: T.onest, fontWeight: 600, fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap' }}>
              {live && <span className="wc-pulse" style={{ width: 7, height: 7, borderRadius: 999, background: 'var(--wf-lime-9)' }} />}
              {live ? `Live · Day ${clock.dayIndex} of ${clock.total}`
                : clock.phase === 'before' ? 'Counting down'
                : clock.phase === 'ended' ? 'Event ended'
                : ctx.event.dateline}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Press onClick={() => ctx.push('ticket', {})} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 38, padding: '0 14px', borderRadius: 999, background: 'rgba(255,255,255,0.16)', color: '#fff' }}>
                <Icon name="qr" size={18} />
                <span style={{ fontFamily: T.sig, fontWeight: 600, fontSize: 13.5, letterSpacing: '0.01em' }}>Badge</span>
              </Press>
              <IconBtn name="bell" badge={ctx.unread > 0} onClick={() => ctx.push('notifications', {})} color="#fff" bg="rgba(255,255,255,0.16)" />
            </div>
          </div>
          <div style={{ marginTop: 26 }}>
            <div style={{ fontFamily: T.onest, fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>Good morning, {ctx.me.name.split(' ')[0]}</div>
            <h1 style={{ fontFamily: T.onest, fontWeight: 700, fontSize: 40, color: '#fff', lineHeight: 1.0, letterSpacing: '-0.02em', marginTop: 8 }}>
              Assessment,
              <br />
              reimagined.
            </h1>
            {h.dateLine && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 12, fontFamily: T.sig, fontSize: 14, color: 'rgba(255,255,255,0.92)' }}>
                <Icon name="calendar" size={15} style={{ opacity: 0.9 }} />
                {h.dateLine}
              </div>
            )}
          </div>
          {clock.phase === 'before' && clock.countdown ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginTop: 20, background: 'rgba(255,255,255,0.15)', borderRadius: 'var(--radius-4)', padding: '14px 16px', backdropFilter: 'blur(4px)' }}>
              <Icon name="clock" size={26} style={{ color: '#fff', flexShrink: 0 }} />
              <div>
                <div style={{ fontFamily: T.onest, fontWeight: 700, fontSize: 22, color: '#fff', lineHeight: 1 }}>{clock.countdown}</div>
                <div style={{ fontFamily: T.sig, fontSize: 12.5, color: 'rgba(255,255,255,0.82)', marginTop: 3 }}>until WISEcon27 begins</div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
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
        {upNext && (
          <div style={{ padding: '0 16px' }}>
            <Eyebrow style={{ marginBottom: 10, paddingLeft: 2 }} color={T.subtle}>Up next at {upNext.start}</Eyebrow>
            <Press onClick={() => (upNext.kind === 'session' ? ctx.openSession(upNext.session!) : ctx.push('activities', {}))} style={{ background: 'var(--wf-surface)', borderRadius: 'var(--radius-5)', overflow: 'hidden', boxShadow: 'var(--shadow-card)', display: 'flex' }}>
              <div style={{ width: 6, background: t ? t.dot : T.green9, flexShrink: 0 }} />
              <div style={{ flex: 1, padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  {upNext.kind === 'session' ? (
                    <TrackTag track={upNext.session!.track} size="lg" />
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: T.onest, fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em', color: T.green10, background: T.green1, borderRadius: 999, padding: '4px 11px' }}>
                      <Icon name="sparkles" size={13} /> Activity
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
              <Press key={q.label} onClick={() => runQuick(ctx, q)} style={{ flex: '1 0 92px', display: 'flex', flexDirection: 'column', gap: 12, padding: 14, borderRadius: 'var(--radius-4)', background: i === 0 ? T.green9 : 'var(--wf-surface)', color: i === 0 ? '#fff' : T.ink, boxShadow: i === 0 ? 'none' : 'var(--shadow-sm)' }}>
                <Icon name={q.icon} size={22} style={{ color: i === 0 ? '#fff' : T.green10 }} />
                <span style={{ fontFamily: T.sig, fontWeight: 600, fontSize: 12.5 }}>{q.label}</span>
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
              const dot = item.kind === 'session' && item.session ? TRACKS[item.session.track].dot : T.green9
              return (
                <Press key={item.id} onClick={() => (item.kind === 'session' ? ctx.openSession(item.session!) : ctx.push('activities', {}))} style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--wf-surface)', borderRadius: 'var(--radius-4)', padding: 14, boxShadow: 'var(--shadow-sm)' }}>
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
                    <Icon name="sparkles" size={18} style={{ color: T.green10 }} />
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
