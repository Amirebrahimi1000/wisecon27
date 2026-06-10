// WISEcon27 — camera + QR detection viewport (native BarcodeDetector on
// Android/Chrome, jsQR frame decoding elsewhere). Parents receive each decoded
// code via onCode; set `paused` to stop detection while showing a result.
import { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import { T } from '../theme'

interface DetectorLike {
  detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]>
}
declare const BarcodeDetector: { new (opts?: { formats?: string[] }): DetectorLike } | undefined

export function QrCamera({ onCode, paused, hint }: { onCode: (code: string) => void; paused: boolean; hint?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const pausedRef = useRef(paused)
  pausedRef.current = paused
  const onCodeRef = useRef(onCode)
  onCodeRef.current = onCode
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setInterval> | undefined
    const canvas = document.createElement('canvas')

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
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
              if (codes.length && codes[0].rawValue) onCodeRef.current(codes[0].rawValue.trim())
            } else {
              canvas.width = video.videoWidth
              canvas.height = video.videoHeight
              const g = canvas.getContext('2d', { willReadFrequently: true })!
              g.drawImage(video, 0, 0)
              const img = g.getImageData(0, 0, canvas.width, canvas.height)
              const hit = jsQR(img.data, img.width, img.height)
              if (hit?.data) onCodeRef.current(hit.data.trim())
            }
          } catch {
            /* skip frame */
          }
        }, 250)
      } catch {
        if (!cancelled) setError('Camera access was denied. Allow camera access for this app and try again.')
      }
    }
    start()
    return () => {
      cancelled = true
      if (timer) clearInterval(timer)
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  return (
    <div style={{ position: 'relative', borderRadius: 'var(--radius-5)', overflow: 'hidden', background: '#000', aspectRatio: '4 / 5', marginBottom: 14 }}>
      <video ref={videoRef} muted playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      {!paused && !error && (
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
          <div style={{ width: '62%', aspectRatio: '1', border: '3px solid rgba(255,255,255,0.85)', borderRadius: 18, boxShadow: '0 0 0 2000px rgba(0,0,0,0.35)' }} />
          <div style={{ position: 'absolute', bottom: 14, left: 0, right: 0, textAlign: 'center', fontFamily: T.sig, fontWeight: 600, fontSize: 13.5, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
            {hint ?? "Point at a badge QR"}
          </div>
        </div>
      )}
      {error && (
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center', fontFamily: T.sig, fontSize: 14, color: '#fff', background: 'rgba(0,0,0,0.75)' }}>
          {error}
        </div>
      )}
    </div>
  )
}
