// WISEcon27 — Exhibitor / sponsor detail (pushed from Sponsors).
import { T, STATUS_INSET, TABBAR_H } from '../theme'
import type { AppCtx } from '../appState'
import { Icon } from '../components/Icon'
import { Eyebrow, IconBtn, Press } from '../components/primitives'
import { useT } from '../i18n'

export function ExhibitorDetail({ ctx }: { ctx: AppCtx }) {
  const { t } = useT()
  const sp = ctx.params.sponsor!
  return (
    <div style={{ paddingBottom: TABBAR_H + 16 }}>
      <div style={{ padding: STATUS_INSET + 8 + 'px 18px 24px', background: `color-mix(in srgb, ${sp.color} 78%, #000)`, color: '#fff' }}>
        <div style={{ marginBottom: 18 }}>
          <IconBtn name="chevronLeft" onClick={ctx.back} stroke={2.2} color="#fff" bg="rgba(255,255,255,0.16)" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: 'var(--radius-4)', background: 'rgba(255,255,255,0.18)', display: 'grid', placeItems: 'center', fontFamily: T.onest, fontWeight: 700, fontSize: 22, boxShadow: '0 0 0 2px rgba(255,255,255,0.4)' }}>{sp.initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Eyebrow color="rgba(255,255,255,0.8)">{t('exhibitor.tierSponsor').replace('{tier}', sp.tier)}</Eyebrow>
            <h2 style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 24, color: '#fff', lineHeight: 1.15, marginTop: 4 }}>{sp.name}</h2>
            <div style={{ fontFamily: T.sig, fontSize: 14.5, color: 'rgba(255,255,255,0.92)', marginTop: 2 }}>{sp.blurb}</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 16px 0', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {sp.booth && (
          <Press onClick={() => ctx.push('venuemap', { booth: sp.booth })} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--wf-surface)', borderRadius: 'var(--radius-4)', padding: 14, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-2)', background: T.sunken, display: 'grid', placeItems: 'center', color: T.body }}><Icon name="pin" size={18} /></div>
            <div style={{ flex: 1 }}>
              <Eyebrow>{t('exhibitor.findAt')}</Eyebrow>
              <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 15.5, color: T.ink, marginTop: 2 }}>{t('exhibitor.booth').replace('{booth}', sp.booth)}</div>
            </div>
            <span style={{ fontFamily: T.sig, fontWeight: 600, fontSize: 13, color: T.green10 }}>{t('exhibitor.map')}</span>
            <Icon name="chevronRight" size={17} stroke={2} style={{ color: T.line2 }} />
          </Press>
        )}
        {sp.description && (
          <div>
            <Eyebrow style={{ marginBottom: 8 }}>{t('exhibitor.about')}</Eyebrow>
            <p style={{ fontFamily: T.sig, fontSize: 15.5, lineHeight: 1.55, color: T.body }}>{sp.description}</p>
          </div>
        )}
        {sp.website && (
          <a
            href={sp.website.startsWith('http') ? sp.website : 'https://' + sp.website}
            target="_blank"
            rel="noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: 'var(--radius-2)', background: T.green9, color: '#fff', fontFamily: T.sig, fontWeight: 600, fontSize: 16, textDecoration: 'none' }}
          >
            <Icon name="arrowRight" size={18} stroke={2} />{t('exhibitor.visitWebsite')}
          </a>
        )}
        {!sp.description && !sp.booth && !sp.website && (
          <p style={{ fontFamily: T.sig, fontSize: 14.5, color: T.muted, lineHeight: 1.5 }}>{t('exhibitor.comingSoon')}</p>
        )}
      </div>
    </div>
  )
}
