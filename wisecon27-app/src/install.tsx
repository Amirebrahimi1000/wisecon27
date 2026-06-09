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
    background: '#fff',
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

  // iOS Safari — manual Add to Home Screen.
  if (mode === 'ios') {
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
            <>Tap the <b style={{ color: T.ink }}>Share</b> icon <Icon name="share" size={14} style={{ verticalAlign: '-2px', color: T.green10 }} /> in Safari's toolbar</>,
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
        borderRadius: 'var(--radius-3)',
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
