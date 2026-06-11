// WISEcon27 — my 1:1 meeting availability (pushed from My meetings).
// Per conference day: a toggle plus one or more time windows (e.g. 08:00–10:00
// and 14:00–16:00). Other delegates can only pick meeting slots inside them.
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { T, TABBAR_H } from '../theme'
import type { AppCtx } from '../appState'
import type { DayAvail, TimeWindow } from '../types'
import { TICKS, DEFAULT_AVAIL, normalizeDayAvail, slotEnd } from '../meetingSlots'
import { Icon } from '../components/Icon'
import { AppHeader, Btn, Eyebrow, Press } from '../components/primitives'

function Toggle({ on, onTap }: { on: boolean; onTap: () => void }) {
  return (
    <Press onClick={onTap} style={{ width: 46, height: 27, borderRadius: 999, background: on ? T.green9 : 'var(--wf-grey-6)', position: 'relative', flexShrink: 0, transition: 'background .15s var(--ease-out)' }}>
      <span style={{ position: 'absolute', top: 3, left: on ? 22 : 3, width: 21, height: 21, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.25)', transition: 'left .15s var(--ease-out)' }} />
    </Press>
  )
}

const selectStyle: React.CSSProperties = {
  border: 'none', outline: 'none', background: 'var(--wf-surface)', borderRadius: 'var(--radius-3)',
  padding: '8px 10px', fontFamily: T.onest, fontWeight: 600, fontSize: 13.5, color: T.ink,
  boxShadow: 'inset 0 0 0 1px var(--wf-grey-6)',
}

const describe = (a: DayAvail) =>
  !a.available ? 'Not taking meetings' : 'Bookable ' + a.windows.map((w) => `${w.start}–${w.end}`).join(' and ')

export function Availability({ ctx }: { ctx: AppCtx }) {
  const [avail, setAvail] = useState<Record<string, DayAvail>>({})
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase
      .from('profiles')
      .select('meeting_availability')
      .eq('id', ctx.userId)
      .single()
      .then(({ data }) => {
        const raw = ((data as { meeting_availability?: Record<string, unknown> | null } | null)?.meeting_availability) ?? {}
        setAvail(Object.fromEntries(Object.entries(raw).map(([day, v]) => [day, normalizeDayAvail(v)])))
        setLoaded(true)
      })
  }, [ctx.userId])

  const dayFor = (dayId: string): DayAvail => avail[dayId] ?? DEFAULT_AVAIL
  const setDay = (dayId: string, next: DayAvail) => setAvail((a) => ({ ...a, [dayId]: next }))
  const setWindow = (dayId: string, i: number, patch: Partial<TimeWindow>) => {
    const d = dayFor(dayId)
    const windows = d.windows.map((w, j) => {
      if (j !== i) return w
      const next = { ...w, ...patch }
      // keep the window valid when its start passes its end
      if (next.start >= next.end) next.end = TICKS[Math.min(TICKS.indexOf(next.start) + 1, TICKS.length - 1)]
      return next
    })
    setDay(dayId, { ...d, windows })
  }
  const addWindow = (dayId: string) => {
    const d = dayFor(dayId)
    // start the new window after the latest existing one, if there's room
    const lastEnd = d.windows.reduce((m, w) => (w.end > m ? w.end : m), '00:00')
    const start = TICKS.find((t) => t >= lastEnd && t < TICKS[TICKS.length - 1]) ?? TICKS[TICKS.length - 3]
    setDay(dayId, { ...d, windows: [...d.windows, { start, end: slotEnd(start) }] })
  }
  const removeWindow = (dayId: string, i: number) => {
    const d = dayFor(dayId)
    if (d.windows.length <= 1) return
    setDay(dayId, { ...d, windows: d.windows.filter((_, j) => j !== i) })
  }

  const save = async () => {
    if (saving) return
    setSaving(true)
    const { error } = await supabase.from('profiles').update({ meeting_availability: avail }).eq('id', ctx.userId)
    setSaving(false)
    if (error) return ctx.toast(error.message)
    ctx.toast('Availability saved')
    ctx.back()
  }

  return (
    <div>
      <AppHeader title="Meeting availability" sub="When can people book you?" onBack={ctx.back} />
      <div style={{ padding: '14px 16px ' + (TABBAR_H + 16) + 'px' }}>
        <div style={{ fontFamily: T.sig, fontSize: 13.5, color: T.muted, marginBottom: 14, lineHeight: 1.5 }}>
          Delegates suggesting a 1:1 meeting can only pick times inside these windows. Add several windows to keep parts of a day free — for example 08:00–10:00 and 14:00–16:00.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {ctx.days.map((d) => {
            const a = dayFor(d.id)
            return (
              <div key={d.id} style={{ background: 'var(--wf-surface)', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 15, color: T.ink }}>{d.long || `${d.dow} ${d.date}`}</div>
                    <div style={{ fontFamily: T.onest, fontSize: 11.5, color: T.muted, marginTop: 2 }}>{describe(a)}</div>
                  </div>
                  <Toggle on={a.available} onTap={() => setDay(d.id, { ...a, available: !a.available })} />
                </div>
                {a.available && (
                  <>
                    {a.windows.map((w, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                        <Eyebrow>From</Eyebrow>
                        <select value={w.start} onChange={(e) => setWindow(d.id, i, { start: e.target.value })} style={selectStyle}>
                          {TICKS.slice(0, -1).map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <Eyebrow>Until</Eyebrow>
                        <select value={w.end} onChange={(e) => setWindow(d.id, i, { end: e.target.value })} style={selectStyle}>
                          {TICKS.filter((t) => t > w.start).map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <div style={{ flex: 1 }} />
                        {a.windows.length > 1 && (
                          <Press onClick={() => removeWindow(d.id, i)} style={{ color: T.muted, padding: 6 }}>
                            <Icon name="close" size={16} />
                          </Press>
                        )}
                      </div>
                    ))}
                    <Press onClick={() => addWindow(d.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: T.green10, fontFamily: T.sig, fontWeight: 600, fontSize: 13, marginTop: 11 }}>
                      <Icon name="plus" size={15} stroke={2.2} />Add another window
                    </Press>
                  </>
                )}
              </div>
            )
          })}
        </div>
        <Btn kind="primary" full size="lg" onClick={save} disabled={!loaded || saving}>{saving ? 'Saving…' : 'Save availability'}</Btn>
      </div>
    </div>
  )
}
