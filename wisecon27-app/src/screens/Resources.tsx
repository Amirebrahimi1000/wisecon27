// WISEcon27 — Slides & recordings hub: every slide deck and shared resource
// (recordings are shared as links/files by speakers) across the whole
// programme, grouped by session. Reuses the existing per-session slides +
// session_resources, so nothing new is stored.
import { T, TABBAR_H } from '../theme'
import type { AppCtx } from '../appState'
import type { Session } from '../types'
import { Icon } from '../components/Icon'
import { AppHeader, Empty, Press } from '../components/primitives'
import { slidesPublicUrl } from '../lib/storage'
import { useT } from '../i18n'

interface ResItem { label: string; href: string; kind: 'slides' | 'recording' | 'link' }

const isRecording = (label: string) => /record|recording|video|optag|opptak|aufzeichnung/i.test(label)

export function Resources({ ctx }: { ctx: AppCtx }) {
  const { t } = useT()

  // build a per-session list of downloadable items, in programme order
  const groups = ctx.sessions
    .slice()
    .sort((a, b) => (a.day + a.start).localeCompare(b.day + b.start))
    .map((s) => {
      const items: ResItem[] = []
      if (s.slidesPath) items.push({ label: s.slidesName || t('res.slides'), href: slidesPublicUrl(s.slidesPath), kind: 'slides' })
      for (const r of ctx.resourcesOf(s.id)) {
        const href = r.path ? slidesPublicUrl(r.path) : r.url ?? ''
        if (!href) continue
        items.push({ label: r.label, href, kind: isRecording(r.label) ? 'recording' : 'link' })
      }
      return { session: s, items }
    })
    .filter((g) => g.items.length > 0)

  return (
    <div>
      <AppHeader title={t('res.title')} onBack={ctx.back} />
      <div style={{ padding: '14px 16px ' + (TABBAR_H + 16) + 'px' }}>
        <p style={{ fontFamily: T.sig, fontSize: 14.5, color: T.muted, lineHeight: 1.5, marginBottom: 16 }}>{t('res.subtitle')}</p>
        {groups.length === 0 ? (
          <Empty icon="download" text={t('res.empty')} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {groups.map((g) => (
              <SessionGroup key={g.session.id} ctx={ctx} session={g.session} items={g.items} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function SessionGroup({ ctx, session, items }: { ctx: AppCtx; session: Session; items: ResItem[] }) {
  const day = ctx.days.find((d) => d.id === session.day)
  return (
    <div style={{ background: 'var(--wf-surface)', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
      <Press onClick={() => ctx.openSession(session)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', borderBottom: '1px solid ' + T.line, textAlign: 'left' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 15, color: T.ink, lineHeight: 1.3 }}>{session.title}</div>
          {day && <div style={{ fontFamily: T.onest, fontSize: 11.5, color: T.muted, marginTop: 2 }}>{day.dow} {day.date} · {session.start}–{session.end}</div>}
        </div>
        <Icon name="chevronRight" size={16} stroke={2} style={{ color: T.line2 }} />
      </Press>
      {items.map((it, i) => (
        <a
          key={i}
          href={it.href}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', textDecoration: 'none', borderBottom: i === items.length - 1 ? 'none' : '1px solid ' + T.line }}
        >
          <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-2)', background: T.sunken, display: 'grid', placeItems: 'center', color: T.green10, flexShrink: 0 }}>
            <Icon name={it.kind === 'recording' ? 'mic' : 'download'} size={17} />
          </div>
          <span style={{ flex: 1, fontFamily: T.sig, fontWeight: 500, fontSize: 14.5, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.label}</span>
          <Icon name="arrowRight" size={16} stroke={2} style={{ color: T.line2 }} />
        </a>
      ))}
    </div>
  )
}
