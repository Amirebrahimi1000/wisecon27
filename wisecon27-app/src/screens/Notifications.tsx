// WISEcon27 — Notifications (pushed): typed icons, unread highlight, mark read.
import { T, TABBAR_H } from '../theme'
import type { AppCtx } from '../store'
import type { NotificationType } from '../types'
import type { IconName } from '../components/Icon'
import { Icon } from '../components/Icon'
import { AppHeader, Press } from '../components/primitives'

const META: Record<NotificationType, { icon: IconName; color: string; bg: string }> = {
  reminder: { icon: 'clock', color: 'var(--wf-green-9)', bg: 'var(--wf-green-1)' },
  connect: { icon: 'connect', color: 'var(--wf-purple-8)', bg: 'var(--wf-purple-2)' },
  announce: { icon: 'info', color: 'var(--wf-blue-9)', bg: 'var(--wf-blue-1)' },
  social: { icon: 'heart', color: 'var(--wf-tomato-9)', bg: 'var(--wf-tomato-2)' },
  feedback: { icon: 'star', color: 'var(--wf-orange-9)', bg: 'var(--wf-orange-2)' },
}

export function Notifications({ ctx }: { ctx: AppCtx }) {
  return (
    <div>
      <AppHeader
        title="Notifications"
        onBack={ctx.params._fromTab ? null : ctx.back}
        right={
          <Press onClick={() => { ctx.markAllRead(); ctx.toast('All marked read') }} style={{ fontFamily: T.sig, fontWeight: 600, fontSize: 13.5, color: T.green10, padding: '0 6px' }}>Mark read</Press>
        }
      />
      <div style={{ padding: '8px 12px ' + (TABBAR_H + 16) + 'px' }}>
        {ctx.notifications.map((n) => {
          const m = META[n.type]
          return (
            <Press key={n.id} onClick={() => ctx.readOne(n.id)} style={{ display: 'flex', gap: 12, padding: '14px 10px', borderBottom: '1px solid ' + T.line, background: n.unread ? T.green1 + '55' : 'transparent', borderRadius: 'var(--radius-3)' }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: m.bg, color: m.color, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <Icon name={m.icon} size={19} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 14.5, color: T.ink }}>{n.title}</span>
                  <span style={{ fontFamily: T.onest, fontSize: 11, color: T.muted, flexShrink: 0 }}>{n.time}</span>
                </div>
                <div style={{ fontFamily: T.sig, fontSize: 13.5, color: T.body, marginTop: 2, lineHeight: 1.4 }}>{n.body}</div>
              </div>
              {n.unread && <span style={{ width: 8, height: 8, borderRadius: 999, background: T.green9, flexShrink: 0, marginTop: 6 }} />}
            </Press>
          )
        })}
      </div>
    </div>
  )
}
