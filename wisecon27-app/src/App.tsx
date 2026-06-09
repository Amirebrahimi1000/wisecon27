// WISEcon27 — app shell: tab bar, navigation stack, toast.
// The iOS bezel, desktop stage toolbar, "Compare homes" mode and Tweaks panel
// from the prototype are intentionally NOT ported (prototype-only chrome).
import { useEffect, useRef, useState } from 'react'
import { T, TABBAR_H } from './theme'
import { useAppState, type AppCtx, type PushScreen, type TabId } from './appState'
import { useAuth } from './auth'
import { isSupabaseConfigured } from './lib/supabase'
import { Icon, type IconName } from './components/Icon'
import { Press } from './components/primitives'
import { InstallSheet } from './install'
import { NotifyPrompt } from './NotifyPrompt'
import { SignIn } from './screens/SignIn'
import { ProfileSetup } from './screens/ProfileSetup'

import { Home } from './screens/Home'
import { Agenda } from './screens/Agenda'
import { Speakers } from './screens/Speakers'
import { Connect } from './screens/Connect'
import { Profile } from './screens/Profile'
import { SessionDetail } from './screens/SessionDetail'
import { SpeakerProfile } from './screens/SpeakerProfile'
import { MySchedule } from './screens/MySchedule'
import { Notifications } from './screens/Notifications'
import { Sponsors } from './screens/Sponsors'
import { Ticket } from './screens/Ticket'
import { Feedback } from './screens/Feedback'
import { Info } from './screens/Info'
import { Settings } from './screens/Settings'
import { Admin } from './screens/Admin'
import { Activities } from './screens/Activities'
import { Survey } from './screens/Survey'
import { ExhibitorDetail } from './screens/ExhibitorDetail'
import { Conversation } from './screens/Conversation'

const TABS: { id: TabId; icon: IconName; label: string }[] = [
  { id: 'home', icon: 'home', label: 'Home' },
  { id: 'agenda', icon: 'calendar', label: 'Agenda' },
  { id: 'speakers', icon: 'speakers', label: 'Speakers' },
  { id: 'connect', icon: 'connect', label: 'Connect' },
  { id: 'profile', icon: 'user', label: 'Profile' },
]

const PUSH_SCREENS: Record<PushScreen, (p: { ctx: AppCtx }) => JSX.Element> = {
  session: SessionDetail,
  speaker: SpeakerProfile,
  myschedule: MySchedule,
  notifications: Notifications,
  sponsors: Sponsors,
  ticket: Ticket,
  feedback: Feedback,
  info: Info,
  settings: Settings,
  admin: Admin,
  activities: Activities,
  survey: Survey,
  exhibitor: ExhibitorDetail,
  conversation: Conversation,
}

const TAB_SCREENS: Record<Exclude<TabId, 'home'>, (p: { ctx: AppCtx }) => JSX.Element> = {
  agenda: Agenda,
  speakers: Speakers,
  connect: Connect,
  profile: Profile,
}

function BottomNav({ active, onSelect, unread }: { active: TabId; onSelect: (t: TabId) => void; unread: number }) {
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 40, paddingBottom: 22, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', borderTop: '1px solid ' + T.line, display: 'flex' }}>
      {TABS.map((t) => {
        const on = active === t.id
        return (
          <Press key={t.id} onClick={() => onSelect(t.id)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '9px 0 4px', position: 'relative' }}>
            <div style={{ position: 'relative', color: on ? T.green9 : T.muted }}>
              <Icon name={t.icon} size={25} stroke={on ? 2.2 : 1.8} />
              {t.id === 'profile' && unread > 0 && (
                <span style={{ position: 'absolute', top: -1, right: -3, width: 8, height: 8, borderRadius: 999, background: 'var(--wf-tomato-9)', boxShadow: '0 0 0 2px #fff' }} />
              )}
            </div>
            <span style={{ fontFamily: T.sig, fontWeight: on ? 700 : 500, fontSize: 10.5, color: on ? T.green10 : T.muted, letterSpacing: '0.01em' }}>{t.label}</span>
          </Press>
        )
      })}
    </div>
  )
}

function Toast({ msg }: { msg: string | null }) {
  if (!msg) return null
  return (
    <div
      className="wc-toast"
      style={{ position: 'absolute', bottom: TABBAR_H + 14, left: '50%', transform: 'translateX(-50%)', zIndex: 80, background: 'rgba(17,17,17,0.94)', color: '#fff', fontFamily: T.sig, fontWeight: 500, fontSize: 13.5, padding: '10px 18px', borderRadius: 999, boxShadow: '0 8px 24px rgba(0,0,0,0.25)', whiteSpace: 'nowrap', maxWidth: '86%', overflow: 'hidden', textOverflow: 'ellipsis' }}
    >
      {msg}
    </div>
  )
}

const PULL_TRIGGER = 64 // px (after resistance) to trigger a refresh

function AuthedApp() {
  const ctx = useAppState()
  const scrollRef = useRef<HTMLDivElement>(null)

  // pull-to-refresh: drag down at the top of any screen to reload the app
  const pullStart = useRef<number | null>(null)
  const [pull, setPull] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const onTouchStart = (e: React.TouchEvent) => {
    pullStart.current = (scrollRef.current?.scrollTop ?? 0) <= 0 ? e.touches[0].clientY : null
  }
  const onTouchMove = (e: React.TouchEvent) => {
    if (pullStart.current == null || refreshing) return
    if ((scrollRef.current?.scrollTop ?? 0) > 0) { pullStart.current = null; setPull(0); return }
    const dy = e.touches[0].clientY - pullStart.current
    setPull(dy > 0 ? Math.min(dy * 0.5, 90) : 0)
  }
  const onTouchEnd = () => {
    if (pull >= PULL_TRIGGER) {
      setRefreshing(true)
      setPull(PULL_TRIGGER)
      window.location.reload()
    } else {
      setPull(0)
    }
    pullStart.current = null
  }

  const top = ctx.stack[ctx.stack.length - 1] || null
  const screenKey = ctx.tab + '·' + ctx.stack.length + '·' + (top ? top.screen : '')

  // reset scroll on every navigation
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }, [screenKey])

  // map the hardware/browser Back button to popping the nav stack
  const depth = ctx.stack.length
  useEffect(() => {
    window.history.pushState({ depth }, '')
    const onPop = () => {
      if (ctx.stack.length > 0) ctx.back()
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depth])

  let ScreenEl: ((p: { ctx: AppCtx }) => JSX.Element) | null = null
  if (top) ScreenEl = PUSH_SCREENS[top.screen]
  else if (ctx.tab === 'home') ScreenEl = Home
  else ScreenEl = TAB_SCREENS[ctx.tab]

  // gate on live content + first-time profile completion (after all hooks)
  if (ctx.loading) return <Splash />
  if (!ctx.me.name.trim()) return <ProfileSetup ctx={ctx} />

  return (
    <div style={{ height: '100%', position: 'relative', background: '#fff', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* pull-to-refresh indicator */}
      {(pull > 0 || refreshing) && (
        <div style={{ position: 'absolute', top: 0, left: '50%', zIndex: 50, transform: `translate(-50%, ${(refreshing ? PULL_TRIGGER : pull) - 36}px)`, transition: pullStart.current == null ? 'transform .25s var(--ease-out)' : 'none', pointerEvents: 'none' }}>
          <div
            className={refreshing ? 'wc-spin' : ''}
            style={{ width: 30, height: 30, borderRadius: '50%', background: '#fff', boxShadow: 'var(--shadow-card)', border: '2.5px solid var(--wf-grey-5)', borderTopColor: 'var(--wf-green-9)', transform: refreshing ? undefined : `rotate(${pull * 4}deg)` }}
          />
        </div>
      )}
      <div
        ref={scrollRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch', transform: pull ? `translateY(${pull}px)` : undefined, transition: pullStart.current == null ? 'transform .25s var(--ease-out)' : 'none' }}
      >
        <div key={screenKey} className="wc-screen">
          {ScreenEl ? <ScreenEl ctx={ctx} /> : null}
        </div>
      </div>
      <Toast msg={ctx.toastMsg} />
      <BottomNav active={ctx.tab} onSelect={ctx.setTab} unread={ctx.unread} />
      <NotifyPrompt userId={ctx.userId} onToast={ctx.toast} />
    </div>
  )
}

/** Brief splash while we check for an existing session. */
function Splash() {
  return (
    <div style={{ height: '100%', display: 'grid', placeItems: 'center', background: 'linear-gradient(160deg, var(--wf-green-8) 0%, var(--wf-green-10) 55%, var(--wf-green-12) 130%)' }}>
      <img src={import.meta.env.BASE_URL + 'logo-mark.svg'} alt="WISEcon27" width="72" style={{ filter: 'brightness(0) invert(1)', opacity: 0.92 }} />
    </div>
  )
}

/** Shown only if the Supabase env vars are missing (e.g. secrets not set). */
function SetupNotice() {
  return (
    <div style={{ height: '100%', display: 'grid', placeItems: 'center', padding: 28, textAlign: 'center', background: 'var(--wf-grey-2)' }}>
      <div>
        <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 19, color: T.ink }}>Backend not configured</div>
        <p style={{ fontFamily: T.sig, fontSize: 14.5, color: T.muted, marginTop: 8, lineHeight: 1.55 }}>
          Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> (in
          <code> .env.local</code> for dev, or as GitHub Actions secrets for the deployed build).
        </p>
      </div>
    </div>
  )
}

export default function App() {
  const { session, loading } = useAuth()
  let content
  if (!isSupabaseConfigured) content = <SetupNotice />
  else if (loading) content = <Splash />
  else if (!session) content = <SignIn />
  else content = <AuthedApp />
  return (
    <div className="wc-stage">
      <div className="wc-device">
        {content}
        <InstallSheet />
      </div>
    </div>
  )
}
