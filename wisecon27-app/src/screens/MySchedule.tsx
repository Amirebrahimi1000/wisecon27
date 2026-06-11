// WISEcon27 — My Schedule (pushed): bookmarked sessions + activity sign-ups,
// grouped by day and exportable to the calendar.
import { T, TABBAR_H } from '../theme'
import type { AppCtx } from '../appState'
import type { Session } from '../types'
import { Icon } from '../components/Icon'
import { AppHeader, Btn, Empty, Eyebrow, Press, SessionRow } from '../components/primitives'
import { buildScheduleIcs, downloadIcs } from '../lib/ics'

export function MySchedule({ ctx }: { ctx: AppCtx }) {
  const mine = ctx.sessions.filter((s) => ctx.isBookmarked(s.id))
  const myActs = ctx.activities.filter((a) => a.signedUp)
  const myMeetings = ctx.meetings.filter((m) => m.status === 'accepted')
  const meetingTitle = (m: (typeof myMeetings)[number]) =>
    'Meeting with ' + ctx.nameFor(m.requesterId === ctx.userId ? m.inviteeId : m.requesterId)
  const meetingPlace = (m: (typeof myMeetings)[number]) =>
    ctx.meetingPoints.find((p) => p.id === m.pointId)?.label ?? 'Meeting point TBC'
  const total = mine.length + myActs.length + myMeetings.length
  const exportIcs = () => {
    // activities and meetings map onto the same shape the ICS builder needs
    const actEvents = myActs.map((a) => ({
      id: 'act-' + a.id, day: a.day ?? '', start: a.start, end: a.end,
      title: a.title, room: a.location, desc: a.description,
    })) as unknown as Session[]
    const mtgEvents = myMeetings.map((m) => ({
      id: 'mtg-' + m.id, day: m.day, start: m.start, end: m.end,
      title: meetingTitle(m), room: meetingPlace(m), desc: m.message,
    })) as unknown as Session[]
    const ics = buildScheduleIcs([...mine, ...actEvents, ...mtgEvents], ctx.days, ctx.event.startISO, ctx.event.location)
    if (!ics) return ctx.toast('Event dates are not configured yet')
    downloadIcs(ics)
    ctx.toast('Calendar file downloaded')
  }
  return (
    <div>
      <AppHeader title="My schedule" sub={`${total} saved`} onBack={ctx.params._fromTab ? null : ctx.back} />
      <div style={{ padding: '8px 12px ' + (TABBAR_H + 16) + 'px' }}>
        {total > 0 && (
          <Btn kind="outline" full icon="calendar" onClick={exportIcs} style={{ marginBottom: 14 }}>
            Add to my calendar (.ics)
          </Btn>
        )}
        {ctx.days.map((d) => {
          const day = mine.filter((s) => s.day === d.id).sort((a, b) => a.start.localeCompare(b.start))
          const acts = myActs.filter((a) => a.day === d.id).sort((a, b) => a.start.localeCompare(b.start))
          const mtgs = myMeetings.filter((m) => m.day === d.id).sort((a, b) => a.start.localeCompare(b.start))
          if (day.length + acts.length + mtgs.length === 0) return null
          // merge chronologically
          const items: (
            | { kind: 'session'; start: string; s: Session }
            | { kind: 'activity'; start: string; a: (typeof acts)[number] }
            | { kind: 'meeting'; start: string; m: (typeof mtgs)[number] }
          )[] = [
            ...day.map((s) => ({ kind: 'session' as const, start: s.start, s })),
            ...acts.map((a) => ({ kind: 'activity' as const, start: a.start, a })),
            ...mtgs.map((m) => ({ kind: 'meeting' as const, start: m.start, m })),
          ].sort((x, y) => x.start.localeCompare(y.start))
          return (
            <div key={d.id} style={{ marginBottom: 18 }}>
              <Eyebrow style={{ padding: '8px 6px 10px' }}>{d.long}</Eyebrow>
              <div style={{ background: 'var(--wf-surface)', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
                {items.map((it, i) => (
                  <div key={it.kind === 'session' ? it.s.id : it.kind === 'activity' ? it.a.id : it.m.id} style={{ borderBottom: i === items.length - 1 ? 'none' : '1px solid ' + T.line }}>
                    {it.kind === 'session' ? (
                      <SessionRow s={it.s} bookmarked onToggle={() => ctx.toggleBookmark(it.s.id)} onOpen={ctx.openSession} />
                    ) : it.kind === 'activity' ? (
                      <Press onClick={() => ctx.push('activities', {})} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', width: '100%', textAlign: 'left' }}>
                        <div style={{ width: 44, flexShrink: 0, textAlign: 'center' }}>
                          <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 14.5, color: T.ink }}>{it.a.start}</div>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 14.5, color: T.ink, lineHeight: 1.3 }}>{it.a.title}</div>
                          <div style={{ fontFamily: T.sig, fontSize: 12.5, color: T.muted, marginTop: 2 }}>{['Activity', it.a.location].filter(Boolean).join(' · ')}</div>
                        </div>
                        <Icon name="sparkles" size={17} style={{ color: T.green10, flexShrink: 0 }} />
                      </Press>
                    ) : (
                      <Press onClick={() => ctx.push('meetings', {})} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', width: '100%', textAlign: 'left' }}>
                        <div style={{ width: 44, flexShrink: 0, textAlign: 'center' }}>
                          <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 14.5, color: T.ink }}>{it.m.start}</div>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 14.5, color: T.ink, lineHeight: 1.3 }}>{meetingTitle(it.m)}</div>
                          <div style={{ fontFamily: T.sig, fontSize: 12.5, color: T.muted, marginTop: 2 }}>{['1:1 meeting', meetingPlace(it.m)].join(' · ')}</div>
                        </div>
                        <Icon name="connect" size={17} style={{ color: T.green10, flexShrink: 0 }} />
                      </Press>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
        {total === 0 && <Empty icon="bookmark" text="Bookmark sessions to build your schedule." />}
      </div>
    </div>
  )
}
