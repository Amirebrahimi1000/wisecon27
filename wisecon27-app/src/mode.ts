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
  return 'light'
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

/* ── Text size (Settings → Text size) ───────────────────────────── */
export type TextSize = 'normal' | 'large' | 'xlarge'
const SIZE_KEY = 'wc27.textsize'

export function getTextSize(): TextSize {
  try {
    const v = localStorage.getItem(SIZE_KEY)
    if (v === 'normal' || v === 'large' || v === 'xlarge') return v
  } catch {
    /* ignore */
  }
  return 'normal'
}

export function setTextSize(size: TextSize) {
  try {
    localStorage.setItem(SIZE_KEY, size)
  } catch {
    /* ignore */
  }
  document.documentElement.setAttribute('data-textsize', size)
}

/** Call once at startup. */
export function initTextSize() {
  document.documentElement.setAttribute('data-textsize', getTextSize())
}

/* ── Real app height ──────────────────────────────────────────────
   iOS 26 standalone web apps resolve 100% / 100vh / 100dvh to the
   window height MINUS the status bar while still drawing from the top
   edge — leaving a status-bar-sized band at the bottom. window.innerHeight
   reports the true height, so we measure it and drive layout from a
   custom property instead of CSS units. */
export function initAppHeight() {
  const set = () => document.documentElement.style.setProperty('--app-height', window.innerHeight + 'px')
  set()
  // iOS reports stale values on cold start — re-measure a few times
  setTimeout(set, 100)
  setTimeout(set, 500)
  setTimeout(set, 1500)
  window.addEventListener('resize', set)
  window.addEventListener('orientationchange', () => setTimeout(set, 300))
}
