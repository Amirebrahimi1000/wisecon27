// WISEcon27 — light / dark appearance. 'system' follows the OS; the choice is
// stored per device and applied as html[data-mode] which index.css themes.
export type AppMode = 'system' | 'light' | 'dark'

const KEY = 'wc27.mode'
const mq = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null

export function getMode(): AppMode {
  try {
    const v = localStorage.getItem(KEY)
    if (v === 'light' || v === 'dark' || v === 'system') return v
  } catch {
    /* ignore */
  }
  return 'system'
}

function apply(mode: AppMode) {
  const dark = mode === 'dark' || (mode === 'system' && !!mq?.matches)
  document.documentElement.setAttribute('data-mode', dark ? 'dark' : 'light')
}

export function setMode(mode: AppMode) {
  try {
    localStorage.setItem(KEY, mode)
  } catch {
    /* ignore */
  }
  apply(mode)
}

/** Call once at startup: applies the stored mode and tracks OS changes. */
export function initMode() {
  apply(getMode())
  mq?.addEventListener('change', () => {
    if (getMode() === 'system') apply('system')
  })
}
