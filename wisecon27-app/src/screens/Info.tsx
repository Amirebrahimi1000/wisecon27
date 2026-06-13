// WISEcon27 — Event Info (pushed): Wi-Fi, venue, hours as a key/value card,
// plus a way back into the app tour.
import { T, TABBAR_H } from '../theme'
import type { AppCtx } from '../appState'
import type { IconName } from '../components/Icon'
import { Icon } from '../components/Icon'
import { AppHeader, Eyebrow, Press } from '../components/primitives'
import { useT } from '../i18n'

interface Essential { icon: IconName; title: string; body: string }
// Sensible defaults so the practical basics are always covered; organisers can
// override any of these from event_info in Admin once they're in the database.
const ESSENTIALS: Essential[] = [
  { icon: 'map', title: 'Getting here', body: 'The venue is reachable by public transport and car. Parking is available on-site; allow extra time at peak arrival hours.' },
  { icon: 'user', title: 'Accessibility', body: 'Step-free access, accessible toilets and reserved seating are available. Tell a host at the welcome desk if you need assistance.' },
  { icon: 'coffee', title: 'Food & dietary needs', body: 'Lunch and refreshments are included. Vegetarian, vegan and gluten-free options are labelled; ask staff about allergens.' },
  { icon: 'shield', title: 'Code of conduct', body: 'WISEcon27 is a respectful, inclusive event. Harassment of any kind is not tolerated — report concerns to any organiser.' },
  { icon: 'bell', title: 'Emergency & first aid', body: 'First aid is at the welcome desk. In an emergency, alert the nearest staff member or call local emergency services.' },
  { icon: 'message', title: 'Contact the organisers', body: 'Find a host at the welcome desk, or reach the team through the contact details shared in your registration email.' },
]

export function Info({ ctx }: { ctx: AppCtx }) {
  const { t } = useT()
  const items = ctx.eventInfo
  return (
    <div>
      <AppHeader title="Event info" onBack={ctx.back} />
      <div style={{ padding: '14px 16px ' + (TABBAR_H + 16) + 'px' }}>
        <div style={{ background: 'var(--wf-surface)', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
          {items.map((it, i) => (
            <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 16px', borderBottom: i === items.length - 1 ? 'none' : '1px solid ' + T.line }}>
              <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-2)', background: T.sunken, display: 'grid', placeItems: 'center', color: T.body }}>
                <Icon name={it.icon as IconName} size={18} />
              </div>
              <span style={{ flex: 1, fontFamily: T.sig, fontWeight: 500, fontSize: 15, color: T.body }}>{it.label}</span>
              <span style={{ fontFamily: T.sig, fontWeight: 600, fontSize: 15, color: T.ink }}>{it.detail}</span>
            </div>
          ))}
        </div>

        {/* practical essentials */}
        <Eyebrow style={{ marginTop: 22, marginBottom: 10, paddingLeft: 2 }}>{t('info.essentials')}</Eyebrow>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ESSENTIALS.map((e) => (
            <div key={e.title} style={{ display: 'flex', gap: 13, background: 'var(--wf-surface)', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', padding: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-2)', background: T.sunken, display: 'grid', placeItems: 'center', color: T.green10, flexShrink: 0 }}>
                <Icon name={e.icon} size={19} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 15, color: T.ink }}>{e.title}</div>
                <div style={{ fontFamily: T.sig, fontSize: 13.5, color: T.muted, marginTop: 3, lineHeight: 1.5 }}>{e.body}</div>
              </div>
            </div>
          ))}
        </div>

        {/* new to the app? */}
        <Press onClick={() => ctx.push('tour', {})} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--wf-surface)', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', padding: 16, marginTop: 14 }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: T.green1, color: T.green10, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <Icon name="sparkles" size={19} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 14.5, color: T.ink }}>Take the app tour</div>
            <div style={{ fontFamily: T.sig, fontSize: 12.5, color: T.muted, marginTop: 1 }}>A one-minute walkthrough of everything the app can do.</div>
          </div>
          <Icon name="chevronRight" size={18} stroke={2} style={{ color: T.line2 }} />
        </Press>
      </div>
    </div>
  )
}
