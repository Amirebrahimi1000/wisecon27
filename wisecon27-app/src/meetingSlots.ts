// WISEcon27 — shared 1:1 meeting slot model: 30-minute slots across the
// conference day, plus the availability model (multiple windows per day).
import type { DayAvail, TimeWindow } from './types'

export const SLOT_MIN = 30

const hm = (mins: number) => `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`

// candidate slot starts: 08:30 … 17:30
export const SLOTS = Array.from({ length: 19 }, (_, i) => hm(8 * 60 + 30 + i * SLOT_MIN))

// half-hour ticks for the availability editor: 08:00 … 18:00
export const TICKS = Array.from({ length: 21 }, (_, i) => hm(8 * 60 + i * SLOT_MIN))

export const slotEnd = (start: string) => {
  const [h, m] = start.split(':').map(Number)
  return hm(h * 60 + m + SLOT_MIN)
}

export const overlaps = (aS: string, aE: string, bS: string, bE: string) => aS < bE && bS < aE

export const ALL_DAY: TimeWindow = { start: '08:30', end: '18:00' }
export const DEFAULT_AVAIL: DayAvail = { available: true, windows: [ALL_DAY] }

// accept both the current shape ({available, windows[]}) and the original
// single-window shape ({available, start, end}) stored by earlier app versions
export function normalizeDayAvail(raw: unknown): DayAvail {
  if (!raw || typeof raw !== 'object') return DEFAULT_AVAIL
  const r = raw as { available?: boolean; windows?: TimeWindow[]; start?: string; end?: string }
  const available = r.available !== false
  if (Array.isArray(r.windows)) {
    const windows = r.windows.filter((w) => w && w.start && w.end && w.start < w.end)
    return { available, windows: windows.length ? windows : [ALL_DAY] }
  }
  if (r.start && r.end) return { available, windows: [{ start: r.start, end: r.end }] }
  return { available, windows: [ALL_DAY] }
}

export const availFor = (avail: Record<string, DayAvail> | undefined, dayId: string): DayAvail =>
  avail?.[dayId] ? normalizeDayAvail(avail[dayId]) : DEFAULT_AVAIL

/** Does a slot [start, end) fit fully inside any of the day's windows? */
export const inAnyWindow = (start: string, end: string, a: DayAvail): boolean =>
  a.available && a.windows.some((w) => start >= w.start && end <= w.end)
