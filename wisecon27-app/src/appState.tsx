// WISEcon27 — app state backed by Supabase.
// Loads content (days/speakers/sessions/sponsors/event-info/announcements),
// the signed-in user's profile, bookmarks and connections; exposes nav, toast,
// and mutators that write through to the database. Realtime keeps announcements,
// sessions and connections in sync across devices.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from './lib/supabase'
import { useAuth } from './auth'
import type {
  AppNotification, Attendee, ConnectStatus, Day, Me, Session, Speaker, Sponsor,
} from './types'

export type TabId = 'home' | 'agenda' | 'speakers' | 'connect' | 'profile'
export type PushScreen =
  | 'session' | 'speaker' | 'myschedule' | 'notifications' | 'sponsors'
  | 'ticket' | 'feedback' | 'info' | 'settings' | 'admin'
export type HomeVariant = 'classic' | 'cards' | 'bold'

export interface EventInfoItem { id: string; icon: string; label: string; detail: string }

export interface NavParams {
  session?: Session
  speaker?: Speaker
  day?: string
  _fromTab?: boolean
}
interface StackEntry { screen: PushScreen; params: NavParams }

const HOME_KEY = 'wc27.homeVariant'

export interface AppCtx {
  // nav
  tab: TabId
  stack: StackEntry[]
  params: NavParams
  openSession: (s: Session) => void
  push: (screen: PushScreen, params?: NavParams) => void
  back: () => void
  setTab: (t: TabId) => void
  // content (live from Supabase)
  loading: boolean
  days: Day[]
  speakers: Speaker[]
  sessions: Session[]
  sponsors: Sponsor[]
  eventInfo: EventInfoItem[]
  speakersOf: (s: Session) => Speaker[]
  refreshContent: () => Promise<void>
  // identity
  userId: string
  me: Me
  isAdmin: boolean
  updateProfile: (patch: Partial<Me>) => Promise<void>
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
  // toast
  toast: (msg: string) => void
  toastMsg: string | null
  // home variant
  homeVariant: HomeVariant
  setHomeVariant: (v: HomeVariant) => void
}

/* ── row → app-type mappers ────────────────────────────────────── */
interface SessionRow {
  id: string; day_id: string; start: string; end: string; title: string
  type: Session['type']; track: Session['track']; room: string; desc: string
  tags: string[] | null; going: number; capacity: number | null
  session_speakers?: { speaker_id: string; ord: number }[]
}
const mapSession = (r: SessionRow): Session => ({
  id: r.id, day: r.day_id, start: r.start, end: r.end, title: r.title, type: r.type,
  track: r.track, room: r.room, desc: r.desc, tags: r.tags ?? [], going: r.going,
  capacity: r.capacity ?? undefined,
  speakers: (r.session_speakers ?? []).slice().sort((a, b) => a.ord - b.ord).map((x) => x.speaker_id),
})

interface ProfileRow {
  id: string; name: string; initials: string; role: string; org: string; color: string
  ticket: string; badge_id: string; interests: string[]; is_admin: boolean
}
const mapProfile = (r: ProfileRow): Me => ({
  name: r.name, initials: r.initials, role: r.role, org: r.org, color: r.color,
  ticket: r.ticket, badgeId: r.badge_id, bookmarks: [],
})

const initialsFrom = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || '?'

const shortTime = (iso: string) => {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const EMPTY_ME: Me = {
  name: '', initials: '', role: '', org: '', color: 'var(--wf-blue-9)',
  ticket: 'Full delegate', badgeId: '', bookmarks: [],
}

export function useAppState(): AppCtx {
  const { session } = useAuth()
  const userId = session?.user.id ?? ''

  // nav
  const [tab, setTabState] = useState<TabId>('home')
  const [stack, setStack] = useState<StackEntry[]>([])

  // content
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState<Day[]>([])
  const [speakers, setSpeakers] = useState<Speaker[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [eventInfo, setEventInfo] = useState<EventInfoItem[]>([])

  // identity / user data
  const [me, setMe] = useState<Me>(EMPTY_ME)
  const [isAdmin, setIsAdmin] = useState(false)
  const [bookmarkSet, setBookmarkSet] = useState<Set<string>>(new Set())
  const [announcements, setAnnouncements] = useState<AppNotification[]>([])
  const [readSet, setReadSet] = useState<Set<string>>(new Set())
  const [attendees, setAttendees] = useState<Attendee[]>([])

  // ui
  const [homeVariant, setHomeVariantState] = useState<HomeVariant>(() => {
    const raw = localStorage.getItem(HOME_KEY)
    if (!raw) return 'bold'
    // tolerate the old JSON-quoted format ("\"bold\"") as well as a raw value
    const v = (raw.startsWith('"') ? raw.replace(/^"|"$/g, '') : raw) as HomeVariant
    return v === 'bold' || v === 'cards' || v === 'classic' ? v : 'bold'
  })
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const speakerById = useMemo(() => new Map(speakers.map((s) => [s.id, s])), [speakers])
  const speakersOf = useCallback(
    (s: Session) => (s.speakers || []).map((id) => speakerById.get(id)).filter(Boolean) as Speaker[],
    [speakerById],
  )

  /* ── load all content + user data ── */
  const loadContent = useCallback(async () => {
    const [d, sp, se, so, ei] = await Promise.all([
      supabase.from('days').select('*').order('sort'),
      supabase.from('speakers').select('*').order('sort'),
      supabase.from('sessions').select('*, session_speakers(speaker_id, ord)'),
      supabase.from('sponsors').select('*').order('sort'),
      supabase.from('event_info').select('*').order('sort'),
    ])
    if (d.data) setDays(d.data as Day[])
    if (sp.data) setSpeakers(sp.data as Speaker[])
    if (se.data) setSessions((se.data as SessionRow[]).map(mapSession))
    if (so.data) setSponsors(so.data as Sponsor[])
    if (ei.data) setEventInfo(ei.data as EventInfoItem[])
  }, [])

  const loadUserData = useCallback(async () => {
    if (!userId) return
    const [prof, bm, ann, reads, profs, conns] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('bookmarks').select('session_id').eq('user_id', userId),
      supabase.from('announcements').select('*').order('created_at', { ascending: false }),
      supabase.from('notification_reads').select('announcement_id').eq('user_id', userId),
      supabase.from('profiles').select('*'),
      supabase.from('connections').select('*'),
    ])
    if (prof.data) {
      const p = prof.data as ProfileRow
      setMe(mapProfile(p))
      setIsAdmin(p.is_admin)
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
      const connRows = (conns.data ?? []) as { requester_id: string; target_id: string; status: ConnectStatus }[]
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
            color: p.color, interests: p.interests,
            mutual: p.interests.filter((i) => myInterests.has(i)).length,
            status: statusFor(p.id),
          })),
      )
    }
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'connections' }, () => loadUserData())
      .subscribe()
    return () => {
      supabase.removeChannel(ch)
    }
  }, [userId, loadContent, loadUserData])

  /* ── derived ── */
  const notifications = useMemo(
    () => announcements.map((n) => ({ ...n, unread: !readSet.has(n.id) })),
    [announcements, readSet],
  )
  const unread = notifications.filter((n) => n.unread).length
  const top = stack[stack.length - 1]

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
  }

  const setConnection = (id: string, status: ConnectStatus) => {
    setAttendees((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)))
    if (status === 'connect') {
      supabase.from('connections').delete().eq('requester_id', userId).eq('target_id', id).then()
    } else {
      supabase.from('connections').upsert({ requester_id: userId, target_id: id, status }).then()
    }
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

  const setHomeVariant = (v: HomeVariant) => {
    setHomeVariantState(v)
    localStorage.setItem(HOME_KEY, v)
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
    loading,
    days,
    speakers,
    sessions,
    sponsors,
    eventInfo,
    speakersOf,
    refreshContent: loadContent,
    userId,
    me,
    isAdmin,
    updateProfile,
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
    toast,
    toastMsg,
    homeVariant,
    setHomeVariant,
  }
}
