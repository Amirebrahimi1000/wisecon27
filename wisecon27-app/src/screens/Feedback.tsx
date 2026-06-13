// WISEcon27 — Feedback (pushed): star rating, chips, textarea, success state.
// Responses are stored in event_feedback (organisers read them under Reports).
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { T, TABBAR_H } from '../theme'
import type { AppCtx } from '../appState'
import { Icon } from '../components/Icon'
import { AppHeader, Btn, Eyebrow, Press } from '../components/primitives'
import { useT } from '../i18n'

export function Feedback({ ctx }: { ctx: AppCtx }) {
  const { t } = useT()

  const CHIPS = [
    t('feedback.chip.greatSpeaker'),
    t('feedback.chip.wellOrganised'),
    t('feedback.chip.tooShort'),
    t('feedback.chip.rightLevel'),
    t('feedback.chip.practical'),
    t('feedback.chip.lovedVenue'),
  ]
  const WORDS = [
    t('feedback.rating.tapToRate'),
    t('feedback.rating.poor'),
    t('feedback.rating.fair'),
    t('feedback.rating.good'),
    t('feedback.rating.great'),
    t('feedback.rating.excellent'),
  ]

  const [stars, setStars] = useState(0)
  const [tags, setTags] = useState<string[]>([])
  const [text, setText] = useState('')
  const [done, setDone] = useState(false)
  const [saving, setSaving] = useState(false)
  const toggle = (c: string) => setTags(tags.includes(c) ? tags.filter((x) => x !== c) : [...tags, c])

  const submit = async () => {
    if (saving) return
    setSaving(true)
    const { error } = await supabase
      .from('event_feedback')
      .insert({ user_id: ctx.userId, stars, tags, comment: text.trim() })
    setSaving(false)
    if (error) return ctx.toast(error.message)
    setDone(true)
    ctx.toast(t('feedback.toast.submitted'))
  }

  if (done) {
    return (
      <div>
        <AppHeader title={t('feedback.title')} onBack={ctx.back} />
        <div style={{ padding: '60px 30px', textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: T.green1, color: T.green9, display: 'grid', placeItems: 'center', margin: '0 auto 18px' }}>
            <Icon name="checkCircle" size={40} />
          </div>
          <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 22, color: T.ink }}>{t('feedback.thankYou')}</div>
          <p style={{ fontFamily: T.sig, fontSize: 15, color: T.body, marginTop: 8, lineHeight: 1.5 }}>{t('feedback.thankYouBody')}</p>
          <Btn kind="primary" onClick={ctx.back} style={{ marginTop: 22 }}>{t('feedback.done')}</Btn>
        </div>
      </div>
    )
  }

  return (
    <div>
      <AppHeader title={t('feedback.titleGive')} onBack={ctx.back} />
      <div style={{ padding: '20px 18px ' + (TABBAR_H + 16) + 'px' }}>
        <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 18, color: T.ink }}>{t('feedback.question')}</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', margin: '22px 0 8px' }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Press key={i} onClick={() => setStars(i)} style={{ color: i <= stars ? 'var(--wf-yellow-8)' : T.line2 }}>
              <Icon name={i <= stars ? 'starFill' : 'star'} size={38} />
            </Press>
          ))}
        </div>
        <div style={{ textAlign: 'center', fontFamily: T.onest, fontSize: 12.5, color: T.muted, marginBottom: 22 }}>{WORDS[stars]}</div>
        <Eyebrow style={{ marginBottom: 10 }}>{t('feedback.whatStoodOut')}</Eyebrow>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 22 }}>
          {CHIPS.map((c) => (
            <Press key={c} onClick={() => toggle(c)} style={{ fontFamily: T.sig, fontWeight: 600, fontSize: 13.5, padding: '8px 14px', borderRadius: 999, background: tags.includes(c) ? T.green9 : '#fff', color: tags.includes(c) ? '#fff' : T.body, boxShadow: tags.includes(c) ? 'none' : 'inset 0 0 0 1px var(--wf-grey-6)' }}>{c}</Press>
          ))}
        </div>
        <Eyebrow style={{ marginBottom: 10 }}>{t('feedback.anythingElse')}</Eyebrow>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('feedback.textPlaceholder')}
          rows={4}
          style={{ width: '100%', boxSizing: 'border-box', resize: 'none', border: '1px solid var(--wf-grey-6)', borderRadius: 'var(--radius-4)', padding: 13, fontFamily: T.sig, fontSize: 15, color: T.ink, outline: 'none', lineHeight: 1.5 }}
        />
        <Btn kind="primary" full size="lg" onClick={submit} disabled={stars === 0 || saving} style={{ marginTop: 18 }}>
          {saving ? t('feedback.submitting') : t('feedback.submit')}
        </Btn>
      </div>
    </div>
  )
}
