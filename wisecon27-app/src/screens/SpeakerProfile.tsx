// WISEcon27 — Speaker Profile (pushed): hero, connect/message, bio, sessions.
// Connect/Message work against the speaker's delegate profile when they have
// one (matched by name); otherwise we say so instead of pretending.
import { T, STATUS_INSET, TABBAR_H } from '../theme'
import type { AppCtx } from '../appState'
import { Avatar, Btn, Eyebrow, IconBtn, SessionRow } from '../components/primitives'
import { shareOrCopy } from '../lib/share'

const norm = (n: string) => n.toLowerCase().replace(/^(dr|prof)\.?\s+/i, '').trim()

export function SpeakerProfile({ ctx }: { ctx: AppCtx }) {
  const p = ctx.params.speaker!
  const sessions = ctx.sessions.filter((s) => (s.speakers || []).includes(p.id))
  const delegate = ctx.attendees.find((a) => norm(a.name) === norm(p.name))
  const first = p.name.replace(/^(Dr\.|Prof\.) /, '').split(' ')[0]

  const share = async () => {
    const r = await shareOrCopy('WISEcon27', `${p.name} — ${[p.role, p.org].filter(Boolean).join(', ')} · speaking at WISEcon27`)
    if (r === 'copied') ctx.toast('Speaker details copied')
    else if (r === 'failed') ctx.toast('Sharing isn’t available on this device')
  }

  const connect = () => {
    if (!delegate) return ctx.toast(first + ' isn’t on the delegate list — catch them after their session')
    if (delegate.status === 'connected') return ctx.toast('You’re already connected with ' + first)
    if (delegate.status === 'pending') return ctx.toast('Request already sent')
    ctx.setConnection(delegate.id, 'pending')
    ctx.toast('Request sent to ' + first)
  }

  const message = () => {
    if (!delegate) return ctx.toast(first + ' isn’t on the delegate list — catch them after their session')
    if (delegate.status !== 'connected') return ctx.toast('Connect with ' + first + ' first to send a message')
    ctx.push('conversation', { peerId: delegate.id })
  }
  return (
    <div style={{ paddingBottom: TABBAR_H + 16 }}>
      <div
        style={{
          position: 'relative',
          padding: STATUS_INSET + 8 + 'px 18px 24px',
          background: `linear-gradient(150deg, color-mix(in srgb, ${p.color} 88%, #fff), color-mix(in srgb, ${p.color} 70%, #000))`,
          color: '#fff',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
          <IconBtn name="chevronLeft" onClick={ctx.back} stroke={2.2} color="#fff" bg="rgba(255,255,255,0.16)" />
          <IconBtn name="share" onClick={share} color="#fff" bg="rgba(255,255,255,0.16)" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Avatar initials={p.initials} color="rgba(255,255,255,0.22)" size={72} src={p.photoUrl} style={{ boxShadow: '0 0 0 2px rgba(255,255,255,0.4)' }} />
          <div style={{ flex: 1 }}>
            <h2 style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 23, color: '#fff', lineHeight: 1.15 }}>{p.name}</h2>
            <div style={{ fontFamily: T.sig, fontSize: 14.5, color: 'rgba(255,255,255,0.92)', marginTop: 3 }}>{p.role}</div>
            <div style={{ fontFamily: T.onest, fontSize: 12.5, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>{p.org}</div>
          </div>
        </div>
      </div>
      <div style={{ padding: '16px 16px 0', display: 'flex', gap: 10 }}>
        {delegate?.status === 'connected' ? (
          <Btn kind="primary" full icon="message" onClick={message}>Message</Btn>
        ) : (
          <>
            <Btn kind={delegate?.status === 'pending' ? 'default' : 'primary'} full icon={delegate?.status === 'pending' ? 'check' : 'connect'} onClick={connect}>
              {delegate?.status === 'pending' ? 'Requested' : 'Connect'}
            </Btn>
            <Btn kind="outline" icon="message" onClick={message} style={{ flexShrink: 0 }}>Message</Btn>
          </>
        )}
      </div>
      <div style={{ padding: '20px 16px 0', display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div>
          <Eyebrow style={{ marginBottom: 8 }}>About</Eyebrow>
          <p style={{ fontFamily: T.sig, fontSize: 15.5, lineHeight: 1.55, color: T.body }}>{p.bio}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {p.topics.map((t) => (
              <span key={t} style={{ fontFamily: T.sig, fontSize: 12.5, fontWeight: 600, color: T.subtle, background: T.sunken, borderRadius: 999, padding: '5px 12px' }}>{t}</span>
            ))}
          </div>
        </div>
        {sessions.length > 0 && (
          <div>
            <Eyebrow style={{ marginBottom: 10 }}>Sessions ({sessions.length})</Eyebrow>
            <div style={{ background: 'var(--wf-surface)', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
              {sessions.map((s, i) => (
                <div key={s.id} style={{ borderBottom: i === sessions.length - 1 ? 'none' : '1px solid ' + T.line }}>
                  <SessionRow s={s} bookmarked={ctx.isBookmarked(s.id)} onToggle={() => ctx.toggleBookmark(s.id)} onOpen={ctx.openSession} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
