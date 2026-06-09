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

/** "3d 4h 20m" / "4h 20m" / "20m" / "Less than a minute" */
export function formatCountdown(ms: number): string {
  if (ms <= 0) return ''
  const totalMin = Math.floor(ms / 60000)
  const d = Math.floor(totalMin / 1440)
  const h = Math.floor((totalMin % 1440) / 60)
  const m = totalMin % 60
  if (d > 0) return `${d}d ${h}h ${m}m`
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m`
  return 'less than a minute'
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
    const t = setInterval(() => setNowMs(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  return computeEventClock(nowMs, startISO, endISO, total)
}
