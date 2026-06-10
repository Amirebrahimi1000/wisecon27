// WISEcon27 — export bookmarked sessions as an iCalendar (.ics) file.
// Times are written as floating local times (the venue's clock), which is the
// right behaviour for a physical event: 09:00 means 09:00 at the venue.
import type { Day, Session } from '../types'

const pad = (n: number) => String(n).padStart(2, '0')
const icsDate = (d: Date, hm: string) =>
  `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${hm.replace(':', '')}00`
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')

/**
 * Build the .ics text. Day 1 = the calendar date of eventStartISO; subsequent
 * days follow the order of the `days` list. Returns null when the event start
 * is not configured (no real dates to anchor to).
 */
export function buildScheduleIcs(sessions: Session[], days: Day[], eventStartISO: string, location: string): string | null {
  const start = eventStartISO ? new Date(eventStartISO) : null
  if (!start || Number.isNaN(start.getTime())) return null
  const dayDate = new Map<string, Date>()
  days.forEach((d, i) => {
    const dt = new Date(start)
    dt.setDate(dt.getDate() + i)
    dayDate.set(d.id, dt)
  })

  const events = sessions
    .filter((s) => dayDate.has(s.day))
    .map((s) => {
      const d = dayDate.get(s.day)!
      return [
        'BEGIN:VEVENT',
        `UID:${s.id}@wisecon27`,
        `DTSTART:${icsDate(d, s.start)}`,
        `DTEND:${icsDate(d, s.end)}`,
        `SUMMARY:${esc(s.title)}`,
        s.room ? `LOCATION:${esc([s.room, location].filter(Boolean).join(', '))}` : '',
        s.desc ? `DESCRIPTION:${esc(s.desc)}` : '',
        'BEGIN:VALARM',
        'TRIGGER:-PT10M',
        'ACTION:DISPLAY',
        `DESCRIPTION:${esc(s.title)} starts in 10 minutes`,
        'END:VALARM',
        'END:VEVENT',
      ].filter(Boolean).join('\r\n')
    })

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//UNIwise//WISEcon27//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:WISEcon27 — my schedule`,
    ...events,
    'END:VCALENDAR',
  ].join('\r\n')
}

export function downloadIcs(ics: string) {
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = 'wisecon27-schedule.ics'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}
