// WISEcon27 — keep the running app current without manual reloads.
// The service worker uses skipWaiting + clientsClaim, so a new build activates
// as soon as it is discovered; this module (1) actively checks for new builds
// while the app is open, and (2) reloads the page once a new worker takes
// control, so delegates see updates immediately.

const CHECK_EVERY_MS = 60_000

export function watchForAppUpdates() {
  if (!('serviceWorker' in navigator)) return

  // true on a normal visit (a worker already controls the page); false on the
  // very first visit, where the initial clients.claim() also fires
  // controllerchange and must NOT trigger a reload loop
  let hadController = !!navigator.serviceWorker.controller
  let reloading = false

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) {
      hadController = true
      return
    }
    if (reloading) return
    reloading = true
    window.location.reload()
  })

  const check = async () => {
    try {
      const reg = await navigator.serviceWorker.getRegistration()
      await reg?.update()
    } catch {
      /* offline / transient — try again next tick */
    }
  }

  // poll while open, and check immediately whenever the app returns to the
  // foreground (the common "opened the installed app again" moment)
  setInterval(check, CHECK_EVERY_MS)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') check()
  })
}
