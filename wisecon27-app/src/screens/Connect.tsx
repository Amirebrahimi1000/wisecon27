// WISEcon27 — Connect (networking): your badge card + Discover/Requests/Messages.
import { useState } from 'react'
import { ATTENDEES, ME } from '../data'
import { T, TABBAR_H } from '../theme'
import type { AppCtx } from '../store'
import type { Attendee, ConnectStatus } from '../types'
import { AppHeader, Avatar, Btn, Divider, Empty, IconBtn, Press } from '../components/primitives'
import { QR } from '../components/QR'

const LABEL: Record<ConnectStatus, string> = { connect: 'Connect', pending: 'Pending', connected: 'Connected' }

export function Connect({ ctx }: { ctx: AppCtx }) {
  const [tab, setTab] = useState<'discover' | 'requests' | 'messages'>('discover')
  // merge seed attendees with persisted connection statuses
  const people: Attendee[] = ATTENDEES.map((a) => ({ ...a, status: ctx.connections[a.id] ?? a.status }))

  const toggle = (p: Attendee) => {
    const next: ConnectStatus =
      p.status === 'connect' ? 'pending' : p.status === 'pending' ? 'connect' : 'connected'
    if (p.status === 'connect') ctx.toast('Request sent to ' + p.name.split(' ')[0])
    ctx.setConnection(p.id, next)
  }

  const requests = people.filter((p) => p.status === 'pending')
  const shown = tab === 'requests' ? requests : people

  return (
    <div>
      <AppHeader title="Connect" sub="Meet fellow delegates" right={<IconBtn name="search" onClick={() => ctx.toast('Search coming soon')} />} />
      {/* your badge card */}
      <div style={{ padding: '12px 16px 0' }}>
        <Press onClick={() => ctx.push('ticket', {})} style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'linear-gradient(135deg, var(--wf-green-9), var(--wf-green-11))', borderRadius: 'var(--radius-5)', padding: 16, color: '#fff' }}>
          <Avatar initials={ME.initials} color="rgba(255,255,255,0.2)" size={48} style={{ boxShadow: '0 0 0 2px rgba(255,255,255,0.4)' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 16 }}>{ME.name}</div>
            <div style={{ fontFamily: T.onest, fontSize: 12.5, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>Tap to share your badge</div>
          </div>
          <div style={{ background: '#fff', borderRadius: 'var(--radius-3)', padding: 5 }}>
            <QR value={ME.badgeId} size={44} />
          </div>
        </Press>
      </div>
      {/* tabs */}
      <div style={{ display: 'flex', gap: 4, padding: '14px 16px 0' }}>
        {([['discover', 'Discover'], ['requests', `Requests${requests.length ? ' · ' + requests.length : ''}`], ['messages', 'Messages']] as const).map(([k, l]) => (
          <Press key={k} onClick={() => setTab(k)} style={{ flex: 1, textAlign: 'center', paddingBottom: 10, fontFamily: T.sig, fontWeight: 600, fontSize: 13.5, color: tab === k ? T.green10 : T.muted, borderBottom: '2.5px solid ' + (tab === k ? T.green9 : 'transparent') }}>{l}</Press>
        ))}
      </div>
      <Divider />
      <div style={{ padding: '12px 12px ' + (TABBAR_H + 16) + 'px' }}>
        {tab === 'messages' ? (
          <MessagesList ctx={ctx} people={people} />
        ) : (
          shown.map((p) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 6px', borderBottom: '1px solid ' + T.line }}>
              <Avatar initials={p.initials} color={p.color} size={46} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 15, color: T.ink }}>{p.name}</div>
                <div style={{ fontFamily: T.sig, fontSize: 13, color: T.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.role} · {p.org}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 5 }}>
                  {p.mutual > 0 && (
                    <span style={{ fontFamily: T.onest, fontSize: 11, color: T.green10, background: T.green1, borderRadius: 999, padding: '2px 8px' }}>{p.mutual} shared interests</span>
                  )}
                </div>
              </div>
              <Btn
                kind={p.status === 'connect' ? 'primary' : p.status === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggle(p)}
                icon={p.status === 'connected' ? 'message' : undefined}
              >
                {LABEL[p.status]}
              </Btn>
            </div>
          ))
        )}
        {tab === 'requests' && requests.length === 0 && <Empty icon="connect" text="No pending requests." />}
      </div>
    </div>
  )
}

function MessagesList({ ctx, people }: { ctx: AppCtx; people: Attendee[] }) {
  const threads = [
    { p: people.find((x) => x.id === 'a6')!, last: 'See you at the reception tonight!', time: '14:02', unread: 0 },
    { p: people.find((x) => x.id === 'a3')!, last: 'Thanks — really enjoyed your question.', time: '11:20', unread: 2 },
  ]
  return (
    <div>
      {threads.map((t, i) => (
        <Press key={i} onClick={() => ctx.toast('Chat coming soon')} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 6px', borderBottom: '1px solid ' + T.line }}>
          <Avatar initials={t.p.initials} color={t.p.color} size={46} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 15, color: T.ink }}>{t.p.name}</span>
              <span style={{ fontFamily: T.onest, fontSize: 11, color: T.muted }}>{t.time}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: T.sig, fontSize: 13.5, color: T.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.last}</span>
              {t.unread > 0 && (
                <span style={{ background: T.green9, color: '#fff', fontFamily: T.onest, fontWeight: 700, fontSize: 11, minWidth: 18, height: 18, borderRadius: 999, display: 'grid', placeItems: 'center', padding: '0 5px' }}>{t.unread}</span>
              )}
            </div>
          </div>
        </Press>
      ))}
    </div>
  )
}
