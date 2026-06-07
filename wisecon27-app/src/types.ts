// WISEcon27 — domain types (schema mirrors prototype/app/data.js)

export type TrackId =
  | 'integrity'
  | 'pedagogy'
  | 'platform'
  | 'research'
  | 'workshop'
  | 'plenary'

export interface Track {
  name: string
  bg: string
  fg: string
  dot: string
}

export interface Day {
  id: string
  dow: string
  date: string
  long: string
}

export interface Speaker {
  id: string
  name: string
  role: string
  org: string
  initials: string
  color: string
  bio: string
  topics: string[]
}

export type SessionType =
  | 'keynote'
  | 'talk'
  | 'panel'
  | 'workshop'
  | 'break'
  | 'social'
  | 'plenary'

export interface Session {
  id: string
  day: string
  start: string
  end: string
  title: string
  type: SessionType
  track: TrackId
  room: string
  speakers: string[]
  desc: string
  tags?: string[]
  going: number
  capacity?: number
}

export type ConnectStatus = 'connect' | 'pending' | 'connected'

export interface Attendee {
  id: string
  name: string
  role: string
  org: string
  initials: string
  color: string
  interests: string[]
  mutual: number
  status: ConnectStatus
}

export type NotificationType =
  | 'reminder'
  | 'connect'
  | 'announce'
  | 'social'
  | 'feedback'

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  body: string
  time: string
  unread: boolean
}

export type SponsorTier = 'Host' | 'Platinum' | 'Gold' | 'Silver'

export interface Sponsor {
  name: string
  tier: SponsorTier
  blurb: string
  initials: string
  color: string
}

export interface Me {
  name: string
  initials: string
  role: string
  org: string
  color: string
  ticket: string
  badgeId: string
  bookmarks: string[]
}
