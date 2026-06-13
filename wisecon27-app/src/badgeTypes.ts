// WISEcon27 — delegate types drive badge colours (set per delegate in Admin).
export type DelegateType = 'uniwise' | 'sponsor_gold' | 'sponsor_silver' | 'sponsor_bronze' | 'delegate'

export interface BadgeStyle {
  label: string
  /** full-screen solid colour behind the badge card (DS: no gradients) */
  bg: string
  /** chip colours on the white card */
  chipBg: string
  chipText: string
}

export const BADGE_TYPES: Record<DelegateType, BadgeStyle> = {
  uniwise: {
    label: 'UNIwise',
    bg: 'var(--wf-green-11)',
    chipBg: 'var(--wf-green-1)',
    chipText: 'var(--wf-green-11)',
  },
  sponsor_gold: {
    label: 'Gold sponsor',
    bg: '#a8841f',
    chipBg: '#f7eed3',
    chipText: '#7a5f0e',
  },
  sponsor_silver: {
    label: 'Silver sponsor',
    bg: '#6f777f',
    chipBg: '#eceff2',
    chipText: '#4d555e',
  },
  sponsor_bronze: {
    label: 'Bronze sponsor',
    bg: '#8a5524',
    chipBg: '#f6e8da',
    chipText: '#74471a',
  },
  delegate: {
    label: 'Delegate',
    bg: 'var(--wf-blue-11)',
    chipBg: 'var(--wf-blue-1)',
    chipText: 'var(--wf-blue-11)',
  },
}

export const asDelegateType = (v: string | null | undefined): DelegateType =>
  v && v in BADGE_TYPES ? (v as DelegateType) : 'delegate'
