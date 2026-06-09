// WISEcon27 — Home, three directions: Classic · Cards · Bold (default).
// Ported from prototype/app/home.jsx.
import { CLOCK, TRACKS } from '../data'
import { T, STATUS_INSET, TABBAR_H } from '../theme'
import type { AppCtx, HomeVariant } from '../appState'
import type { IconName } from '../components/Icon'
import { Icon } from '../components/Icon'
import { Avatar, BookmarkBtn, Eyebrow, IconBtn, Press, SessionRow, TrackTag } from '../components/primitives'
import { InstallBanner } from '../install'
import type { Session } from '../types'

// "Day X of N" + today's long label, derived from the live day list
function dayMeta(ctx: AppCtx) {
  const idx = Math.max(0, ctx.days.findIndex((d) => d.id === CLOCK.today))
  return { long: ctx.days[idx]?.long ?? '', n: idx + 1, total: ctx.days.length }
}

function planForHome(ctx: AppCtx) {
  const { today, now } = CLOCK
  const mine = ctx.sessions.filter((s) => ctx.isBookmarked(s.id) && s.day === today).sort((a, b) =>
    a.start.localeCompare(b.start),
  )
  const upNext = mine.find((s) => s.start >= now) || mine[0]
  const later = mine.filter((s) => s !== upNext)
  return { mine, upNext, later }
}

interface QuickAction {
  icon: IconName
  label: string
  tab?: 'agenda' | 'speakers' | 'connect'
  push?: 'ticket'
}
const QUICK: QuickAction[] = [
  { icon: 'calendar', label: 'Agenda', tab: 'agenda' },
  { icon: 'speakers', label: 'Speakers', tab: 'speakers' },
  { icon: 'connect', label: 'Connect', tab: 'connect' },
  { icon: 'qr', label: 'My badge', push: 'ticket' },
]
const runQuick = (ctx: AppCtx, q: QuickAction) => (q.tab ? ctx.setTab(q.tab) : ctx.push(q.push!, {}))

function MiniSession({ s, ctx }: { s: Session; ctx: AppCtx }) {
  return (
    <Press onClick={() => ctx.openSession(s)} style={{ width: 210, flexShrink: 0, background: '#fff', borderRadius: 'var(--radius-5)', padding: 14, boxShadow: 'var(--shadow-card)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <TrackTag track={s.track} />
        <BookmarkBtn on={ctx.isBookmarked(s.id)} onClick={() => ctx.toggleBookmark(s.id)} size={30} />
      </div>
      <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 15.5, color: T.ink, lineHeight: 1.25, height: 38, overflow: 'hidden' }}>{s.title}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, color: T.muted, fontFamily: T.sig, fontSize: 12.5 }}>
        <Icon name="clock" size={14} />
        {s.start}
        <span style={{ opacity: 0.5 }}>·</span>
        <Icon name="pin" size={14} />
        {s.room}
      </div>
    </Press>
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

/* ════════ VARIANT A — Classic ════════ */
function HomeClassic({ ctx }: { ctx: AppCtx }) {
  const { upNext, mine } = planForHome(ctx)
  return (
    <div style={{ background: '#fff', minHeight: '100%', paddingBottom: TABBAR_H + 16 }}>
      <div style={{ padding: STATUS_INSET + 'px 18px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 }}>
          <img src={import.meta.env.BASE_URL + 'wisecon27-logo.svg'} alt="WISEcon27" style={{ height: 36, display: 'block' }} />
          <IconBtn name="bell" badge={ctx.unread > 0} onClick={() => ctx.push('notifications', {})} />
        </div>
        <div style={{ marginTop: 22 }}>
          <div style={{ fontFamily: T.onest, fontSize: 13, color: T.muted }}>Good morning</div>
          <h1 style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 28, color: T.ink, lineHeight: 1.1, marginTop: 2 }}>{ctx.me.name.split(' ')[0]}</h1>
          <div style={{ fontFamily: T.sig, fontSize: 14, color: T.body, marginTop: 6 }}>{[dayMeta(ctx).long, `Day ${dayMeta(ctx).n} of ${dayMeta(ctx).total}`].filter(Boolean).join(' · ')}</div>
        </div>
      </div>

      {upNext && (
        <div style={{ padding: '20px 18px 0' }}>
          <Eyebrow style={{ marginBottom: 10 }}>Up next</Eyebrow>
          <Press onClick={() => ctx.openSession(upNext)} style={{ border: '1px solid ' + T.line2, borderRadius: 'var(--radius-5)', padding: 16, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <TrackTag track={upNext.track} />
              <span style={{ fontFamily: T.onest, fontSize: 12, color: T.muted }}>{upNext.start}–{upNext.end}</span>
            </div>
            <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 18, color: T.ink, lineHeight: 1.25 }}>{upNext.title}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, color: T.muted, fontFamily: T.sig, fontSize: 13.5 }}>
              <Icon name="pin" size={15} />
              {upNext.room}
            </div>
          </Press>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, padding: '18px 18px 0' }}>
        {QUICK.map((q) => (
          <Press key={q.label} onClick={() => runQuick(ctx, q)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, padding: '12px 4px', borderRadius: 'var(--radius-4)', background: T.sunken }}>
            <Icon name={q.icon} size={22} style={{ color: T.green10 }} />
            <span style={{ fontFamily: T.sig, fontWeight: 600, fontSize: 12, color: T.body }}>{q.label}</span>
          </Press>
        ))}
      </div>

      <div style={{ padding: '24px 18px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <Eyebrow>Your schedule today</Eyebrow>
          <Press onClick={() => ctx.push('myschedule', {})} style={{ fontFamily: T.sig, fontWeight: 600, fontSize: 13, color: T.green10 }}>See all</Press>
        </div>
        <div style={{ border: '1px solid ' + T.line, borderRadius: 'var(--radius-5)', overflow: 'hidden' }}>
          {mine.map((s, i) => (
            <div key={s.id} style={{ borderBottom: i === mine.length - 1 ? 'none' : '1px solid ' + T.line }}>
              <SessionRow s={s} bookmarked onToggle={() => ctx.toggleBookmark(s.id)} onOpen={ctx.openSession} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ════════ VARIANT B — Cards ════════ */
function HomeCards({ ctx }: { ctx: AppCtx }) {
  const { upNext, mine } = planForHome(ctx)
  const t = upNext && TRACKS[upNext.track]
  return (
    <div style={{ background: 'var(--wf-grey-2)', minHeight: '100%', paddingBottom: TABBAR_H + 16 }}>
      <div style={{ padding: STATUS_INSET + 'px 16px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 }}>
          <div>
            <div style={{ fontFamily: T.onest, fontSize: 12.5, color: T.muted }}>Good morning</div>
            <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 24, color: T.ink, lineHeight: 1.1 }}>Hello, {ctx.me.name.split(' ')[0]}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <IconBtn name="bell" badge={ctx.unread > 0} onClick={() => ctx.push('notifications', {})} />
            <Press onClick={() => ctx.setTab('profile')}>
              <Avatar initials={ctx.me.initials} color={ctx.me.color} size={38} src={ctx.me.avatarUrl} />
            </Press>
          </div>
        </div>
      </div>

      {upNext && t && (
        <div style={{ padding: '16px 16px 0' }}>
          <Press onClick={() => ctx.openSession(upNext)} style={{ borderRadius: 'var(--radius-5)', padding: 18, background: `linear-gradient(140deg, ${t.dot}, color-mix(in srgb, ${t.dot} 60%, #000))`, color: '#fff', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.22)', borderRadius: 999, padding: '5px 12px', fontFamily: T.onest, fontWeight: 600, fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <span className="wc-pulse" style={{ width: 7, height: 7, borderRadius: 999, background: '#fff' }} />
                Up next · {upNext.start}
              </span>
              <BookmarkBtn on={ctx.isBookmarked(upNext.id)} onClick={() => ctx.toggleBookmark(upNext.id)} light />
            </div>
            <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 22, lineHeight: 1.2 }}>{upNext.title}</div>
            <div style={{ display: 'flex', gap: 16, marginTop: 14, fontFamily: T.sig, fontSize: 13.5, color: 'rgba(255,255,255,0.92)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="clock" size={15} />{upNext.start}–{upNext.end}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="pin" size={15} />{upNext.room}</span>
            </div>
          </Press>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, padding: '16px 16px 0' }}>
        {QUICK.map((q) => (
          <Press key={q.label} onClick={() => runQuick(ctx, q)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '14px 4px', borderRadius: 'var(--radius-4)', background: '#fff', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: T.green1, display: 'grid', placeItems: 'center', color: T.green10 }}>
              <Icon name={q.icon} size={20} />
            </div>
            <span style={{ fontFamily: T.sig, fontWeight: 600, fontSize: 11.5, color: T.body }}>{q.label}</span>
          </Press>
        ))}
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        <Press onClick={() => ctx.push('notifications', {})} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--wf-blue-1)', borderRadius: 'var(--radius-4)', padding: '13px 14px' }}>
          <Icon name="info" size={20} style={{ color: 'var(--wf-blue-9)', flexShrink: 0 }} />
          <span style={{ flex: 1, fontFamily: T.sig, fontSize: 13.5, color: 'var(--wf-blue-11)', lineHeight: 1.35 }}>
            <b>Room change:</b> Fairness in automated scoring → Studio 2.
          </span>
          <Icon name="chevronRight" size={18} stroke={2} style={{ color: 'var(--wf-blue-9)' }} />
        </Press>
      </div>

      <div style={{ paddingTop: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0 16px 10px' }}>
          <Eyebrow>Your day</Eyebrow>
          <Press onClick={() => ctx.push('myschedule', {})} style={{ fontFamily: T.sig, fontWeight: 600, fontSize: 13, color: T.green10 }}>See all</Press>
        </div>
        <div className="wc-noscroll" style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '0 16px 4px' }}>
          {mine.map((s) => (
            <MiniSession key={s.id} s={s} ctx={ctx} />
          ))}
        </div>
      </div>
    </div>
  )
}

/* ════════ VARIANT C — Bold (DEFAULT) ════════ */
function HomeBold({ ctx }: { ctx: AppCtx }) {
  const { upNext, later, mine } = planForHome(ctx)
  const t = upNext && TRACKS[upNext.track]
  return (
    <div style={{ background: 'var(--wf-grey-2)', minHeight: '100%', paddingBottom: TABBAR_H + 16 }}>
      {/* hero */}
      <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(160deg, var(--wf-green-8) 0%, var(--wf-green-10) 55%, var(--wf-green-12) 130%)', padding: STATUS_INSET + 'px 20px 56px' }}>
        <img src={import.meta.env.BASE_URL + 'wisecon27-logo.svg'} alt="" style={{ position: 'absolute', right: -24, top: 18, width: 260, opacity: 0.13, filter: 'brightness(0) invert(1)', transform: 'rotate(-8deg)' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: T.onest, fontWeight: 600, fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap' }}>
              <span className="wc-pulse" style={{ width: 7, height: 7, borderRadius: 999, background: 'var(--wf-lime-9)' }} />
              Live · Day {dayMeta(ctx).n} of {dayMeta(ctx).total}
            </span>
            <IconBtn name="bell" badge={ctx.unread > 0} onClick={() => ctx.push('notifications', {})} color="#fff" bg="rgba(255,255,255,0.16)" />
          </div>
          <div style={{ marginTop: 26 }}>
            <div style={{ fontFamily: T.onest, fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>Good morning, {ctx.me.name.split(' ')[0]}</div>
            <h1 style={{ fontFamily: T.onest, fontWeight: 700, fontSize: 40, color: '#fff', lineHeight: 1.0, letterSpacing: '-0.02em', marginTop: 8 }}>
              Assessment,
              <br />
              reimagined.
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <HeroStat n={ctx.sessions.filter((s) => s.day === CLOCK.today && s.type !== 'break').length} label="sessions today" />
            <HeroStat n={mine.length} label="in your plan" />
            <HeroStat n={ctx.speakers.length} label="speakers" />
          </div>
        </div>
      </div>

      {/* sheet */}
      <div style={{ marginTop: -34, background: 'var(--wf-grey-2)', borderRadius: '24px 24px 0 0', position: 'relative', paddingTop: 22 }}>
        <div style={{ padding: '0 16px' }}>
          <InstallBanner />
        </div>
        {upNext && t && (
          <div style={{ padding: '0 16px' }}>
            <Eyebrow style={{ marginBottom: 10, paddingLeft: 2 }} color={T.subtle}>Up next at {upNext.start}</Eyebrow>
            <Press onClick={() => ctx.openSession(upNext)} style={{ background: '#fff', borderRadius: 'var(--radius-5)', overflow: 'hidden', boxShadow: 'var(--shadow-card)', display: 'flex' }}>
              <div style={{ width: 6, background: t.dot, flexShrink: 0 }} />
              <div style={{ flex: 1, padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <TrackTag track={upNext.track} size="lg" />
                  <BookmarkBtn on={ctx.isBookmarked(upNext.id)} onClick={() => ctx.toggleBookmark(upNext.id)} />
                </div>
                <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 21, color: T.ink, lineHeight: 1.2 }}>{upNext.title}</div>
                <div style={{ display: 'flex', gap: 16, marginTop: 12, fontFamily: T.sig, fontSize: 13.5, color: T.muted }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="clock" size={15} />{upNext.start}–{upNext.end}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="pin" size={15} />{upNext.room}</span>
                </div>
              </div>
            </Press>
          </div>
        )}

        <div className="wc-noscroll" style={{ display: 'flex', gap: 10, padding: '18px 16px 0', overflowX: 'auto' }}>
          {QUICK.map((q, i) => (
            <Press key={q.label} onClick={() => runQuick(ctx, q)} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 12, padding: 14, borderRadius: 'var(--radius-4)', background: i === 0 ? T.green9 : '#fff', color: i === 0 ? '#fff' : T.ink, boxShadow: i === 0 ? 'none' : 'var(--shadow-sm)' }}>
              <Icon name={q.icon} size={22} style={{ color: i === 0 ? '#fff' : T.green10 }} />
              <span style={{ fontFamily: T.sig, fontWeight: 600, fontSize: 12.5 }}>{q.label}</span>
            </Press>
          ))}
        </div>

        <div style={{ padding: '24px 16px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 19, color: T.ink }}>Then today</div>
            <Press onClick={() => ctx.push('myschedule', {})} style={{ fontFamily: T.sig, fontWeight: 600, fontSize: 13.5, color: T.green10 }}>See all</Press>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {later.map((s) => {
              const tt = TRACKS[s.track]
              return (
                <Press key={s.id} onClick={() => ctx.openSession(s)} style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#fff', borderRadius: 'var(--radius-4)', padding: 14, boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 16, color: T.ink }}>{s.start}</div>
                    <div style={{ width: 8, height: 8, borderRadius: 999, background: tt.dot, margin: '4px auto 0' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 15.5, color: T.ink, lineHeight: 1.25 }}>{s.title}</div>
                    <div style={{ fontFamily: T.sig, fontSize: 12.5, color: T.muted, marginTop: 3 }}>{s.room}</div>
                  </div>
                  <BookmarkBtn on={ctx.isBookmarked(s.id)} onClick={() => ctx.toggleBookmark(s.id)} />
                </Press>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

const HOME_VARIANTS: Record<HomeVariant, (p: { ctx: AppCtx }) => JSX.Element> = {
  classic: HomeClassic,
  cards: HomeCards,
  bold: HomeBold,
}

export function Home({ ctx }: { ctx: AppCtx }) {
  const Variant = HOME_VARIANTS[ctx.homeVariant] || HomeBold
  return <Variant ctx={ctx} />
}
