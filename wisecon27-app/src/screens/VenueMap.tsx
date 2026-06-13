// WISEcon27 — interactive venue map (pushed). The floor plan is generated
// from the rooms actually used by the programme (plus the fixed venue spaces),
// so it stays correct whatever venue the organisers load. Rooms highlight on
// tap and show what's on there; the Expo Hall lists exhibitor booths.
// Opened with { room } or { booth } params to pre-select a location.
import { useMemo, useState } from 'react'
import { T, TABBAR_H } from '../theme'
import type { AppCtx } from '../appState'
import { trackOf } from '../data'
import { Icon } from '../components/Icon'
import { AppHeader, Eyebrow, Press, TrackTag } from '../components/primitives'

interface Area {
  id: string
  label: string
  x: number
  y: number
  w: number
  h: number
  note?: string
}

const norm = (s: string) => s.trim().toLowerCase()
const W = 360
const PAD = 16
const GAP = 12
const INNER = W - PAD * 2

// programme rooms (largest first) → one big hero block, then a 2-up grid,
// then the fixed venue spaces (Foyer / Expo Hall / Networking Lounge)
function buildAreas(rooms: string[]): { areas: Area[]; height: number } {
  const areas: Area[] = []
  let y = PAD
  const fixed = new Set(['foyer', 'expo hall', 'networking lounge'])
  const programme = rooms.filter((r) => r && !fixed.has(norm(r)))
  if (programme.length > 0) {
    areas.push({ id: norm(programme[0]), label: programme[0], x: PAD, y, w: INNER, h: 92, note: 'Main room' })
    y += 92 + GAP
  }
  const rest = programme.slice(1)
  const colW = (INNER - GAP) / 2
  rest.forEach((r, i) => {
    const col = i % 2
    areas.push({ id: norm(r), label: r, x: PAD + col * (colW + GAP), y, w: colW, h: 72 })
    if (col === 1 || i === rest.length - 1) y += 72 + GAP
  })
  areas.push({ id: 'foyer', label: 'Foyer', x: PAD, y, w: INNER, h: 50, note: 'Registration & catering' })
  y += 50 + GAP
  areas.push({ id: 'expo hall', label: 'Expo Hall', x: PAD, y, w: 196, h: 100, note: 'Exhibitor booths' })
  areas.push({ id: 'networking lounge', label: 'Networking Lounge', x: PAD + 196 + GAP, y, w: INNER - 196 - GAP, h: 100, note: '1:1 meeting tables' })
  y += 100
  return { areas, height: y + 26 }
}

export function VenueMap({ ctx }: { ctx: AppCtx }) {
  const booth = ctx.params.booth

  const { areas, height } = useMemo(() => {
    // rooms ordered by how much of the programme happens there
    const tally = new Map<string, number>()
    for (const s of ctx.sessions) {
      if (!s.room.trim()) continue
      tally.set(s.room, (tally.get(s.room) ?? 0) + 1)
    }
    const rooms = [...tally.entries()].sort((a, b) => b[1] - a[1]).map(([r]) => r)
    return buildAreas(rooms)
  }, [ctx.sessions])

  const areaFor = (room: string): Area | undefined =>
    areas.find((a) => a.id === norm(room) || norm(room).includes(a.id))

  const initial = booth ? 'expo hall' : ctx.params.room ? areaFor(ctx.params.room)?.id ?? null : null
  const [sel, setSel] = useState<string | null>(initial)
  const selected = areas.find((a) => a.id === sel) || null

  // upcoming programme in the selected room (across days, in order)
  const inRoom = useMemo(() => {
    if (!selected) return []
    return ctx.sessions
      .filter((s) => areaFor(s.room)?.id === selected.id)
      .sort((a, b) => (a.day + a.start).localeCompare(b.day + b.start))
      .slice(0, 4)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.sessions, selected, areas])

  const exhibitors = ctx.sponsors.filter((sp) => sp.booth)

  return (
    <div>
      <AppHeader title="Venue map" sub={ctx.event.location || 'Find your way'} onBack={ctx.back} />
      <div style={{ padding: '14px 16px ' + (TABBAR_H + 16) + 'px' }}>
        {ctx.params.room && !areaFor(ctx.params.room) && (
          <div style={{ fontFamily: T.sig, fontSize: 13.5, color: T.muted, marginBottom: 10 }}>
            “{ctx.params.room}” isn't on the floor plan — ask at the registration desk in the Foyer.
          </div>
        )}

        {/* floor plan */}
        <div style={{ background: 'var(--wf-surface)', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', padding: 10 }}>
          <svg viewBox={`0 0 ${W} ${height}`} style={{ display: 'block', width: '100%' }}>
            {areas.map((a) => {
              const on = sel === a.id
              return (
                <g key={a.id} onClick={() => setSel(on ? null : a.id)} style={{ cursor: 'pointer' }}>
                  <rect
                    x={a.x} y={a.y} width={a.w} height={a.h} rx={10}
                    fill={on ? 'var(--wf-green-1)' : 'var(--wf-grey-2)'}
                    stroke={on ? 'var(--wf-green-9)' : 'var(--wf-grey-6)'}
                    strokeWidth={on ? 2 : 1}
                  />
                  <text
                    x={a.x + a.w / 2} y={a.y + a.h / 2 + (a.note ? -3 : 4)}
                    textAnchor="middle"
                    style={{ fontFamily: T.sig, fontWeight: 700, fontSize: a.w < 170 ? 11.5 : 13, fill: on ? 'var(--wf-green-11)' : 'var(--wf-grey-11)' }}
                  >
                    {a.label}
                  </text>
                  {a.note && (
                    <text
                      x={a.x + a.w / 2} y={a.y + a.h / 2 + 12}
                      textAnchor="middle"
                      style={{ fontFamily: T.onest, fontSize: 9, fill: on ? 'var(--wf-green-10)' : 'var(--wf-grey-9)' }}
                    >
                      {a.note}
                    </text>
                  )}
                </g>
              )
            })}
            <text x={W / 2} y={height - 8} textAnchor="middle" style={{ fontFamily: T.onest, fontSize: 10, fill: 'var(--wf-grey-9)' }}>
              ▲ Main entrance
            </text>
          </svg>
        </div>
        <div style={{ fontFamily: T.onest, fontSize: 11.5, color: T.muted, margin: '8px 2px 16px', lineHeight: 1.5 }}>
          Tap a room to see what's happening there.
        </div>

        {/* selected location detail */}
        {selected && (
          <div style={{ background: 'var(--wf-surface)', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{ width: 34, height: 34, borderRadius: 'var(--radius-2)', background: T.green1, color: T.green10, display: 'grid', placeItems: 'center' }}><Icon name="pin" size={18} /></div>
              <div>
                <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 17, color: T.ink }}>{selected.label}</div>
                {selected.note && <div style={{ fontFamily: T.onest, fontSize: 12, color: T.muted }}>{selected.note}</div>}
              </div>
            </div>

            {/* exhibitor booths in the Expo Hall */}
            {selected.id === 'expo hall' && exhibitors.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <Eyebrow style={{ marginBottom: 8 }}>Booths</Eyebrow>
                {exhibitors.map((sp) => {
                  const here = booth && norm(sp.booth ?? '') === norm(booth)
                  return (
                    <Press key={sp.name} onClick={() => ctx.push('exhibitor', { sponsor: sp })} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 'var(--radius-2)', background: here ? T.green1 : 'transparent' }}>
                      <span style={{ fontFamily: T.onest, fontWeight: 700, fontSize: 12, color: here ? T.green10 : T.muted, width: 34 }}>{sp.booth}</span>
                      <span style={{ flex: 1, fontFamily: T.sig, fontWeight: 600, fontSize: 14, color: T.ink }}>{sp.name}</span>
                      <Icon name="chevronRight" size={16} stroke={2} style={{ color: T.line2 }} />
                    </Press>
                  )
                })}
              </div>
            )}

            {/* programme in this room */}
            {inRoom.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <Eyebrow style={{ marginBottom: 8 }}>In this room</Eyebrow>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {inRoom.map((s) => {
                    const d = ctx.days.find((x) => x.id === s.day)
                    return (
                      <Press key={s.id} onClick={() => ctx.openSession(s)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 'var(--radius-2)' }}>
                        <div style={{ width: 58, flexShrink: 0 }}>
                          <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 13, color: T.ink }}>{s.start}</div>
                          <div style={{ fontFamily: T.onest, fontSize: 10.5, color: T.muted }}>{d?.dow} {d?.date}</div>
                        </div>
                        <span style={{ width: 3, alignSelf: 'stretch', borderRadius: 3, background: trackOf(s.track).dot }} />
                        <span style={{ flex: 1, fontFamily: T.sig, fontWeight: 600, fontSize: 13.5, color: T.ink, lineHeight: 1.3 }}>{s.title}</span>
                        <TrackTag track={s.track} />
                      </Press>
                    )
                  })}
                </div>
              </div>
            )}
            {selected.id !== 'expo hall' && inRoom.length === 0 && (
              <div style={{ fontFamily: T.sig, fontSize: 13.5, color: T.muted, marginTop: 10 }}>No programmed sessions in this space.</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
