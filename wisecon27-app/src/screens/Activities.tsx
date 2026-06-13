// WISEcon27 — Interactive activities with sign-up + capacity (realtime).
import { T, TABBAR_H } from '../theme'
import type { AppCtx } from '../appState'
import { Icon } from '../components/Icon'
import { AppHeader, Btn, Empty, Eyebrow } from '../components/primitives'
import { useT } from '../i18n'

export function Activities({ ctx }: { ctx: AppCtx }) {
  const { t } = useT()
  const dayLong = (id: string | null) => (id ? ctx.days.find((d) => d.id === id)?.long ?? '' : '')
  return (
    <div>
      <AppHeader title={t('activities.title')} sub={t('activities.sub')} onBack={ctx.stack.length ? ctx.back : null} />
      <div style={{ padding: '14px 16px ' + (TABBAR_H + 16) + 'px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {ctx.activities.map((a) => {
          const spotsLeft = a.capacity != null ? Math.max(0, a.capacity - a.going) : null
          return (
            <div key={a.id} style={{ background: 'var(--wf-surface)', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 17, color: T.ink, lineHeight: 1.25 }}>{a.title}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', marginTop: 7, color: T.muted, fontFamily: T.sig, fontSize: 13 }}>
                    {a.start && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="clock" size={14} />{a.start}{a.end ? '–' + a.end : ''}</span>}
                    {a.location && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="pin" size={14} />{a.location}</span>}
                  </div>
                  {a.day && <div style={{ fontFamily: T.onest, fontSize: 11, color: T.subtle, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{dayLong(a.day)}</div>}
                </div>
              </div>
              {a.description && <p style={{ fontFamily: T.sig, fontSize: 14, color: T.body, lineHeight: 1.5, marginTop: 10 }}>{a.description}</p>}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 14 }}>
                <span style={{ fontFamily: T.onest, fontSize: 12, color: spotsLeft === 0 ? 'var(--wf-negative-9)' : T.muted }}>
                  {a.capacity == null
                    ? `${a.going} ${t('activities.going')}`
                    : a.signedUp
                      ? `${t('activities.youreIn')} · ${a.going}/${a.capacity}`
                      : spotsLeft === 0
                        ? t('activities.full')
                        : `${spotsLeft} ${t('activities.of')} ${a.capacity} ${t('activities.spotsLeft')}`}
                </span>
                <Btn
                  kind={a.signedUp ? 'default' : a.full ? 'outline' : 'primary'}
                  size="sm"
                  icon={a.signedUp ? 'check' : undefined}
                  onClick={() => ctx.toggleActivitySignup(a.id)}
                  disabled={a.full && !a.signedUp}
                >
                  {a.signedUp ? t('activities.signedUp') : a.full ? t('activities.full') : t('activities.signUp')}
                </Btn>
              </div>
            </div>
          )
        })}
        {ctx.activities.length === 0 && <Empty icon="sparkles" text={t('activities.empty')} />}
        <Eyebrow style={{ textAlign: 'center', marginTop: 4, color: T.muted }}>{t('activities.moreComingSoon')}</Eyebrow>
      </div>
    </div>
  )
}
