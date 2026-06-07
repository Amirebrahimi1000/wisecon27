// WISEcon27 — shared UI primitives. Consumes WISEflow tokens via CSS vars.
(function () {
const { Icon } = window;

/* ── tokens shorthand ── */
const T = {
  green1: 'var(--wf-green-1)', green2: 'var(--wf-green-2)', green7: 'var(--wf-green-7)',
  green8: 'var(--wf-green-8)', green9: 'var(--wf-green-9)', green10: 'var(--wf-green-10)',
  green11: 'var(--wf-green-11)', green12: 'var(--wf-green-12)',
  ink: '#000', body: 'var(--wf-grey-11)', muted: 'var(--wf-grey-9)', subtle: 'var(--wf-grey-10)',
  line: 'var(--wf-grey-5)', line2: 'var(--wf-grey-6)', surface: '#fff',
  sunken: 'var(--wf-grey-2)', page: 'var(--wf-grey-2)',
  sig: '"Signika", system-ui, sans-serif', onest: '"Onest", system-ui, sans-serif',
};

/* ── tiny press feedback wrapper ── */
function Press({ children, onClick, style = {}, className = '', disabled = false, ...rest }) {
  return (
    <div role="button" tabIndex={0} onClick={disabled ? undefined : onClick} className={'wc-press ' + className}
      style={{ cursor: disabled ? 'default' : 'pointer', WebkitTapHighlightColor: 'transparent', ...style }}
      {...rest}>{children}</div>
  );
}

/* ── eyebrow label (Onest uppercase) ── */
function Eyebrow({ children, color = T.muted, style = {} }) {
  return <div style={{ fontFamily: T.onest, fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color, whiteSpace: 'nowrap', ...style }}>{children}</div>;
}

/* ── avatar / monogram ── */
function Avatar({ initials, color = T.green9, size = 40, ring = false, style = {} }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: color, color: '#fff',
      display: 'grid', placeItems: 'center', fontFamily: T.onest, fontWeight: 700,
      fontSize: size * 0.36, flexShrink: 0, letterSpacing: '0.01em',
      boxShadow: ring ? '0 0 0 2.5px #fff, 0 0 0 4px ' + color : 'none', ...style,
    }}>{initials}</div>
  );
}

/* ── stacked avatars ── */
function AvatarStack({ people, size = 24, max = 3 }) {
  const shown = people.slice(0, max);
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {shown.map((p, i) => (
        <div key={p.id} style={{ marginLeft: i === 0 ? 0 : -size * 0.34, zIndex: shown.length - i }}>
          <Avatar initials={p.initials} color={p.color} size={size} style={{ boxShadow: '0 0 0 2px #fff' }} />
        </div>
      ))}
      {people.length > max && (
        <div style={{ marginLeft: -size * 0.34, width: size, height: size, borderRadius: '50%', background: 'var(--wf-grey-4)', color: T.body, display: 'grid', placeItems: 'center', fontFamily: T.onest, fontWeight: 700, fontSize: size * 0.32, boxShadow: '0 0 0 2px #fff', zIndex: 0 }}>+{people.length - max}</div>
      )}
    </div>
  );
}

/* ── track tag ── */
function TrackTag({ track, size = 'sm' }) {
  const t = window.DATA.TRACKS[track];
  if (!t) return null;
  const pad = size === 'sm' ? '3px 9px 3px 8px' : '5px 12px 5px 10px';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: t.bg, color: t.fg, borderRadius: 999, padding: pad, fontFamily: T.sig, fontWeight: 600, fontSize: size === 'sm' ? 12 : 13, lineHeight: 1.2, whiteSpace: 'nowrap' }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: t.dot }} />{t.name}
    </span>
  );
}

/* ── generic button ── */
function Btn({ children, kind = 'primary', size = 'md', full = false, icon, onClick, style = {}, disabled = false }) {
  const h = size === 'lg' ? 48 : size === 'sm' ? 34 : 42;
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: h, padding: size === 'sm' ? '0 14px' : '0 18px', borderRadius: 'var(--radius-2)',
    fontFamily: T.sig, fontWeight: 600, fontSize: size === 'lg' ? 16 : 14, border: 'none',
    cursor: disabled ? 'default' : 'pointer', width: full ? '100%' : 'auto',
    transition: 'filter .15s, background .15s', WebkitTapHighlightColor: 'transparent',
    opacity: disabled ? 0.5 : 1, whiteSpace: 'nowrap',
  };
  const kinds = {
    primary: { background: T.green9, color: '#fff' },
    dark: { background: '#111', color: '#fff' },
    secondary: { background: 'var(--wf-blue-9)', color: '#fff' },
    default: { background: 'var(--wf-grey-4)', color: T.ink },
    ghost: { background: 'transparent', color: T.green10 },
    outline: { background: '#fff', color: T.ink, boxShadow: 'inset 0 0 0 1px var(--wf-grey-6)' },
    danger: { background: 'transparent', color: 'var(--wf-negative-9)', boxShadow: 'inset 0 0 0 1px var(--wf-grey-6)' },
  };
  return (
    <button onClick={disabled ? undefined : onClick} disabled={disabled} style={{ ...base, ...kinds[kind], ...style }}
      onMouseDown={e => e.currentTarget.style.filter = 'brightness(0.94)'}
      onMouseUp={e => e.currentTarget.style.filter = 'none'}
      onMouseLeave={e => e.currentTarget.style.filter = 'none'}>
      {icon && <Icon name={icon} size={size === 'lg' ? 19 : 17} stroke={2} />}{children}
    </button>
  );
}

/* ── icon button (round) ── */
function IconBtn({ name, onClick, size = 38, color = T.body, bg = 'transparent', stroke = 1.8, badge = false, style = {} }) {
  return (
    <Press onClick={onClick} style={{ width: size, height: size, borderRadius: '50%', background: bg, display: 'grid', placeItems: 'center', color, position: 'relative', ...style }}>
      <Icon name={name} size={size * 0.55} stroke={stroke} />
      {badge && <span style={{ position: 'absolute', top: size * 0.18, right: size * 0.2, width: 8, height: 8, borderRadius: 999, background: 'var(--wf-tomato-9)', boxShadow: '0 0 0 2px #fff' }} />}
    </Press>
  );
}

/* ── bookmark toggle ── */
function BookmarkBtn({ on, onClick, size = 38, light = false }) {
  return (
    <Press onClick={(e) => { e.stopPropagation(); onClick(); }} style={{ width: size, height: size, borderRadius: '50%', display: 'grid', placeItems: 'center', color: on ? T.green9 : (light ? 'rgba(255,255,255,0.85)' : T.muted), background: 'transparent', flexShrink: 0 }}>
      <Icon name={on ? 'bookmarkFill' : 'bookmark'} size={size * 0.5} stroke={1.9} />
    </Press>
  );
}

/* ── session type → icon + label for breaks/social ── */
const TYPE_META = {
  keynote: { icon: 'mic', label: 'Keynote' },
  talk: { icon: 'speakers', label: 'Talk' },
  panel: { icon: 'connect', label: 'Panel' },
  workshop: { icon: 'grid', label: 'Workshop' },
  break: { icon: 'coffee', label: 'Break' },
  social: { icon: 'heart', label: 'Social' },
  plenary: { icon: 'star', label: 'Plenary' },
};

function speakersOf(s) { return (s.speakers || []).map(id => window.DATA.SPEAKERS.find(x => x.id === id)).filter(Boolean); }

/* ── session row (list style, used in agenda & schedule) ── */
function SessionRow({ s, bookmarked, onToggle, onOpen, showBookmark = true }) {
  const t = window.DATA.TRACKS[s.track];
  const isBreak = s.type === 'break' || s.type === 'social';
  const sp = speakersOf(s);
  return (
    <Press onClick={() => onOpen(s)} style={{ display: 'flex', gap: 12, padding: '14px 16px', alignItems: 'stretch', background: '#fff' }}>
      <div style={{ width: 52, flexShrink: 0, textAlign: 'right', paddingTop: 1 }}>
        <div style={{ fontFamily: T.sig, fontWeight: 600, fontSize: 14, color: T.ink }}>{s.start}</div>
        <div style={{ fontFamily: T.onest, fontSize: 11, color: T.muted }}>{s.end}</div>
      </div>
      <div style={{ width: 3, borderRadius: 3, background: t.dot, flexShrink: 0, opacity: isBreak ? 0.4 : 1 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          {!isBreak ? <TrackTag track={s.track} /> : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: T.subtle, fontFamily: T.onest, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}><Icon name={TYPE_META[s.type].icon} size={14} stroke={2} />{TYPE_META[s.type].label}</span>}
        </div>
        <div style={{ fontFamily: T.sig, fontWeight: 600, fontSize: 16, color: T.ink, lineHeight: 1.25, textWrap: 'pretty' }}>{s.title}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5, color: T.muted, fontSize: 12.5, fontFamily: T.sig }}>
          <Icon name="pin" size={14} stroke={1.8} /><span>{s.room}</span>
          {sp.length > 0 && <><span style={{ opacity: 0.5 }}>·</span><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sp[0].name.replace(/^(Dr\.|Prof\.) /, '')}{sp.length > 1 ? ` +${sp.length - 1}` : ''}</span></>}
        </div>
      </div>
      {showBookmark && !isBreak && <div style={{ display: 'flex', alignItems: 'center' }}><BookmarkBtn on={bookmarked} onClick={onToggle} /></div>}
    </Press>
  );
}

/* ── card wrapper ── */
function Card({ children, style = {}, onClick, pad = 16 }) {
  const inner = { background: '#fff', borderRadius: 'var(--radius-5)', padding: pad, boxShadow: 'var(--shadow-card)', ...style };
  return onClick ? <Press onClick={onClick} style={inner}>{children}</Press> : <div style={inner}>{children}</div>;
}

/* ── divider ── */
function Divider({ style = {} }) { return <div style={{ height: 1, background: T.line, ...style }} />; }

Object.assign(window, { T, Press, Eyebrow, Avatar, AvatarStack, TrackTag, Btn, IconBtn, BookmarkBtn, SessionRow, Card, Divider, TYPE_META, speakersOf });
})();
