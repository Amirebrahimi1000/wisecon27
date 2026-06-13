// WISEcon27 — My meetings (pushed): Brella-style 1:1 meetings.
// Incoming requests need a reply; confirmed meetings show their meeting point.
import { T, TABBAR_H } from '../theme'
import type { AppCtx } from '../appState'
import type { Meeting } from '../types'
import { Icon } from '../components/Icon'
import { AppHeader, Avatar, Btn, Empty, Eyebrow, Press } from '../components/primitives'
import { FirstTimeHint } from '../components/Hint'

function MeetingCard({ ctx, m }: { ctx: AppCtx; m: Meeting }) {
  const incoming = m.inviteeId === ctx.userId
  const peerId = incoming ? m.requesterId : m.inviteeId
  const peer = ctx.attendees.find((a) => a.id === peerId)
  const day = ctx.days.find((d) => d.id === m.day)
  const point = ctx.meetingPoints.find((p) => p.id === m.pointId)
  return (
    <div style={{ background: 'var(--wf-surface)', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', padding: 14 }}>
      <Press onClick={() => ctx.push('delegate', { peerId })} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Avatar initials={peer?.initials ?? '?'} color={peer?.color ?? 'var(--wf-blue-9)'} size={44} src={peer?.avatarUrl} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 15, color: T.ink }}>{peer?.name ?? 'A delegate'}</div>
          <div style={{ fontFamily: T.sig, fontSize: 12.5, color: T.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {[peer?.role, peer?.org].filter(Boolean).join(' · ')}
          </div>
        </div>
        <Icon name="chevronRight" size={17} stroke={2} style={{ color: T.line2 }} />
      </Press>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px 14px', marginTop: 11, fontFamily: T.sig, fontSize: 13.5, color: T.body }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="calendar" size={15} />{day ? `${day.dow} ${day.date}` : m.day}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="clock" size={15} />{m.start}–{m.end}</span>
        {point && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="pin" size={15} />{point.label}</span>}
      </div>
      {m.message && (
        <div style={{ fontFamily: T.sig, fontSize: 13.5, color: T.muted, marginTop: 9, lineHeight: 1.45, fontStyle: 'italic' }}>
          “{m.message}”
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12, flexWrap: 'wrap' }}>
        {m.status === 'pending' && incoming ? (
          <>
            <Btn kind="default" size="sm" onClick={() => ctx.respondMeeting(m.id, 'declined')}>Decline</Btn>
            <Btn kind="outline" size="sm" icon="clock" onClick={() => ctx.push('meetingrequest', { peerId, meetingId: m.id })}>New time</Btn>
            <Btn kind="primary" size="sm" icon="check" onClick={() => ctx.respondMeeting(m.id, 'accepted')}>Accept</Btn>
          </>
        ) : m.status === 'pending' ? (
          <Btn kind="default" size="sm" onClick={() => { ctx.cancelMeeting(m.id); ctx.toast('Meeting request cancelled') }}>Cancel request</Btn>
        ) : (
          <Btn kind="default" size="sm" onClick={() => { ctx.cancelMeeting(m.id); ctx.toast('Meeting cancelled') }}>Cancel meeting</Btn>
        )}
      </div>
    </div>
  )
}

function Section({ ctx, label, items }: { ctx: AppCtx; label: string; items: Meeting[] }) {
  if (!items.length) return null
  return (
    <div style={{ marginBottom: 20 }}>
      <Eyebrow style={{ marginBottom: 10, paddingLeft: 2 }}>{label}</Eyebrow>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((m) => <MeetingCard key={m.id} ctx={ctx} m={m} />)}
      </div>
    </div>
  )
}

export function Meetings({ ctx }: { ctx: AppCtx }) {
  const byTime = (a: Meeting, b: Meeting) => (a.day + a.start).localeCompare(b.day + b.start)
  const incoming = ctx.meetings.filter((m) => m.status === 'pending' && m.inviteeId === ctx.userId).sort(byTime)
  const outgoing = ctx.meetings.filter((m) => m.status === 'pending' && m.requesterId === ctx.userId).sort(byTime)
  const confirmed = ctx.meetings.filter((m) => m.status === 'accepted').sort(byTime)
  const total = incoming.length + outgoing.length + confirmed.length
  return (
    <div>
      <AppHeader title="My meetings" sub="1:1 networking" onBack={ctx.back} />
      <FirstTimeHint id="meetings" text="Confirmed meetings appear in your agenda, on Home and in your calendar export — and if a suggested time doesn't fit, reply with a new one." />
      <div style={{ padding: '14px 16px ' + (TABBAR_H + 16) + 'px' }}>
        {/* when can people book me? */}
        <Press onClick={() => ctx.push('availability', {})} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--wf-surface)', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', padding: 14, marginBottom: 18 }}>
          <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-2)', background: T.green1, color: T.green10, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <Icon name="clock" size={19} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 14.5, color: T.ink }}>My availability</div>
            <div style={{ fontFamily: T.sig, fontSize: 12.5, color: T.muted, marginTop: 1 }}>Choose when delegates can book you.</div>
          </div>
          <Icon name="chevronRight" size={18} stroke={2} style={{ color: T.line2 }} />
        </Press>
        {total === 0 ? (
          <>
            <Empty icon="connect" text="No meetings yet. Open a delegate's profile and suggest a time — we'll reserve a meeting spot for you." />
            <Btn kind="primary" full icon="connect" onClick={() => ctx.setTab('connect')}>Find delegates to meet</Btn>
          </>
        ) : (
          <>
            <Section ctx={ctx} label="Needs your reply" items={incoming} />
            <Section ctx={ctx} label="Awaiting their reply" items={outgoing} />
            <Section ctx={ctx} label="Confirmed" items={confirmed} />
          </>
        )}
      </div>
    </div>
  )
}
