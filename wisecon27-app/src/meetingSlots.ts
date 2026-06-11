// WISEcon27 — shared 1:1 meeting slot model: 30-minute slots across the
// conference day, plus the default availability window (all day).
import type { DayWindow } from './types'

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

export const DEFAULT_WINDOW: DayWindow = { available: true, start: '08:30', end: '18:00' }

export const windowFor = (avail: Record<string, DayWindow> | undefined, dayId: string): DayWindow =>
  avail?.[dayId] ?? DEFAULT_WINDOW
