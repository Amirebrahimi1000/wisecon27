// WISEcon27 — More: a grouped directory of every section, plus the badge and sign out.
// Identity (avatar, name, edit, photo upload) lives on Home now — this screen is a
// single-purpose menu so features like Sponsors and Event info are easy to find.
import { T, TABBAR_H } from '../theme'
import type { AppCtx, PushScreen, TabId } from '../appState'
import type { IconName } from '../components/Icon'
import { Icon } from '../components/Icon'
import { AppHeader, Avatar, Btn, Eyebrow, Press } from '../components/primitives'
import { QR } from '../components/QR'
import { useAuth } from '../auth'

export function Profile({ ctx }: { ctx: AppCtx }) {
  const { signOut } = useAuth()
  const me = ctx.me
  const count = ctx.sessions.filter((s) => ctx.isBookmarked(s.id)).length
  const connectedCount = ctx.attendees.filter((a) => a.status === 'connected').length
  const pendingMeetings = ctx.meetings.filter((m) => m.status === 'pending' && m.inviteeId === ctx.userId).length
  const confirmedMeetings = ctx.meetings.filter((m) => m.status === 'accepted').length

  interface Row { icon: IconName; label: string; detail?: string; to: () => void }
  interface Section { title: string; rows: Row[] }
  const sections: Section[] = [
    { title: 'My event', rows: [
      { icon: 'calendar', label: 'My schedule', detail: count + ' saved', to: () => ctx.push('myschedule', {}) },
      { icon: 'connect', label: 'My connections', detail: String(connectedCount), to: () => ctx.setTab('connect' as TabId) },
      { icon: 'clock', label: 'My meetings', detail: pendingMeetings > 0 ? pendingMeetings + ' to answer' : String(confirmedMeetings), to: () => ctx.push('meetings', {}) },
      { icon: 'bell', label: 'Notifications', detail: ctx.unread > 0 ? ctx.unread + ' new' : '', to: () => ctx.push('notifications', {}) },
    ] },
    { title: 'Explore', rows: [
      { icon: 'grid', label: 'Sponsors & exhibitors', to: () => ctx.push('sponsors', {}) },
      { icon: 'message', label: 'Community feed', to: () => ctx.push('community', {}) },
      { icon: 'map', label: 'Venue map', to: () => ctx.push('venuemap', {}) },
      { icon: 'sparkles', label: 'Interactive activities', to: () => ctx.push('activities', {}) },
      { icon: 'info', label: 'Event info & Wi-Fi', to: () => ctx.push('info', {}) },
    ] },
    { title: 'Support & settings', rows: [
      { icon: 'star', label: 'Give feedback', to: () => ctx.push('feedback', {}) },
      { icon: 'poll', label: 'Post-conference survey', detail: ctx.surveyDone ? 'Done' : '', to: () => ctx.push('survey', {}) },
      { icon: 'arrowRight', label: 'Take the app tour', detail: '1 min', to: () => ctx.push('tour', {}) },
      { icon: 'settings', label: 'Settings', to: () => ctx.push('settings' as PushScreen, {}) },
    ] },
    ...(ctx.isAdmin || ctx.isStaff ? [{ title: 'Organiser', rows: [
      { icon: 'qr' as IconName, label: 'Entrance scanning', detail: 'Staff', to: () => ctx.push('scanner', {}) },
      ...(ctx.isAdmin ? [{ icon: 'grid' as IconName, label: 'Admin tools', detail: 'Organiser', to: () => ctx.push('admin', {}) }] : []),
    ] }] : []),
  ]

  return (
    <div>
      <AppHeader title="More" />
      <div style={{ padding: '8px 16px', paddingBottom: 'calc(' + (TABBAR_H + 24) + 'px + env(safe-area-inset-bottom, 0px))' }}>
        {/* my profile — tap through to edit; nudges a first-time fill-out */}
        <Press onClick={() => ctx.push('editprofile', {})} style={{ display: 'flex', alignItems: 'center', gap: 13, background: 'var(--wf-surface)', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', padding: 14, marginBottom: 14 }}>
          <Avatar initials={me.initials} color={me.color} size={48} src={me.avatarUrl} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <Eyebrow color={T.subtle}>My profile</Eyebrow>
            <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 16.5, color: T.ink, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{me.name}</div>
            {me.avatarUrl ? (
              <div style={{ fontFamily: T.onest, fontSize: 12.5, color: T.muted, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {[me.role, me.org].filter(Boolean).join(' · ') || 'View and edit your profile'}
              </div>
            ) : (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 3, fontFamily: T.sig, fontWeight: 600, fontSize: 12.5, color: T.green10 }}>
                <Icon name="sparkles" size={13} /> Add a photo & interests
              </div>
            )}
          </div>
          <Icon name="chevronRight" size={18} stroke={2} style={{ color: T.line2 }} />
        </Press>
        {/* badge */}
        <Press onClick={() => ctx.push('ticket', {})} style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#111', borderRadius: 'var(--radius-5)', padding: 16, color: '#fff', marginBottom: 22 }}>
          <div style={{ background: '#fff', borderRadius: 'var(--radius-2)', padding: 6 }}>
            <QR value={me.badgeId} size={56} />
          </div>
          <div style={{ flex: 1 }}>
            <Eyebrow color="rgba(255,255,255,0.6)">My badge</Eyebrow>
            <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 16, marginTop: 3 }}>{me.ticket}</div>
            <div style={{ fontFamily: T.onest, fontSize: 12.5, color: 'rgba(255,255,255,0.7)', marginTop: 1 }}>{me.badgeId}</div>
          </div>
          <Icon name="qr" size={22} style={{ color: 'rgba(255,255,255,0.7)' }} />
        </Press>
        {/* grouped directory */}
        {sections.map((sec) => (
          <div key={sec.title} style={{ marginBottom: 18 }}>
            <Eyebrow style={{ paddingLeft: 4, marginBottom: 8 }} color={T.subtle}>{sec.title}</Eyebrow>
            <div style={{ background: 'var(--wf-surface)', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
              {sec.rows.map((r, i) => (
                <Press key={r.label} onClick={r.to} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 16px', borderBottom: i === sec.rows.length - 1 ? 'none' : '1px solid ' + T.line }}>
                  <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-2)', background: T.sunken, display: 'grid', placeItems: 'center', color: T.body }}>
                    <Icon name={r.icon} size={18} />
                  </div>
                  <span style={{ flex: 1, fontFamily: T.sig, fontWeight: 500, fontSize: 15.5, color: T.ink }}>{r.label}</span>
                  {r.detail && <span style={{ fontFamily: T.onest, fontSize: 12.5, color: T.muted }}>{r.detail}</span>}
                  <Icon name="chevronRight" size={18} stroke={2} style={{ color: T.line2 }} />
                </Press>
              ))}
            </div>
          </div>
        ))}
        <div style={{ textAlign: 'center', marginTop: 6 }}>
          <Btn kind="danger" icon="logout" onClick={() => signOut()}>Sign out</Btn>
        </div>
        <div style={{ textAlign: 'center', fontFamily: T.onest, fontSize: 11.5, color: T.muted, marginTop: 18 }}>WISEcon27 · {__APP_VERSION__} · Powered by UNIwise</div>
      </div>
    </div>
  )
}
