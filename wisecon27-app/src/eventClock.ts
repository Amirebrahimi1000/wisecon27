// WISEcon27 — derive the event's live state from real dates/times.
// Event start/end are stored as local ISO datetimes in settings
// (event_start / event_end), editable in Admin → Event.
import { useEffect, useState } from 'react'

export type EventPhase = 'before' | 'live' | 'ended' | 'unknown'

export interface EventClock {
  phase: EventPhase
  dayIndex: number // 1-based; meaningful when live
  total: number
  msToStart: number
  countdown: string // e.g. "3d 4h 20m" — only when before
}

const startOfDay = (ms: number) => {
  const d = new Date(ms)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** Ticking countdown incl. seconds: "3d 04h 20m 09s" / "4h 20m 09s" / "20m 09s" / "9s" */
export function formatCountdown(ms: number): string {
  if (ms <= 0) return ''
  const totalSec = Math.floor(ms / 1000)
  const d = Math.floor(totalSec / 86400)
  const h = Math.floor((totalSec % 86400) / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  const p = (n: number) => String(n).padStart(2, '0')
  if (d > 0) return `${d}d ${p(h)}h ${p(m)}m ${p(s)}s`
  if (h > 0) return `${h}h ${p(m)}m ${p(s)}s`
  if (m > 0) return `${m}m ${p(s)}s`
  return `${s}s`
}

export function computeEventClock(nowMs: number, startISO: string, endISO: string, total: number): EventClock {
  const start = startISO ? new Date(startISO).getTime() : NaN
  const end = endISO ? new Date(endISO).getTime() : NaN
  if (Number.isNaN(start) || Number.isNaN(end)) return { phase: 'unknown', dayIndex: 1, total, msToStart: 0, countdown: '' }
  if (nowMs < start) return { phase: 'before', dayIndex: 1, total, msToStart: start - nowMs, countdown: formatCountdown(start - nowMs) }
  if (nowMs > end) return { phase: 'ended', dayIndex: Math.max(1, total), total, msToStart: 0, countdown: '' }
  const idx = Math.round((startOfDay(nowMs) - startOfDay(start)) / 86400000) + 1
  return { phase: 'live', dayIndex: Math.min(Math.max(1, idx), Math.max(1, total)), total, msToStart: 0, countdown: '' }
}

/** Re-evaluates every second so the countdown ticks and the phase flips live. */
export function useEventClock(startISO: string, endISO: string, total: number): EventClock {
  const [nowMs, setNowMs] = useState(() => Date.now())
  useEffect(() => {
    // 250ms so the seconds digit never looks stale (it's derived from the real
    // clock, so this only affects how promptly the display flips)
    const t = setInterval(() => setNowMs(Date.now()), 250)
    return () => clearInterval(t)
  }, [])
  return computeEventClock(nowMs, startISO, endISO, total)
}
