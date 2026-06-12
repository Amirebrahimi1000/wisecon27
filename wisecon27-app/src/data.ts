// WISEcon27 — design constants. Tracks are deliberately client-side: their
// colours are part of the design system, not editable event content.
// (All other event data — days, sessions, speakers, sponsors — lives in
// Supabase and reaches the app through appState.)

import type { Track, TrackId } from './types'

export const TRACKS: Record<TrackId, Track> = {
  integrity: { name: 'Integrity', bg: 'var(--wf-purple-2)', fg: 'var(--wf-purple-10)', dot: 'var(--wf-purple-8)' },
  pedagogy:  { name: 'Pedagogy',  bg: 'var(--wf-green-1)',  fg: 'var(--wf-green-11)',  dot: 'var(--wf-green-9)' },
  platform:  { name: 'Platform',  bg: 'var(--wf-blue-1)',   fg: 'var(--wf-blue-11)',   dot: 'var(--wf-blue-9)' },
  research:  { name: 'Research',  bg: 'var(--wf-orange-2)', fg: 'var(--wf-orange-11)', dot: 'var(--wf-orange-9)' },
  workshop:  { name: 'Workshop',  bg: 'var(--wf-teal-3)',   fg: 'var(--wf-teal-11)',   dot: 'var(--wf-teal-9)' },
  plenary:   { name: 'Plenary',   bg: 'var(--wf-grey-3)',   fg: 'var(--wf-grey-11)',   dot: 'var(--wf-grey-10)' },
}
