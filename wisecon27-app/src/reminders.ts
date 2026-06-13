// WISEcon27 — per-session reminders.
// Two delivery paths, kept in sync from one opt-in:
//  • Server (closed-app): each opt-in is mirrored to the session_reminders
//    table; the send-reminders cron pushes it even when the app is shut.
//  • Local (foreground fallback): a scheduler running while the app is open
//    fires a notification for delegates who haven't enabled push, so they
//    still get reminded. It stands down when push is on to avoid duplicates.
import { useEffect } from 'react'
import type { AppCtx } from './appState'
import { sessionStartMs } from './sessionTime'
import { supabase } from './lib/supabase'
import { isPushEnabled } from './push'

export const REMINDER_LEAD_MIN = 10

const setKey = (userId: string) => `wc27.reminders.${userId}`
const firedKey = (userId: string) => `wc27.reminders.fired.${userId}`

const read = (key: string): string[] => {
  try {
    const v = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}
const write = (key: string, ids: string[]) => {
  try {
    localStorage.setItem(key, JSON.stringify([...new Set(ids)]))
  } catch {
    /* ignore */
  }
}

export const getReminders = (userId: string): Set<string> => new Set(read(setKey(userId)))
export const hasReminder = (userId: string, sessionId: string) => read(setKey(userId)).includes(sessionId)

/** Toggle a reminder; returns the new on/off state. */
export function toggleReminder(userId: string, sessionId: string): boolean {
  const ids = read(setKey(userId))
  const on = ids.includes(sessionId)
  write(setKey(userId), on ? ids.filter((x) => x !== sessionId) : [...ids, sessionId])
  // clearing a reminder also clears any "already fired" flag so re-adding works
  if (on) write(firedKey(userId), read(firedKey(userId)).filter((x) => x !== sessionId))
  return !on
}

/** Mirror the opt-in to the server so it can deliver when the app is closed.
 *  Fire-and-forget: local delivery still works if this write fails. */
export function syncReminderToServer(userId: string, sessionId: string, on: boolean, remindAtMs: number) {
  if (!userId) return
  if (on) {
    if (Number.isNaN(remindAtMs)) return
    supabase
      .from('session_reminders')
      .upsert({ user_id: userId, session_id: sessionId, remind_at: new Date(remindAtMs).toISOString(), sent_at: null })
      .then()
  } else {
    supabase.from('session_reminders').delete().eq('user_id', userId).eq('session_id', sessionId).then()
  }
}

async function notify(title: string, body: string, tag: string) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return false
  try {
    const reg = await navigator.serviceWorker?.ready
    if (reg) {
      await reg.showNotification(title, { body, tag, icon: import.meta.env.BASE_URL + 'logo-icon.svg' })
      return true
    }
    new Notification(title, { body, tag })
    return true
  } catch {
    return false
  }
}

/** Polls every 30s while mounted; fires due reminders once each. */
export function useReminderScheduler(ctx: AppCtx) {
  const userId = ctx.userId
  useEffect(() => {
    if (!userId) return
    let alive = true
    const tick = async () => {
      if (!alive) return
      const want = read(setKey(userId))
      if (!want.length) return
      // push on → the server cron delivers (foreground and closed); don't also
      // fire locally or the delegate gets the reminder twice.
      if (await isPushEnabled()) return
      const fired = new Set(read(firedKey(userId)))
      const now = Date.now()
      const lead = REMINDER_LEAD_MIN * 60000
      for (const id of want) {
        if (fired.has(id)) continue
        const s = ctx.sessions.find((x) => x.id === id)
        if (!s) continue
        const startMs = sessionStartMs(ctx, s)
        if (Number.isNaN(startMs)) continue
        // fire once we're inside the lead window but before the session ends
        if (now >= startMs - lead && now < startMs + 60000) {
          const mins = Math.max(0, Math.round((startMs - now) / 60000))
          const when = mins <= 1 ? 'starting now' : `starts in ${mins} min`
          const shown = await notify(s.title, `${when} · ${s.room}`, 'wc27-reminder-' + id)
          if (!shown) ctx.toast(`${s.title} ${when}`)
          fired.add(id)
          write(firedKey(userId), [...fired])
        }
      }
    }
    tick()
    const t = setInterval(tick, 30000)
    return () => {
      alive = false
      clearInterval(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, ctx.sessions, ctx.event.startISO])
}
