// WISEcon27 — Ticket / Badge (pushed): full green screen, perforated card, QR.
import { T, STATUS_INSET, TABBAR_H } from '../theme'
import type { AppCtx } from '../appState'
import { Eyebrow, IconBtn } from '../components/primitives'
import { QR } from '../components/QR'

export function Ticket({ ctx }: { ctx: AppCtx }) {
  const ME = ctx.me
  return (
    <div style={{ minHeight: '100%', background: 'linear-gradient(160deg, var(--wf-green-9), var(--wf-green-11))', paddingBottom: TABBAR_H + 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: STATUS_INSET + 6 + 'px 14px 6px' }}>
        <IconBtn name="chevronLeft" onClick={ctx.back} stroke={2.2} color="#fff" bg="rgba(255,255,255,0.16)" />
        <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 17, color: '#fff' }}>My badge</div>
        <div style={{ width: 38 }} />
      </div>
      <div style={{ padding: '20px 22px' }}>
        <div style={{ background: '#fff', borderRadius: 22, overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.3)' }}>
          <div style={{ padding: '22px 22px 16px', textAlign: 'center', borderBottom: '2px dashed ' + T.line }}>
            <Eyebrow style={{ marginBottom: 6 }} color="var(--wf-green-10)">WISEcon27 · Aarhus</Eyebrow>
            <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 24, color: T.ink }}>{ME.name}</div>
            <div style={{ fontFamily: T.sig, fontSize: 14.5, color: T.body, marginTop: 2 }}>{ME.org}</div>
            <span style={{ display: 'inline-flex', marginTop: 12, background: T.green1, color: T.green11, fontFamily: T.sig, fontWeight: 600, fontSize: 13, borderRadius: 999, padding: '5px 14px' }}>{ME.ticket}</span>
          </div>
          <div style={{ padding: 24, display: 'grid', placeItems: 'center' }}>
            <QR value={ME.badgeId} size={200} />
            <div style={{ fontFamily: T.onest, fontSize: 13, letterSpacing: '0.18em', color: T.body, marginTop: 16 }}>{ME.badgeId}</div>
            <div style={{ fontFamily: T.sig, fontSize: 12.5, color: T.muted, marginTop: 4 }}>Scan at registration & session doors</div>
          </div>
        </div>
      </div>
    </div>
  )
}
