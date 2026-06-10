// WISEcon27 — edit my profile. Name, email, role and organisation come from
// registration (HubSpot) and are locked; everything else is optional, with a
// per-field choice of what other delegates may see.
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { T, TABBAR_H } from '../theme'
import type { AppCtx } from '../appState'
import { Icon } from '../components/Icon'
import { AppHeader, Btn, Eyebrow, Press } from '../components/primitives'

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', border: 'none', outline: 'none', background: 'var(--wf-surface)',
  borderRadius: 'var(--radius-4)', padding: '12px 13px', fontFamily: T.sig, fontSize: 15, color: T.ink,
  boxShadow: 'inset 0 0 0 1px var(--wf-grey-6)',
}

function Toggle({ on, onTap }: { on: boolean; onTap: () => void }) {
  return (
    <Press onClick={onTap} style={{ width: 46, height: 27, borderRadius: 999, background: on ? T.green9 : 'var(--wf-grey-6)', position: 'relative', flexShrink: 0, transition: 'background .15s var(--ease-out)' }}>
      <span style={{ position: 'absolute', top: 3, left: on ? 22 : 3, width: 21, height: 21, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.25)', transition: 'left .15s var(--ease-out)' }} />
    </Press>
  )
}

export function EditProfile({ ctx }: { ctx: AppCtx }) {
  const [email, setEmail] = useState('')
  const [bio, setBio] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [interests, setInterests] = useState('')
  const [share, setShare] = useState<Record<string, boolean>>({})
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase
      .from('profiles')
      .select('email, bio, linkedin, interests, share_prefs')
      .eq('id', ctx.userId)
      .single()
      .then(({ data }) => {
        if (!data) return
        const d = data as { email: string; bio: string; linkedin: string; interests: string[]; share_prefs: Record<string, boolean> | null }
        setEmail(d.email)
        setBio(d.bio ?? '')
        setLinkedin(d.linkedin ?? '')
        setInterests((d.interests ?? []).join(', '))
        setShare(d.share_prefs ?? {})
        setLoaded(true)
      })
  }, [ctx.userId])

  const sharedOn = (k: string) => share[k] !== false
  const flip = (k: string) => setShare((s) => ({ ...s, [k]: s[k] === false }))

  const save = async () => {
    if (saving) return
    setSaving(true)
    const ints = interests.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 8)
    const { error } = await supabase
      .from('profiles')
      .update({ bio: bio.trim(), linkedin: linkedin.trim(), interests: ints, share_prefs: share })
      .eq('id', ctx.userId)
    setSaving(false)
    if (error) return ctx.toast(error.message)
    ctx.toast('Profile updated')
    ctx.back()
  }

  const locked = [
    ['Name', ctx.me.name],
    ['Email', email],
    ['Role', ctx.me.role],
    ['Organisation', ctx.me.org],
  ] as const

  return (
    <div style={{ minHeight: '100%', background: 'var(--wf-grey-2)' }}>
      <AppHeader title="Edit profile" onBack={ctx.back} />
      <div style={{ padding: '14px 16px ' + (TABBAR_H + 16) + 'px' }}>
        {/* registration data — locked */}
        <Eyebrow style={{ marginBottom: 8, paddingLeft: 2 }}>From your registration</Eyebrow>
        <div style={{ background: 'var(--wf-surface)', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', overflow: 'hidden', marginBottom: 8 }}>
          {locked.map(([label, value], i) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: i === locked.length - 1 ? 'none' : '1px solid ' + T.line }}>
              <span style={{ width: 100, flexShrink: 0, fontFamily: T.onest, fontSize: 12, color: T.muted }}>{label}</span>
              <span style={{ flex: 1, fontFamily: T.sig, fontSize: 14.5, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value || '—'}</span>
              <Icon name="shield" size={15} style={{ color: T.muted, flexShrink: 0 }} />
            </div>
          ))}
        </div>
        <div style={{ fontFamily: T.onest, fontSize: 11.5, color: T.muted, marginBottom: 22, paddingLeft: 2, lineHeight: 1.5 }}>
          These come from your registration and are always visible to other delegates. Contact the organisers to change them.
        </div>

        {/* optional extras */}
        <Eyebrow style={{ marginBottom: 8, paddingLeft: 2 }}>About you — optional</Eyebrow>
        <div style={{ marginBottom: 14 }}>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 280))}
            placeholder="A few lines about yourself, what you work on, or what you'd like to talk about at WISEcon…"
            rows={4}
            maxLength={280}
            style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }}
            disabled={!loaded}
          />
          <div style={{ fontFamily: T.onest, fontSize: 11, color: T.muted, textAlign: 'right', marginTop: 4 }}>{bio.length}/280</div>
        </div>
        <input
          value={linkedin}
          onChange={(e) => setLinkedin(e.target.value)}
          placeholder="LinkedIn URL (e.g. linkedin.com/in/you)"
          style={{ ...inputStyle, marginBottom: 12 }}
          disabled={!loaded}
        />
        <input
          value={interests}
          onChange={(e) => setInterests(e.target.value)}
          placeholder="Interests, comma-separated (e.g. AI, rubrics, integrity)"
          style={{ ...inputStyle, marginBottom: 22 }}
          disabled={!loaded}
        />

        {/* sharing */}
        <Eyebrow style={{ marginBottom: 8, paddingLeft: 2 }}>What other delegates can see</Eyebrow>
        <div style={{ background: 'var(--wf-surface)', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', overflow: 'hidden', marginBottom: 8 }}>
          {([['bio', 'About text'], ['linkedin', 'LinkedIn'], ['interests', 'Interests']] as const).map(([k, label], i) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', borderBottom: i === 2 ? 'none' : '1px solid ' + T.line }}>
              <span style={{ flex: 1, fontFamily: T.sig, fontWeight: 600, fontSize: 14.5, color: T.ink }}>{label}</span>
              <Toggle on={sharedOn(k)} onTap={() => flip(k)} />
            </div>
          ))}
        </div>
        <div style={{ fontFamily: T.onest, fontSize: 11.5, color: T.muted, marginBottom: 20, paddingLeft: 2, lineHeight: 1.5 }}>
          Name, email, role and organisation are always shown.
        </div>

        <Btn kind="primary" full size="lg" onClick={save} disabled={!loaded || saving}>
          {saving ? 'Saving…' : 'Save profile'}
        </Btn>
      </div>
    </div>
  )
}
