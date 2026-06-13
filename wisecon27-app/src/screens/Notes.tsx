// WISEcon27 — My notes: every private note the delegate has written, newest
// first, each tapping through to its session. Notes live on the device (see
// notes.ts) so this screen reads localStorage, not Supabase.
import { T, TABBAR_H } from '../theme'
import type { AppCtx } from '../appState'
import { Icon } from '../components/Icon'
import { AppHeader, Empty, Eyebrow, Press } from '../components/primitives'
import { allNotes } from '../notes'
import { useT } from '../i18n'

export function Notes({ ctx }: { ctx: AppCtx }) {
  const { t } = useT()
  const notes = allNotes(ctx.userId)

  return (
    <div>
      <AppHeader title={t('notes.title')} onBack={ctx.back} />
      <div style={{ padding: '14px 16px ' + (TABBAR_H + 16) + 'px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: T.sig, fontSize: 12.5, color: T.muted, marginBottom: 14 }}>
          <Icon name="shield" size={14} /> {t('notes.private')}
        </div>
        {notes.length === 0 ? (
          <Empty icon="list" text={t('notes.empty')} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {notes.map((n) => {
              const s = ctx.sessions.find((x) => x.id === n.sessionId)
              const day = s ? ctx.days.find((d) => d.id === s.day) : null
              return (
                <Press
                  key={n.sessionId}
                  onClick={() => s && ctx.openSession(s)}
                  style={{ background: 'var(--wf-surface)', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', padding: 14, textAlign: 'left' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <Eyebrow color={T.subtle} style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s ? s.title : 'Session'}
                    </Eyebrow>
                    {s && <Icon name="chevronRight" size={16} stroke={2} style={{ color: T.line2 }} />}
                  </div>
                  {day && s && <div style={{ fontFamily: T.onest, fontSize: 11.5, color: T.muted, marginBottom: 6 }}>{day.dow} {day.date} · {s.start}–{s.end}</div>}
                  <div style={{ fontFamily: T.sig, fontSize: 14.5, color: T.body, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{n.text}</div>
                </Press>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
