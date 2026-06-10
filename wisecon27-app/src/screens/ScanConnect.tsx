// WISEcon27 — connect by scanning another delegate's badge QR (pushed from
// Connect). Decodes the badge, looks the delegate up, and opens their profile.
import { useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { T, TABBAR_H } from '../theme'
import type { AppCtx } from '../appState'
import { AppHeader, Eyebrow } from '../components/primitives'
import { QrCamera } from '../components/QrCamera'

export function ScanConnect({ ctx }: { ctx: AppCtx }) {
  const [busy, setBusy] = useState(false)
  const lastMiss = useRef('')

  const onCode = async (code: string) => {
    if (busy) return
    setBusy(true)
    const { data } = await supabase.from('profiles').select('id, name').eq('badge_id', code).maybeSingle()
    if (!data) {
      if (lastMiss.current !== code) {
        lastMiss.current = code
        ctx.toast('No delegate found for that code')
      }
      setBusy(false)
      return
    }
    if ((data as { id: string }).id === ctx.userId) {
      ctx.toast('That’s your own badge 🙂')
      setBusy(false)
      return
    }
    ctx.push('delegate', { peerId: (data as { id: string }).id })
    setBusy(false)
  }

  return (
    <div style={{ minHeight: '100%', background: 'var(--wf-grey-2)' }}>
      <AppHeader title="Scan to connect" sub="Point at a fellow delegate's badge" onBack={ctx.back} />
      <div style={{ padding: '14px 16px ' + (TABBAR_H + 16) + 'px' }}>
        <QrCamera onCode={onCode} paused={busy} hint="Point at a delegate's badge QR" />
        <Eyebrow style={{ display: 'block', textAlign: 'center' }}>Their profile opens — connect from there</Eyebrow>
        <div style={{ fontFamily: T.sig, fontSize: 13, color: T.muted, textAlign: 'center', marginTop: 8, lineHeight: 1.5 }}>
          Your own badge is under Connect → the green card, or Profile → My badge.
        </div>
      </div>
    </div>
  )
}
