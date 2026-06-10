// WISEcon27 — My Schedule (pushed): bookmarked sessions grouped by day.
import { T, TABBAR_H } from '../theme'
import type { AppCtx } from '../appState'
import { AppHeader, Btn, Empty, Eyebrow, SessionRow } from '../components/primitives'
import { buildScheduleIcs, downloadIcs } from '../lib/ics'

export function MySchedule({ ctx }: { ctx: AppCtx }) {
  const mine = ctx.sessions.filter((s) => ctx.isBookmarked(s.id))
  const exportIcs = () => {
    const ics = buildScheduleIcs(mine, ctx.days, ctx.event.startISO, ctx.event.location)
    if (!ics) return ctx.toast('Event dates are not configured yet')
    downloadIcs(ics)
    ctx.toast('Calendar file downloaded')
  }
  return (
    <div>
      <AppHeader title="My schedule" sub={`${mine.length} saved sessions`} onBack={ctx.params._fromTab ? null : ctx.back} />
      <div style={{ padding: '8px 12px ' + (TABBAR_H + 16) + 'px' }}>
        {mine.length > 0 && (
          <Btn kind="outline" full icon="calendar" onClick={exportIcs} style={{ marginBottom: 14 }}>
            Add to my calendar (.ics)
          </Btn>
        )}
        {ctx.days.map((d) => {
          const day = mine.filter((s) => s.day === d.id).sort((a, b) => a.start.localeCompare(b.start))
          if (day.length === 0) return null
          return (
            <div key={d.id} style={{ marginBottom: 18 }}>
              <Eyebrow style={{ padding: '8px 6px 10px' }}>{d.long}</Eyebrow>
              <div style={{ background: 'var(--wf-surface)', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
                {day.map((s, i) => (
                  <div key={s.id} style={{ borderBottom: i === day.length - 1 ? 'none' : '1px solid ' + T.line }}>
                    <SessionRow s={s} bookmarked onToggle={() => ctx.toggleBookmark(s.id)} onOpen={ctx.openSession} />
                  </div>
                ))}
              </div>
            </div>
          )
        })}
        {mine.length === 0 && <Empty icon="bookmark" text="Bookmark sessions to build your schedule." />}
      </div>
    </div>
  )
}
