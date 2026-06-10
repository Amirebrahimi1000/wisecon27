// WISEcon27 — 1:1 conversation with a connected delegate.
import { useEffect, useRef, useState } from 'react'
import { T, TABBAR_H } from '../theme'
import type { AppCtx } from '../appState'
import { AppHeader, Avatar, Empty, IconBtn } from '../components/primitives'

function dayLabel(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
}
function timeLabel(iso: string) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function Conversation({ ctx }: { ctx: AppCtx }) {
  const peerId = ctx.params.peerId || ''
  const peer = ctx.attendees.find((a) => a.id === peerId)
  const msgs = ctx.messagesWith(peerId)
  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  // mark incoming messages read whenever the thread opens or grows
  useEffect(() => {
    ctx.markThreadRead(peerId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peerId, msgs.length])

  // keep the newest message in view
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [msgs.length])

  const send = () => {
    const t = text.trim()
    if (!t) return
    setText('')
    ctx.sendMessage(peerId, t)
  }

  return (
    <div style={{ minHeight: '100%', background: 'var(--wf-grey-2)' }}>
      <AppHeader
        title={peer?.name || ctx.nameFor(peerId)}
        sub={peer ? [peer.role, peer.org].filter(Boolean).join(' · ') || undefined : undefined}
        onBack={ctx.back}
        right={peer ? <Avatar initials={peer.initials} color={peer.color} size={36} src={peer.avatarUrl} /> : undefined}
      />

      <div style={{ padding: '14px 14px 0', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 'calc(100dvh - 320px)' }}>
        {msgs.length === 0 ? (
          <Empty icon="message" text={`Say hello to ${(peer?.name || 'your connection').split(' ')[0]} 👋`} />
        ) : (
          msgs.map((m, i) => {
            const mine = m.senderId === ctx.userId
            const prev = msgs[i - 1]
            const showDay = !prev || dayLabel(prev.createdAt) !== dayLabel(m.createdAt)
            return (
              <div key={m.id}>
                {showDay && (
                  <div style={{ textAlign: 'center', fontFamily: T.onest, fontSize: 11, color: T.muted, margin: '8px 0' }}>{dayLabel(m.createdAt)}</div>
                )}
                <div style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                  <div
                    style={{
                      maxWidth: '78%',
                      background: mine ? T.green9 : 'var(--wf-surface)',
                      color: mine ? '#fff' : T.ink,
                      borderRadius: mine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      padding: '9px 13px',
                      fontFamily: T.sig,
                      fontSize: 14.5,
                      lineHeight: 1.4,
                      boxShadow: mine ? 'none' : 'var(--shadow-sm)',
                      wordBreak: 'break-word',
                    }}
                  >
                    {m.body}
                    <span style={{ display: 'block', fontFamily: T.onest, fontSize: 10, opacity: 0.6, marginTop: 3, textAlign: 'right' }}>
                      {timeLabel(m.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* composer — floats just above the tab bar */}
      <div style={{ position: 'sticky', bottom: TABBAR_H, marginTop: 12, padding: '10px 12px', background: 'var(--wf-grey-2)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, background: 'var(--wf-surface)', borderRadius: 22, padding: '6px 6px 6px 14px', boxShadow: 'inset 0 0 0 1px var(--wf-grey-6)' }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
            placeholder="Message…"
            rows={1}
            style={{ flex: 1, border: 'none', outline: 'none', resize: 'none', background: 'transparent', fontFamily: T.sig, fontSize: 15, color: T.ink, padding: '8px 0', maxHeight: 120, lineHeight: 1.4 }}
          />
          <IconBtn name="send" onClick={send} size={40} bg={text.trim() ? T.green9 : 'var(--wf-grey-4)'} color={text.trim() ? '#fff' : T.muted} />
        </div>
      </div>
    </div>
  )
}
