// WISEcon27 — line icon set. 24px artboard, 1.8 stroke, round caps, currentColor.
// Ported verbatim from prototype/app/icons.jsx.
import type { CSSProperties, ReactNode } from 'react'

export type IconName =
  | 'home' | 'calendar' | 'speakers' | 'connect' | 'user' | 'bell' | 'search'
  | 'filter' | 'bookmark' | 'bookmarkFill' | 'check' | 'checkCircle' | 'close'
  | 'chevronRight' | 'chevronLeft' | 'chevronDown' | 'clock' | 'pin' | 'star'
  | 'starFill' | 'send' | 'plus' | 'minus' | 'share' | 'sparkles' | 'shield'
  | 'qr' | 'message' | 'arrowRight' | 'arrowUp' | 'ticket' | 'mic' | 'coffee'
  | 'poll' | 'map' | 'info' | 'logout' | 'settings' | 'heart' | 'grid' | 'list'
  | 'wifi'

interface IconProps {
  name: IconName
  size?: number
  stroke?: number
  style?: CSSProperties
}

export function Icon({ name, size = 24, stroke = 1.8, style = {} }: IconProps) {
  const P = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: stroke,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  const paths: Record<IconName, ReactNode> = {
    home: <><path d="M4 11.5 12 4l8 7.5" {...P} /><path d="M6 10v9.5h12V10" {...P} /></>,
    calendar: <><rect x="4" y="5" width="16" height="15" rx="2.5" {...P} /><path d="M8 3v4M16 3v4M4 10h16" {...P} /></>,
    speakers: <><circle cx="12" cy="8" r="3.4" {...P} /><path d="M5 20c0-3.6 3.1-5.6 7-5.6s7 2 7 5.6" {...P} /></>,
    connect: <><circle cx="7" cy="9" r="2.6" {...P} /><circle cx="17" cy="9" r="2.6" {...P} /><path d="M2.5 19c0-2.6 2-4.2 4.5-4.2s4.5 1.6 4.5 4.2M12.5 19c0-2.6 2-4.2 4.5-4.2s4.5 1.6 4.5 4.2" {...P} /></>,
    user: <><circle cx="12" cy="8" r="3.6" {...P} /><path d="M5 20c0-3.8 3.1-5.8 7-5.8s7 2 7 5.8" {...P} /></>,
    bell: <><path d="M6 9.5a6 6 0 1 1 12 0v3.2l1.4 2.8H4.6L6 12.7z" {...P} /><path d="M9.7 19a2.4 2.4 0 0 0 4.6 0" {...P} /></>,
    search: <><circle cx="11" cy="11" r="7" {...P} /><path d="M21 21l-4.3-4.3" {...P} /></>,
    filter: <><path d="M4 6h16M7 12h10M10 18h4" {...P} /></>,
    bookmark: <path d="M7 4h10a1 1 0 0 1 1 1v15l-6-4-6 4V5a1 1 0 0 1 1-1z" {...P} />,
    bookmarkFill: <path d="M7 4h10a1 1 0 0 1 1 1v15l-6-4-6 4V5a1 1 0 0 1 1-1z" fill="currentColor" stroke="currentColor" strokeWidth={stroke} strokeLinejoin="round" />,
    check: <path d="M5 12.5l4.5 4.5L19 7" {...P} />,
    checkCircle: <><circle cx="12" cy="12" r="9" {...P} /><path d="M8 12.2l2.6 2.6L16 9" {...P} /></>,
    close: <path d="M6 6l12 12M18 6L6 18" {...P} />,
    chevronRight: <path d="M9 5l7 7-7 7" {...P} />,
    chevronLeft: <path d="M15 5l-7 7 7 7" {...P} />,
    chevronDown: <path d="M5 9l7 7 7-7" {...P} />,
    clock: <><circle cx="12" cy="12" r="8.5" {...P} /><path d="M12 7.5V12l3 2" {...P} /></>,
    pin: <><path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z" {...P} /><circle cx="12" cy="10" r="2.6" {...P} /></>,
    star: <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z" {...P} />,
    starFill: <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z" fill="currentColor" stroke="currentColor" strokeWidth={stroke} strokeLinejoin="round" />,
    send: <><path d="M21 4L3 11l7 2.5L13 21l8-17z" {...P} /><path d="M10 13.5L21 4" {...P} /></>,
    plus: <path d="M12 5v14M5 12h14" {...P} />,
    minus: <path d="M5 12h14" {...P} />,
    share: <><circle cx="6" cy="12" r="2.4" {...P} /><circle cx="17" cy="6" r="2.4" {...P} /><circle cx="17" cy="18" r="2.4" {...P} /><path d="M8.1 11l6.8-3.7M8.1 13l6.8 3.7" {...P} /></>,
    sparkles: <><path d="M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6z" {...P} /><path d="M18 15l.7 1.8 1.8.7-1.8.7L18 20l-.7-1.8-1.8-.7 1.8-.7z" {...P} /></>,
    shield: <><path d="M12 3l7 3v5.5c0 4.5-3 7.3-7 8.5-4-1.2-7-4-7-8.5V6z" {...P} /><path d="M9 11.5l2 2 4-4" {...P} /></>,
    qr: <><rect x="4" y="4" width="6" height="6" rx="1" {...P} /><rect x="14" y="4" width="6" height="6" rx="1" {...P} /><rect x="4" y="14" width="6" height="6" rx="1" {...P} /><path d="M14 14h2v2M20 14v.01M14 20h6M18 17v3" {...P} /></>,
    message: <path d="M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-4 4V6a1 1 0 0 1 1-1z" {...P} />,
    arrowRight: <path d="M5 12h14M13 6l6 6-6 6" {...P} />,
    arrowUp: <path d="M12 19V5M6 11l6-6 6 6" {...P} />,
    ticket: <><path d="M4 7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5V10a2 2 0 0 0 0 4v2.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5V14a2 2 0 0 0 0-4z" {...P} /><path d="M14 6v12" stroke="currentColor" strokeWidth={stroke} strokeDasharray="2 2.5" /></>,
    mic: <><rect x="9" y="3" width="6" height="11" rx="3" {...P} /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" {...P} /></>,
    coffee: <><path d="M5 8h12v5a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5z" {...P} /><path d="M17 9h2.2a2 2 0 0 1 0 4H17M8 3v2M12 3v2" {...P} /></>,
    poll: <><path d="M5 20V10M12 20V4M19 20v-7" {...P} /></>,
    map: <><path d="M9 4L4 6v14l5-2 6 2 5-2V4l-5 2-6-2z" {...P} /><path d="M9 4v14M15 6v14" {...P} /></>,
    info: <><circle cx="12" cy="12" r="9" {...P} /><path d="M12 11v5M12 8h.01" {...P} /></>,
    logout: <><path d="M10 5H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h4" {...P} /><path d="M15 8l4 4-4 4M9 12h10" {...P} /></>,
    settings: <><circle cx="12" cy="12" r="3" {...P} /><path d="M12 3v2.5M12 18.5V21M21 12h-2.5M5.5 12H3M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8M18.4 18.4l-1.8-1.8M7.4 7.4 5.6 5.6" {...P} /></>,
    heart: <path d="M12 20s-7-4.5-7-9.5A3.5 3.5 0 0 1 12 7a3.5 3.5 0 0 1 7 3.5C19 15.5 12 20 12 20z" {...P} />,
    grid: <><rect x="4" y="4" width="7" height="7" rx="1.5" {...P} /><rect x="13" y="4" width="7" height="7" rx="1.5" {...P} /><rect x="4" y="13" width="7" height="7" rx="1.5" {...P} /><rect x="13" y="13" width="7" height="7" rx="1.5" {...P} /></>,
    list: <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" {...P} />,
    wifi: <><path d="M3 9a14 14 0 0 1 18 0M6 12.5a9 9 0 0 1 12 0M9 16a4 4 0 0 1 6 0" {...P} /><circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" /></>,
  }
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} style={{ display: 'block', flexShrink: 0, ...style }}>
      {paths[name] || paths.info}
    </svg>
  )
}
