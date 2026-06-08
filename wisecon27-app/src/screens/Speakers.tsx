// WISEcon27 — Speakers list with live search (name / role / org).
import { useState } from 'react'
import { T, TABBAR_H } from '../theme'
import type { AppCtx } from '../appState'
import { Icon } from '../components/Icon'
import { AppHeader, Avatar, Press } from '../components/primitives'

export function Speakers({ ctx }: { ctx: AppCtx }) {
  const [q, setQ] = useState('')
  const list = ctx.speakers.filter((s) => (s.name + s.org + s.role).toLowerCase().includes(q.toLowerCase()))
  return (
    <div>
      <AppHeader title="Speakers" sub={`${ctx.speakers.length} speakers`} />
      <div style={{ padding: '12px 16px 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', borderRadius: 'var(--radius-4)', padding: '0 12px', boxShadow: 'inset 0 0 0 1px var(--wf-grey-6)' }}>
          <Icon name="search" size={18} style={{ color: T.muted }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search speakers"
            style={{ flex: 1, border: 'none', outline: 'none', padding: '11px 0', fontFamily: T.sig, fontSize: 15, color: T.ink, background: 'transparent' }}
          />
        </div>
      </div>
      <div style={{ padding: '8px 12px ' + (TABBAR_H + 16) + 'px' }}>
        {list.map((p) => (
          <Press key={p.id} onClick={() => ctx.push('speaker', { speaker: p })} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 8px', borderBottom: '1px solid ' + T.line }}>
            <Avatar initials={p.initials} color={p.color} size={52} src={p.photoUrl} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 16, color: T.ink }}>{p.name}</div>
              <div style={{ fontFamily: T.sig, fontSize: 13.5, color: T.body }}>{p.role}</div>
              <div style={{ fontFamily: T.onest, fontSize: 12, color: T.muted, marginTop: 1 }}>{p.org}</div>
            </div>
            <Icon name="chevronRight" size={20} stroke={2} style={{ color: T.line2 }} />
          </Press>
        ))}
        {list.length === 0 && (
          <div style={{ textAlign: 'center', color: T.muted, padding: 40, fontFamily: T.sig }}>No speakers match “{q}”.</div>
        )}
      </div>
    </div>
  )
}
