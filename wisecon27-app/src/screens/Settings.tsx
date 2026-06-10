// WISEcon27 — Settings: push notifications + appearance (light/dark).
import { useEffect, useState } from 'react'
import { T, TABBAR_H } from '../theme'
import type { AppCtx } from '../appState'
import { Icon } from '../components/Icon'
import { AppHeader, Btn, Eyebrow, Press } from '../components/primitives'
import { enablePush, isPushEnabled, pushSupported } from '../push'
import { getMode, setMode, type AppMode } from '../mode'

const MODES: { id: AppMode; name: string; desc: string }[] = [
  { id: 'system', name: 'Automatic', desc: 'Follows your device’s light/dark setting' },
  { id: 'light', name: 'Light', desc: 'Always light' },
  { id: 'dark', name: 'Dark', desc: 'Always dark — easier on the eyes in dim rooms' },
]

export function Settings({ ctx }: { ctx: AppCtx }) {
  const [pushOn, setPushOn] = useState(false)
  const [busy, setBusy] = useState(false)
  const [mode, setModeState] = useState<AppMode>(() => getMode())
  useEffect(() => {
    isPushEnabled().then(setPushOn)
  }, [])
  const turnOnPush = async () => {
    setBusy(true)
    const err = await enablePush(ctx.userId)
    setBusy(false)
    if (err) ctx.toast(err)
    else {
      setPushOn(true)
      ctx.toast('Push notifications enabled')
    }
  }
  const pick = (m: AppMode) => {
    setModeState(m)
    setMode(m)
  }
  return (
    <div>
      <AppHeader title="Settings" onBack={ctx.back} />
      <div style={{ padding: '16px 16px ' + (TABBAR_H + 16) + 'px' }}>
        {/* push notifications */}
        <Eyebrow style={{ marginBottom: 10, paddingLeft: 2 }}>Notifications</Eyebrow>
        <div style={{ background: 'var(--wf-surface)', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', padding: 16, marginBottom: 24 }}>
          {!pushSupported() ? (
            <div style={{ fontFamily: T.sig, fontSize: 14, color: T.muted, lineHeight: 1.5 }}>
              This device doesn't support push. On iPhone, add WISEcon27 to your Home Screen first, then enable it here.
            </div>
          ) : pushOn ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: T.green10 }}>
              <Icon name="checkCircle" size={20} />
              <span style={{ fontFamily: T.sig, fontWeight: 600, fontSize: 15 }}>Push notifications are on</span>
            </div>
          ) : (
            <>
              <div style={{ fontFamily: T.sig, fontSize: 14, color: T.body, lineHeight: 1.5, marginBottom: 12 }}>
                Get session reminders and live announcements on your device — even when the app is closed.
              </div>
              <Btn kind="primary" full icon="bell" onClick={turnOnPush} disabled={busy}>
                {busy ? 'Enabling…' : 'Enable push notifications'}
              </Btn>
            </>
          )}
        </div>

        {/* appearance */}
        <Eyebrow style={{ marginBottom: 10, paddingLeft: 2 }}>Appearance</Eyebrow>
        <div style={{ background: 'var(--wf-surface)', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
          {MODES.map((o, i) => {
            const on = mode === o.id
            return (
              <Press
                key={o.id}
                onClick={() => pick(o.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: i === MODES.length - 1 ? 'none' : '1px solid ' + T.line }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 15.5, color: T.ink }}>{o.name}</div>
                  <div style={{ fontFamily: T.sig, fontSize: 13, color: T.muted, marginTop: 1 }}>{o.desc}</div>
                </div>
                <div style={{ width: 24, height: 24, borderRadius: '50%', display: 'grid', placeItems: 'center', color: '#fff', background: on ? T.green9 : 'transparent', boxShadow: on ? 'none' : 'inset 0 0 0 2px var(--wf-grey-6)' }}>
                  {on && <Icon name="check" size={15} stroke={2.6} />}
                </div>
              </Press>
            )
          })}
        </div>
        <div style={{ fontFamily: T.onest, fontSize: 11.5, color: T.muted, marginTop: 14, paddingLeft: 2, lineHeight: 1.5 }}>
          Your choice is saved on this device.
        </div>
      </div>
    </div>
  )
}
