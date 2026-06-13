// WISEcon27 — Event Info (pushed): Wi-Fi, venue, hours as a key/value card,
// plus a way back into the app tour.
import { T, TABBAR_H } from '../theme'
import type { AppCtx } from '../appState'
import type { IconName } from '../components/Icon'
import { Icon } from '../components/Icon'
import { AppHeader, Press } from '../components/primitives'

export function Info({ ctx }: { ctx: AppCtx }) {
  const items = ctx.eventInfo
  return (
    <div>
      <AppHeader title="Event info" onBack={ctx.back} />
      <div style={{ padding: '14px 16px ' + (TABBAR_H + 16) + 'px' }}>
        <div style={{ background: 'var(--wf-surface)', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
          {items.map((it, i) => (
            <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 16px', borderBottom: i === items.length - 1 ? 'none' : '1px solid ' + T.line }}>
              <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-2)', background: T.sunken, display: 'grid', placeItems: 'center', color: T.body }}>
                <Icon name={it.icon as IconName} size={18} />
              </div>
              <span style={{ flex: 1, fontFamily: T.sig, fontWeight: 500, fontSize: 15, color: T.body }}>{it.label}</span>
              <span style={{ fontFamily: T.sig, fontWeight: 600, fontSize: 15, color: T.ink }}>{it.detail}</span>
            </div>
          ))}
        </div>

        {/* new to the app? */}
        <Press onClick={() => ctx.push('tour', {})} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--wf-surface)', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', padding: 16, marginTop: 14 }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: T.green1, color: T.green10, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <Icon name="sparkles" size={19} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 14.5, color: T.ink }}>Take the app tour</div>
            <div style={{ fontFamily: T.sig, fontSize: 12.5, color: T.muted, marginTop: 1 }}>A one-minute walkthrough of everything the app can do.</div>
          </div>
          <Icon name="chevronRight" size={18} stroke={2} style={{ color: T.line2 }} />
        </Press>
      </div>
    </div>
  )
}
