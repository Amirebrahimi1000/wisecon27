// WISEcon27 — first-login profile completion. Shown once, until the user has a name.
import { useState } from 'react'
import type { AppCtx } from '../appState'
import { T, STATUS_INSET } from '../theme'
import { Avatar, Btn } from '../components/primitives'

const initialsFrom = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')

export function ProfileSetup({ ctx }: { ctx: AppCtx }) {
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [org, setOrg] = useState('')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!name.trim() || saving) return
    setSaving(true)
    await ctx.updateProfile({ name: name.trim(), role: role.trim(), org: org.trim() })
    // me.name is now set → AuthedApp renders the full app
  }

  const field = (label: string, value: string, set: (v: string) => void, placeholder: string) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontFamily: T.onest, fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: T.muted, marginBottom: 6 }}>{label}</div>
      <input
        value={value}
        onChange={(e) => set(e.target.value)}
        placeholder={placeholder}
        style={{ width: '100%', boxSizing: 'border-box', border: 'none', outline: 'none', background: '#fff', borderRadius: 'var(--radius-4)', padding: '13px 14px', fontFamily: T.sig, fontSize: 15.5, color: T.ink, boxShadow: 'inset 0 0 0 1px var(--wf-grey-6)' }}
      />
    </div>
  )

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: 'var(--wf-grey-2)' }}>
      <div style={{ padding: STATUS_INSET + 'px 22px 0', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16, marginBottom: 16 }}>
          <Avatar initials={initialsFrom(name) || '·'} color="var(--wf-green-9)" size={76} />
        </div>
        <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 23, color: T.ink }}>Welcome to WISEcon27</div>
        <p style={{ fontFamily: T.sig, fontSize: 15, color: T.muted, marginTop: 8, lineHeight: 1.5 }}>
          Set up your delegate badge. This is how other attendees will see you.
        </p>
      </div>
      <div style={{ padding: '24px 22px 40px' }}>
        {field('Full name', name, setName, 'e.g. Maria Nielsen')}
        {field('Role', role, setRole, 'e.g. Assessment Lead')}
        {field('Organisation', org, setOrg, 'e.g. Aarhus University')}
        <Btn kind="primary" full size="lg" onClick={save} disabled={!name.trim() || saving} style={{ marginTop: 8 }}>
          {saving ? 'Saving…' : 'Continue'}
        </Btn>
      </div>
    </div>
  )
}
