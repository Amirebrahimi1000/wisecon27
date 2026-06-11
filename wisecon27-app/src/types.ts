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
  // linked delegate account — lets the speaker share resources on their sessions
  profileId?: string | null
}

/** A file or link a speaker (or organiser) shares on a session. */
export interface SessionResource {
  id: string
  sessionId: string
  label: string
  path: string | null
  url: string | null
  createdBy: string | null
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

/** One bookable time window within a day. */
export interface TimeWindow {
  start: string
  end: string
}

/** One day's 1:1 meeting availability; a missing day means available all day.
 *  Multiple windows allow e.g. "08:00–10:00 and 14:00–16:00". */
export interface DayAvail {
  available: boolean
  windows: TimeWindow[]
}

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
  hidden?: boolean
  meetingAvailability?: Record<string, DayAvail>
}

export type NotificationType =
  | 'reminder'
  | 'connect'
  | 'announce'
  | 'social'
  | 'feedback'
  | 'message'
  | 'meeting'

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  body: string
  time: string
  unread: boolean
  // 'announcement' (default, global) vs per-user derived items that navigate on tap
  kind?: 'announcement' | 'request' | 'message' | 'meeting'
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
  interests: string[]
}

/* ── 1:1 meetings (Brella-style time-slotted networking) ── */
export type MeetingStatus = 'pending' | 'accepted' | 'declined' | 'cancelled'

export interface MeetingPoint {
  id: string
  label: string
}

export interface Meeting {
  id: string
  requesterId: string
  inviteeId: string
  day: string
  start: string
  end: string
  pointId: string | null
  message: string
  status: MeetingStatus
  createdAt: string
}

/* ── community feed ── */
export interface FeedPost {
  id: string
  userId: string | null
  body: string
  createdAt: string
  likes: number
  liked: boolean
  // storage path in the private wall-photos bucket (rendered via signed URL)
  photoPath?: string | null
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
