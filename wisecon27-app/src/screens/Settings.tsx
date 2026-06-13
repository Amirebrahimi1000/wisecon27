// WISEcon27 — Settings: notifications (incl. topics), appearance, text size, privacy.
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { T, TABBAR_H } from '../theme'
import type { AppCtx } from '../appState'
import { Icon } from '../components/Icon'
import { AppHeader, Btn, Eyebrow, Press } from '../components/primitives'
import { enablePush, isPushEnabled, pushSupported } from '../push'
import { getMode, setMode, getTextSize, setTextSize, type AppMode, type TextSize } from '../mode'
import { useT, LANGS, type Lang } from '../i18n'

const MODES: { id: AppMode; name: string; desc: string }[] = [
  { id: 'light', name: 'Light', desc: 'Always light (default)' },
  { id: 'dark', name: 'Dark', desc: 'Always dark — easier on the eyes in dim rooms' },
  { id: 'system', name: 'Automatic', desc: 'Follows your device’s light/dark setting' },
]
const SIZES: { id: TextSize; name: string; desc: string }[] = [
  { id: 'normal', name: 'Default', desc: 'Standard size' },
  { id: 'large', name: 'Large', desc: 'Everything 10% bigger' },
  { id: 'xlarge', name: 'Extra large', desc: 'Everything 22% bigger' },
]
type NotifPrefs = Record<string, boolean>
const TOPICS: { key: string; label: string; desc: string }[] = [
  { key: 'announce', label: 'Announcements', desc: 'Organiser updates & room changes' },
  { key: 'connect', label: 'Connection requests', desc: 'When someone wants to connect' },
  { key: 'message', label: 'Direct messages', desc: 'New messages from connections' },
]

function Toggle({ on, onTap }: { on: boolean; onTap: () => void }) {
  return (
    <Press onClick={onTap} style={{ width: 46, height: 27, borderRadius: 999, background: on ? T.green9 : 'var(--wf-grey-6)', position: 'relative', flexShrink: 0, transition: 'background .15s var(--ease-out)' }}>
      <span style={{ position: 'absolute', top: 3, left: on ? 22 : 3, width: 21, height: 21, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.25)', transition: 'left .15s var(--ease-out)' }} />
    </Press>
  )
}

const cardStyle: React.CSSProperties = { background: 'var(--wf-surface)', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', overflow: 'hidden', marginBottom: 24 }

function PickList<Id extends string>({ options, value, onPick }: { options: { id: Id; name: string; desc: string }[]; value: Id; onPick: (id: Id) => void }) {
  return (
    <div style={cardStyle}>
      {options.map((o, i) => {
        const on = value === o.id
        return (
          <Press key={o.id} onClick={() => onPick(o.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: i === options.length - 1 ? 'none' : '1px solid ' + T.line }}>
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
  )
}

export function Settings({ ctx }: { ctx: AppCtx }) {
  const { t, lang, setLang } = useT()
  const [pushOn, setPushOn] = useState(false)
  const [busy, setBusy] = useState(false)
  const [mode, setModeState] = useState<AppMode>(() => getMode())
  const [size, setSizeState] = useState<TextSize>(() => getTextSize())
  const [hidden, setHidden] = useState(false)
  const [prefs, setPrefs] = useState<NotifPrefs>({})

  useEffect(() => {
    isPushEnabled().then(setPushOn)
    supabase.from('profiles').select('hidden, notif_prefs').eq('id', ctx.userId).single().then(({ data }) => {
      if (!data) return
      setHidden((data as { hidden: boolean | null }).hidden ?? false)
      setPrefs(((data as { notif_prefs: NotifPrefs | null }).notif_prefs) ?? {})
    })
  }, [ctx.userId])

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

  const toggleTopic = (key: string) => {
    const next = { ...prefs, [key]: prefs[key] === false ? true : false }
    setPrefs(next)
    supabase.from('profiles').update({ notif_prefs: next }).eq('id', ctx.userId).then(({ error }) => {
      if (error) ctx.toast(error.message)
    })
  }

  const toggleHidden = () => {
    const next = !hidden
    setHidden(next)
    supabase.from('profiles').update({ hidden: next }).eq('id', ctx.userId).then(({ error }) => {
      if (error) ctx.toast(error.message)
      else ctx.toast(next ? 'You’re hidden from the delegate list' : 'You’re visible to other delegates')
    })
  }

  return (
    <div>
      <AppHeader title={t('settings.title')} onBack={ctx.back} />
      <div style={{ padding: '16px 16px ' + (TABBAR_H + 16) + 'px' }}>
        {/* language */}
        <Eyebrow style={{ marginBottom: 10, paddingLeft: 2 }}>{t('settings.language')}</Eyebrow>
        <PickList
          options={LANGS.map((l) => ({ id: l.id, name: l.name, desc: l.english }))}
          value={lang}
          onPick={(l: Lang) => setLang(l)}
        />

        {/* push notifications */}
        <Eyebrow style={{ marginBottom: 10, paddingLeft: 2 }}>Notifications</Eyebrow>
        <div style={{ ...cardStyle, padding: 16 }}>
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

        {/* notification topics */}
        <Eyebrow style={{ marginBottom: 10, paddingLeft: 2 }}>Notify me about</Eyebrow>
        <div style={cardStyle}>
          {TOPICS.map((t, i) => (
            <div key={t.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: i === TOPICS.length - 1 ? 'none' : '1px solid ' + T.line }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 15, color: T.ink }}>{t.label}</div>
                <div style={{ fontFamily: T.sig, fontSize: 12.5, color: T.muted, marginTop: 1 }}>{t.desc}</div>
              </div>
              <Toggle on={prefs[t.key] !== false} onTap={() => toggleTopic(t.key)} />
            </div>
          ))}
        </div>

        {/* appearance */}
        <Eyebrow style={{ marginBottom: 10, paddingLeft: 2 }}>Appearance</Eyebrow>
        <PickList options={MODES} value={mode} onPick={(m) => { setModeState(m); setMode(m) }} />

        {/* text size */}
        <Eyebrow style={{ marginBottom: 10, paddingLeft: 2 }}>Text size</Eyebrow>
        <PickList options={SIZES} value={size} onPick={(s) => { setSizeState(s); setTextSize(s) }} />

        {/* privacy */}
        <Eyebrow style={{ marginBottom: 10, paddingLeft: 2 }}>Privacy</Eyebrow>
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 15, color: T.ink }}>Hide me from the delegate list</div>
              <div style={{ fontFamily: T.sig, fontSize: 12.5, color: T.muted, marginTop: 1, lineHeight: 1.4 }}>
                Others won’t find you under Connect. Existing connections and messages keep working.
              </div>
            </div>
            <Toggle on={hidden} onTap={toggleHidden} />
          </div>
        </div>

        <div style={{ fontFamily: T.onest, fontSize: 11.5, color: T.muted, paddingLeft: 2, lineHeight: 1.5 }}>
          Appearance and text size are saved on this device; notification topics and privacy follow your account.
        </div>
      </div>
    </div>
  )
}
