// WISEcon27 — Feedback (pushed): star rating, chips, textarea, success state.
import { useState } from 'react'
import { T, TABBAR_H } from '../theme'
import type { AppCtx } from '../appState'
import { Icon } from '../components/Icon'
import { AppHeader, Btn, Eyebrow, Press } from '../components/primitives'

const CHIPS = ['Great speaker', 'Well organised', 'Too short', 'Right level', 'Practical', 'Loved the venue']
const WORDS = ['Tap to rate', 'Poor', 'Fair', 'Good', 'Great', 'Excellent']

export function Feedback({ ctx }: { ctx: AppCtx }) {
  const [stars, setStars] = useState(0)
  const [tags, setTags] = useState<string[]>([])
  const [text, setText] = useState('')
  const [done, setDone] = useState(false)
  const toggle = (c: string) => setTags(tags.includes(c) ? tags.filter((x) => x !== c) : [...tags, c])

  if (done) {
    return (
      <div>
        <AppHeader title="Feedback" onBack={ctx.back} />
        <div style={{ padding: '60px 30px', textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: T.green1, color: T.green9, display: 'grid', placeItems: 'center', margin: '0 auto 18px' }}>
            <Icon name="checkCircle" size={40} />
          </div>
          <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 22, color: T.ink }}>Thank you</div>
          <p style={{ fontFamily: T.sig, fontSize: 15, color: T.body, marginTop: 8, lineHeight: 1.5 }}>Your feedback helps us shape WISEcon28.</p>
          <Btn kind="primary" onClick={ctx.back} style={{ marginTop: 22 }}>Done</Btn>
        </div>
      </div>
    )
  }

  return (
    <div>
      <AppHeader title="Give feedback" onBack={ctx.back} />
      <div style={{ padding: '20px 18px ' + (TABBAR_H + 16) + 'px' }}>
        <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 18, color: T.ink }}>How was your WISEcon27 so far?</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', margin: '22px 0 8px' }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Press key={i} onClick={() => setStars(i)} style={{ color: i <= stars ? 'var(--wf-yellow-8)' : T.line2 }}>
              <Icon name={i <= stars ? 'starFill' : 'star'} size={38} />
            </Press>
          ))}
        </div>
        <div style={{ textAlign: 'center', fontFamily: T.onest, fontSize: 12.5, color: T.muted, marginBottom: 22 }}>{WORDS[stars]}</div>
        <Eyebrow style={{ marginBottom: 10 }}>What stood out?</Eyebrow>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 22 }}>
          {CHIPS.map((c) => (
            <Press key={c} onClick={() => toggle(c)} style={{ fontFamily: T.sig, fontWeight: 600, fontSize: 13.5, padding: '8px 14px', borderRadius: 999, background: tags.includes(c) ? T.green9 : '#fff', color: tags.includes(c) ? '#fff' : T.body, boxShadow: tags.includes(c) ? 'none' : 'inset 0 0 0 1px var(--wf-grey-6)' }}>{c}</Press>
          ))}
        </div>
        <Eyebrow style={{ marginBottom: 10 }}>Anything else?</Eyebrow>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share your thoughts (optional)"
          rows={4}
          style={{ width: '100%', boxSizing: 'border-box', resize: 'none', border: '1px solid var(--wf-grey-6)', borderRadius: 'var(--radius-4)', padding: 13, fontFamily: T.sig, fontSize: 15, color: T.ink, outline: 'none', lineHeight: 1.5 }}
        />
        <Btn kind="primary" full size="lg" onClick={() => { setDone(true); ctx.toast('Feedback submitted') }} disabled={stars === 0} style={{ marginTop: 18 }}>
          Submit feedback
        </Btn>
      </div>
    </div>
  )
}
