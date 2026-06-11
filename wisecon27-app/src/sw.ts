// WISEcon27 — service worker. Precaches the app shell and handles Web Push.
/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching'

declare const self: ServiceWorkerGlobalScope

precacheAndRoute(self.__WB_MANIFEST)

// Activate a new version immediately and take control of open tabs, so content
// updates (schedule changes, new builds) reach delegates without a manual reload.
self.addEventListener('install', () => {
  self.skipWaiting()
})
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event: PushEvent) => {
  let data: { title?: string; body?: string; url?: string } = {}
  try {
    data = event.data?.json() ?? {}
  } catch {
    data = { body: event.data?.text() }
  }
  const icon = new URL('logo-icon.svg', self.registration.scope).href
  event.waitUntil(
    self.registration.showNotification(data.title || 'WISEcon27', {
      body: data.body || '',
      icon,
      badge: icon,
      data: { url: data.url || self.registration.scope },
    }),
  )
})

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  const url = (event.notification.data?.url as string) || self.registration.scope
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const open = clients.find((c) => 'focus' in c) as WindowClient | undefined
      if (open) {
        // app already running: focus it and let it route to the right screen
        open.postMessage({ type: 'navigate', url })
        return open.focus()
      }
      // cold start: the app reads the #nav= hash on load
      return self.clients.openWindow(url)
    }),
  )
})
