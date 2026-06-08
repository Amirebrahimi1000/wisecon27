// WISEcon27 — Event Info (pushed): Wi-Fi, venue, hours as a key/value card.
import { T, TABBAR_H } from '../theme'
import type { AppCtx } from '../appState'
import type { IconName } from '../components/Icon'
import { Icon } from '../components/Icon'
import { AppHeader } from '../components/primitives'

export function Info({ ctx }: { ctx: AppCtx }) {
  const items = ctx.eventInfo
  return (
    <div>
      <AppHeader title="Event info" onBack={ctx.back} />
      <div style={{ padding: '14px 16px ' + (TABBAR_H + 16) + 'px' }}>
        <div style={{ background: '#fff', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
          {items.map((it, i) => (
            <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 16px', borderBottom: i === items.length - 1 ? 'none' : '1px solid ' + T.line }}>
              <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-3)', background: T.sunken, display: 'grid', placeItems: 'center', color: T.body }}>
                <Icon name={it.icon as IconName} size={18} />
              </div>
              <span style={{ flex: 1, fontFamily: T.sig, fontWeight: 500, fontSize: 15, color: T.body }}>{it.label}</span>
              <span style={{ fontFamily: T.sig, fontWeight: 600, fontSize: 15, color: T.ink }}>{it.detail}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
