// WISEcon27 — app state backed by Supabase.
// Loads content (days/speakers/sessions/sponsors/event-info/announcements),
// the signed-in user's profile, bookmarks and connections; exposes nav, toast,
// and mutators that write through to the database. Realtime keeps announcements,
// sessions and connections in sync across devices.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from './lib/supabase'
import { useAuth } from './auth'
import { normalizeDayAvail } from './meetingSlots'
import type {
  Activity, AppNotification, Attendee, ConnectStatus, Conversation, Day, InfoSection, Me, Meeting, MeetingPoint, MeetingStatus, Message, Session, SessionResource, Speaker, Sponsor, SurveyQuestion,
} from './types'

export type TabId = 'home' | 'agenda' | 'activities' | 'speakers' | 'connect' | 'profile'
export type PushScreen =
  | 'session' | 'speaker' | 'myschedule' | 'notifications' | 'sponsors'
  | 'ticket' | 'feedback' | 'info' | 'settings' | 'admin'
  | 'activities' | 'survey' | 'exhibitor' | 'conversation' | 'scanner'
  | 'editprofile' | 'delegate' | 'scanconnect'
  | 'meetings' | 'meetingrequest' | 'community' | 'venuemap' | 'availability' | 'tour'
  | 'certificate' | 'notes' | 'resources'

export interface EventInfoItem { id: string; icon: string; label: string; detail: string }
export interface EventMeta { dateline: string; location: string; startISO: string; endISO: string }

export interface NavParams {
  session?: Session
  speaker?: Speaker
  sponsor?: Sponsor
  day?: string
  peerId?: string
  room?: string
  booth?: string
  meetingId?: string
  tourStep?: number
  focus?: 'interests' // editprofile: scroll to + focus the interest picker
  _fromTab?: boolean
}
interface StackEntry { screen: PushScreen; params: NavParams }

export interface AppCtx {
  // nav
  tab: TabId
  stack: StackEntry[]
  params: NavParams
  openSession: (s: Session) => void
  push: (screen: PushScreen, params?: NavParams) => void
  back: () => void
  setTab: (t: TabId) => void
  // jump to the Agenda pre-searched on a topic (e.g. tapping a tag on a
  // session page); Agenda consumes the pending jump on render
  agendaJump: { query: string; day?: string } | null
  openAgendaSearch: (query: string, day?: string) => void
  consumeAgendaJump: () => void
  // content (live from Supabase)
  loading: boolean
  days: Day[]
  speakers: Speaker[]
  sessions: Session[]
  sponsors: Sponsor[]
  eventInfo: EventInfoItem[]
  infoSections: InfoSection[]
  event: EventMeta
  speakersOf: (s: Session) => Speaker[]
  // resources (files/links) shared on a session by its speakers or organisers
  resourcesOf: (sessionId: string) => SessionResource[]
  refreshContent: () => Promise<void>
  // identity
  userId: string
  me: Me
  isAdmin: boolean
  isStaff: boolean
  updateProfile: (patch: Partial<Me>) => Promise<void>
  // refresh interests in-memory so recommendations and "shared interests"
  // counts update instantly (the DB write happens in EditProfile)
  setMyInterests: (interests: string[]) => void
  nameFor: (id: string) => string
  // bookmarks (per account)
  isBookmarked: (id: string) => boolean
  toggleBookmark: (id: string) => void
  // notifications (announcements + per-user read state)
  notifications: AppNotification[]
  unread: number
  readOne: (id: string) => void
  markAllRead: () => void
  // connections (other delegates)
  attendees: Attendee[]
  setConnection: (id: string, status: ConnectStatus) => void
  incomingRequests: Attendee[]
  acceptConnection: (id: string) => void
  declineConnection: (id: string) => void
  // direct messages (between connected delegates)
  conversations: Conversation[]
  messagesWith: (peerId: string) => Message[]
  sendMessage: (peerId: string, body: string) => Promise<void>
  markThreadRead: (peerId: string) => void
  // 1:1 meetings (Brella-style time-slotted networking)
  meetings: Meeting[]
  meetingPoints: MeetingPoint[]
  requestMeeting: (peerId: string, dayId: string, start: string, end: string, pointId: string, message: string) => Promise<boolean>
  respondMeeting: (id: string, status: Extract<MeetingStatus, 'accepted' | 'declined'>) => void
  cancelMeeting: (id: string) => void
  // interactive activities (with sign-up)
  activities: ActivityView[]
  toggleActivitySignup: (id: string) => void
  // per-session feedback
  myFeedback: Record<string, { stars: number; tags: string[]; comment: string }>
  submitSessionFeedback: (sessionId: string, stars: number, tags: string[], comment: string) => Promise<void>
  // post-conference survey
  surveyQuestions: SurveyQuestion[]
  surveyDone: boolean
  submitSurvey: (answers: Record<string, unknown>) => Promise<void>
  // profile picture
  setAvatar: (url: string) => void
  // toast
  toast: (msg: string) => void
  toastMsg: string | null
}

/* ── row → app-type mappers ────────────────────────────────────── */
interface SessionRow {
  id: string; day_id: string; start: string; end: string; title: string
  type: Session['type']; track: Session['track']; room: string; desc: string
  tags: string[] | null; going: number; capacity: number | null
  slides_path: string | null; slides_name: string | null
  session_speakers?: { speaker_id: string; ord: number }[]
}
const mapSession = (r: SessionRow): Session => ({
  id: r.id, day: r.day_id, start: r.start, end: r.end, title: r.title, type: r.type,
  track: r.track, room: r.room, desc: r.desc, tags: r.tags ?? [], going: r.going,
  capacity: r.capacity ?? undefined,
  slidesPath: r.slides_path, slidesName: r.slides_name,
  speakers: (r.session_speakers ?? []).slice().sort((a, b) => a.ord - b.ord).map((x) => x.speaker_id),
})

interface ProfileRow {
  id: string; name: string; initials: string; role: string; org: string; color: string
  ticket: string; badge_id: string; interests: string[]; is_admin: boolean; is_staff?: boolean; avatar_url: string | null
  delegate_type: string | null; gala: boolean | null
  hidden?: boolean | null; notif_prefs?: Record<string, boolean> | null
  meeting_availability?: Record<string, unknown> | null
}
const mapProfile = (r: ProfileRow): Me => ({
  name: r.name, initials: r.initials, role: r.role, org: r.org, color: r.color,
  ticket: r.ticket, badgeId: r.badge_id, bookmarks: [], avatarUrl: r.avatar_url,
  delegateType: r.delegate_type ?? 'delegate', gala: r.gala ?? false,
  interests: r.interests ?? [],
})

interface MeetingRow {
  id: string; requester_id: string; invitee_id: string; day_id: string
  start: string; end: string; point_id: string | null; message: string
  status: MeetingStatus; created_at: string
}
const mapMeeting = (r: MeetingRow): Meeting => ({
  id: r.id, requesterId: r.requester_id, inviteeId: r.invitee_id, day: r.day_id,
  start: r.start, end: r.end, pointId: r.point_id, message: r.message,
  status: r.status, createdAt: r.created_at,
})

interface ActivityRow {
  id: string; title: string; description: string; location: string
  day_id: string | null; start: string; end: string; capacity: number | null
}
export interface ActivityView extends Activity {
  going: number
  signedUp: boolean
  full: boolean
}

interface MessageRow {
  id: string; sender_id: string; recipient_id: string; body: string; created_at: string; read_at: string | null
}
const mapMessage = (r: MessageRow): Message => ({
  id: r.id, senderId: r.sender_id, recipientId: r.recipient_id, body: r.body, createdAt: r.created_at, readAt: r.read_at,
})

type ConnRow = { requester_id: string; target_id: string; status: ConnectStatus }

interface ResourceRow { id: string; session_id: string; label: string; path: string | null; url: string | null; created_by: string | null }
const mapResource = (r: ResourceRow): SessionResource => ({
  id: r.id, sessionId: r.session_id, label: r.label, path: r.path, url: r.url, createdBy: r.created_by,
})

const initialsFrom = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || '?'

const shortTime = (iso: string) => {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const EMPTY_ME: Me = {
  name: '', initials: '', role: '', org: '', color: 'var(--wf-blue-9)',
  ticket: 'Full delegate', badgeId: '', bookmarks: [], delegateType: 'delegate', gala: false,
  interests: [],
}

export function useAppState(): AppCtx {
  const { session } = useAuth()
  const userId = session?.user.id ?? ''

  // nav
  const [tab, setTabState] = useState<TabId>('home')
  const [agendaJump, setAgendaJump] = useState<{ query: string; day?: string } | null>(null)
  const [stack, setStack] = useState<StackEntry[]>([])

  // content
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState<Day[]>([])
  const [speakers, setSpeakers] = useState<Speaker[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [eventInfo, setEventInfo] = useState<EventInfoItem[]>([])
  const [infoSections, setInfoSections] = useState<InfoSection[]>([])
  const [event, setEvent] = useState<EventMeta>({ dateline: '', location: '', startISO: '', endISO: '' })
  const [meetingPoints, setMeetingPoints] = useState<MeetingPoint[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [resources, setResources] = useState<SessionResource[]>([])

  // identity / user data
  const [me, setMe] = useState<Me>(EMPTY_ME)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isStaff, setIsStaff] = useState(false)
  const [bookmarkSet, setBookmarkSet] = useState<Set<string>>(new Set())
  const [announcements, setAnnouncements] = useState<AppNotification[]>([])
  const [readSet, setReadSet] = useState<Set<string>>(new Set())
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [connRows, setConnRows] = useState<ConnRow[]>([])
  const [messages, setMessages] = useState<Message[]>([])

  // features: activities, survey, per-session feedback
  const [activitiesRaw, setActivitiesRaw] = useState<ActivityRow[]>([])
  const [signupCounts, setSignupCounts] = useState<Record<string, number>>({})
  const [mySignups, setMySignups] = useState<Set<string>>(new Set())
  const [surveyQuestions, setSurveyQuestions] = useState<SurveyQuestion[]>([])
  const [surveyDone, setSurveyDone] = useState(false)
  const [myFeedback, setMyFeedback] = useState<Record<string, { stars: number; tags: string[]; comment: string }>>({})

  // ui
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const speakerById = useMemo(() => new Map(speakers.map((s) => [s.id, s])), [speakers])
  const speakersOf = useCallback(
    (s: Session) => (s.speakers || []).map((id) => speakerById.get(id)).filter(Boolean) as Speaker[],
    [speakerById],
  )

  /* ── load all content + user data ── */
  const loadContent = useCallback(async () => {
    const [d, sp, se, so, ei, act, sq, st, mp, sr, is] = await Promise.all([
      supabase.from('days').select('*').order('sort'),
      supabase.from('speakers').select('*').order('sort'),
      supabase.from('sessions').select('*, session_speakers(speaker_id, ord)'),
      supabase.from('sponsors').select('*').order('sort'),
      supabase.from('event_info').select('*').order('sort'),
      supabase.from('activities').select('*').order('sort'),
      supabase.from('survey_questions').select('*').eq('active', true).order('sort'),
      supabase.from('settings').select('key, value'),
      supabase.from('meeting_points').select('id, label').order('sort'),
      supabase.from('session_resources').select('*').order('created_at'),
      supabase.from('info_sections').select('*').order('sort'),
    ])
    if (st.data) {
      const m = new Map((st.data as { key: string; value: string }[]).map((r) => [r.key, r.value]))
      setEvent({
        dateline: m.get('event_dateline') ?? '',
        location: m.get('event_location') ?? '',
        startISO: m.get('event_start') ?? '',
        endISO: m.get('event_end') ?? '',
      })
    }
    if (d.data) setDays(d.data as Day[])
    if (sp.data) setSpeakers((sp.data as (Speaker & { photo_url: string | null; profile_id?: string | null })[]).map((s) => ({ ...s, photoUrl: s.photo_url, profileId: s.profile_id ?? null })))
    if (se.data) setSessions((se.data as SessionRow[]).map(mapSession))
    if (so.data) setSponsors(so.data as Sponsor[])
    if (ei.data) setEventInfo(ei.data as EventInfoItem[])
    if (is.data) setInfoSections((is.data as (InfoSection & { sort: number; title_i18n?: Record<string, string>; body_i18n?: Record<string, string> })[]).map((r) => ({ id: r.id, icon: r.icon, title: r.title, body: r.body, link: r.link ?? null, titleI18n: r.title_i18n ?? {}, bodyI18n: r.body_i18n ?? {} })))
    if (act.data) setActivitiesRaw(act.data as ActivityRow[])
    if (sq.data) setSurveyQuestions(sq.data as SurveyQuestion[])
    if (mp.data) setMeetingPoints(mp.data as MeetingPoint[])
    if (sr.data) setResources((sr.data as ResourceRow[]).map(mapResource))
  }, [])

  const loadUserData = useCallback(async () => {
    if (!userId) return
    const [prof, bm, ann, reads, profs, conns, signups, survey, feedback] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('bookmarks').select('session_id').eq('user_id', userId),
      supabase.from('announcements').select('*').order('created_at', { ascending: false }),
      supabase.from('notification_reads').select('announcement_id').eq('user_id', userId),
      supabase.from('profiles').select('*'),
      supabase.from('connections').select('*'),
      supabase.from('activity_signups').select('activity_id, user_id'),
      supabase.from('survey_responses').select('answers').eq('user_id', userId).maybeSingle(),
      supabase.from('session_feedback').select('session_id, stars, tags, comment').eq('user_id', userId),
    ])
    if (prof.data) {
      const p = prof.data as ProfileRow
      setMe(mapProfile(p))
      setIsAdmin(p.is_admin)
      setIsStaff(p.is_staff ?? false)
    }
    if (bm.data) setBookmarkSet(new Set((bm.data as { session_id: string }[]).map((x) => x.session_id)))
    if (ann.data)
      setAnnouncements(
        (ann.data as { id: string; type: AppNotification['type']; title: string; body: string; created_at: string }[]).map(
          (a) => ({ id: a.id, type: a.type, title: a.title, body: a.body, time: shortTime(a.created_at), unread: true }),
        ),
      )
    if (reads.data) setReadSet(new Set((reads.data as { announcement_id: string }[]).map((x) => x.announcement_id)))

    // attendees = other profiles, with my connection status + shared interests
    if (profs.data) {
      const myInterests = new Set((prof.data as ProfileRow | null)?.interests ?? [])
      const connRows = (conns.data ?? []) as ConnRow[]
      setConnRows(connRows)
      const statusFor = (otherId: string): ConnectStatus => {
        const row = connRows.find(
          (c) =>
            (c.requester_id === userId && c.target_id === otherId) ||
            (c.requester_id === otherId && c.target_id === userId),
        )
        return row ? row.status : 'connect'
      }
      setAttendees(
        (profs.data as ProfileRow[])
          .filter((p) => p.id !== userId && p.name.trim() !== '')
          .map((p) => ({
            id: p.id, name: p.name, role: p.role, org: p.org, initials: p.initials || initialsFrom(p.name),
            color: p.color, interests: p.interests, avatarUrl: p.avatar_url,
            mutual: p.interests.filter((i) => myInterests.has(i)).length,
            status: statusFor(p.id),
            hidden: p.hidden ?? false,
            meetingAvailability: Object.fromEntries(
              Object.entries(p.meeting_availability ?? {}).map(([day, v]) => [day, normalizeDayAvail(v)]),
            ),
          })),
      )
    }

    // activity sign-ups → counts + my set
    const su = (signups.data ?? []) as { activity_id: string; user_id: string }[]
    const counts: Record<string, number> = {}
    const mine = new Set<string>()
    for (const r of su) {
      counts[r.activity_id] = (counts[r.activity_id] ?? 0) + 1
      if (r.user_id === userId) mine.add(r.activity_id)
    }
    setSignupCounts(counts)
    setMySignups(mine)

    setSurveyDone(!!survey.data)
    const fb: Record<string, { stars: number; tags: string[]; comment: string }> = {}
    for (const f of (feedback.data ?? []) as { session_id: string; stars: number; tags: string[]; comment: string }[]) {
      fb[f.session_id] = { stars: f.stars, tags: f.tags ?? [], comment: f.comment ?? '' }
    }
    setMyFeedback(fb)

    setLoading(false)
  }, [userId])

  useEffect(() => {
    setLoading(true)
    loadContent().then(loadUserData)
  }, [loadContent, loadUserData])

  /* ── realtime: announcements, sessions, connections ── */
  useEffect(() => {
    if (!userId) return
    const ch = supabase
      .channel('wc27-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => loadUserData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, () => loadContent())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'days' }, () => loadContent())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => loadContent())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'session_resources' }, () => loadContent())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'info_sections' }, () => loadContent())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'connections' }, () => loadUserData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_signups' }, () => loadUserData())
      .subscribe()
    return () => {
      supabase.removeChannel(ch)
    }
  }, [userId, loadContent, loadUserData])

  /* ── direct messages: own loader + realtime (kept separate so a new message
        doesn't reload all content/user data) ── */
  const loadMessages = useCallback(async () => {
    if (!userId) return
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at')
    if (data) setMessages((data as MessageRow[]).map(mapMessage))
  }, [userId])

  useEffect(() => {
    if (!userId) return
    loadMessages()
    const ch = supabase
      .channel('wc27-msgs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => loadMessages())
      .subscribe()
    return () => {
      supabase.removeChannel(ch)
    }
  }, [userId, loadMessages])

  /* ── 1:1 meetings: own loader + realtime ── */
  const loadMeetings = useCallback(async () => {
    if (!userId) return
    const { data } = await supabase
      .from('meetings')
      .select('*')
      .or(`requester_id.eq.${userId},invitee_id.eq.${userId}`)
      .order('created_at')
    if (data) setMeetings((data as MeetingRow[]).map(mapMeeting))
  }, [userId])

  useEffect(() => {
    if (!userId) return
    loadMeetings()
    const ch = supabase
      .channel('wc27-meetings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meetings' }, () => loadMeetings())
      .subscribe()
    return () => {
      supabase.removeChannel(ch)
    }
  }, [userId, loadMeetings])

  /* ── derived ── */
  const attendeeById = useMemo(() => new Map(attendees.map((a) => [a.id, a])), [attendees])

  // incoming connection requests = someone asked to connect with me (pending)
  const incomingRequests = useMemo(() => {
    const ids = new Set(
      connRows.filter((c) => c.target_id === userId && c.requester_id !== userId && c.status === 'pending').map((c) => c.requester_id),
    )
    return attendees.filter((a) => ids.has(a.id))
  }, [connRows, attendees, userId])

  // group my messages into conversations (one per peer)
  const conversations = useMemo<Conversation[]>(() => {
    const byPeer = new Map<string, Message[]>()
    for (const m of messages) {
      const peer = m.senderId === userId ? m.recipientId : m.senderId
      const arr = byPeer.get(peer)
      if (arr) arr.push(m)
      else byPeer.set(peer, [m])
    }
    const out: Conversation[] = []
    for (const [peerId, msgs] of byPeer) {
      msgs.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      const last = msgs[msgs.length - 1]
      const a = attendeeById.get(peerId)
      out.push({
        peerId,
        peerName: a?.name ?? 'A delegate',
        peerInitials: a?.initials ?? '?',
        peerColor: a?.color ?? 'var(--wf-blue-9)',
        peerAvatarUrl: a?.avatarUrl,
        lastBody: last.body,
        lastAt: last.createdAt,
        unread: msgs.filter((m) => m.recipientId === userId && !m.readAt).length,
        fromMe: last.senderId === userId,
      })
    }
    return out.sort((a, b) => b.lastAt.localeCompare(a.lastAt))
  }, [messages, attendeeById, userId])

  const messagesWith = useCallback(
    (peerId: string) =>
      messages
        .filter((m) => (m.senderId === userId && m.recipientId === peerId) || (m.senderId === peerId && m.recipientId === userId))
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [messages, userId],
  )

  // notification feed = unread messages + incoming requests (live, per-user) +
  // global announcements; the bell badge counts all three.
  const notifications = useMemo<AppNotification[]>(() => {
    const msgNotifs: AppNotification[] = conversations
      .filter((c) => c.unread > 0)
      .map((c) => ({
        id: 'msg:' + c.peerId, type: 'message', kind: 'message', peerId: c.peerId,
        title: c.peerName, body: c.lastBody, time: shortTime(c.lastAt), unread: true,
      }))
    const reqNotifs: AppNotification[] = incomingRequests.map((a) => ({
      id: 'req:' + a.id, type: 'connect', kind: 'request', peerId: a.id,
      title: a.name + ' wants to connect', body: [a.role, a.org].filter(Boolean).join(' · '), time: '', unread: true,
    }))
    const mtgNotifs: AppNotification[] = meetings
      .filter((m) => m.inviteeId === userId && m.status === 'pending')
      .map((m) => {
        const a = attendeeById.get(m.requesterId)
        const d = days.find((x) => x.id === m.day)
        return {
          id: 'mtg:' + m.id, type: 'meeting' as const, kind: 'meeting' as const, peerId: m.requesterId,
          title: (a?.name ?? 'A delegate') + ' suggested a meeting',
          body: [[d?.dow, d?.date].filter(Boolean).join(' '), `${m.start}–${m.end}`].filter(Boolean).join(' · '),
          time: '', unread: true,
        }
      })
    const annNotifs: AppNotification[] = announcements.map((n) => ({ ...n, kind: 'announcement', unread: !readSet.has(n.id) }))
    return [...msgNotifs, ...reqNotifs, ...mtgNotifs, ...annNotifs]
  }, [conversations, incomingRequests, meetings, attendeeById, days, userId, announcements, readSet])

  const unread = notifications.filter((n) => n.unread).length
  const top = stack[stack.length - 1]

  const activities: ActivityView[] = useMemo(
    () =>
      activitiesRaw.map((a) => {
        const going = signupCounts[a.id] ?? 0
        const signedUp = mySignups.has(a.id)
        return {
          id: a.id, title: a.title, description: a.description, location: a.location,
          day: a.day_id, start: a.start, end: a.end, capacity: a.capacity,
          going, signedUp, full: a.capacity != null && going >= a.capacity && !signedUp,
        }
      }),
    [activitiesRaw, signupCounts, mySignups],
  )

  const toast = useCallback((msg: string) => {
    setToastMsg(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastMsg(null), 1900)
  }, [])

  /* ── mutators (write-through to Supabase) ── */
  const toggleBookmark = (id: string) => {
    const has = bookmarkSet.has(id)
    setBookmarkSet((prev) => {
      const n = new Set(prev)
      has ? n.delete(id) : n.add(id)
      return n
    })
    if (has) supabase.from('bookmarks').delete().eq('user_id', userId).eq('session_id', id).then()
    else supabase.from('bookmarks').upsert({ user_id: userId, session_id: id }).then()
  }

  const readOne = (id: string) => {
    setReadSet((prev) => new Set(prev).add(id))
    supabase.from('notification_reads').upsert({ user_id: userId, announcement_id: id }).then()
  }
  const markAllRead = () => {
    const rows = announcements.map((a) => ({ user_id: userId, announcement_id: a.id }))
    setReadSet(new Set(announcements.map((a) => a.id)))
    if (rows.length) supabase.from('notification_reads').upsert(rows).then()
    // also clear unread direct messages (they feed the same bell badge)
    if (messages.some((m) => m.recipientId === userId && !m.readAt)) {
      const now = new Date().toISOString()
      setMessages((prev) => prev.map((m) => (m.recipientId === userId && !m.readAt ? { ...m, readAt: now } : m)))
      supabase.from('messages').update({ read_at: now }).eq('recipient_id', userId).is('read_at', null).then()
    }
  }

  // best-effort device push to one delegate (no-op if function/subscription
  // absent). `nav` deep-links the notification tap to a screen via #nav=…
  const pushTo = (toUserId: string, kind: 'connect' | 'message', title: string, body: string, nav?: string) => {
    const url = window.location.origin + import.meta.env.BASE_URL + (nav ? '#nav=' + nav : '')
    supabase.functions
      .invoke('notify-user', { body: { toUserId, kind, title, body, url } })
      .catch(() => {})
  }

  const setConnection = (id: string, status: ConnectStatus) => {
    setAttendees((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)))
    if (status === 'connect') {
      setConnRows((prev) => prev.filter((c) => !(c.requester_id === userId && c.target_id === id)))
      supabase.from('connections').delete().eq('requester_id', userId).eq('target_id', id).then()
    } else {
      setConnRows((prev) => [...prev.filter((c) => !(c.requester_id === userId && c.target_id === id)), { requester_id: userId, target_id: id, status }])
      supabase.from('connections').upsert({ requester_id: userId, target_id: id, status }).then()
      if (status === 'pending') pushTo(id, 'connect', (me.name || 'Someone') + ' wants to connect', 'Open WISEcon27 to view the request.', 'connect')
    }
  }

  const acceptConnection = (id: string) => {
    setConnRows((prev) => prev.map((c) => (c.requester_id === id && c.target_id === userId ? { ...c, status: 'connected' } : c)))
    setAttendees((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'connected' } : a)))
    supabase.from('connections').update({ status: 'connected' }).eq('requester_id', id).eq('target_id', userId).then()
    pushTo(id, 'connect', (me.name || 'Someone') + ' accepted your request', 'You’re now connected — say hello on WISEcon27.', 'conversation:' + userId)
    toast('Connected')
  }

  const declineConnection = (id: string) => {
    setConnRows((prev) => prev.filter((c) => !(c.requester_id === id && c.target_id === userId)))
    setAttendees((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'connect' } : a)))
    supabase.from('connections').delete().eq('requester_id', id).eq('target_id', userId).then()
  }

  const sendMessage = async (peerId: string, body: string) => {
    const text = body.trim()
    if (!text || !userId) return
    const { data, error } = await supabase
      .from('messages')
      .insert({ sender_id: userId, recipient_id: peerId, body: text })
      .select()
      .single()
    if (!error && data) {
      setMessages((prev) => [...prev, mapMessage(data as MessageRow)])
      pushTo(peerId, 'message', me.name || 'New message', text.length > 120 ? text.slice(0, 117) + '…' : text, 'conversation:' + userId)
    } else if (error) {
      toast('Could not send message')
    }
  }

  const markThreadRead = (peerId: string) => {
    // decide from current state, NOT inside the setState updater — updaters run
    // during the next render, so a flag set there is never visible here and the
    // DB write would be skipped (read state then resets on next sign-in)
    const unread = messages.some((m) => m.senderId === peerId && m.recipientId === userId && !m.readAt)
    if (!unread) return
    const now = new Date().toISOString()
    setMessages((prev) =>
      prev.map((m) => (m.senderId === peerId && m.recipientId === userId && !m.readAt ? { ...m, readAt: now } : m)),
    )
    supabase.from('messages').update({ read_at: now }).eq('sender_id', peerId).eq('recipient_id', userId).is('read_at', null).then()
  }

  /* ── 1:1 meetings ── */
  const requestMeeting = async (peerId: string, dayId: string, start: string, end: string, pointId: string, message: string) => {
    const { data, error } = await supabase
      .from('meetings')
      .insert({ requester_id: userId, invitee_id: peerId, day_id: dayId, start, end, point_id: pointId || null, message: message.trim(), status: 'pending' })
      .select()
      .single()
    if (error || !data) {
      toast('Could not send the meeting request')
      return false
    }
    setMeetings((prev) => [...prev, mapMeeting(data as MeetingRow)])
    pushTo(peerId, 'connect', (me.name || 'Someone') + ' suggested a meeting', `${start}–${end} — open WISEcon27 to respond.`, 'meetings')
    return true
  }

  const respondMeeting = (id: string, status: 'accepted' | 'declined') => {
    const m = meetings.find((x) => x.id === id)
    setMeetings((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x)))
    supabase.from('meetings').update({ status }).eq('id', id).then()
    if (m && status === 'accepted') {
      pushTo(m.requesterId, 'connect', (me.name || 'Someone') + ' accepted your meeting', `${m.start}–${m.end} — see My meetings for the spot.`, 'meetings')
      toast('Meeting confirmed')
    }
  }

  const cancelMeeting = (id: string) => {
    setMeetings((prev) => prev.map((x) => (x.id === id ? { ...x, status: 'cancelled' } : x)))
    supabase.from('meetings').update({ status: 'cancelled' }).eq('id', id).then()
  }

  const setMyInterests = (interests: string[]) => {
    setMe((m) => ({ ...m, interests }))
    const mySet = new Set(interests)
    setAttendees((prev) => prev.map((a) => ({ ...a, mutual: a.interests.filter((i) => mySet.has(i)).length })))
  }

  const updateProfile = async (patch: Partial<Me>) => {
    const next = { ...me, ...patch }
    if (patch.name && !patch.initials) next.initials = initialsFrom(patch.name)
    setMe(next)
    await supabase
      .from('profiles')
      .update({
        name: next.name, initials: next.initials, role: next.role, org: next.org, ticket: next.ticket,
      })
      .eq('id', userId)
  }

  const setAvatar = (url: string) => {
    setMe((m) => ({ ...m, avatarUrl: url }))
    supabase.from('profiles').update({ avatar_url: url }).eq('id', userId).then()
  }

  const toggleActivitySignup = (id: string) => {
    const a = activities.find((x) => x.id === id)
    if (!a) return
    if (a.signedUp) {
      setMySignups((prev) => { const n = new Set(prev); n.delete(id); return n })
      setSignupCounts((c) => ({ ...c, [id]: Math.max(0, (c[id] ?? 1) - 1) }))
      supabase.from('activity_signups').delete().eq('activity_id', id).eq('user_id', userId).then()
    } else {
      if (a.full) { toast('That activity is full'); return }
      setMySignups((prev) => new Set(prev).add(id))
      setSignupCounts((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }))
      supabase.from('activity_signups').upsert({ activity_id: id, user_id: userId }).then()
      toast('You’re signed up')
    }
  }

  const submitSessionFeedback = async (sessionId: string, stars: number, tags: string[], comment: string) => {
    setMyFeedback((prev) => ({ ...prev, [sessionId]: { stars, tags, comment } }))
    const { error } = await supabase.from('session_feedback').upsert({ session_id: sessionId, user_id: userId, stars, tags, comment })
    if (error) toast('Could not save your rating — try again')
  }

  const submitSurvey = async (answers: Record<string, unknown>) => {
    const { error } = await supabase.from('survey_responses').upsert({ user_id: userId, answers })
    if (error) {
      toast('Could not submit the survey — try again')
      throw new Error(error.message)
    }
    setSurveyDone(true)
  }

  return {
    tab,
    stack,
    params: top ? top.params : {},
    openSession: (s) => setStack((st) => [...st, { screen: 'session', params: { session: s } }]),
    push: (screen, params) => setStack((st) => [...st, { screen, params: params || {} }]),
    back: () => setStack((st) => st.slice(0, -1)),
    setTab: (t) => {
      setStack([])
      setTabState(t)
    },
    agendaJump,
    openAgendaSearch: (query, day) => {
      setAgendaJump({ query, day })
      setStack([])
      setTabState('agenda')
    },
    consumeAgendaJump: () => setAgendaJump(null),
    loading,
    days,
    speakers,
    sessions,
    sponsors,
    eventInfo,
    infoSections,
    event,
    speakersOf,
    resourcesOf: (sessionId) => resources.filter((r) => r.sessionId === sessionId),
    refreshContent: loadContent,
    userId,
    me,
    isAdmin,
    isStaff,
    updateProfile,
    setMyInterests,
    nameFor: (id) =>
      id === userId ? me.name : attendees.find((a) => a.id === id)?.name || 'A delegate',
    isBookmarked: (id) => bookmarkSet.has(id),
    toggleBookmark,
    notifications,
    unread,
    readOne,
    markAllRead,
    attendees,
    setConnection,
    incomingRequests,
    acceptConnection,
    declineConnection,
    conversations,
    messagesWith,
    sendMessage,
    markThreadRead,
    meetings,
    meetingPoints,
    requestMeeting,
    respondMeeting,
    cancelMeeting,
    activities,
    toggleActivitySignup,
    myFeedback,
    submitSessionFeedback,
    surveyQuestions,
    surveyDone,
    submitSurvey,
    setAvatar,
    toast,
    toastMsg,
  }
}
