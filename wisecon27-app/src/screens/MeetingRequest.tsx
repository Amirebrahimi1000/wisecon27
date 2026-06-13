// WISEcon27 — suggest a 1:1 meeting (pushed from a delegate's profile, or
// from an incoming request via "Suggest another time" — params.meetingId).
// Pick a day, a 30-minute slot and a meeting point. Slots that collide with
// your confirmed/requested meetings are blocked, slots outside the other
// delegate's availability are greyed out, and agenda clashes are flagged.
// When rescheduling, sending the new suggestion declines the original.
import { useMemo, useState } from 'react'
import { T, TABBAR_H } from '../theme'
import type { AppCtx } from '../appState'
import { SLOTS, slotEnd, overlaps, availFor, inAnyWindow } from '../meetingSlots'
import { Icon } from '../components/Icon'
import { AppHeader, Avatar, Btn, Chip, Eyebrow, Press } from '../components/primitives'
import { useT } from '../i18n'

export function MeetingRequest({ ctx }: { ctx: AppCtx }) {
  const { t } = useT()
  // rescheduling? the original request we're countering
  const original = ctx.params.meetingId ? ctx.meetings.find((m) => m.id === ctx.params.meetingId) : undefined
  const peerId = ctx.params.peerId || ''
  const peer = ctx.attendees.find((a) => a.id === peerId)
  const first = peer?.name.split(' ')[0] ?? t('meetingreq.them')

  const [dayId, setDayId] = useState(original?.day ?? ctx.days[0]?.id ?? '')
  const [slot, setSlot] = useState<string | null>(null)
  const [pointId, setPointId] = useState(original?.pointId ?? ctx.meetingPoints[0]?.id ?? '')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  // the other delegate's availability windows for the chosen day
  const peerAvail = availFor(peer?.meetingAvailability, dayId)
  const dayOff = !peerAvail.available

  // my commitments on the chosen day: requested/confirmed meetings block a
  // slot outright (minus the one being rescheduled); bookmarked sessions only
  // flag a clash (plans can change)
  const { busy, clash } = useMemo(() => {
    const busy = new Set<string>()
    const clash = new Set<string>()
    const mtgs = ctx.meetings.filter(
      (m) => m.day === dayId && m.id !== original?.id && (m.status === 'pending' || m.status === 'accepted'),
    )
    const booked = ctx.sessions.filter((s) => s.day === dayId && ctx.isBookmarked(s.id))
    for (const s of SLOTS) {
      const e = slotEnd(s)
      if (mtgs.some((m) => overlaps(s, e, m.start, m.end))) busy.add(s)
      if (booked.some((b) => overlaps(s, e, b.start, b.end))) clash.add(s)
    }
    return { busy, clash }
  }, [ctx.meetings, ctx.sessions, ctx.isBookmarked, dayId, original?.id])

  const outsideWindow = (s: string) => !inAnyWindow(s, slotEnd(s), peerAvail)

  const send = async () => {
    if (!slot || sending) return
    setSending(true)
    const ok = await ctx.requestMeeting(peerId, dayId, slot, slotEnd(slot), pointId, message)
    setSending(false)
    if (!ok) return
    if (original) {
      // counter-proposal replaces the original request
      if (original.inviteeId === ctx.userId) ctx.respondMeeting(original.id, 'declined')
      else ctx.cancelMeeting(original.id)
      ctx.toast(t('meetingreq.toastNewTime'))
    } else {
      ctx.toast(t('meetingreq.toastSent').replace('{first}', first))
    }
    ctx.back()
  }

  return (
    <div>
      <AppHeader title={t('meetingreq.title')} sub={original ? t('meetingreq.subCounter') : t('meetingreq.subNew')} onBack={ctx.back} />
      <div style={{ padding: '14px 16px ' + (TABBAR_H + 16) + 'px' }}>
        {/* who */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--wf-surface)', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', padding: 14, marginBottom: original ? 10 : 18 }}>
          <Avatar initials={peer?.initials ?? '?'} color={peer?.color ?? 'var(--wf-blue-9)'} size={44} src={peer?.avatarUrl} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 15, color: T.ink }}>{peer?.name ?? t('meetingreq.aDelegate')}</div>
            <div style={{ fontFamily: T.sig, fontSize: 12.5, color: T.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {[peer?.role, peer?.org].filter(Boolean).join(' · ')}
            </div>
          </div>
        </div>

        {original && (
          <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', background: 'var(--wf-blue-1)', borderRadius: 'var(--radius-4)', padding: '11px 13px', marginBottom: 18 }}>
            <Icon name="info" size={16} style={{ color: 'var(--wf-blue-9)', flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontFamily: T.sig, fontSize: 13, color: 'var(--wf-blue-11)', lineHeight: 1.45 }}>
              {t('meetingreq.counterInfo').replace('{first}', first).replace('{start}', original.start).replace('{end}', original.end)}
            </span>
          </div>
        )}

        {/* day */}
        <Eyebrow style={{ marginBottom: 8, paddingLeft: 2 }}>{t('meetingreq.labelDay')}</Eyebrow>
        <div className="wc-noscroll" style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 18 }}>
          {ctx.days.map((d) => (
            <Chip key={d.id} active={dayId === d.id} onClick={() => { setDayId(d.id); setSlot(null) }}>{d.dow} {d.date}</Chip>
          ))}
        </div>

        {/* time slot */}
        <Eyebrow style={{ marginBottom: 8, paddingLeft: 2 }}>{t('meetingreq.labelTime')}</Eyebrow>
        {dayOff ? (
          <div style={{ fontFamily: T.sig, fontSize: 14, color: T.muted, background: 'var(--wf-surface)', borderRadius: 'var(--radius-4)', padding: 14, boxShadow: 'var(--shadow-sm)', marginBottom: 18, lineHeight: 1.5 }}>
            {t('meetingreq.dayOff').replace('{first}', first)}
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 8 }}>
              {SLOTS.map((s) => {
                const blocked = busy.has(s)
                const off = outsideWindow(s)
                const warned = clash.has(s)
                const on = slot === s
                return (
                  <Press
                    key={s}
                    disabled={blocked || off}
                    onClick={() => setSlot(s)}
                    style={{
                      textAlign: 'center', padding: '10px 0', borderRadius: 'var(--radius-2)', position: 'relative',
                      fontFamily: T.onest, fontWeight: 600, fontSize: 13.5,
                      background: on ? T.green9 : blocked || off ? 'var(--wf-grey-3)' : 'var(--wf-surface)',
                      color: on ? '#fff' : blocked || off ? T.line2 : T.ink,
                      boxShadow: on || blocked || off ? 'none' : 'inset 0 0 0 1px var(--wf-grey-6)',
                      textDecoration: blocked ? 'line-through' : 'none',
                      opacity: off && !blocked ? 0.55 : 1,
                    }}
                  >
                    {s}
                    {warned && !blocked && !off && (
                      <span style={{ position: 'absolute', top: 4, right: 5, width: 6, height: 6, borderRadius: 999, background: 'var(--wf-orange-9)' }} />
                    )}
                  </Press>
                )
              })}
            </div>
            <div style={{ fontFamily: T.onest, fontSize: 11.5, color: T.muted, marginBottom: 18, lineHeight: 1.5 }}>
              {t('meetingreq.slotLegend').replace('{first}', first)}
            </div>
          </>
        )}

        {/* meeting point */}
        <Eyebrow style={{ marginBottom: 8, paddingLeft: 2 }}>{t('meetingreq.labelPoint')}</Eyebrow>
        {ctx.meetingPoints.length === 0 ? (
          <div style={{ fontFamily: T.sig, fontSize: 13.5, color: T.muted, marginBottom: 18 }}>{t('meetingreq.noPoints')}</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
            {ctx.meetingPoints.map((p) => {
              const on = pointId === p.id
              return (
                <Press key={p.id} onClick={() => setPointId(p.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', borderRadius: 'var(--radius-4)', background: 'var(--wf-surface)', boxShadow: 'inset 0 0 0 ' + (on ? '1.5px ' + T.green9 : '1px var(--wf-grey-6)') }}>
                  <Icon name="pin" size={17} style={{ color: on ? T.green9 : T.muted }} />
                  <span style={{ flex: 1, fontFamily: T.sig, fontWeight: 600, fontSize: 14, color: T.ink }}>{p.label}</span>
                  {on && <Icon name="check" size={17} stroke={2.4} style={{ color: T.green9 }} />}
                </Press>
              )
            })}
          </div>
        )}

        {/* message */}
        <Eyebrow style={{ marginBottom: 8, paddingLeft: 2 }}>{t('meetingreq.labelMessage')}</Eyebrow>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, 200))}
          placeholder={t('meetingreq.messagePlaceholder')}
          rows={3}
          style={{ width: '100%', boxSizing: 'border-box', resize: 'none', border: 'none', outline: 'none', background: 'var(--wf-surface)', boxShadow: 'inset 0 0 0 1px var(--wf-grey-6)', borderRadius: 'var(--radius-4)', padding: 12, fontFamily: T.sig, fontSize: 14.5, color: T.ink, lineHeight: 1.5, marginBottom: 16 }}
        />

        <Btn kind="primary" full size="lg" icon="send" onClick={send} disabled={!slot || sending}>
          {sending ? t('meetingreq.sending') : slot ? `${t('meetingreq.suggest')} ${slot}–${slotEnd(slot)}` : t('meetingreq.pickSlot')}
        </Btn>
      </div>
    </div>
  )
}
