// WISEcon27 — design constants. Tracks are deliberately client-side: their
// colours are part of the design system, not editable event content.
// (All other event data — days, sessions, speakers, sponsors — lives in
// Supabase and reaches the app through appState.)

import type { Track, TrackId } from './types'

export const TRACKS: Record<TrackId, Track> = {
  explorer: { name: 'Explorer stream', bg: 'var(--wf-orange-2)', fg: 'var(--wf-orange-11)', dot: 'var(--wf-orange-9)' },
  faculty:  { name: 'Faculty stream',  bg: 'var(--wf-green-1)',  fg: 'var(--wf-green-11)',  dot: 'var(--wf-green-9)' },
  admin:    { name: 'Admin stream',    bg: 'var(--wf-blue-1)',   fg: 'var(--wf-blue-11)',   dot: 'var(--wf-blue-9)' },
  plenary:  { name: 'Plenary',         bg: 'var(--wf-grey-3)',   fg: 'var(--wf-grey-11)',   dot: 'var(--wf-grey-10)' },
}

// Tolerant lookup: session rows may briefly carry track ids the bundle doesn't
// know (deploys and data edits aren't atomic) — render those as plenary grey
// rather than crashing.
export const trackOf = (t: string): Track => TRACKS[t as TrackId] ?? TRACKS.plenary
