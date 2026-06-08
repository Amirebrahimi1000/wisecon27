// WISEcon27 — Profile: identity, badge card, list menu, sign out.
import { T, TABBAR_H } from '../theme'
import type { AppCtx, PushScreen, TabId } from '../appState'
import type { IconName } from '../components/Icon'
import { Icon } from '../components/Icon'
import { AppHeader, Avatar, Btn, Eyebrow, IconBtn, Press } from '../components/primitives'
import { QR } from '../components/QR'
import { useAuth } from '../auth'

export function Profile({ ctx }: { ctx: AppCtx }) {
  const { signOut } = useAuth()
  const me = ctx.me
  const count = ctx.sessions.filter((s) => ctx.isBookmarked(s.id)).length
  const connectedCount = ctx.attendees.filter((a) => a.status === 'connected').length

  interface Row { icon: IconName; label: string; detail?: string; to: () => void }
  const rows: Row[] = [
    { icon: 'calendar', label: 'My schedule', detail: count + ' saved', to: () => ctx.push('myschedule', {}) },
    { icon: 'bell', label: 'Notifications', detail: ctx.unread > 0 ? ctx.unread + ' new' : '', to: () => ctx.push('notifications', {}) },
    { icon: 'connect', label: 'My connections', detail: String(connectedCount), to: () => ctx.setTab('connect' as TabId) },
    { icon: 'grid', label: 'Sponsors & exhibitors', to: () => ctx.push('sponsors', {}) },
    { icon: 'star', label: 'Give feedback', to: () => ctx.push('feedback', {}) },
    { icon: 'info', label: 'Event info & Wi-Fi', to: () => ctx.push('info', {}) },
    { icon: 'settings', label: 'Settings', to: () => ctx.push('settings' as PushScreen, {}) },
    ...(ctx.isAdmin ? [{ icon: 'grid' as IconName, label: 'Admin tools', detail: 'Organiser', to: () => ctx.push('admin', {}) }] : []),
  ]

  return (
    <div>
      <AppHeader title="Profile" right={<IconBtn name="settings" onClick={() => ctx.push('settings', {})} />} />
      <div style={{ padding: '8px 16px ' + (TABBAR_H + 16) + 'px' }}>
        {/* identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '8px 4px 18px' }}>
          <Avatar initials={me.initials} color={me.color} size={64} />
          <div>
            <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 20, color: T.ink }}>{me.name}</div>
            <div style={{ fontFamily: T.sig, fontSize: 14, color: T.body }}>{me.role}</div>
            <div style={{ fontFamily: T.onest, fontSize: 12.5, color: T.muted, marginTop: 1 }}>{me.org}</div>
          </div>
        </div>
        {/* badge */}
        <Press onClick={() => ctx.push('ticket', {})} style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'linear-gradient(135deg, #111, #2a2a2a)', borderRadius: 'var(--radius-5)', padding: 16, color: '#fff', marginBottom: 18 }}>
          <div style={{ background: '#fff', borderRadius: 'var(--radius-3)', padding: 6 }}>
            <QR value={me.badgeId} size={56} />
          </div>
          <div style={{ flex: 1 }}>
            <Eyebrow color="rgba(255,255,255,0.6)">My badge</Eyebrow>
            <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 16, marginTop: 3 }}>{me.ticket}</div>
            <div style={{ fontFamily: T.onest, fontSize: 12.5, color: 'rgba(255,255,255,0.7)', marginTop: 1 }}>{me.badgeId}</div>
          </div>
          <Icon name="qr" size={22} style={{ color: 'rgba(255,255,255,0.7)' }} />
        </Press>
        {/* list */}
        <div style={{ background: '#fff', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
          {rows.map((r, i) => (
            <Press key={r.label} onClick={r.to} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 16px', borderBottom: i === rows.length - 1 ? 'none' : '1px solid ' + T.line }}>
              <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-3)', background: T.sunken, display: 'grid', placeItems: 'center', color: T.body }}>
                <Icon name={r.icon} size={18} />
              </div>
              <span style={{ flex: 1, fontFamily: T.sig, fontWeight: 500, fontSize: 15.5, color: T.ink }}>{r.label}</span>
              {r.detail && <span style={{ fontFamily: T.onest, fontSize: 12.5, color: T.muted }}>{r.detail}</span>}
              <Icon name="chevronRight" size={18} stroke={2} style={{ color: T.line2 }} />
            </Press>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 18 }}>
          <Btn kind="danger" icon="logout" onClick={() => signOut()}>Sign out</Btn>
        </div>
        <div style={{ textAlign: 'center', fontFamily: T.onest, fontSize: 11.5, color: T.muted, marginTop: 18 }}>WISEcon27 · v1.0 · Powered by WISEflow</div>
      </div>
    </div>
  )
}
