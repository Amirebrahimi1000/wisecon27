// WISEcon27 — PWA install detection + prompt.
//
// Browsers do not allow an app to install itself silently, so the play is:
//  • Android / desktop Chromium: capture the `beforeinstallprompt` event and
//    offer a one-tap "Install" button.
//  • iOS Safari: no programmatic prompt exists — show the manual
//    "Share → Add to Home Screen" steps instead.
//  • Already installed (standalone): show nothing.
import { useEffect, useReducer, useState } from 'react'
import { T } from './theme'
import { Icon } from './components/Icon'
import { Btn, Press } from './components/primitives'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// The beforeinstallprompt event can fire before React mounts, so we capture it
// at module load and let the hook subscribe to changes.
let deferred: BeforeInstallPromptEvent | null = null
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred = e as BeforeInstallPromptEvent
    emit()
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    emit()
  })
}

export const isStandalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true)

const isIOS = () =>
  typeof navigator !== 'undefined' &&
  (/iphone|ipad|ipod/i.test(navigator.userAgent) ||
    // iPadOS 13+ reports as Mac, so also check for touch
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))

/**
 * Which iOS browser the user is in. Since iOS 16.4, Safari, Chrome (CriOS),
 * Firefox (FxiOS) and Edge (EdgiOS) can all "Add to Home Screen" — only in-app
 * webviews (LinkedIn, Instagram, Gmail, Facebook, etc.) cannot, because they
 * have no Share/menu entry for it.
 */
type IosBrowser = 'safari' | 'chrome' | 'firefox' | 'edge' | 'inapp'
export const iosBrowser = (): IosBrowser | null => {
  if (!isIOS()) return null
  const ua = navigator.userAgent
  // Known in-app webviews that can't add to the Home Screen.
  if (/FBAN|FBAV|FB_IAB|Instagram|LinkedInApp|Snapchat|Twitter|Pinterest|MicroMessenger|Line\//i.test(ua)) return 'inapp'
  if (/CriOS/.test(ua)) return 'chrome'
  if (/FxiOS/.test(ua)) return 'firefox'
  if (/EdgiOS/.test(ua)) return 'edge'
  if (/Safari/.test(ua) && /Version\//.test(ua)) return 'safari'
  // iOS with no browser token and no Safari token → generic WKWebView shell.
  if (!/Safari/.test(ua)) return 'inapp'
  return 'safari'
}

/** Where the Share button lives + how to reach it, per iOS browser. */
const IOS_SHARE_HINT: Record<Exclude<IosBrowser, 'inapp'>, { step1: string; toolbar: string; down: boolean }> = {
  safari: { step1: "Tap the Share icon in Safari's toolbar", toolbar: "The Share button is at the bottom in Safari", down: true },
  chrome: { step1: 'Tap the Share icon (top-right) in Chrome', toolbar: 'The Share button is at the top in Chrome', down: false },
  edge: { step1: 'Tap the menu (•••) in Edge', toolbar: 'The menu is at the bottom in Edge', down: true },
  firefox: { step1: 'Tap the menu (•••) in Firefox', toolbar: 'The menu is at the bottom in Firefox', down: true },
}

/** Open the current page in Safari from inside an in-app browser/webview. */
function OpenInSafari() {
  const href = typeof window !== 'undefined' ? 'x-safari-' + window.location.href : '#'
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontFamily: T.sig, fontSize: 13.5, color: T.body, lineHeight: 1.5 }}>
        You're in an in-app browser, which can't add apps to the Home Screen. Open this page in <b style={{ color: T.ink }}>Safari</b> or <b style={{ color: T.ink }}>Chrome</b> to install.
      </div>
      <a
        href={href}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 48,
          marginTop: 14,
          borderRadius: 'var(--radius-2)',
          background: T.green9,
          color: '#fff',
          fontFamily: T.sig,
          fontWeight: 600,
          fontSize: 16,
          textDecoration: 'none',
        }}
      >
        Open in Safari
      </a>
      <div style={{ fontFamily: T.sig, fontSize: 12, color: T.muted, marginTop: 10, lineHeight: 1.5, textAlign: 'center' }}>
        If nothing happens, copy this page's link and paste it into Safari or Chrome.
      </div>
    </div>
  )
}

type InstallMode = 'installed' | 'android' | 'ios' | 'other'

export function useInstall() {
  const [, force] = useReducer((x) => x + 1, 0)
  useEffect(() => {
    listeners.add(force)
    return () => {
      listeners.delete(force)
    }
  }, [])

  const standalone = isStandalone()
  const canPrompt = !!deferred
  const mode: InstallMode = standalone ? 'installed' : canPrompt ? 'android' : isIOS() ? 'ios' : 'other'

  const promptInstall = async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    if (!deferred) return 'unavailable'
    await deferred.prompt()
    const { outcome } = await deferred.userChoice
    deferred = null
    emit()
    return outcome
  }

  return { mode, canPrompt, promptInstall, standalone }
}

/**
 * Branded card that nudges attendees to install the app. Renders nothing when
 * the app is already running as an installed PWA.
 */
export function InstallCard({ compact = false }: { compact?: boolean }) {
  const { mode, promptInstall } = useInstall()
  const [busy, setBusy] = useState(false)

  if (mode === 'installed') return null

  const card: React.CSSProperties = {
    background: 'var(--wf-surface)',
    borderRadius: 'var(--radius-4)',
    padding: compact ? '14px 16px' : '18px',
    boxShadow: 'inset 0 0 0 1px var(--wf-grey-6)',
  }
  const titleRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10 }
  const badge: React.CSSProperties = {
    width: 38,
    height: 38,
    borderRadius: 10,
    background: T.green1,
    color: T.green10,
    display: 'grid',
    placeItems: 'center',
    flexShrink: 0,
  }
  const title: React.CSSProperties = { fontFamily: T.sig, fontWeight: 700, fontSize: 15.5, color: T.ink }
  const sub: React.CSSProperties = { fontFamily: T.sig, fontSize: 13, color: T.muted, marginTop: 2, lineHeight: 1.45 }

  // Android / desktop Chromium — one-tap install.
  if (mode === 'android') {
    return (
      <div style={card}>
        <div style={titleRow}>
          <div style={badge}>
            <Icon name="download" size={20} />
          </div>
          <div>
            <div style={title}>Install the WISEcon27 app</div>
            <div style={sub}>Add it to your home screen for the full conference experience.</div>
          </div>
        </div>
        <Btn
          kind="primary"
          full
          size="lg"
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            await promptInstall()
            setBusy(false)
          }}
          style={{ marginTop: 14 }}
        >
          {busy ? 'Installing…' : 'Install app'}
        </Btn>
      </div>
    )
  }

  // iOS in-app webview (LinkedIn, Instagram, …) — can't install; send to Safari.
  if (mode === 'ios' && iosBrowser() === 'inapp') {
    return (
      <div style={card}>
        <div style={titleRow}>
          <div style={badge}>
            <Icon name="share" size={20} />
          </div>
          <div>
            <div style={title}>Open in a browser to install</div>
            <div style={sub}>Adding to the Home Screen doesn't work inside in-app browsers.</div>
          </div>
        </div>
        <OpenInSafari />
      </div>
    )
  }

  // iOS Safari / Chrome / Firefox / Edge — manual Add to Home Screen.
  if (mode === 'ios') {
    const hint = IOS_SHARE_HINT[(iosBrowser() ?? 'safari') as Exclude<IosBrowser, 'inapp'>]
    return (
      <div style={card}>
        <div style={titleRow}>
          <div style={badge}>
            <Icon name="share" size={20} />
          </div>
          <div>
            <div style={title}>Add WISEcon27 to your Home Screen</div>
            <div style={sub}>Install it as an app so your sign-in stays put and you get the full-screen experience.</div>
          </div>
        </div>
        <ol style={{ margin: '14px 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: 10 }}>
          {[
            <>{hint.step1} <Icon name="share" size={14} style={{ verticalAlign: '-2px', color: T.green10 }} /></>,
            <>Choose <b style={{ color: T.ink }}>Add to Home Screen</b> <Icon name="plus" size={14} style={{ verticalAlign: '-2px', color: T.green10 }} /></>,
            <>Open <b style={{ color: T.ink }}>WISEcon27</b> from your home screen and sign in there</>,
          ].map((step, i) => (
            <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span
                style={{
                  flexShrink: 0,
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: T.green10,
                  color: '#fff',
                  fontFamily: T.onest,
                  fontWeight: 700,
                  fontSize: 12,
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                {i + 1}
              </span>
              <span style={{ fontFamily: T.sig, fontSize: 13.5, color: T.body, lineHeight: 1.5 }}>{step}</span>
            </li>
          ))}
        </ol>
      </div>
    )
  }

  // Desktop / other browsers — point them to their phone.
  return (
    <div style={{ ...card, display: 'flex', gap: 10, alignItems: 'center' }}>
      <div style={badge}>
        <Icon name="qr" size={20} />
      </div>
      <div>
        <div style={title}>Best on your phone</div>
        <div style={sub}>Open this link on your phone to install WISEcon27 as an app.</div>
      </div>
    </div>
  )
}

/**
 * Auto-showing first-visit install sheet. Pops up once on phones (not desktop)
 * when the app is not yet installed: a one-tap Install button on Android, and
 * an animated "tap Share → Add to Home Screen" guide on iOS. Remembers that it
 * has been shown so it does not nag on every visit.
 */
export function InstallSheet() {
  const { mode, promptInstall } = useInstall()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  // Auto-open shortly after load — only on phones, only if not seen/installed.
  useEffect(() => {
    if (mode !== 'ios' && mode !== 'android') return
    let seen = false
    try {
      seen = localStorage.getItem('wc27-install-sheet-seen') === '1'
    } catch {
      /* ignore */
    }
    if (seen) return
    const t = setTimeout(() => setOpen(true), 1200)
    return () => clearTimeout(t)
  }, [mode])

  // Close automatically if it gets installed while open.
  useEffect(() => {
    if (mode === 'installed') setOpen(false)
  }, [mode])

  if (!open || mode === 'installed' || mode === 'other') return null

  const close = () => {
    setOpen(false)
    try {
      localStorage.setItem('wc27-install-sheet-seen', '1')
    } catch {
      /* ignore */
    }
  }

  return (
    <div
      onClick={close}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 120,
        background: 'rgba(10,14,4,0.55)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
    >
      <div
        className="wc-sheet-up"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--wf-surface)',
          borderRadius: '22px 22px 0 0',
          padding: '20px 20px 26px',
          boxShadow: '0 -16px 40px rgba(0,0,0,0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
          <img
            src={import.meta.env.BASE_URL + 'apple-touch-icon.png'}
            alt=""
            width={52}
            height={52}
            style={{ borderRadius: 12, flexShrink: 0 }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 17, color: T.ink }}>Install the WISEcon27 app</div>
            <div style={{ fontFamily: T.sig, fontSize: 13, color: T.muted, marginTop: 2, lineHeight: 1.4 }}>
              Get a home-screen icon, full-screen mode and event notifications.
            </div>
          </div>
          <Press onClick={close} style={{ color: T.muted, flexShrink: 0, alignSelf: 'flex-start' }}>
            <Icon name="close" size={20} />
          </Press>
        </div>

        {mode === 'android' ? (
          <>
            <Btn
              kind="primary"
              full
              size="lg"
              disabled={busy}
              onClick={async () => {
                setBusy(true)
                const outcome = await promptInstall()
                setBusy(false)
                if (outcome !== 'dismissed') close()
              }}
              style={{ marginTop: 18 }}
            >
              {busy ? 'Installing…' : 'Install app'}
            </Btn>
            <Press
              onClick={close}
              style={{ display: 'block', textAlign: 'center', marginTop: 12, fontFamily: T.sig, fontWeight: 600, fontSize: 13.5, color: T.muted }}
            >
              Maybe later
            </Press>
          </>
        ) : iosBrowser() === 'inapp' ? (
          <OpenInSafari />
        ) : (
          <>
            <ol style={{ margin: '18px 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: 12 }}>
              {[
                <>{IOS_SHARE_HINT[(iosBrowser() ?? 'safari') as Exclude<IosBrowser, 'inapp'>].step1} <Icon name="share" size={15} style={{ verticalAlign: '-2px', color: T.green10 }} /></>,
                <>Scroll and choose <b style={{ color: T.ink }}>Add to Home Screen</b> <Icon name="plus" size={15} style={{ verticalAlign: '-2px', color: T.green10 }} /></>,
                <>Open <b style={{ color: T.ink }}>WISEcon27</b> from your home screen — and sign in there</>,
              ].map((step, i) => (
                <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span
                    style={{
                      flexShrink: 0,
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: T.green10,
                      color: '#fff',
                      fontFamily: T.onest,
                      fontWeight: 700,
                      fontSize: 12.5,
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    {i + 1}
                  </span>
                  <span style={{ fontFamily: T.sig, fontSize: 14, color: T.body, lineHeight: 1.5 }}>{step}</span>
                </li>
              ))}
            </ol>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                marginTop: 18,
                color: T.green10,
              }}
            >
              <span style={{ fontFamily: T.sig, fontWeight: 600, fontSize: 12.5, color: T.muted }}>
                {IOS_SHARE_HINT[(iosBrowser() ?? 'safari') as Exclude<IosBrowser, 'inapp'>].toolbar}
              </span>
              <span className="wc-bounce-y" style={{ display: 'inline-flex' }}>
                <Icon name={IOS_SHARE_HINT[(iosBrowser() ?? 'safari') as Exclude<IosBrowser, 'inapp'>].down ? 'chevronDown' : 'arrowUp'} size={26} />
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/**
 * Slim, dismissible banner for use inside the signed-in app. Stays hidden once
 * dismissed (per browser) and when already installed.
 */
export function InstallBanner() {
  const { mode, promptInstall } = useInstall()
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem('wc27-install-dismissed') === '1'
    } catch {
      return false
    }
  })

  if (dismissed || mode === 'installed' || mode === 'other') return null

  const dismiss = () => {
    setDismissed(true)
    try {
      localStorage.setItem('wc27-install-dismissed', '1')
    } catch {
      /* ignore */
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: T.green1,
        borderRadius: 'var(--radius-2)',
        padding: '10px 12px',
        margin: '0 0 12px',
      }}
    >
      <Icon name={mode === 'ios' ? 'share' : 'download'} size={18} style={{ color: T.green10, flexShrink: 0 }} />
      <div style={{ flex: 1, fontFamily: T.sig, fontSize: 13, color: T.ink, lineHeight: 1.4 }}>
        {mode === 'ios' ? (
          <>Add to Home Screen: tap <b>Share</b> → <b>Add to Home Screen</b>.</>
        ) : (
          <>Install WISEcon27 as an app for the full experience.</>
        )}
      </div>
      {mode === 'android' && (
        <Press
          onClick={() => promptInstall()}
          style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 13, color: T.green10, whiteSpace: 'nowrap' }}
        >
          Install
        </Press>
      )}
      <Press onClick={dismiss} style={{ color: T.muted, flexShrink: 0 }}>
        <Icon name="close" size={16} />
      </Press>
    </div>
  )
}
