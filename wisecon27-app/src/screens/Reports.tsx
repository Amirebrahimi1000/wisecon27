// WISEcon27 — Admin → Reports: attendance, survey results and poll results,
// each with a CSV export for post-event reporting.
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { T } from '../theme'
import type { AppCtx } from '../appState'
import { BADGE_TYPES, asDelegateType } from '../badgeTypes'
import { downloadCsv } from '../lib/csv'
import { Icon } from '../components/Icon'
import { Btn, Eyebrow } from '../components/primitives'

/* ── shared bits ── */
const card: React.CSSProperties = { background: 'var(--wf-surface)', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', padding: 16, marginBottom: 18 }
const h2: React.CSSProperties = { fontFamily: T.sig, fontWeight: 700, fontSize: 17, color: T.ink }

function Bar({ label, n, max, suffix }: { label: string; n: number; max: number; suffix?: string }) {
  const pct = max > 0 ? Math.round((n / max) * 100) : 0
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: T.sig, fontSize: 13, color: T.body, marginBottom: 3 }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}>{label}</span>
        <span style={{ fontFamily: T.onest, color: T.muted, flexShrink: 0 }}>{n}{suffix ?? ''}</span>
      </div>
      <div style={{ height: 7, borderRadius: 999, background: 'var(--wf-grey-4)' }}>
        <div style={{ width: pct + '%', height: '100%', borderRadius: 999, background: T.green9, transition: 'width .3s var(--ease-out)' }} />
      </div>
    </div>
  )
}

/* ════════ attendance ════════ */
interface RosterRow { id: string; email: string; name: string; role: string; org: string; is_admin: boolean; signed_in: boolean }
interface ExtraRow { id: string; delegate_type: string | null; gala: boolean | null; checked_in_at: string | null }

function Attendance() {
  const [roster, setRoster] = useState<RosterRow[] | null>(null)
  const [extras, setExtras] = useState<Record<string, ExtraRow>>({})
  useEffect(() => {
    ;(async () => {
      const [list, profs] = await Promise.all([
        supabase.functions.invoke('import-delegates', { body: { action: 'list' } }),
        supabase.from('profiles').select('id, delegate_type, gala, checked_in_at'),
      ])
      setRoster(((list.data as { delegates: RosterRow[] } | null)?.delegates) ?? [])
      const m: Record<string, ExtraRow> = {}
      for (const p of (profs.data ?? []) as ExtraRow[]) m[p.id] = p
      setExtras(m)
    })()
  }, [])

  if (!roster) return <div style={card}><Eyebrow>Loading attendance…</Eyebrow></div>
  const checkedIn = roster.filter((d) => extras[d.id]?.checked_in_at)
  const exportCsv = () =>
    downloadCsv('wisecon27-attendance.csv', [
      ['Name', 'Email', 'Role', 'Organisation', 'Type', 'Gala dinner', 'Signed in to app', 'Checked in at'],
      ...roster.map((d) => {
        const ex = extras[d.id]
        return [
          d.name, d.email, d.role, d.org,
          BADGE_TYPES[asDelegateType(ex?.delegate_type)].label,
          ex?.gala ? 'Yes' : 'No',
          d.signed_in ? 'Yes' : 'No',
          ex?.checked_in_at ?? '',
        ]
      }),
    ])

  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={h2}>Attendance</div>
        <Btn kind="outline" size="sm" icon="download" onClick={exportCsv}>CSV</Btn>
      </div>
      <Bar label="Checked in at the entrance" n={checkedIn.length} max={roster.length} suffix={` / ${roster.length}`} />
      <Bar label="Signed in to the app" n={roster.filter((d) => d.signed_in).length} max={roster.length} suffix={` / ${roster.length}`} />
      <Bar label="Gala dinner guests" n={roster.filter((d) => extras[d.id]?.gala).length} max={roster.length} suffix={` / ${roster.length}`} />
      <div style={{ fontFamily: T.onest, fontSize: 11.5, color: T.muted, marginTop: 10, lineHeight: 1.5 }}>
        The CSV lists every delegate with type, gala status, app sign-in and exact check-in time.
      </div>
    </div>
  )
}

/* ════════ survey results ════════ */
interface SurveyResponse { user_id: string; answers: Record<string, unknown>; created_at: string }

function SurveyResults({ ctx }: { ctx: AppCtx }) {
  const [responses, setResponses] = useState<SurveyResponse[] | null>(null)
  useEffect(() => {
    supabase.from('survey_responses').select('user_id, answers, created_at').then(({ data }) =>
      setResponses((data ?? []) as SurveyResponse[]),
    )
  }, [])

  const qs = ctx.surveyQuestions
  if (!responses) return <div style={card}><Eyebrow>Loading survey…</Eyebrow></div>

  const valuesFor = (qid: string) => responses.map((r) => r.answers?.[qid]).filter((v) => v !== undefined && v !== null && v !== '')

  const exportCsv = () =>
    downloadCsv('wisecon27-survey.csv', [
      ['Respondent', 'Submitted', ...qs.map((q) => q.prompt)],
      ...responses.map((r, i) => [i + 1, r.created_at, ...qs.map((q) => (r.answers?.[q.id] as string | number | undefined) ?? '')]),
    ])

  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div style={h2}>Survey results</div>
        <Btn kind="outline" size="sm" icon="download" onClick={exportCsv} disabled={responses.length === 0}>CSV</Btn>
      </div>
      <div style={{ fontFamily: T.onest, fontSize: 12, color: T.muted, marginBottom: 14 }}>{responses.length} response{responses.length === 1 ? '' : 's'} · exported anonymised</div>
      {responses.length === 0 && <Eyebrow>No responses yet.</Eyebrow>}
      {responses.length > 0 && qs.map((q) => {
        const vals = valuesFor(q.id)
        return (
          <div key={q.id} style={{ marginBottom: 18 }}>
            <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 14, color: T.ink, marginBottom: 8, lineHeight: 1.35 }}>{q.prompt}</div>

            {q.kind === 'rating' && (() => {
              const nums = vals.map(Number).filter((n) => !Number.isNaN(n))
              const avg = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0
              return (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                    <Icon name="starFill" size={17} style={{ color: 'var(--wf-yellow-8)' }} />
                    <span style={{ fontFamily: T.onest, fontWeight: 700, fontSize: 17, color: T.ink }}>{avg.toFixed(1)}</span>
                    <span style={{ fontFamily: T.onest, fontSize: 12, color: T.muted }}>({nums.length} answers)</span>
                  </div>
                  {[5, 4, 3, 2, 1].map((s) => (
                    <Bar key={s} label={s + (s === 1 ? ' star' : ' stars')} n={nums.filter((n) => n === s).length} max={nums.length} />
                  ))}
                </div>
              )
            })()}

            {q.kind === 'nps' && (() => {
              const nums = vals.map(Number).filter((n) => !Number.isNaN(n))
              const promoters = nums.filter((n) => n >= 9).length
              const detractors = nums.filter((n) => n <= 6).length
              const nps = nums.length ? Math.round(((promoters - detractors) / nums.length) * 100) : 0
              return (
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, marginBottom: 8 }}>
                    <span style={{ fontFamily: T.onest, fontWeight: 700, fontSize: 22, color: nps >= 0 ? T.green10 : 'var(--wf-negative-9)' }}>{nps > 0 ? '+' + nps : nps}</span>
                    <span style={{ fontFamily: T.onest, fontSize: 12, color: T.muted }}>NPS · {nums.length} answers</span>
                  </div>
                  <Bar label={`Promoters (9–10)`} n={promoters} max={nums.length} />
                  <Bar label={`Passives (7–8)`} n={nums.length - promoters - detractors} max={nums.length} />
                  <Bar label={`Detractors (0–6)`} n={detractors} max={nums.length} />
                </div>
              )
            })()}

            {q.kind === 'choice' && (
              <div>
                {q.options.map((o) => (
                  <Bar key={o} label={o} n={vals.filter((v) => v === o).length} max={vals.length} />
                ))}
              </div>
            )}

            {q.kind === 'text' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {vals.length === 0 && <span style={{ fontFamily: T.sig, fontSize: 13, color: T.muted }}>No written answers.</span>}
                {(vals as string[]).map((v, i) => (
                  <div key={i} style={{ fontFamily: T.sig, fontSize: 13.5, color: T.body, background: 'var(--wf-grey-3)', borderRadius: 'var(--radius-2)', padding: '8px 11px', lineHeight: 1.45 }}>
                    “{v}”
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ════════ general event feedback (the "Give feedback" screen) ════════ */
interface FeedbackRow { stars: number; tags: string[]; comment: string; created_at: string }

function EventFeedback() {
  const [rows, setRows] = useState<FeedbackRow[] | null>(null)
  useEffect(() => {
    supabase
      .from('event_feedback')
      .select('stars, tags, comment, created_at')
      .order('created_at', { ascending: false })
      .then(({ data }) => setRows((data ?? []) as FeedbackRow[]))
  }, [])

  if (!rows) return <div style={card}><Eyebrow>Loading feedback…</Eyebrow></div>
  const avg = rows.length ? rows.reduce((a, r) => a + r.stars, 0) / rows.length : 0

  const exportCsv = () =>
    downloadCsv('wisecon27-feedback.csv', [
      ['Submitted', 'Stars', 'Tags', 'Comment'],
      ...rows.map((r) => [r.created_at, r.stars, (r.tags ?? []).join('; '), r.comment]),
    ])

  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div style={h2}>Event feedback</div>
        <Btn kind="outline" size="sm" icon="download" onClick={exportCsv} disabled={rows.length === 0}>CSV</Btn>
      </div>
      <div style={{ fontFamily: T.onest, fontSize: 12, color: T.muted, marginBottom: 14 }}>
        {rows.length} response{rows.length === 1 ? '' : 's'}{rows.length > 0 ? ` · ${avg.toFixed(1)} of 5 average` : ''}
      </div>
      {rows.length === 0 && <Eyebrow>No feedback yet.</Eyebrow>}
      {[5, 4, 3, 2, 1].map((s) => rows.length > 0 && (
        <Bar key={s} label={s + (s === 1 ? ' star' : ' stars')} n={rows.filter((r) => r.stars === s).length} max={rows.length} />
      ))}
      {rows.filter((r) => r.comment).slice(0, 8).map((r, i) => (
        <div key={i} style={{ fontFamily: T.sig, fontSize: 13.5, color: T.body, background: 'var(--wf-grey-3)', borderRadius: 'var(--radius-2)', padding: '8px 11px', lineHeight: 1.45, marginTop: 8 }}>
          “{r.comment}” <span style={{ fontFamily: T.onest, fontSize: 11, color: T.muted }}>· {r.stars} of 5</span>
        </div>
      ))}
    </div>
  )
}

/* ════════ poll results ════════ */
interface PollRow { id: string; session_id: string | null; question: string }
interface ResultRow { poll_id: string; option_id: string; label: string; sort: number; votes: number }

function PollResults({ ctx }: { ctx: AppCtx }) {
  const [polls, setPolls] = useState<PollRow[] | null>(null)
  const [results, setResults] = useState<ResultRow[]>([])
  useEffect(() => {
    ;(async () => {
      const [p, r] = await Promise.all([
        supabase.from('polls').select('id, session_id, question'),
        supabase.from('poll_results').select('poll_id, option_id, label, sort, votes'),
      ])
      setPolls((p.data ?? []) as PollRow[])
      setResults((r.data ?? []) as ResultRow[])
    })()
  }, [])

  const sessionTitle = useMemo(
    () => (id: string | null) => ctx.sessions.find((s) => s.id === id)?.title ?? '—',
    [ctx.sessions],
  )

  if (!polls) return <div style={card}><Eyebrow>Loading polls…</Eyebrow></div>

  const optionsOf = (pollId: string) => results.filter((r) => r.poll_id === pollId).sort((a, b) => a.sort - b.sort)

  const exportCsv = () =>
    downloadCsv('wisecon27-polls.csv', [
      ['Session', 'Poll question', 'Option', 'Votes', 'Share'],
      ...polls.flatMap((p) => {
        const opts = optionsOf(p.id)
        const total = opts.reduce((a, b) => a + b.votes, 0)
        return opts.map((o) => [
          sessionTitle(p.session_id), p.question, o.label, o.votes,
          total ? Math.round((o.votes / total) * 100) + '%' : '0%',
        ])
      }),
    ])

  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div style={h2}>Poll results</div>
        <Btn kind="outline" size="sm" icon="download" onClick={exportCsv} disabled={polls.length === 0}>CSV</Btn>
      </div>
      <div style={{ fontFamily: T.onest, fontSize: 12, color: T.muted, marginBottom: 14 }}>{polls.length} poll{polls.length === 1 ? '' : 's'}</div>
      {polls.length === 0 && <Eyebrow>No polls yet — add one on a session.</Eyebrow>}
      {polls.map((p) => {
        const opts = optionsOf(p.id)
        const total = opts.reduce((a, b) => a + b.votes, 0)
        return (
          <div key={p.id} style={{ marginBottom: 18 }}>
            <div style={{ fontFamily: T.onest, fontSize: 11, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{sessionTitle(p.session_id)}</div>
            <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 14, color: T.ink, marginBottom: 8, lineHeight: 1.35 }}>{p.question} <span style={{ fontFamily: T.onest, fontWeight: 400, fontSize: 12, color: T.muted }}>· {total} votes</span></div>
            {opts.map((o) => <Bar key={o.option_id} label={o.label} n={o.votes} max={total} />)}
          </div>
        )
      })}
    </div>
  )
}

/* ════════ tab ════════ */
export function Reports({ ctx }: { ctx: AppCtx }) {
  return (
    <div>
      <Attendance />
      <SurveyResults ctx={ctx} />
      <EventFeedback />
      <PollResults ctx={ctx} />
    </div>
  )
}
