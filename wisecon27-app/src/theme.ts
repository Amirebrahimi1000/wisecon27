// WISEcon27 — token shorthand consumed by components (mirrors prototype `T`).
// All values are CSS custom properties defined in index.css.

export const T = {
  green1: 'var(--wf-green-1)',
  green2: 'var(--wf-green-2)',
  green7: 'var(--wf-green-7)',
  green8: 'var(--wf-green-8)',
  green9: 'var(--wf-green-9)',
  green10: 'var(--wf-green-10)',
  green11: 'var(--wf-green-11)',
  green12: 'var(--wf-green-12)',
  ink: '#000',
  body: 'var(--wf-grey-11)',
  muted: 'var(--wf-grey-9)',
  subtle: 'var(--wf-grey-10)',
  line: 'var(--wf-grey-5)',
  line2: 'var(--wf-grey-6)',
  surface: '#fff',
  sunken: 'var(--wf-grey-2)',
  page: 'var(--wf-grey-2)',
  sig: '"Signika", system-ui, sans-serif',
  onest: '"Onest", system-ui, sans-serif',
} as const

// Layout insets (status bar reserve + tab bar height) — match the prototype.
export const STATUS_INSET = 54
export const TABBAR_H = 82
