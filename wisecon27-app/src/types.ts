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
  photoUrl?: string | null
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
  slidesPath?: string | null
  slidesName?: string | null
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
  avatarUrl?: string | null
}

export type NotificationType =
  | 'reminder'
  | 'connect'
  | 'announce'
  | 'social'
  | 'feedback'
  | 'message'

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  body: string
  time: string
  unread: boolean
  // 'announcement' (default, global) vs per-user derived items that navigate on tap
  kind?: 'announcement' | 'request' | 'message'
  peerId?: string
}

export interface Message {
  id: string
  senderId: string
  recipientId: string
  body: string
  createdAt: string
  readAt: string | null
}

export interface Conversation {
  peerId: string
  peerName: string
  peerInitials: string
  peerColor: string
  peerAvatarUrl?: string | null
  lastBody: string
  lastAt: string
  unread: number
  fromMe: boolean
}

export type SponsorTier = 'Host' | 'Platinum' | 'Gold' | 'Silver'

export interface Sponsor {
  id?: string
  name: string
  tier: SponsorTier
  blurb: string
  initials: string
  color: string
  description?: string
  booth?: string
  website?: string
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
  avatarUrl?: string | null
  delegateType: string
  gala: boolean
}

export interface Activity {
  id: string
  title: string
  description: string
  location: string
  day: string | null
  start: string
  end: string
  capacity: number | null
}

export type SurveyKind = 'rating' | 'nps' | 'choice' | 'text'
export interface SurveyQuestion {
  id: string
  prompt: string
  kind: SurveyKind
  options: string[]
  sort: number
}
