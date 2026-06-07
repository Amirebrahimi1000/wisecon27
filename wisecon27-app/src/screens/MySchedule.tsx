// WISEcon27 — My Schedule (pushed): bookmarked sessions grouped by day.
import { DAYS, SESSIONS } from '../data'
import { T, TABBAR_H } from '../theme'
import type { AppCtx } from '../store'
import { AppHeader, Empty, Eyebrow, SessionRow } from '../components/primitives'

export function MySchedule({ ctx }: { ctx: AppCtx }) {
  const mine = SESSIONS.filter((s) => ctx.isBookmarked(s.id))
  return (
    <div>
      <AppHeader title="My schedule" sub={`${mine.length} saved sessions`} onBack={ctx.params._fromTab ? null : ctx.back} />
      <div style={{ padding: '8px 12px ' + (TABBAR_H + 16) + 'px' }}>
        {DAYS.map((d) => {
          const day = mine.filter((s) => s.day === d.id).sort((a, b) => a.start.localeCompare(b.start))
          if (day.length === 0) return null
          return (
            <div key={d.id} style={{ marginBottom: 18 }}>
              <Eyebrow style={{ padding: '8px 6px 10px' }}>{d.long}</Eyebrow>
              <div style={{ background: '#fff', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
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
