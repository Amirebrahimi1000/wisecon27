// WISEcon27 — Sponsors (pushed): grouped by tier (Host/Platinum big, Gold/Silver 2-col).
import { SPONSORS } from '../data'
import { T, TABBAR_H } from '../theme'
import type { AppCtx } from '../store'
import type { SponsorTier } from '../types'
import { AppHeader, Eyebrow, Press } from '../components/primitives'

const TIERS: SponsorTier[] = ['Host', 'Platinum', 'Gold', 'Silver']

export function Sponsors({ ctx }: { ctx: AppCtx }) {
  return (
    <div>
      <AppHeader title="Sponsors" sub="With thanks to our partners" onBack={ctx.back} />
      <div style={{ padding: '12px 16px ' + (TABBAR_H + 16) + 'px' }}>
        {TIERS.map((tier) => {
          const list = SPONSORS.filter((s) => s.tier === tier)
          if (!list.length) return null
          const big = tier === 'Host' || tier === 'Platinum'
          return (
            <div key={tier} style={{ marginBottom: 22 }}>
              <Eyebrow style={{ marginBottom: 10 }}>{tier}</Eyebrow>
              <div style={{ display: 'grid', gridTemplateColumns: big ? '1fr' : '1fr 1fr', gap: 10 }}>
                {list.map((sp) => (
                  <Press key={sp.name} onClick={() => ctx.toast(sp.name)} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', borderRadius: 'var(--radius-5)', padding: big ? 16 : 13, boxShadow: 'var(--shadow-card)' }}>
                    <div style={{ width: big ? 48 : 40, height: big ? 48 : 40, borderRadius: 'var(--radius-3)', background: sp.color, color: '#fff', display: 'grid', placeItems: 'center', fontFamily: T.onest, fontWeight: 700, fontSize: big ? 17 : 14, flexShrink: 0 }}>{sp.initials}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: big ? 16 : 14, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sp.name}</div>
                      {big && <div style={{ fontFamily: T.sig, fontSize: 13, color: T.muted, marginTop: 1 }}>{sp.blurb}</div>}
                    </div>
                  </Press>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
