// WISEcon27 — Connect (networking): your badge card + Discover/Requests/Messages.
// Attendees, requests, connections and messages are all live from Supabase.
import { useState } from 'react'
import { T, TABBAR_H } from '../theme'
import type { AppCtx } from '../appState'
import type { Attendee } from '../types'
import { AppHeader, Avatar, Btn, Divider, Empty, IconBtn, Press } from '../components/primitives'
import { QR } from '../components/QR'

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'now'
  if (m < 60) return m + 'm'
  const h = Math.floor(m / 60)
  if (h < 24) return h + 'h'
  return Math.floor(h / 24) + 'd'
}

export function Connect({ ctx }: { ctx: AppCtx }) {
  const [tab, setTab] = useState<'discover' | 'requests' | 'messages'>('discover')
  const people = ctx.attendees
  const incomingIds = new Set(ctx.incomingRequests.map((a) => a.id))
  const totalUnread = ctx.conversations.reduce((n, c) => n + c.unread, 0)

  const openConversation = (id: string) => ctx.push('conversation', { peerId: id })

  const request = (p: Attendee) => {
    ctx.setConnection(p.id, 'pending')
    ctx.toast('Request sent to ' + p.name.split(' ')[0])
  }

  // Discover excludes people who are asking to connect with me (those live in Requests)
  const discover = people.filter((p) => !incomingIds.has(p.id))

  const tabs = [
    ['discover', 'Discover'],
    ['requests', `Requests${ctx.incomingRequests.length ? ' · ' + ctx.incomingRequests.length : ''}`],
    ['messages', `Messages${totalUnread ? ' · ' + totalUnread : ''}`],
  ] as const

  return (
    <div>
      <AppHeader title="Connect" sub="Meet fellow delegates" right={<IconBtn name="search" onClick={() => ctx.toast('Search coming soon')} />} />

      {/* your badge card */}
      <div style={{ padding: '12px 16px 0' }}>
        <Press onClick={() => ctx.push('ticket', {})} style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'linear-gradient(135deg, var(--wf-green-9), var(--wf-green-11))', borderRadius: 'var(--radius-5)', padding: 16, color: '#fff' }}>
          <Avatar initials={ctx.me.initials} color="rgba(255,255,255,0.2)" size={48} src={ctx.me.avatarUrl} style={{ boxShadow: '0 0 0 2px rgba(255,255,255,0.4)' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 16 }}>{ctx.me.name}</div>
            <div style={{ fontFamily: T.onest, fontSize: 12.5, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>Tap to share your badge</div>
          </div>
          <div style={{ background: '#fff', borderRadius: 'var(--radius-3)', padding: 5 }}>
            <QR value={ctx.me.badgeId} size={44} />
          </div>
        </Press>
      </div>

      {/* tabs */}
      <div style={{ display: 'flex', gap: 4, padding: '14px 16px 0' }}>
        {tabs.map(([k, l]) => (
          <Press key={k} onClick={() => setTab(k)} style={{ flex: 1, textAlign: 'center', paddingBottom: 10, fontFamily: T.sig, fontWeight: 600, fontSize: 13.5, color: tab === k ? T.green10 : T.muted, borderBottom: '2.5px solid ' + (tab === k ? T.green9 : 'transparent') }}>{l}</Press>
        ))}
      </div>
      <Divider />

      <div style={{ padding: '12px 12px ' + (TABBAR_H + 16) + 'px' }}>
        {/* ── MESSAGES ── */}
        {tab === 'messages' ? (
          ctx.conversations.length === 0 ? (
            <Empty icon="message" text="No messages yet. Connect with a delegate, then start a conversation." />
          ) : (
            ctx.conversations.map((c) => (
              <Press key={c.peerId} onClick={() => openConversation(c.peerId)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 6px', borderBottom: '1px solid ' + T.line }}>
                <Avatar initials={c.peerInitials} color={c.peerColor} size={46} src={c.peerAvatarUrl} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 15, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.peerName}</span>
                    <span style={{ fontFamily: T.onest, fontSize: 11, color: T.muted, flexShrink: 0 }}>{relTime(c.lastAt)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 2 }}>
                    <span style={{ fontFamily: T.sig, fontSize: 13.5, color: c.unread ? T.ink : T.muted, fontWeight: c.unread ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.fromMe ? 'You: ' : ''}{c.lastBody}
                    </span>
                    {c.unread > 0 && (
                      <span style={{ flexShrink: 0, minWidth: 18, height: 18, borderRadius: 999, background: T.green9, color: '#fff', fontFamily: T.onest, fontWeight: 700, fontSize: 11, display: 'grid', placeItems: 'center', padding: '0 5px' }}>{c.unread}</span>
                    )}
                  </div>
                </div>
              </Press>
            ))
          )
        ) : /* ── REQUESTS ── */ tab === 'requests' ? (
          ctx.incomingRequests.length === 0 ? (
            <Empty icon="connect" text="No pending requests." />
          ) : (
            ctx.incomingRequests.map((p) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 6px', borderBottom: '1px solid ' + T.line }}>
                <Avatar initials={p.initials} color={p.color} size={46} src={p.avatarUrl} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 15, color: T.ink }}>{p.name}</div>
                  <div style={{ fontFamily: T.sig, fontSize: 13, color: T.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.role}{p.org ? ' · ' + p.org : ''}</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Btn kind="default" size="sm" onClick={() => ctx.declineConnection(p.id)}>Ignore</Btn>
                  <Btn kind="primary" size="sm" onClick={() => ctx.acceptConnection(p.id)}>Accept</Btn>
                </div>
              </div>
            ))
          )
        ) : /* ── DISCOVER ── */ discover.length === 0 ? (
          <Empty icon="connect" text="No other delegates yet — check back soon." />
        ) : (
          discover.map((p) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 6px', borderBottom: '1px solid ' + T.line }}>
              <Avatar initials={p.initials} color={p.color} size={46} src={p.avatarUrl} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 15, color: T.ink }}>{p.name}</div>
                <div style={{ fontFamily: T.sig, fontSize: 13, color: T.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.role}{p.org ? ' · ' + p.org : ''}</div>
                {p.mutual > 0 && (
                  <div style={{ marginTop: 5 }}>
                    <span style={{ fontFamily: T.onest, fontSize: 11, color: T.green10, background: T.green1, borderRadius: 999, padding: '2px 8px' }}>{p.mutual} shared interests</span>
                  </div>
                )}
              </div>
              {p.status === 'connected' ? (
                <Btn kind="outline" size="sm" icon="message" onClick={() => openConversation(p.id)}>Message</Btn>
              ) : p.status === 'pending' ? (
                <Btn kind="default" size="sm" onClick={() => ctx.setConnection(p.id, 'connect')}>Requested</Btn>
              ) : (
                <Btn kind="primary" size="sm" onClick={() => request(p)}>Connect</Btn>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
