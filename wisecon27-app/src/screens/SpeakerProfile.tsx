// WISEcon27 — Speaker Profile (pushed): hero, connect/message, bio, sessions.
import { SESSIONS } from '../data'
import { T, STATUS_INSET, TABBAR_H } from '../theme'
import type { AppCtx } from '../store'
import { Avatar, Btn, Eyebrow, IconBtn, SessionRow } from '../components/primitives'

export function SpeakerProfile({ ctx }: { ctx: AppCtx }) {
  const p = ctx.params.speaker!
  const sessions = SESSIONS.filter((s) => (s.speakers || []).includes(p.id))
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
          <IconBtn name="share" onClick={() => ctx.toast('Profile link copied')} color="#fff" bg="rgba(255,255,255,0.16)" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Avatar initials={p.initials} color="rgba(255,255,255,0.22)" size={72} style={{ boxShadow: '0 0 0 2px rgba(255,255,255,0.4)' }} />
          <div style={{ flex: 1 }}>
            <h2 style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 23, color: '#fff', lineHeight: 1.15 }}>{p.name}</h2>
            <div style={{ fontFamily: T.sig, fontSize: 14.5, color: 'rgba(255,255,255,0.92)', marginTop: 3 }}>{p.role}</div>
            <div style={{ fontFamily: T.onest, fontSize: 12.5, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>{p.org}</div>
          </div>
        </div>
      </div>
      <div style={{ padding: '16px 16px 0', display: 'flex', gap: 10 }}>
        <Btn kind="primary" full icon="connect" onClick={() => ctx.toast('Connection request sent')}>Connect</Btn>
        <Btn kind="outline" icon="message" onClick={() => ctx.toast('Messaging coming soon')} style={{ flexShrink: 0 }}>Message</Btn>
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
            <div style={{ background: '#fff', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
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
