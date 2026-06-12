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
import { FirstTimeHint } from '../components/Hint'

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

// Accepted 1:1 meetings ride along in every agenda view as pseudo-sessions
// (id-prefixed); tapping one opens My meetings instead of a session page.
const isMeetingItem = (s: Session) => s.id.startsWith('mtg:')
const openItem = (ctx: AppCtx, s: Session) => (isMeetingItem(s) ? ctx.push('meetings', {}) : ctx.openSession(s))

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

  // one column per distinct room; 1:1 meetings sit under their agreed meeting
  // point (own columns, after the programme rooms). Only roomless sessions
  // (e.g. lunch) become full-width bands.
  const sessionRooms = [...new Set(list.filter((s) => !isMeetingItem(s)).map((s) => s.room).filter(Boolean))].sort(byRoom)
  const meetingRooms = [...new Set(list.filter(isMeetingItem).map((s) => s.room))]
    .filter((r) => !sessionRooms.includes(r))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  const rooms = [...sessionRooms, ...meetingRooms]
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
                onClick={() => openItem(ctx, s)}
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
                  background: isMeetingItem(s) ? T.green1 : isBreak ? 'var(--wf-grey-3)' : 'var(--wf-surface)',
                  boxShadow: isMeetingItem(s) ? 'inset 3px 0 0 ' + T.green9 : isBreak ? 'none' : 'var(--shadow-sm), inset 3px 0 0 ' + tr.dot,
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
          <Press key={s.id} onClick={() => openItem(ctx, s)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', padding: '9px 12px', background: isMeetingItem(s) ? T.green1 : 'transparent', borderBottom: i === list.length - 1 ? 'none' : '1px solid ' + T.line }}>
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
  // multi-select filters: empty set = everything ("All"); chips toggle on/off
  const [filters, setFilters] = useState<Set<'meetings' | TrackId>>(new Set())
  const toggleFilter = (k: 'meetings' | TrackId) =>
    setFilters((prev) => {
      const next = new Set(prev)
      if (next.has(k)) next.delete(k)
      else next.add(k)
      return next
    })
  const showAll = filters.size === 0
  const [view, setViewState] = useState<AgendaView>(() => getView())
  const setView = (v: AgendaView) => {
    setViewState(v)
    try { localStorage.setItem(VIEW_KEY, v) } catch { /* ignore */ }
  }
  // live search across title, room and speaker names for the selected day
  const [searching, setSearching] = useState(false)
  const [q, setQ] = useState('')
  const closeSearch = () => {
    setSearching(false)
    setQ('')
  }
  const matches = (s: Session) => {
    const needle = q.trim().toLowerCase()
    if (!needle) return true
    const hay = [s.title, s.room, ...ctx.speakersOf(s).map((p) => p.name)].join(' ').toLowerCase()
    return hay.includes(needle)
  }

  // my accepted 1:1 meetings join the day's programme; like tracks they have
  // their own chip, so any combination of tracks and meetings can be shown
  const meetingItems: Session[] = ctx.meetings
    .filter((m) => m.status === 'accepted' && m.day === day)
    .map((m) => ({
      id: 'mtg:' + m.id, day: m.day, start: m.start, end: m.end,
      title: 'Meeting with ' + ctx.nameFor(m.requesterId === ctx.userId ? m.inviteeId : m.requesterId),
      type: 'social' as const, track: 'plenary' as const,
      room: ctx.meetingPoints.find((p) => p.id === m.pointId)?.label ?? 'Meeting point TBC',
      speakers: [], desc: '', going: 0,
    }))
  const list = [
    ...ctx.sessions.filter((s) => s.day === day && (showAll || filters.has(s.track)) && matches(s)),
    ...(showAll || filters.has('meetings') ? meetingItems.filter(matches) : []),
  ].sort((a, b) => a.start.localeCompare(b.start))
  const VIEWS: { id: AgendaView; label: string }[] = [
    { id: 'timeline', label: 'Timeline' },
    { id: 'linear', label: 'Linear' },
    { id: 'list', label: 'List' },
  ]
  return (
    <div>
      <AppHeader
        title="Agenda"
        sub={[ctx.event.dateline, ctx.event.location].filter(Boolean).join(' · ')}
        right={<IconBtn name={searching ? 'close' : 'search'} onClick={() => (searching ? closeSearch() : setSearching(true))} />}
      />
      {searching && (
        <div style={{ padding: '10px 16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--wf-surface)', borderRadius: 'var(--radius-4)', padding: '0 12px', boxShadow: 'inset 0 0 0 1px var(--wf-grey-6)' }}>
            <Icon name="search" size={18} style={{ color: T.muted }} />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search sessions, rooms, speakers"
              style={{ flex: 1, border: 'none', outline: 'none', padding: '11px 0', fontFamily: T.sig, fontSize: 15, color: T.ink, background: 'transparent' }}
            />
          </div>
        </div>
      )}
      <FirstTimeHint id="agenda" text="Bookmark sessions to build your personal plan — it shows on Home, in My schedule, and exports to your calendar." />
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
        <Chip active={showAll} onClick={() => setFilters(new Set())}>All</Chip>
        {(Object.entries(TRACKS) as [TrackId, (typeof TRACKS)[TrackId]][])
          .filter(([k]) => k !== 'plenary')
          .map(([k, t]) => (
            <Chip key={k} active={filters.has(k)} onClick={() => toggleFilter(k)} color={t.dot}>
              {t.name}
            </Chip>
          ))}
        <Chip active={filters.has('meetings')} onClick={() => toggleFilter('meetings')} color={T.green9}>
          1:1 meetings
        </Chip>
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
              <SessionRow s={s} bookmarked={ctx.isBookmarked(s.id)} onToggle={() => ctx.toggleBookmark(s.id)} onOpen={(x) => openItem(ctx, x)} speakers={ctx.speakersOf(s)} />
            </div>
          ))}
        {list.length === 0 && (
          <div style={{ textAlign: 'center', color: T.muted, padding: 40, fontFamily: T.sig }}>
            {q.trim()
              ? `Nothing matches “${q.trim()}” on this day.`
              : filters.size === 1 && filters.has('meetings')
                ? 'No 1:1 meetings on this day yet — arrange one from a delegate’s profile in Connect.'
                : 'Nothing matches your filters on this day.'}
          </div>
        )}
      </div>
    </div>
  )
}
