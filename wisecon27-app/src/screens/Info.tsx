// WISEcon27 — Event Info (pushed): Wi-Fi, venue, hours as a key/value card,
// plus a way back into the app tour.
import { T, TABBAR_H } from '../theme'
import type { AppCtx } from '../appState'
import type { IconName } from '../components/Icon'
import { Icon } from '../components/Icon'
import { AppHeader, Eyebrow, Press } from '../components/primitives'
import { useT } from '../i18n'
import type { InfoSection } from '../types'

export function Info({ ctx }: { ctx: AppCtx }) {
  const { t, lang } = useT()
  const items = ctx.eventInfo
  return (
    <div>
      <AppHeader title="Event info" onBack={ctx.back} />
      <div style={{ padding: '14px 16px ' + (TABBAR_H + 16) + 'px' }}>
        <Eyebrow style={{ marginBottom: 10, paddingLeft: 2 }}>{t('info.eventInfo')}</Eyebrow>
        <div style={{ background: 'var(--wf-surface)', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
          {items.map((it, i) => {
            const label = it.labelI18n?.[lang] || it.label
            const detail = it.detailI18n?.[lang] || it.detail
            // Short values stay as a tidy key/value row; prose gets the stacked
            // card layout (label as title, detail as body) so it can breathe.
            const isLong = detail.length > 40
            const border = i === items.length - 1 ? 'none' : '1px solid ' + T.line
            return (
              <div key={it.id} style={{ display: 'flex', alignItems: isLong ? 'flex-start' : 'center', gap: 13, padding: '14px 16px', borderBottom: border }}>
                <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-2)', background: T.sunken, display: 'grid', placeItems: 'center', color: T.green10, flexShrink: 0 }}>
                  <Icon name={it.icon as IconName} size={19} />
                </div>
                {isLong ? (
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: T.sig, fontWeight: 600, fontSize: 15, color: T.ink }}>{label}</div>
                    <div style={{ fontFamily: T.sig, fontSize: 13.5, color: T.muted, marginTop: 3, lineHeight: 1.5 }}>{detail}</div>
                  </div>
                ) : (
                  <>
                    <span style={{ flex: 1, fontFamily: T.sig, fontWeight: 500, fontSize: 15, color: T.body }}>{label}</span>
                    <span style={{ fontFamily: T.sig, fontWeight: 600, fontSize: 15, color: T.ink }}>{detail}</span>
                  </>
                )}
              </div>
            )
          })}
        </div>

        {/* practical essentials — admin-managed (Admin → Info) */}
        {ctx.infoSections.length > 0 && (
          <>
            <Eyebrow style={{ marginTop: 22, marginBottom: 10, paddingLeft: 2 }}>{t('info.essentials')}</Eyebrow>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {ctx.infoSections.map((s) => <InfoSectionCard key={s.id} s={s} />)}
            </div>
          </>
        )}

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

// A practical-info card. If `link` is set it's tappable: a full URL opens as-is,
// anything else is treated as an address and opens in the device's map app.
function InfoSectionCard({ s }: { s: InfoSection }) {
  const { t, lang } = useT()
  const title = s.titleI18n?.[lang] || s.title
  const body = s.bodyI18n?.[lang] || s.body
  const link = s.link?.trim() || ''
  const isUrl = /^https?:\/\//i.test(link)
  const href = link ? (isUrl ? link : 'https://maps.google.com/?q=' + encodeURIComponent(link)) : null
  const cardStyle: React.CSSProperties = { display: 'flex', gap: 13, background: 'var(--wf-surface)', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', padding: 16, textDecoration: 'none' }
  const inner = (
    <>
      <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-2)', background: T.sunken, display: 'grid', placeItems: 'center', color: T.green10, flexShrink: 0 }}>
        <Icon name={s.icon as IconName} size={19} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 15, color: T.ink }}>{title}</div>
        {body && <div style={{ fontFamily: T.sig, fontSize: 13.5, color: T.muted, marginTop: 3, lineHeight: 1.5 }}>{body}</div>}
        {link && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8, fontFamily: T.sig, fontWeight: 600, fontSize: 13, color: T.green10 }}>
            <Icon name={isUrl ? 'arrowRight' : 'pin'} size={14} />
            {isUrl ? t('info.openLink') : link}
          </div>
        )}
      </div>
      {href && <Icon name="chevronRight" size={18} stroke={2} style={{ color: T.line2, alignSelf: 'center' }} />}
    </>
  )
  return href
    ? <a href={href} target="_blank" rel="noopener noreferrer" style={cardStyle}>{inner}</a>
    : <div style={cardStyle}>{inner}</div>
}
