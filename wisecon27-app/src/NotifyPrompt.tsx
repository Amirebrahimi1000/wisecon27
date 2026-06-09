// WISEcon27 — proactive "turn on notifications?" opt-in.
// Shown once after sign-in when the device can do push and permission hasn't
// been decided yet. Tapping Allow triggers the OS permission dialog and
// registers the push subscription via enablePush(). Browsers require a user
// gesture to request notification permission, which the Allow button provides.
import { useEffect, useState } from 'react'
import { T } from './theme'
import { Icon } from './components/Icon'
import { Btn, Press } from './components/primitives'
import { enablePush, pushPermission, pushSupported } from './push'
import { isStandalone } from './install'

const ASKED_KEY = 'wc27-notify-asked'

export function NotifyPrompt({ userId, onToast }: { userId: string; onToast: (msg: string) => void }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!userId) return
    // device can't do push, or the user already granted/blocked it → nothing to ask
    if (!pushSupported() || pushPermission() !== 'default') return
    let asked = false
    try {
      asked = localStorage.getItem(ASKED_KEY) === '1'
    } catch {
      /* ignore */
    }
    if (asked) return
    // don't stack on top of the install prompt: wait until the app is installed
    // or the install sheet has already been seen this device
    let installSeen = false
    try {
      installSeen = localStorage.getItem('wc27-install-sheet-seen') === '1'
    } catch {
      /* ignore */
    }
    if (!isStandalone() && !installSeen) return
    const t = setTimeout(() => setOpen(true), 2000)
    return () => clearTimeout(t)
  }, [userId])

  if (!open) return null

  const remember = () => {
    try {
      localStorage.setItem(ASKED_KEY, '1')
    } catch {
      /* ignore */
    }
  }
  const dismiss = () => {
    remember()
    setOpen(false)
  }
  const allow = async () => {
    setBusy(true)
    const err = await enablePush(userId)
    setBusy(false)
    remember()
    setOpen(false)
    onToast(err ? err : 'Notifications are on 🔔')
  }

  return (
    <div
      onClick={dismiss}
      style={{ position: 'absolute', inset: 0, zIndex: 130, background: 'rgba(10,14,4,0.55)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
    >
      <div
        className="wc-sheet-up"
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: '22px 22px 0 0', padding: '22px 20px 26px', boxShadow: '0 -16px 40px rgba(0,0,0,0.25)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: T.green1, color: T.green10, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <Icon name="bell" size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 17, color: T.ink }}>Turn on notifications?</div>
            <div style={{ fontFamily: T.sig, fontSize: 13, color: T.muted, marginTop: 2, lineHeight: 1.4 }}>
              Get connection requests, new messages, session reminders and live announcements — even when the app is closed.
            </div>
          </div>
        </div>
        <Btn kind="primary" full size="lg" icon="bell" disabled={busy} onClick={allow} style={{ marginTop: 18 }}>
          {busy ? 'Enabling…' : 'Allow notifications'}
        </Btn>
        <Press onClick={dismiss} style={{ display: 'block', textAlign: 'center', marginTop: 12, fontFamily: T.sig, fontWeight: 600, fontSize: 13.5, color: T.muted }}>
          Not now
        </Press>
      </div>
    </div>
  )
}
