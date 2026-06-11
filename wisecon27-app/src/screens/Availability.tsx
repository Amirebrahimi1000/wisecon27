// WISEcon27 — my 1:1 meeting availability (pushed from My meetings).
// Per conference day: a toggle plus an optional time window. Other delegates
// can only pick meeting slots inside these windows.
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { T, TABBAR_H } from '../theme'
import type { AppCtx } from '../appState'
import type { DayWindow } from '../types'
import { TICKS, DEFAULT_WINDOW } from '../meetingSlots'
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

export function Availability({ ctx }: { ctx: AppCtx }) {
  const [avail, setAvail] = useState<Record<string, DayWindow>>({})
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase
      .from('profiles')
      .select('meeting_availability')
      .eq('id', ctx.userId)
      .single()
      .then(({ data }) => {
        setAvail(((data as { meeting_availability?: Record<string, DayWindow> | null } | null)?.meeting_availability) ?? {})
        setLoaded(true)
      })
  }, [ctx.userId])

  const winFor = (dayId: string): DayWindow => avail[dayId] ?? DEFAULT_WINDOW
  const setWin = (dayId: string, patch: Partial<DayWindow>) =>
    setAvail((a) => ({ ...a, [dayId]: { ...winFor(dayId), ...patch } }))

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
          Delegates suggesting a 1:1 meeting can only pick times inside these windows. By default you're bookable all day.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {ctx.days.map((d) => {
            const w = winFor(d.id)
            return (
              <div key={d.id} style={{ background: 'var(--wf-surface)', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 15, color: T.ink }}>{d.long || `${d.dow} ${d.date}`}</div>
                    <div style={{ fontFamily: T.onest, fontSize: 11.5, color: T.muted, marginTop: 2 }}>
                      {w.available ? `Bookable ${w.start}–${w.end}` : 'Not taking meetings'}
                    </div>
                  </div>
                  <Toggle on={w.available} onTap={() => setWin(d.id, { available: !w.available })} />
                </div>
                {w.available && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                    <Eyebrow>From</Eyebrow>
                    <select value={w.start} onChange={(e) => setWin(d.id, { start: e.target.value, end: e.target.value < w.end ? w.end : TICKS[TICKS.length - 1] })} style={selectStyle}>
                      {TICKS.slice(0, -1).map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <Eyebrow>Until</Eyebrow>
                    <select value={w.end} onChange={(e) => setWin(d.id, { end: e.target.value })} style={selectStyle}>
                      {TICKS.filter((t) => t > w.start).map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
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
