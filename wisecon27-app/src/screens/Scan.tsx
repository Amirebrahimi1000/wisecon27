// WISEcon27 — entrance scanner (Admin → Scan). Reads a delegate's badge QR
// with the phone camera, shows who they are (type colour, gala dinner) and
// checks them in. Re-scanning someone already checked in shows a warning with
// the original time — the duplicate-ticket guard.
//
// Uses the native BarcodeDetector where available (Android/Chrome) and falls
// back to jsQR frame decoding elsewhere (iPhone Safari).
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { T } from '../theme'
import type { AppCtx } from '../appState'
import { BADGE_TYPES, asDelegateType } from '../badgeTypes'
import { Icon } from '../components/Icon'
import { AppHeader, Avatar, Btn, Eyebrow } from '../components/primitives'
import { QrCamera } from '../components/QrCamera'
import { useT } from '../i18n'

interface ScannedProfile {
  id: string
  name: string
  org: string
  role: string
  delegate_type: string | null
  gala: boolean | null
  checked_in_at: string | null
  badge_id: string
  avatar_url: string | null
}

type ScanState =
  | { kind: 'scanning' }
  | { kind: 'notfound'; code: string }
  | { kind: 'found'; p: ScannedProfile; justCheckedIn: boolean }

const fmtTime = (iso: string) => {
  const d = new Date(iso)
  return d.toLocaleString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' })
}

export function Scan({ ctx }: { ctx: AppCtx }) {
  const { t } = useT()
  const [state, setState] = useState<ScanState>({ kind: 'scanning' })
  const [saving, setSaving] = useState(false)

  const onCode = async (code: string) => {
    if (state.kind !== 'scanning') return
    const { data } = await supabase
      .from('profiles')
      .select('id, name, org, role, delegate_type, gala, checked_in_at, badge_id, avatar_url')
      .eq('badge_id', code)
      .maybeSingle()
    if (!data) setState({ kind: 'notfound', code })
    else setState({ kind: 'found', p: data as ScannedProfile, justCheckedIn: false })
  }

  const scanNext = () => {
    setState({ kind: 'scanning' })
  }

  const checkIn = async (p: ScannedProfile) => {
    if (saving) return
    setSaving(true)
    // RPC instead of a direct table update: it is the only write the Staff
    // role can perform (stamps checked_in_at, nothing else)
    const { data, error } = await supabase.rpc('check_in', { p_badge: p.badge_id })
    setSaving(false)
    if (error) return ctx.toast(error.message)
    setState({ kind: 'found', p: { ...p, checked_in_at: (data as string) ?? new Date().toISOString() }, justCheckedIn: true })
  }

  return (
    <div>
      <QrCamera onCode={onCode} paused={state.kind !== 'scanning'} hint={t('scan.cameraHint')} />

      {/* result */}
      {state.kind === 'notfound' && (
        <div style={{ background: 'var(--wf-surface)', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', padding: 18, textAlign: 'center' }}>
          <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'var(--wf-tomato-2)', color: 'var(--wf-tomato-9)', display: 'grid', placeItems: 'center', margin: '0 auto 10px' }}>
            <Icon name="close" size={24} />
          </div>
          <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 16.5, color: T.ink }}>{t('scan.notFound')}</div>
          <div style={{ fontFamily: T.onest, fontSize: 13, color: T.muted, marginTop: 4 }}>{t('scan.code')}: {state.code}</div>
          <Btn kind="primary" full size="lg" onClick={scanNext} style={{ marginTop: 14 }}>{t('scan.scanNext')}</Btn>
        </div>
      )}

      {state.kind === 'found' && (() => {
        const { p } = state
        const bt = BADGE_TYPES[asDelegateType(p.delegate_type)]
        const already = !!p.checked_in_at && !state.justCheckedIn
        return (
          <div style={{ background: 'var(--wf-surface)', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
            <div style={{ height: 8, background: bt.bg }} />
            <div style={{ padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
                <Avatar initials={(p.name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')} color={bt.chipText} size={52} src={p.avatar_url} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 18, color: T.ink }}>{p.name || t('scan.unnamed')}</div>
                  <div style={{ fontFamily: T.sig, fontSize: 13.5, color: T.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{[p.role, p.org].filter(Boolean).join(' · ')}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', background: bt.chipBg, color: bt.chipText, fontFamily: T.sig, fontWeight: 600, fontSize: 13, borderRadius: 999, padding: '5px 13px' }}>{bt.label}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: p.gala ? '#1c1c1e' : 'var(--wf-grey-4)', color: p.gala ? '#f5d77b' : T.muted, fontFamily: T.sig, fontWeight: 600, fontSize: 13, borderRadius: 999, padding: '5px 13px' }}>
                  <Icon name="star" size={13} /> {p.gala ? t('scan.galaDinner') : t('scan.noGala')}
                </span>
              </div>

              {state.justCheckedIn ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 16, background: T.green1, color: T.green11, borderRadius: 'var(--radius-4)', padding: '12px 14px', fontFamily: T.sig, fontWeight: 700, fontSize: 15 }}>
                  <Icon name="checkCircle" size={20} /> {t('scan.checkedIn')}
                </div>
              ) : already ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 16, background: 'var(--wf-orange-2)', color: 'var(--wf-orange-11, #8a5a00)', borderRadius: 'var(--radius-4)', padding: '12px 14px', fontFamily: T.sig, fontWeight: 600, fontSize: 14, lineHeight: 1.35 }}>
                  <Icon name="info" size={20} style={{ flexShrink: 0 }} /> {t('scan.alreadyCheckedIn')} · {fmtTime(p.checked_in_at!)}
                </div>
              ) : (
                <Btn kind="primary" full size="lg" icon="check" onClick={() => checkIn(p)} disabled={saving} style={{ marginTop: 16 }}>
                  {saving ? t('scan.checkingIn') : t('scan.checkIn')}
                </Btn>
              )}
              <Btn kind={state.justCheckedIn || already ? 'primary' : 'outline'} full size="lg" onClick={scanNext} style={{ marginTop: 10 }}>
                {t('scan.scanNext')}
              </Btn>
            </div>
          </div>
        )
      })()}

      {state.kind === 'scanning' && (
        <Eyebrow style={{ textAlign: 'center', display: 'block' }}>{t('scan.entranceHint')}</Eyebrow>
      )}
    </div>
  )
}

/** Standalone scanner for the Staff role (pushed from Profile) — same scanner,
 *  no other admin tools around it. */
export function ScannerScreen({ ctx }: { ctx: AppCtx }) {
  const { t } = useT()
  return (
    <div>
      <AppHeader title={t('scan.screenTitle')} sub={t('scan.screenSub')} onBack={ctx.back} />
      <div style={{ padding: '14px 16px 24px' }}>
        <Scan ctx={ctx} />
      </div>
    </div>
  )
}
