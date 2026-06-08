// WISEcon27 — Settings (pushed): home layout direction.
// The product decision is "Bold" (default); Classic and Cards are exposed here
// per the handoff, which documents them as a possible setting / A/B.
import { useEffect, useState } from 'react'
import { T, TABBAR_H } from '../theme'
import type { AppCtx, HomeVariant } from '../appState'
import { Icon } from '../components/Icon'
import { AppHeader, Btn, Eyebrow, Press } from '../components/primitives'
import { enablePush, isPushEnabled, pushSupported } from '../push'

const OPTIONS: { id: HomeVariant; name: string; desc: string }[] = [
  { id: 'bold', name: 'Bold', desc: 'Energetic — full-bleed green hero (default)' },
  { id: 'cards', name: 'Cards', desc: 'Warm, balanced — track-coloured up-next hero' },
  { id: 'classic', name: 'Classic', desc: 'Restrained, institutional — white background' },
]

export function Settings({ ctx }: { ctx: AppCtx }) {
  const [pushOn, setPushOn] = useState(false)
  const [busy, setBusy] = useState(false)
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
  return (
    <div>
      <AppHeader title="Settings" onBack={ctx.back} />
      <div style={{ padding: '16px 16px ' + (TABBAR_H + 16) + 'px' }}>
        {/* push notifications */}
        <Eyebrow style={{ marginBottom: 10, paddingLeft: 2 }}>Notifications</Eyebrow>
        <div style={{ background: '#fff', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', padding: 16, marginBottom: 24 }}>
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

        <Eyebrow style={{ marginBottom: 10, paddingLeft: 2 }}>Home layout</Eyebrow>
        <div style={{ background: '#fff', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
          {OPTIONS.map((o, i) => {
            const on = ctx.homeVariant === o.id
            return (
              <Press
                key={o.id}
                onClick={() => { ctx.setHomeVariant(o.id); ctx.toast(`Home set to ${o.name}`) }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: i === OPTIONS.length - 1 ? 'none' : '1px solid ' + T.line }}
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
