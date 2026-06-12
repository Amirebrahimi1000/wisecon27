// WISEcon27 — post-conference survey. Renders the editable question set
// (survey_questions) and stores a response. Standard set is seeded; organisers
// can edit questions in the Supabase Table Editor.
import { useState } from 'react'
import { T, TABBAR_H } from '../theme'
import type { AppCtx } from '../appState'
import { Icon } from '../components/Icon'
import { AppHeader, Btn, Eyebrow, Press } from '../components/primitives'

export function Survey({ ctx }: { ctx: AppCtx }) {
  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [done, setDone] = useState(ctx.surveyDone)
  const set = (id: string, v: unknown) => setAnswers((a) => ({ ...a, [id]: v }))

  // require the non-text questions to be answered
  const required = ctx.surveyQuestions.filter((q) => q.kind !== 'text')
  const complete = required.every((q) => answers[q.id] !== undefined && answers[q.id] !== '')

  const submit = async () => {
    try {
      await ctx.submitSurvey(answers)
      setDone(true)
    } catch {
      /* submit failed — the toast is already shown, keep the form so nothing is lost */
    }
  }

  if (done) {
    return (
      <div>
        <AppHeader title="Survey" onBack={ctx.back} />
        <div style={{ padding: '60px 30px', textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: T.green1, color: T.green9, display: 'grid', placeItems: 'center', margin: '0 auto 18px' }}>
            <Icon name="checkCircle" size={40} />
          </div>
          <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 22, color: T.ink }}>Thank you</div>
          <p style={{ fontFamily: T.sig, fontSize: 15, color: T.body, marginTop: 8, lineHeight: 1.5 }}>
            Your responses help us make WISEcon28 even better.
          </p>
          <Btn kind="primary" onClick={ctx.back} style={{ marginTop: 22 }}>Done</Btn>
        </div>
      </div>
    )
  }

  return (
    <div>
      <AppHeader title="Post-conference survey" onBack={ctx.back} />
      <div style={{ padding: '18px 18px ' + (TABBAR_H + 16) + 'px', display: 'flex', flexDirection: 'column', gap: 26 }}>
        <p style={{ fontFamily: T.sig, fontSize: 15, color: T.body, lineHeight: 1.5 }}>
          A few quick questions about your WISEcon27 experience — thank you for taking part.
        </p>
        {ctx.surveyQuestions.map((q) => (
          <div key={q.id}>
            <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 16, color: T.ink, marginBottom: 12, lineHeight: 1.3 }}>{q.prompt}</div>

            {q.kind === 'rating' && (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Press key={i} onClick={() => set(q.id, i)} style={{ color: (answers[q.id] as number) >= i ? 'var(--wf-yellow-8)' : T.line2 }}>
                    <Icon name={(answers[q.id] as number) >= i ? 'starFill' : 'star'} size={34} />
                  </Press>
                ))}
              </div>
            )}

            {q.kind === 'nps' && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {Array.from({ length: 11 }, (_, n) => (
                  <Press key={n} onClick={() => set(q.id, n)} style={{ width: 40, height: 40, borderRadius: 'var(--radius-3)', display: 'grid', placeItems: 'center', fontFamily: T.onest, fontWeight: 700, fontSize: 14, background: answers[q.id] === n ? T.green9 : 'var(--wf-surface)', color: answers[q.id] === n ? '#fff' : T.body, boxShadow: answers[q.id] === n ? 'none' : 'inset 0 0 0 1px var(--wf-grey-6)' }}>{n}</Press>
                ))}
              </div>
            )}

            {q.kind === 'choice' && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {q.options.map((o) => (
                  <Press key={o} onClick={() => set(q.id, o)} style={{ fontFamily: T.sig, fontWeight: 600, fontSize: 13.5, padding: '8px 14px', borderRadius: 999, background: answers[q.id] === o ? T.green9 : 'var(--wf-surface)', color: answers[q.id] === o ? '#fff' : T.body, boxShadow: answers[q.id] === o ? 'none' : 'inset 0 0 0 1px var(--wf-grey-6)' }}>{o}</Press>
                ))}
              </div>
            )}

            {q.kind === 'text' && (
              <textarea
                value={(answers[q.id] as string) ?? ''}
                onChange={(e) => set(q.id, e.target.value)}
                placeholder="Your answer (optional)"
                rows={3}
                style={{ width: '100%', boxSizing: 'border-box', resize: 'none', border: '1px solid var(--wf-grey-6)', borderRadius: 'var(--radius-4)', padding: 13, fontFamily: T.sig, fontSize: 15, color: T.ink, outline: 'none', lineHeight: 1.5 }}
              />
            )}
          </div>
        ))}
        {ctx.surveyQuestions.length === 0 && <Eyebrow>No survey is open right now.</Eyebrow>}
        {ctx.surveyQuestions.length > 0 && (
          <Btn kind="primary" full size="lg" onClick={submit} disabled={!complete}>Submit survey</Btn>
        )}
      </div>
    </div>
  )
}
