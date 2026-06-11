// WISEcon27 — Profile: identity, badge card, list menu, sign out.
import { useRef, useState } from 'react'
import { T, TABBAR_H } from '../theme'
import type { AppCtx, PushScreen, TabId } from '../appState'
import type { IconName } from '../components/Icon'
import { Icon } from '../components/Icon'
import { AppHeader, Avatar, Btn, Eyebrow, Press } from '../components/primitives'
import { QR } from '../components/QR'
import { uploadAvatar } from '../lib/storage'
import { useAuth } from '../auth'

export function Profile({ ctx }: { ctx: AppCtx }) {
  const { signOut } = useAuth()
  const me = ctx.me
  const count = ctx.sessions.filter((s) => ctx.isBookmarked(s.id)).length
  const connectedCount = ctx.attendees.filter((a) => a.status === 'connected').length
  const pendingMeetings = ctx.meetings.filter((m) => m.status === 'pending' && m.inviteeId === ctx.userId).length
  const confirmedMeetings = ctx.meetings.filter((m) => m.status === 'accepted').length
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const pickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const { url, error } = await uploadAvatar(ctx.userId, file)
    setUploading(false)
    if (error) ctx.toast(error)
    else if (url) { ctx.setAvatar(url); ctx.toast('Profile photo updated') }
  }

  interface Row { icon: IconName; label: string; detail?: string; to: () => void }
  const rows: Row[] = [
    { icon: 'user', label: 'Edit my profile', detail: 'About, sharing', to: () => ctx.push('editprofile', {}) },
    { icon: 'calendar', label: 'My schedule', detail: count + ' saved', to: () => ctx.push('myschedule', {}) },
    { icon: 'bell', label: 'Notifications', detail: ctx.unread > 0 ? ctx.unread + ' new' : '', to: () => ctx.push('notifications', {}) },
    { icon: 'connect', label: 'My connections', detail: String(connectedCount), to: () => ctx.setTab('connect' as TabId) },
    { icon: 'clock', label: 'My meetings', detail: pendingMeetings > 0 ? pendingMeetings + ' to answer' : String(confirmedMeetings), to: () => ctx.push('meetings', {}) },
    { icon: 'message', label: 'Community feed', to: () => ctx.push('community', {}) },
    { icon: 'map', label: 'Venue map', to: () => ctx.push('venuemap', {}) },
    { icon: 'sparkles', label: 'Interactive activities', to: () => ctx.push('activities', {}) },
    { icon: 'grid', label: 'Sponsors & exhibitors', to: () => ctx.push('sponsors', {}) },
    { icon: 'star', label: 'Give feedback', to: () => ctx.push('feedback', {}) },
    { icon: 'poll', label: 'Post-conference survey', detail: ctx.surveyDone ? 'Done' : '', to: () => ctx.push('survey', {}) },
    { icon: 'info', label: 'Event info & Wi-Fi', to: () => ctx.push('info', {}) },
    { icon: 'settings', label: 'Settings', to: () => ctx.push('settings' as PushScreen, {}) },
    ...(ctx.isAdmin || ctx.isStaff ? [{ icon: 'qr' as IconName, label: 'Entrance scanning', detail: 'Staff', to: () => ctx.push('scanner', {}) }] : []),
    ...(ctx.isAdmin ? [{ icon: 'grid' as IconName, label: 'Admin tools', detail: 'Organiser', to: () => ctx.push('admin', {}) }] : []),
  ]

  return (
    <div>
      <AppHeader title="Profile" />
      <div style={{ padding: '8px 16px', paddingBottom: 'calc(' + (TABBAR_H + 24) + 'px + env(safe-area-inset-bottom, 0px))' }}>
        {/* identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '8px 4px 18px' }}>
          <input ref={fileRef} type="file" accept="image/*" onChange={pickPhoto} style={{ display: 'none' }} />
          <Press onClick={() => fileRef.current?.click()} style={{ position: 'relative' }}>
            <Avatar initials={me.initials} color={me.color} size={64} src={me.avatarUrl} style={{ opacity: uploading ? 0.5 : 1 }} />
            <div style={{ position: 'absolute', right: -2, bottom: -2, width: 24, height: 24, borderRadius: '50%', background: T.green9, color: '#fff', display: 'grid', placeItems: 'center', boxShadow: '0 0 0 2px #fff' }}>
              <Icon name="plus" size={14} stroke={2.4} />
            </div>
          </Press>
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
        <div style={{ background: 'var(--wf-surface)', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
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
        <div style={{ textAlign: 'center', fontFamily: T.onest, fontSize: 11.5, color: T.muted, marginTop: 18 }}>WISEcon27 · {__APP_VERSION__} · Powered by UNIwise</div>
      </div>
    </div>
  )
}
