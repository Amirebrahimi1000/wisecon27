// WISEcon27 — Agenda. Day selector + track filter + three view modes:
// Timeline (time grid, parallel sessions side by side), Linear (detailed
// rows — the original view) and List (compact, scannable).
import { useState } from 'react'
import { TRACKS } from '../data'
import { T, TABBAR_H } from '../theme'
import type { AppCtx } from '../appState'
import type { Session, TrackId } from '../types'
import { Icon } from '../components/Icon'
import { AppHeader, ChipRow, Chip, IconBtn, Press, SessionRow } from '../components/primitives'

type AgendaView = 'timeline' | 'linear' | 'list'
const VIEW_KEY = 'wc27.agendaview'
const getView = (): AgendaView => {
  try {
    const v = localStorage.getItem(VIEW_KEY)
    if (v === 'timeline' || v === 'linear' || v === 'list') return v
  } catch { /* ignore */ }
  return 'linear'
}

const toMin = (t: string) => +t.slice(0, 2) * 60 + +t.slice(3, 5)
const PX_PER_MIN = 2.6
const GUTTER = 44

/* ── Timeline: vertical time axis, overlapping sessions in columns ── */
function Timeline({ list, ctx }: { list: Session[]; ctx: AppCtx }) {
  if (list.length === 0) return null
  const minStart = Math.min(...list.map((s) => toMin(s.start)))
  const maxEnd = Math.max(...list.map((s) => toMin(s.end)))
  const top = (m: number) => (m - minStart) * PX_PER_MIN

  // cluster transitively-overlapping sessions, assign columns within a cluster
  const sorted = [...list].sort((a, b) => toMin(a.start) - toMin(b.start) || a.room.localeCompare(b.room))
  interface Placed { s: Session; col: number; cols: number }
  const placed: Placed[] = []
  let cluster: { items: { s: Session; col: number }[]; colEnds: number[]; maxEnd: number } | null = null
  const flush = () => {
    if (!cluster) return
    for (const it of cluster.items) placed.push({ s: it.s, col: it.col, cols: cluster.colEnds.length })
    cluster = null
  }
  for (const s of sorted) {
    const st = toMin(s.start)
    if (!cluster || st >= cluster.maxEnd) {
      flush()
      cluster = { items: [], colEnds: [], maxEnd: 0 }
    }
    const c = cluster!
    let col = c.colEnds.findIndex((end) => end <= st)
    if (col === -1) {
      col = c.colEnds.length
      c.colEnds.push(0)
    }
    c.colEnds[col] = toMin(s.end)
    c.items.push({ s, col })
    c.maxEnd = Math.max(c.maxEnd, toMin(s.end))
  }
  flush()

  const hours: number[] = []
  for (let h = Math.ceil(minStart / 60); h * 60 <= maxEnd; h++) hours.push(h)

  return (
    <div style={{ position: 'relative', height: (maxEnd - minStart) * PX_PER_MIN + 14, margin: '8px 4px 0' }}>
      {/* hour grid */}
      {hours.map((h) => (
        <div key={h} style={{ position: 'absolute', top: top(h * 60), left: 0, right: 0 }}>
          <div style={{ position: 'absolute', left: GUTTER, right: 0, borderTop: '1px solid ' + T.line }} />
          <span style={{ position: 'absolute', left: 0, top: -7, fontFamily: T.onest, fontSize: 11, color: T.subtle }}>
            {String(h).padStart(2, '0')}:00
          </span>
        </div>
      ))}
      {/* session blocks */}
      {placed.map(({ s, col, cols }) => {
        const tr = TRACKS[s.track]
        const isBreak = s.type === 'break'
        const h = Math.max((toMin(s.end) - toMin(s.start)) * PX_PER_MIN - 3, 26)
        const widthPct = (100 - 0) / cols
        const tight = cols >= 3
        return (
          <Press
            key={s.id}
            onClick={() => ctx.openSession(s)}
            style={{
              position: 'absolute',
              top: top(toMin(s.start)),
              left: `calc(${GUTTER}px + (100% - ${GUTTER}px) * ${(col * widthPct) / 100} + ${col === 0 ? 0 : 2}px)`,
              width: `calc((100% - ${GUTTER}px) * ${widthPct / 100} - ${cols > 1 ? 2 : 0}px)`,
              height: h,
              boxSizing: 'border-box',
              borderRadius: 'var(--radius-3)',
              overflow: 'hidden',
              textAlign: 'left',
              background: isBreak ? 'var(--wf-grey-3)' : 'var(--wf-surface)',
              boxShadow: isBreak ? 'none' : 'var(--shadow-sm), inset 3px 0 0 ' + tr.dot,
              padding: tight ? '4px 5px 4px 8px' : '6px 8px 6px 11px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: tight ? 10.5 : 13, lineHeight: 1.2, color: isBreak ? T.muted : T.ink, display: '-webkit-box', WebkitLineClamp: tight ? 4 : 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {s.title}
                </div>
                {!tight && (
                  <div style={{ fontFamily: T.onest, fontSize: 10.5, color: T.muted, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.start}–{s.end}{s.room ? ' · ' + s.room : ''}
                  </div>
                )}
              </div>
              {ctx.isBookmarked(s.id) && (
                <Icon name="bookmarkFill" size={tight ? 10 : 13} style={{ color: T.green9, flexShrink: 0, marginTop: 1 }} />
              )}
            </div>
          </Press>
        )
      })}
    </div>
  )
}

/* ── List: compact, scannable rows ── */
function CompactList({ list, ctx }: { list: Session[]; ctx: AppCtx }) {
  return (
    <div style={{ background: 'var(--wf-surface)', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
      {list.map((s, i) => {
        const tr = TRACKS[s.track]
        return (
          <Press key={s.id} onClick={() => ctx.openSession(s)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', padding: '9px 12px', borderBottom: i === list.length - 1 ? 'none' : '1px solid ' + T.line }}>
            <span style={{ fontFamily: T.onest, fontWeight: 600, fontSize: 12, color: T.body, width: 38, flexShrink: 0 }}>{s.start}</span>
            <span style={{ width: 7, height: 7, borderRadius: 999, background: tr.dot, flexShrink: 0 }} />
            <span style={{ flex: 1, minWidth: 0, fontFamily: T.sig, fontWeight: 600, fontSize: 13.5, color: s.type === 'break' ? T.muted : T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</span>
            <span style={{ fontFamily: T.onest, fontSize: 10.5, color: T.subtle, flexShrink: 0, maxWidth: 86, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.room}</span>
            {ctx.isBookmarked(s.id) && <Icon name="bookmarkFill" size={13} style={{ color: T.green9, flexShrink: 0 }} />}
          </Press>
        )
      })}
    </div>
  )
}

export function Agenda({ ctx }: { ctx: AppCtx }) {
  const [day, setDay] = useState<string>(ctx.params.day || 'd1')
  const [track, setTrack] = useState<'all' | TrackId>('all')
  const [view, setViewState] = useState<AgendaView>(() => getView())
  const setView = (v: AgendaView) => {
    setViewState(v)
    try { localStorage.setItem(VIEW_KEY, v) } catch { /* ignore */ }
  }
  const list = ctx.sessions.filter((s) => s.day === day && (track === 'all' || s.track === track)).sort((a, b) =>
    a.start.localeCompare(b.start),
  )
  const VIEWS: { id: AgendaView; label: string }[] = [
    { id: 'timeline', label: 'Timeline' },
    { id: 'linear', label: 'Linear' },
    { id: 'list', label: 'List' },
  ]
  return (
    <div>
      <AppHeader title="Agenda" sub={[ctx.event.dateline, ctx.event.location].filter(Boolean).join(' · ')} right={<IconBtn name="search" onClick={() => ctx.toast('Search coming soon')} />} />
      {/* day selector */}
      <div style={{ display: 'flex', gap: 8, padding: '14px 16px 4px' }}>
        {ctx.days.map((d) => {
          const on = day === d.id
          return (
            <Press key={d.id} onClick={() => setDay(d.id)} style={{ flex: 1, padding: '9px 4px', borderRadius: 'var(--radius-4)', textAlign: 'center', background: on ? T.green9 : 'var(--wf-surface)', color: on ? '#fff' : T.body, boxShadow: on ? 'none' : 'inset 0 0 0 1px var(--wf-grey-6)' }}>
              <div style={{ fontFamily: T.onest, fontSize: 11, fontWeight: 600, opacity: on ? 0.85 : 0.6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d.dow}</div>
              <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 16, marginTop: 1 }}>{d.date}</div>
            </Press>
          )
        })}
      </div>
      {/* view switcher */}
      <div style={{ display: 'flex', gap: 0, margin: '10px 16px 0', background: 'var(--wf-grey-4)', borderRadius: 'var(--radius-4)', padding: 3 }}>
        {VIEWS.map((v) => {
          const on = view === v.id
          return (
            <Press key={v.id} onClick={() => setView(v.id)} style={{ flex: 1, textAlign: 'center', padding: '7px 0', borderRadius: 'calc(var(--radius-4) - 2px)', fontFamily: T.sig, fontWeight: 600, fontSize: 13, background: on ? 'var(--wf-surface)' : 'transparent', color: on ? T.ink : T.muted, boxShadow: on ? 'var(--shadow-sm)' : 'none' }}>
              {v.label}
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
        {view === 'timeline' && <Timeline list={list} ctx={ctx} />}
        {view === 'list' && list.length > 0 && <CompactList list={list} ctx={ctx} />}
        {view === 'linear' &&
          list.map((s, i) => (
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
