// WISEcon27 — turn a session's day + "HH:MM" into an absolute time, and detect
// clashes between the delegate's bookmarked sessions. Days are consecutive from
// event_start (same assumption eventClock makes), so we don't need each day's
// calendar date — only its position in the ordered day list.
import type { AppCtx } from './appState'
import type { Session } from './types'

const DAY_MS = 86400000

const startOfDayMs = (ms: number) => {
  const d = new Date(ms)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

const parseHHMM = (t: string): number => {
  const [h, m] = t.split(':').map((n) => parseInt(n, 10))
  return (Number.isFinite(h) ? h : 0) * 3600000 + (Number.isFinite(m) ? m : 0) * 60000
}

/** Absolute epoch-ms for a session start, or NaN if the event date is unknown. */
export function sessionStartMs(ctx: AppCtx, s: Pick<Session, 'day' | 'start'>): number {
  if (!ctx.event.startISO) return NaN
  const base = new Date(ctx.event.startISO).getTime()
  if (Number.isNaN(base)) return NaN
  const dayIdx = Math.max(0, ctx.days.findIndex((d) => d.id === s.day))
  return startOfDayMs(base) + dayIdx * DAY_MS + parseHHMM(s.start)
}

/** Two sessions overlap when they share a day and their time ranges intersect. */
const overlaps = (a: Session, b: Session) =>
  a.day === b.day && a.start < b.end && b.start < a.end

/** Bookmarked sessions that clash with `s` (same day, overlapping times). */
export function conflictsFor(ctx: AppCtx, s: Session): Session[] {
  return ctx.sessions.filter(
    (o) => o.id !== s.id && ctx.isBookmarked(o.id) && o.type !== 'break' && overlaps(s, o),
  )
}

/** Distinct pairs of bookmarked sessions that clash — for a schedule-wide warning. */
export function scheduleConflicts(ctx: AppCtx): [Session, Session][] {
  const booked = ctx.sessions.filter((s) => ctx.isBookmarked(s.id) && s.type !== 'break')
  const out: [Session, Session][] = []
  for (let i = 0; i < booked.length; i++)
    for (let j = i + 1; j < booked.length; j++)
      if (overlaps(booked[i], booked[j])) out.push([booked[i], booked[j]])
  return out
}
