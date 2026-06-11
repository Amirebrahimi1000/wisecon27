// WISEcon27 — another delegate's profile (pushed from Connect or badge scan).
// Name, email, role and organisation are always shown; bio, LinkedIn and
// interests appear only if the delegate chose to share them.
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { T, TABBAR_H } from '../theme'
import type { AppCtx } from '../appState'
import { Icon } from '../components/Icon'
import { AppHeader, Avatar, Btn, Eyebrow } from '../components/primitives'

interface FullProfile {
  id: string
  name: string
  initials: string
  role: string
  org: string
  color: string
  avatar_url: string | null
  email: string
  bio: string
  linkedin: string
  interests: string[]
  share_prefs: Record<string, boolean> | null
}

export function DelegateProfile({ ctx }: { ctx: AppCtx }) {
  const peerId = ctx.params.peerId || ''
  const [p, setP] = useState<FullProfile | null>(null)
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, name, initials, role, org, color, avatar_url, email, bio, linkedin, interests, share_prefs')
      .eq('id', peerId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setP(data as FullProfile)
        else setMissing(true)
      })
  }, [peerId])

  const att = ctx.attendees.find((a) => a.id === peerId)
  const incoming = ctx.incomingRequests.some((a) => a.id === peerId)
  const shared = (key: string) => (p?.share_prefs?.[key] ?? true) !== false

  return (
    <div style={{ minHeight: '100%', background: 'var(--wf-grey-2)' }}>
      <AppHeader title="Delegate" onBack={ctx.back} />
      <div style={{ padding: '14px 16px ' + (TABBAR_H + 16) + 'px' }}>
        {missing && <Eyebrow>This profile is no longer available.</Eyebrow>}
        {p && (
          <>
            {/* identity card */}
            <div style={{ background: 'var(--wf-surface)', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', padding: 20, textAlign: 'center' }}>
              <Avatar initials={p.initials || '?'} color={p.color} size={76} src={p.avatar_url} style={{ margin: '0 auto' }} />
              <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 21, color: T.ink, marginTop: 12 }}>{p.name}</div>
              <div style={{ fontFamily: T.sig, fontSize: 14.5, color: T.body, marginTop: 3 }}>{[p.role, p.org].filter(Boolean).join(' · ')}</div>
              {p.email && (
                <a href={'mailto:' + p.email} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, fontFamily: T.sig, fontSize: 13.5, color: T.green10, textDecoration: 'none' }}>
                  <Icon name="message" size={15} /> {p.email}
                </a>
              )}

              {/* actions */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
                {incoming ? (
                  <>
                    <Btn kind="default" size="sm" onClick={() => { ctx.declineConnection(p.id); ctx.back() }}>Ignore</Btn>
                    <Btn kind="primary" size="sm" onClick={() => ctx.acceptConnection(p.id)}>Accept request</Btn>
                  </>
                ) : att?.status === 'connected' ? (
                  <Btn kind="primary" size="sm" icon="message" onClick={() => ctx.push('conversation', { peerId: p.id })}>Message</Btn>
                ) : att?.status === 'pending' ? (
                  <Btn kind="default" size="sm" onClick={() => ctx.setConnection(p.id, 'connect')}>Requested — cancel</Btn>
                ) : (
                  <Btn kind="primary" size="sm" icon="connect" onClick={() => { ctx.setConnection(p.id, 'pending'); ctx.toast('Request sent') }}>Connect</Btn>
                )}
                {!incoming && (
                  <Btn kind="outline" size="sm" icon="calendar" onClick={() => ctx.push('meetingrequest', { peerId: p.id })}>Suggest meeting</Btn>
                )}
              </div>
            </div>

            {/* shared extras */}
            {shared('bio') && p.bio.trim() && (
              <div style={{ background: 'var(--wf-surface)', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', padding: 16, marginTop: 14 }}>
                <Eyebrow style={{ marginBottom: 8 }}>About</Eyebrow>
                <div style={{ fontFamily: T.sig, fontSize: 14.5, color: T.body, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{p.bio}</div>
              </div>
            )}
            {shared('interests') && p.interests.length > 0 && (
              <div style={{ background: 'var(--wf-surface)', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', padding: 16, marginTop: 14 }}>
                <Eyebrow style={{ marginBottom: 10 }}>Interests</Eyebrow>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {p.interests.map((i) => (
                    <span key={i} style={{ fontFamily: T.sig, fontWeight: 600, fontSize: 13, color: T.green10, background: T.green1, borderRadius: 999, padding: '5px 12px' }}>{i}</span>
                  ))}
                </div>
              </div>
            )}
            {shared('linkedin') && p.linkedin.trim() && (
              <a
                href={p.linkedin.startsWith('http') ? p.linkedin : 'https://' + p.linkedin}
                target="_blank"
                rel="noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--wf-surface)', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', padding: 16, marginTop: 14, textDecoration: 'none' }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-3)', background: 'var(--wf-blue-1)', color: 'var(--wf-blue-9)', display: 'grid', placeItems: 'center' }}>
                  <Icon name="connect" size={19} />
                </div>
                <span style={{ flex: 1, fontFamily: T.sig, fontWeight: 600, fontSize: 14.5, color: T.ink }}>LinkedIn profile</span>
                <Icon name="chevronRight" size={18} stroke={2} style={{ color: T.muted }} />
              </a>
            )}
          </>
        )}
      </div>
    </div>
  )
}
