// WISEcon27 — one-time, just-in-time tips. Shown on a surface until the
// delegate taps "Got it"; the dismissal is remembered per device.
import { useState } from 'react'
import { T } from '../theme'
import { Icon } from './Icon'
import { Press } from './primitives'

export function FirstTimeHint({ id, text }: { id: string; text: string }) {
  const key = 'wc27.hint.' + id
  const [hidden, setHidden] = useState(() => {
    try { return localStorage.getItem(key) === '1' } catch { return true }
  })
  if (hidden) return null
  const dismiss = () => {
    try { localStorage.setItem(key, '1') } catch { /* ignore */ }
    setHidden(true)
  }
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: T.green1, borderRadius: 'var(--radius-4)', padding: '11px 13px', margin: '10px 16px 0' }}>
      <Icon name="sparkles" size={16} style={{ color: T.green10, flexShrink: 0, marginTop: 2 }} />
      <span style={{ flex: 1, fontFamily: T.sig, fontSize: 13, color: T.green11, lineHeight: 1.45 }}>{text}</span>
      <Press onClick={dismiss} style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 12.5, color: T.green10, padding: '2px 4px', flexShrink: 0 }}>Got it</Press>
    </div>
  )
}
