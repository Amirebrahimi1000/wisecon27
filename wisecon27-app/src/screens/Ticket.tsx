// WISEcon27 — Ticket / Badge (pushed): type-coloured screen, perforated card, QR.
import { T, STATUS_INSET, TABBAR_H } from '../theme'
import type { AppCtx } from '../appState'
import { BADGE_TYPES, asDelegateType } from '../badgeTypes'
import { Icon } from '../components/Icon'
import { Eyebrow, IconBtn } from '../components/primitives'
import { QR } from '../components/QR'
import { useT } from '../i18n'

export function Ticket({ ctx }: { ctx: AppCtx }) {
  const { t } = useT()
  const ME = ctx.me
  const bt = BADGE_TYPES[asDelegateType(ME.delegateType)]
  return (
    <div style={{ minHeight: '100%', background: bt.bg, paddingBottom: TABBAR_H + 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: STATUS_INSET + 6 + 'px 14px 6px' }}>
        <IconBtn name="chevronLeft" onClick={ctx.back} stroke={2.2} color="#fff" bg="rgba(255,255,255,0.16)" />
        <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 17, color: '#fff' }}>{t('ticket.title')}</div>
        <div style={{ width: 38 }} />
      </div>
      <div style={{ padding: '20px 22px' }}>
        <div style={{ background: '#fff', borderRadius: 22, overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.3)' }}>
          <div style={{ padding: '22px 22px 16px', textAlign: 'center', borderBottom: '2px dashed #e6e6e6' }}>
            <Eyebrow style={{ marginBottom: 6 }} color={bt.chipText}>{['WISEcon27', ctx.event.location].filter(Boolean).join(' · ')}</Eyebrow>
            <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 24, color: '#111' }}>{ME.name}</div>
            <div style={{ fontFamily: T.sig, fontSize: 14.5, color: '#474748', marginTop: 2 }}>{ME.org}</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', background: bt.chipBg, color: bt.chipText, fontFamily: T.sig, fontWeight: 600, fontSize: 13, borderRadius: 999, padding: '5px 14px' }}>{bt.label}</span>
              {ME.gala && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#1c1c1e', color: '#f5d77b', fontFamily: T.sig, fontWeight: 600, fontSize: 13, borderRadius: 999, padding: '5px 14px' }}>
                  <Icon name="star" size={13} /> {t('ticket.galaDinner')}
                </span>
              )}
            </div>
          </div>
          <div style={{ padding: 24, display: 'grid', placeItems: 'center' }}>
            <QR value={ME.badgeId} size={200} />
            <div style={{ fontFamily: T.onest, fontSize: 13, letterSpacing: '0.18em', color: '#474748', marginTop: 16 }}>{ME.badgeId}</div>
            <div style={{ fontFamily: T.sig, fontSize: 12.5, color: '#8c8c8c', marginTop: 4 }}>{t('ticket.scanHint')}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
