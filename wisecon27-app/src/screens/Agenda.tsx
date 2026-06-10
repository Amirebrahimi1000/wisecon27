// WISEcon27 — Agenda. Day selector + track filter chips + session list.
import { useState } from 'react'
import { TRACKS } from '../data'
import { T, TABBAR_H } from '../theme'
import type { AppCtx } from '../appState'
import type { TrackId } from '../types'
import { AppHeader, ChipRow, Chip, IconBtn, Press, SessionRow } from '../components/primitives'

export function Agenda({ ctx }: { ctx: AppCtx }) {
  const [day, setDay] = useState<string>(ctx.params.day || 'd1')
  const [track, setTrack] = useState<'all' | TrackId>('all')
  const list = ctx.sessions.filter((s) => s.day === day && (track === 'all' || s.track === track)).sort((a, b) =>
    a.start.localeCompare(b.start),
  )
  return (
    <div>
      <AppHeader title="Agenda" sub={[ctx.event.dateline, ctx.event.location].filter(Boolean).join(' · ')} right={<IconBtn name="search" onClick={() => ctx.toast('Search coming soon')} />} />
      {/* day selector */}
      <div style={{ display: 'flex', gap: 8, padding: '14px 16px 4px' }}>
        {ctx.days.map((d) => {
          const on = day === d.id
          return (
            <Press key={d.id} onClick={() => setDay(d.id)} style={{ flex: 1, padding: '9px 4px', borderRadius: 'var(--radius-4)', textAlign: 'center', background: on ? T.green9 : '#fff', color: on ? '#fff' : T.body, boxShadow: on ? 'none' : 'inset 0 0 0 1px var(--wf-grey-6)' }}>
              <div style={{ fontFamily: T.onest, fontSize: 11, fontWeight: 600, opacity: on ? 0.85 : 0.6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d.dow}</div>
              <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 16, marginTop: 1 }}>{d.date}</div>
            </Press>
          )
        })}
      </div>
      <ChipRow style={{ paddingBottom: 4 }}>
        <Chip active={track === 'all'} onClick={() => setTrack('all')}>All tracks</Chip>
        {(Object.entries(TRACKS) as [TrackId, (typeof TRACKS)[TrackId]][])
          .filter(([k]) => k !== 'plenary')
          .map(([k, t]) => (
            <Chip key={k} active={track === k} onClick={() => setTrack(k)} color={t.dot}>
              {t.name}
            </Chip>
          ))}
      </ChipRow>
      <div style={{ padding: '4px 12px ' + (TABBAR_H + 16) + 'px' }}>
        {list.map((s, i) => (
          <div
            key={s.id}
            style={{
              background: 'var(--wf-surface)',
              borderRadius:
                i === 0
                  ? 'var(--radius-5) var(--radius-5) 0 0'
                  : i === list.length - 1
                    ? '0 0 var(--radius-5) var(--radius-5)'
                    : 0,
              boxShadow: 'var(--shadow-sm)',
              borderBottom: i === list.length - 1 ? 'none' : '1px solid ' + T.line,
            }}
          >
            <SessionRow s={s} bookmarked={ctx.isBookmarked(s.id)} onToggle={() => ctx.toggleBookmark(s.id)} onOpen={ctx.openSession} />
          </div>
        ))}
        {list.length === 0 && (
          <div style={{ textAlign: 'center', color: T.muted, padding: 40, fontFamily: T.sig }}>No sessions in this track today.</div>
        )}
      </div>
    </div>
  )
}
