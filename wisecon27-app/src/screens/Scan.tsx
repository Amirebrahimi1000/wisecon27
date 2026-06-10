// WISEcon27 — entrance scanner (Admin → Scan). Reads a delegate's badge QR
// with the phone camera, shows who they are (type colour, gala dinner) and
// checks them in. Re-scanning someone already checked in shows a warning with
// the original time — the duplicate-ticket guard.
//
// Uses the native BarcodeDetector where available (Android/Chrome) and falls
// back to jsQR frame decoding elsewhere (iPhone Safari).
import { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import { supabase } from '../lib/supabase'
import { T } from '../theme'
import type { AppCtx } from '../appState'
import { BADGE_TYPES, asDelegateType } from '../badgeTypes'
import { Icon } from '../components/Icon'
import { Avatar, Btn, Eyebrow } from '../components/primitives'

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
  | { kind: 'error'; message: string }
  | { kind: 'notfound'; code: string }
  | { kind: 'found'; p: ScannedProfile; justCheckedIn: boolean }

interface DetectorLike {
  detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]>
}
declare const BarcodeDetector: { new (opts?: { formats?: string[] }): DetectorLike } | undefined

const fmtTime = (iso: string) => {
  const d = new Date(iso)
  return d.toLocaleString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' })
}

export function Scan({ ctx }: { ctx: AppCtx }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const pausedRef = useRef(false)
  const [state, setState] = useState<ScanState>({ kind: 'scanning' })
  const [saving, setSaving] = useState(false)

  // camera + detection loop
  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setInterval> | undefined
    const canvas = document.createElement('canvas')

    const onCode = async (raw: string) => {
      pausedRef.current = true
      const code = raw.trim()
      const { data } = await supabase
        .from('profiles')
        .select('id, name, org, role, delegate_type, gala, checked_in_at, badge_id, avatar_url')
        .eq('badge_id', code)
        .maybeSingle()
      if (cancelled) return
      if (!data) setState({ kind: 'notfound', code })
      else setState({ kind: 'found', p: data as ScannedProfile, justCheckedIn: false })
    }

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        const video = videoRef.current
        if (!video) return
        video.srcObject = stream
        await video.play()

        const native = typeof BarcodeDetector !== 'undefined' ? new BarcodeDetector({ formats: ['qr_code'] }) : null
        timer = setInterval(async () => {
          if (pausedRef.current || cancelled || !video.videoWidth) return
          try {
            if (native) {
              const codes = await native.detect(video)
              if (codes.length && codes[0].rawValue) onCode(codes[0].rawValue)
            } else {
              canvas.width = video.videoWidth
              canvas.height = video.videoHeight
              const g = canvas.getContext('2d', { willReadFrequently: true })!
              g.drawImage(video, 0, 0)
              const img = g.getImageData(0, 0, canvas.width, canvas.height)
              const hit = jsQR(img.data, img.width, img.height)
              if (hit?.data) onCode(hit.data)
            }
          } catch {
            /* skip frame */
          }
        }, 250)
      } catch {
        if (!cancelled) setState({ kind: 'error', message: 'Camera access was denied. Allow camera access for this app and try again.' })
      }
    }
    start()
    return () => {
      cancelled = true
      if (timer) clearInterval(timer)
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const scanNext = () => {
    setState({ kind: 'scanning' })
    pausedRef.current = false
  }

  const checkIn = async (p: ScannedProfile) => {
    if (saving) return
    setSaving(true)
    const now = new Date().toISOString()
    const { error } = await supabase.from('profiles').update({ checked_in_at: now }).eq('id', p.id)
    setSaving(false)
    if (error) return ctx.toast(error.message)
    setState({ kind: 'found', p: { ...p, checked_in_at: now }, justCheckedIn: true })
  }

  return (
    <div>
      {/* camera viewport */}
      <div style={{ position: 'relative', borderRadius: 'var(--radius-5)', overflow: 'hidden', background: '#000', aspectRatio: '4 / 5', marginBottom: 14 }}>
        <video ref={videoRef} muted playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        {state.kind === 'scanning' && (
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
            <div style={{ width: '62%', aspectRatio: '1', border: '3px solid rgba(255,255,255,0.85)', borderRadius: 18, boxShadow: '0 0 0 2000px rgba(0,0,0,0.35)' }} />
            <div style={{ position: 'absolute', bottom: 14, left: 0, right: 0, textAlign: 'center', fontFamily: T.sig, fontWeight: 600, fontSize: 13.5, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
              Point at a delegate's badge QR
            </div>
          </div>
        )}
        {state.kind === 'error' && (
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center', fontFamily: T.sig, fontSize: 14, color: '#fff', background: 'rgba(0,0,0,0.75)' }}>
            {state.message}
          </div>
        )}
      </div>

      {/* result */}
      {state.kind === 'notfound' && (
        <div style={{ background: '#fff', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', padding: 18, textAlign: 'center' }}>
          <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'var(--wf-tomato-2)', color: 'var(--wf-tomato-9)', display: 'grid', placeItems: 'center', margin: '0 auto 10px' }}>
            <Icon name="close" size={24} />
          </div>
          <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 16.5, color: T.ink }}>No delegate found</div>
          <div style={{ fontFamily: T.onest, fontSize: 13, color: T.muted, marginTop: 4 }}>Code: {state.code}</div>
          <Btn kind="primary" full size="lg" onClick={scanNext} style={{ marginTop: 14 }}>Scan next</Btn>
        </div>
      )}

      {state.kind === 'found' && (() => {
        const { p } = state
        const bt = BADGE_TYPES[asDelegateType(p.delegate_type)]
        const already = !!p.checked_in_at && !state.justCheckedIn
        return (
          <div style={{ background: '#fff', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
            <div style={{ height: 8, background: bt.bg }} />
            <div style={{ padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
                <Avatar initials={(p.name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')} color={bt.chipText} size={52} src={p.avatar_url} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 18, color: T.ink }}>{p.name || 'Unnamed delegate'}</div>
                  <div style={{ fontFamily: T.sig, fontSize: 13.5, color: T.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{[p.role, p.org].filter(Boolean).join(' · ')}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', background: bt.chipBg, color: bt.chipText, fontFamily: T.sig, fontWeight: 600, fontSize: 13, borderRadius: 999, padding: '5px 13px' }}>{bt.label}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: p.gala ? '#1c1c1e' : 'var(--wf-grey-4)', color: p.gala ? '#f5d77b' : T.muted, fontFamily: T.sig, fontWeight: 600, fontSize: 13, borderRadius: 999, padding: '5px 13px' }}>
                  <Icon name="star" size={13} /> {p.gala ? 'Gala Dinner' : 'No gala'}
                </span>
              </div>

              {state.justCheckedIn ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 16, background: T.green1, color: T.green11, borderRadius: 'var(--radius-4)', padding: '12px 14px', fontFamily: T.sig, fontWeight: 700, fontSize: 15 }}>
                  <Icon name="checkCircle" size={20} /> Checked in
                </div>
              ) : already ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 16, background: 'var(--wf-orange-2)', color: 'var(--wf-orange-11, #8a5a00)', borderRadius: 'var(--radius-4)', padding: '12px 14px', fontFamily: T.sig, fontWeight: 600, fontSize: 14, lineHeight: 1.35 }}>
                  <Icon name="info" size={20} style={{ flexShrink: 0 }} /> Already checked in · {fmtTime(p.checked_in_at!)}
                </div>
              ) : (
                <Btn kind="primary" full size="lg" icon="check" onClick={() => checkIn(p)} disabled={saving} style={{ marginTop: 16 }}>
                  {saving ? 'Checking in…' : 'Check in'}
                </Btn>
              )}
              <Btn kind={state.justCheckedIn || already ? 'primary' : 'outline'} full size="lg" onClick={scanNext} style={{ marginTop: 10 }}>
                Scan next
              </Btn>
            </div>
          </div>
        )
      })()}

      {state.kind === 'scanning' && (
        <Eyebrow style={{ textAlign: 'center', display: 'block' }}>Entrance check-in · duplicate scans are flagged</Eyebrow>
      )}
    </div>
  )
}
