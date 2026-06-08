// WISEcon27 — Web Push subscription. Registers the device for push and stores
// the subscription in Supabase so the send-push edge function can reach it.
import { supabase } from './lib/supabase'

const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

export const pushSupported = () =>
  typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

export const pushPermission = (): NotificationPermission =>
  typeof Notification !== 'undefined' ? Notification.permission : 'denied'

function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

/** Request permission, subscribe, and persist the subscription. Returns an error string or null. */
export async function enablePush(userId: string): Promise<string | null> {
  if (!pushSupported()) return 'Push notifications are not supported on this device.'
  if (!VAPID_PUBLIC) return 'Push is not configured (missing VAPID key).'

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return 'Notification permission was not granted.'

  const reg = await navigator.serviceWorker.ready
  const existing = await reg.pushManager.getSubscription()
  const sub =
    existing ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
    }))

  const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } }
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return 'Could not read the push subscription.'

  const { error } = await supabase.from('push_subscriptions').upsert(
    { user_id: userId, endpoint: json.endpoint, p256dh: json.keys.p256dh, auth: json.keys.auth },
    { onConflict: 'endpoint' },
  )
  return error ? error.message : null
}

export async function isPushEnabled(): Promise<boolean> {
  if (!pushSupported() || pushPermission() !== 'granted') return false
  const reg = await navigator.serviceWorker.ready
  return !!(await reg.pushManager.getSubscription())
}
