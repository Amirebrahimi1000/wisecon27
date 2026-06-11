// WISEcon27 — Agenda. Day selector + track filter + three view modes:
// Timeline (time grid, parallel sessions side by side), Linear (detailed
// rows — the original view) and List (compact, scannable).
import { useRef, useState } from 'react'
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

/* ── Timeline: a true room grid. Every room that day is a column (hour axis
      pinned, columns scroll horizontally); each session sits under its own
      room at its real time. Sessions with no room (e.g. lunch) span the
      whole width as an all-attendee band. ── */
const COL_W = 158
const HEADER_H = 30

// order rooms left→right: main stages, then breakouts, then communal spaces
const roomRank = (r: string) =>
  /auditorium|main|plenary|hall|stage/i.test(r) ? 0 : /foyer|lobby|atrium|hub/i.test(r) ? 3 : 1
const byRoom = (a: string, b: string) =>
  roomRank(a) - roomRank(b) || a.localeCompare(b, undefined, { numeric: true })

function Timeline({ list, ctx }: { list: Session[]; ctx: AppCtx }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [moreRight, setMoreRight] = useState(true)
  const checkMore = () => {
    const el = scrollRef.current
    if (el) setMoreRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8)
  }
  if (list.length === 0) return null
  const minStart = Math.min(...list.map((s) => toMin(s.start)))
  const maxEnd = Math.max(...list.map((s) => toMin(s.end)))
  const top = (m: number) => (m - minStart) * PX_PER_MIN

  // one column per distinct room; roomless sessions become full-width bands
  const rooms = [...new Set(list.map((s) => s.room).filter(Boolean))].sort(byRoom)
  const colOf = (room: string) => rooms.indexOf(room)
  const cols = Math.max(1, rooms.length)

  const hours: number[] = []
  for (let h = Math.ceil(minStart / 60); h * 60 <= maxEnd; h++) hours.push(h)
  const height = (maxEnd - minStart) * PX_PER_MIN + 14 + HEADER_H

  return (
    <div style={{ display: 'flex', margin: '8px 0 0', position: 'relative' }}>
      {/* pinned hour axis */}
      <div style={{ width: GUTTER, flexShrink: 0, position: 'relative', height }}>
        {hours.map((h) => (
          <span key={h} style={{ position: 'absolute', top: top(h * 60) - 7 + HEADER_H, left: 2, fontFamily: T.onest, fontSize: 11, color: T.subtle }}>
            {String(h).padStart(2, '0')}:00
          </span>
        ))}
      </div>
      {/* horizontally scrollable columns */}
      <div ref={scrollRef} onScroll={checkMore} className="wc-noscroll" style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden' }}>
        <div style={{ position: 'relative', height, width: cols * COL_W, minWidth: '100%' }}>
          {hours.map((h) => (
            <div key={h} style={{ position: 'absolute', top: top(h * 60) + HEADER_H, left: 0, right: 0, borderTop: '1px solid ' + T.line }} />
          ))}
          {rooms.map((room, i) => (
            <div key={room} style={{ position: 'absolute', top: 0, left: i * COL_W + (i === 0 ? 0 : 3), width: COL_W - 3, height: HEADER_H - 6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, background: 'var(--wf-grey-4)', borderRadius: 999, fontFamily: T.onest, fontWeight: 600, fontSize: 10.5, color: T.body, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', padding: '0 8px' }}>
              <Icon name="pin" size={11} style={{ flexShrink: 0, color: T.muted }} />
              {room}
            </div>
          ))}
          {list.map((s) => {
            const tr = TRACKS[s.track]
            const isBreak = s.type === 'break'
            const h = Math.max((toMin(s.end) - toMin(s.start)) * PX_PER_MIN - 3, 26)
            const col = colOf(s.room)
            const full = col === -1 // no room → all-attendee band across every column
            return (
              <Press
                key={s.id}
                onClick={() => ctx.openSession(s)}
                style={{
                  position: 'absolute',
                  top: top(toMin(s.start)) + HEADER_H,
                  left: full ? 0 : col * COL_W + (col === 0 ? 0 : 3),
                  width: full ? '100%' : COL_W - 3,
                  height: h,
                  boxSizing: 'border-box',
                  borderRadius: 'var(--radius-3)',
                  overflow: 'hidden',
                  textAlign: 'left',
                  background: isBreak ? 'var(--wf-grey-3)' : 'var(--wf-surface)',
                  boxShadow: isBreak ? 'none' : 'var(--shadow-sm), inset 3px 0 0 ' + tr.dot,
                  padding: '6px 8px 6px 11px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: full ? 13 : 12, lineHeight: 1.25, color: isBreak ? T.muted : T.ink, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {s.title}
                    </div>
                    <div style={{ fontFamily: T.onest, fontSize: 10.5, color: T.muted, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.start}–{s.end}{s.room ? ' · ' + s.room : ''}
                    </div>
                  </div>
                  {ctx.isBookmarked(s.id) && (
                    <Icon name="bookmarkFill" size={13} style={{ color: T.green9, flexShrink: 0, marginTop: 1 }} />
                  )}
                </div>
              </Press>
            )
          })}
        </div>
      </div>
      {/* "more columns this way" hint */}
      {cols > 2 && moreRight && (
        <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: 46, pointerEvents: 'none', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', paddingTop: 80, background: 'linear-gradient(90deg, transparent, var(--wf-grey-2) 80%)' }}>
          <span className="wc-nudge-x" style={{ display: 'inline-flex', color: T.muted, position: 'sticky', top: 200 }}>
            <Icon name="chevronRight" size={18} stroke={2.2} />
          </span>
        </div>
      )}
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
