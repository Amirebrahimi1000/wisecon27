// WISEcon27 — shared UI primitives. Ported from prototype components.jsx,
// plus AppHeader/Chip (screens-core) and BottomNav/Toast (app.jsx).
import type { CSSProperties, ReactNode } from 'react'
import { T, STATUS_INSET } from '../theme'
import { TRACKS, speakersOf } from '../data'
import type { Session, Speaker, TrackId } from '../types'
import { Icon, type IconName } from './Icon'

/* ── tiny press feedback wrapper ── */
export function Press({
  children,
  onClick,
  style = {},
  className = '',
  disabled = false,
}: {
  children: ReactNode
  onClick?: (e: React.MouseEvent) => void
  style?: CSSProperties
  className?: string
  disabled?: boolean
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={disabled ? undefined : onClick}
      className={'wc-press ' + className}
      style={{ cursor: disabled ? 'default' : 'pointer', ...style }}
    >
      {children}
    </div>
  )
}

/* ── eyebrow label (Onest uppercase) ── */
export function Eyebrow({
  children,
  color = T.muted,
  style = {},
}: {
  children: ReactNode
  color?: string
  style?: CSSProperties
}) {
  return (
    <div
      style={{
        fontFamily: T.onest,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.07em',
        textTransform: 'uppercase',
        color,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/* ── avatar / monogram ── */
export function Avatar({
  initials,
  color = T.green9,
  size = 40,
  ring = false,
  src = null,
  style = {},
}: {
  initials: string
  color?: string
  size?: number
  ring?: boolean
  src?: string | null
  style?: CSSProperties
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        color: '#fff',
        display: 'grid',
        placeItems: 'center',
        fontFamily: T.onest,
        fontWeight: 700,
        fontSize: size * 0.36,
        flexShrink: 0,
        letterSpacing: '0.01em',
        overflow: 'hidden',
        boxShadow: ring ? '0 0 0 2.5px #fff, 0 0 0 4px ' + color : 'none',
        ...style,
      }}
    >
      {src ? (
        <img src={src} alt={initials} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        initials
      )}
    </div>
  )
}

/* ── track tag ── */
export function TrackTag({ track, size = 'sm' }: { track: TrackId; size?: 'sm' | 'lg' }) {
  const t = TRACKS[track]
  if (!t) return null
  const pad = size === 'sm' ? '3px 9px 3px 8px' : '5px 12px 5px 10px'
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: t.bg,
        color: t.fg,
        borderRadius: 999,
        padding: pad,
        fontFamily: T.sig,
        fontWeight: 600,
        fontSize: size === 'sm' ? 12 : 13,
        lineHeight: 1.2,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 999, background: t.dot }} />
      {t.name}
    </span>
  )
}

/* ── generic button ── */
type BtnKind = 'primary' | 'dark' | 'secondary' | 'default' | 'ghost' | 'outline' | 'danger'
export function Btn({
  children,
  kind = 'primary',
  size = 'md',
  full = false,
  icon,
  onClick,
  style = {},
  disabled = false,
}: {
  children?: ReactNode
  kind?: BtnKind
  size?: 'sm' | 'md' | 'lg'
  full?: boolean
  icon?: IconName
  onClick?: () => void
  style?: CSSProperties
  disabled?: boolean
}) {
  const h = size === 'lg' ? 48 : size === 'sm' ? 34 : 42
  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: h,
    padding: size === 'sm' ? '0 14px' : '0 18px',
    borderRadius: 'var(--radius-2)',
    fontFamily: T.sig,
    fontWeight: 600,
    fontSize: size === 'lg' ? 16 : 14,
    border: 'none',
    cursor: disabled ? 'default' : 'pointer',
    width: full ? '100%' : 'auto',
    WebkitTapHighlightColor: 'transparent',
    opacity: disabled ? 0.5 : 1,
    whiteSpace: 'nowrap',
  }
  const kinds: Record<BtnKind, CSSProperties> = {
    primary: { background: T.green9, color: '#fff' },
    dark: { background: '#111', color: '#fff' },
    secondary: { background: 'var(--wf-blue-9)', color: '#fff' },
    default: { background: 'var(--wf-grey-4)', color: T.ink },
    ghost: { background: 'transparent', color: T.green10 },
    outline: { background: 'var(--wf-surface)', color: T.ink, boxShadow: 'inset 0 0 0 1px var(--wf-grey-6)' },
    danger: { background: 'transparent', color: 'var(--wf-negative-9)', boxShadow: 'inset 0 0 0 1px var(--wf-grey-6)' },
  }
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className="wc-press"
      style={{ ...base, ...kinds[kind], ...style }}
    >
      {icon && <Icon name={icon} size={size === 'lg' ? 19 : 17} stroke={2} />}
      {children}
    </button>
  )
}

/* ── icon button (round) ── */
export function IconBtn({
  name,
  onClick,
  size = 38,
  color = T.body,
  bg = 'transparent',
  stroke = 1.8,
  badge = false,
  style = {},
}: {
  name: IconName
  onClick?: () => void
  size?: number
  color?: string
  bg?: string
  stroke?: number
  badge?: boolean
  style?: CSSProperties
}) {
  return (
    <Press
      onClick={onClick}
      style={{ width: size, height: size, borderRadius: '50%', background: bg, display: 'grid', placeItems: 'center', color, position: 'relative', ...style }}
    >
      <Icon name={name} size={size * 0.55} stroke={stroke} />
      {badge && (
        <span
          style={{ position: 'absolute', top: size * 0.18, right: size * 0.2, width: 8, height: 8, borderRadius: 999, background: 'var(--wf-tomato-9)', boxShadow: '0 0 0 2px #fff' }}
        />
      )}
    </Press>
  )
}

/* ── bookmark toggle ── */
export function BookmarkBtn({
  on,
  onClick,
  size = 38,
  light = false,
}: {
  on: boolean
  onClick: () => void
  size?: number
  light?: boolean
}) {
  return (
    <Press
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      style={{ width: size, height: size, borderRadius: '50%', display: 'grid', placeItems: 'center', color: on ? T.green9 : light ? 'rgba(255,255,255,0.85)' : T.muted, background: 'transparent', flexShrink: 0 }}
    >
      <Icon name={on ? 'bookmarkFill' : 'bookmark'} size={size * 0.5} stroke={1.9} />
    </Press>
  )
}

/* ── session type → icon + label (breaks/social/plenary) ── */
export const TYPE_META: Record<Session['type'], { icon: IconName; label: string }> = {
  keynote: { icon: 'mic', label: 'Keynote' },
  talk: { icon: 'speakers', label: 'Talk' },
  panel: { icon: 'connect', label: 'Panel' },
  workshop: { icon: 'grid', label: 'Workshop' },
  break: { icon: 'coffee', label: 'Break' },
  social: { icon: 'heart', label: 'Social' },
  plenary: { icon: 'star', label: 'Plenary' },
}

/* ── session row — the workhorse list item ── */
export function SessionRow({
  s,
  bookmarked,
  onToggle,
  onOpen,
  showBookmark = true,
}: {
  s: Session
  bookmarked: boolean
  onToggle: () => void
  onOpen: (s: Session) => void
  showBookmark?: boolean
}) {
  const t = TRACKS[s.track]
  const isBreak = s.type === 'break' || s.type === 'social'
  const isMeeting = s.id.startsWith('mtg:') // 1:1 meeting riding along in the agenda
  const sp = speakersOf(s)
  return (
    <Press onClick={() => onOpen(s)} style={{ display: 'flex', gap: 12, padding: '14px 16px', alignItems: 'stretch', background: 'var(--wf-surface)' }}>
      <div style={{ width: 52, flexShrink: 0, textAlign: 'right', paddingTop: 1 }}>
        <div style={{ fontFamily: T.sig, fontWeight: 600, fontSize: 14, color: T.ink }}>{s.start}</div>
        <div style={{ fontFamily: T.onest, fontSize: 11, color: T.muted }}>{s.end}</div>
      </div>
      <div style={{ width: 3, borderRadius: 3, background: t.dot, flexShrink: 0, opacity: isBreak ? 0.4 : 1 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          {isMeeting ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: T.green10, fontFamily: T.onest, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              <Icon name="connect" size={14} stroke={2} />
              1:1 meeting
            </span>
          ) : !isBreak ? (
            <TrackTag track={s.track} />
          ) : (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: T.subtle, fontFamily: T.onest, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              <Icon name={TYPE_META[s.type].icon} size={14} stroke={2} />
              {TYPE_META[s.type].label}
            </span>
          )}
        </div>
        <div style={{ fontFamily: T.sig, fontWeight: 600, fontSize: 16, color: T.ink, lineHeight: 1.25 }}>{s.title}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5, color: T.muted, fontSize: 12.5, fontFamily: T.sig }}>
          <Icon name="pin" size={14} stroke={1.8} />
          <span>{s.room}</span>
          {sp.length > 0 && (
            <>
              <span style={{ opacity: 0.5 }}>·</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {sp[0].name.replace(/^(Dr\.|Prof\.) /, '')}
                {sp.length > 1 ? ` +${sp.length - 1}` : ''}
              </span>
            </>
          )}
        </div>
      </div>
      {showBookmark && !isBreak && (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <BookmarkBtn on={bookmarked} onClick={onToggle} />
        </div>
      )}
    </Press>
  )
}

/* ── card wrapper ── */
export function Card({
  children,
  style = {},
  onClick,
  pad = 16,
}: {
  children: ReactNode
  style?: CSSProperties
  onClick?: () => void
  pad?: number
}) {
  const inner: CSSProperties = { background: 'var(--wf-surface)', borderRadius: 'var(--radius-5)', padding: pad, boxShadow: 'var(--shadow-card)', ...style }
  return onClick ? (
    <Press onClick={onClick} style={inner}>
      {children}
    </Press>
  ) : (
    <div style={inner}>{children}</div>
  )
}

/* ── divider ── */
export function Divider({ style = {} }: { style?: CSSProperties }) {
  return <div style={{ height: 1, background: T.line, ...style }} />
}

/* ── sticky app header ── */
export function AppHeader({
  title,
  onBack,
  right,
  sub,
}: {
  title: string
  onBack?: (() => void) | null
  right?: ReactNode
  sub?: string
}) {
  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 30, background: 'var(--wf-glass)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderBottom: '1px solid ' + T.line, paddingTop: STATUS_INSET }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px 12px', minHeight: 44 }}>
        {onBack && <IconBtn name="chevronLeft" onClick={onBack} size={38} stroke={2.2} />}
        <div style={{ flex: 1, minWidth: 0, paddingLeft: onBack ? 0 : 8 }}>
          <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 21, color: T.ink, lineHeight: 1.1, letterSpacing: '-0.01em' }}>{title}</div>
          {sub && <div style={{ fontFamily: T.onest, fontSize: 12, color: T.muted, marginTop: 1 }}>{sub}</div>}
        </div>
        {right}
      </div>
    </div>
  )
}

/* ── horizontally-scrolling chip row ── */
export function ChipRow({ children, style = {} }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div className="wc-noscroll" style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '12px 16px', ...style }}>
      {children}
    </div>
  )
}
export function Chip({
  active,
  onClick,
  children,
  color,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
  color?: string
}) {
  return (
    <Press
      onClick={onClick}
      style={{ flexShrink: 0, height: 34, padding: '0 14px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: T.sig, fontWeight: 600, fontSize: 13.5, background: active ? 'var(--wf-grey-12)' : 'var(--wf-surface)', color: active ? 'var(--wf-grey-1)' : T.body, boxShadow: active ? 'none' : 'inset 0 0 0 1px var(--wf-grey-6)', whiteSpace: 'nowrap' }}
    >
      {color && <span style={{ width: 7, height: 7, borderRadius: 999, background: color }} />}
      {children}
    </Press>
  )
}

/* ── empty state ── */
export function Empty({ icon, text }: { icon: IconName; text: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 20px', color: T.muted }}>
      <div style={{ display: 'grid', placeItems: 'center', marginBottom: 10, color: T.line2 }}>
        <Icon name={icon} size={32} />
      </div>
      <div style={{ fontFamily: T.sig, fontSize: 14.5 }}>{text}</div>
    </div>
  )
}

export { speakersOf }
export type { Speaker }
