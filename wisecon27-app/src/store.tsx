// WISEcon27 — app state: tabs, navigation stack, bookmarks, notifications,
// connections, toast, home variant. Persisted per-device via localStorage.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ATTENDEES, ME, NOTIFICATIONS } from './data'
import type { AppNotification, ConnectStatus, Session, Speaker } from './types'

export type TabId = 'home' | 'agenda' | 'speakers' | 'connect' | 'profile'
export type PushScreen =
  | 'session' | 'speaker' | 'myschedule' | 'notifications' | 'sponsors'
  | 'ticket' | 'feedback' | 'info' | 'settings'
export type HomeVariant = 'classic' | 'cards' | 'bold'

export interface NavParams {
  session?: Session
  speaker?: Speaker
  day?: string
  _fromTab?: boolean
}
interface StackEntry { screen: PushScreen; params: NavParams }

const LS = {
  bookmarks: 'wc27.bookmarks',
  notifs: 'wc27.notifications',
  connections: 'wc27.connections',
  home: 'wc27.homeVariant',
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}
function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage may be unavailable (private mode) — fail silently */
  }
}

export interface AppCtx {
  // nav
  tab: TabId
  stack: StackEntry[]
  params: NavParams
  openSession: (s: Session) => void
  push: (screen: PushScreen, params?: NavParams) => void
  back: () => void
  setTab: (t: TabId) => void
  // bookmarks
  isBookmarked: (id: string) => boolean
  toggleBookmark: (id: string) => void
  // notifications
  notifications: AppNotification[]
  unread: number
  readOne: (id: string) => void
  markAllRead: () => void
  // connections
  connections: Record<string, ConnectStatus>
  setConnection: (id: string, status: ConnectStatus) => void
  // toast
  toast: (msg: string) => void
  toastMsg: string | null
  // home variant
  homeVariant: HomeVariant
  setHomeVariant: (v: HomeVariant) => void
}

export function useAppState(): AppCtx {
  const [tab, setTabState] = useState<TabId>('home')
  const [stack, setStack] = useState<StackEntry[]>([])

  const [bookmarkList, setBookmarkList] = useState<string[]>(() =>
    load(LS.bookmarks, ME.bookmarks),
  )
  const bookmarks = useMemo(() => new Set(bookmarkList), [bookmarkList])

  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    load(
      LS.notifs,
      NOTIFICATIONS.map((n) => ({ ...n })),
    ),
  )

  const [connections, setConnections] = useState<Record<string, ConnectStatus>>(() =>
    load(
      LS.connections,
      Object.fromEntries(ATTENDEES.map((a) => [a.id, a.status])),
    ),
  )

  const [homeVariant, setHomeVariantState] = useState<HomeVariant>(() =>
    load(LS.home, 'bold'),
  )

  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // persist
  useEffect(() => save(LS.bookmarks, bookmarkList), [bookmarkList])
  useEffect(() => save(LS.notifs, notifications), [notifications])
  useEffect(() => save(LS.connections, connections), [connections])
  useEffect(() => save(LS.home, homeVariant), [homeVariant])

  const unread = notifications.filter((n) => n.unread).length

  const toast = useCallback((msg: string) => {
    setToastMsg(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastMsg(null), 1900)
  }, [])

  const top = stack[stack.length - 1]

  const ctx: AppCtx = {
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
    isBookmarked: (id) => bookmarks.has(id),
    toggleBookmark: (id) =>
      setBookmarkList((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
      ),
    notifications,
    unread,
    readOne: (id) =>
      setNotifications((ns) => ns.map((n) => (n.id === id ? { ...n, unread: false } : n))),
    markAllRead: () => setNotifications((ns) => ns.map((n) => ({ ...n, unread: false }))),
    connections,
    setConnection: (id, status) => setConnections((c) => ({ ...c, [id]: status })),
    toast,
    toastMsg,
    homeVariant,
    setHomeVariant: setHomeVariantState,
  }

  return ctx
}
