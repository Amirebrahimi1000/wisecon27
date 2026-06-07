// WISEcon27 — app shell: tabs, navigation stack, bookmarks, notifications, toast
(function () {
const { useState, useEffect, useRef } = React;
const { Icon, T, Press, STATUS_INSET, TABBAR_H, AgendaScreen, SessionDetail, SpeakersScreen, SpeakerProfile, ConnectScreen, MyScheduleScreen, ProfileScreen, TicketScreen, SponsorsScreen, NotificationsScreen, FeedbackScreen, InfoScreen } = window;

const TABS = [
  { id: 'home', icon: 'home', label: 'Home' },
  { id: 'agenda', icon: 'calendar', label: 'Agenda' },
  { id: 'speakers', icon: 'speakers', label: 'Speakers' },
  { id: 'connect', icon: 'connect', label: 'Connect' },
  { id: 'profile', icon: 'user', label: 'Profile' },
];

function BottomNav({ active, onSelect, unread }) {
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 40, paddingBottom: 22, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', borderTop: '1px solid ' + T.line, display: 'flex' }}>
      {TABS.map(t => {
        const on = active === t.id;
        return (
          <Press key={t.id} onClick={() => onSelect(t.id)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '9px 0 4px', position: 'relative' }}>
            <div style={{ position: 'relative', color: on ? T.green9 : T.muted }}>
              <Icon name={t.icon} size={25} stroke={on ? 2.2 : 1.8} />
              {t.id === 'profile' && unread > 0 && <span style={{ position: 'absolute', top: -1, right: -3, width: 8, height: 8, borderRadius: 999, background: 'var(--wf-tomato-9)', boxShadow: '0 0 0 2px #fff' }} />}
            </div>
            <span style={{ fontFamily: T.sig, fontWeight: on ? 700 : 500, fontSize: 10.5, color: on ? T.green10 : T.muted, letterSpacing: '0.01em' }}>{t.label}</span>
          </Press>
        );
      })}
    </div>
  );
}

function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div style={{ position: 'absolute', bottom: TABBAR_H + 14, left: '50%', transform: 'translateX(-50%)', zIndex: 80, background: 'rgba(17,17,17,0.94)', color: '#fff', fontFamily: T.sig, fontWeight: 500, fontSize: 13.5, padding: '10px 18px', borderRadius: 999, boxShadow: '0 8px 24px rgba(0,0,0,0.25)', whiteSpace: 'nowrap', maxWidth: '86%', overflow: 'hidden', textOverflow: 'ellipsis' }} className="wc-toast">{msg}</div>
  );
}

const PUSH_SCREENS = {
  session: SessionDetail, speaker: SpeakerProfile, myschedule: MyScheduleScreen,
  notifications: NotificationsScreen, sponsors: SponsorsScreen, ticket: TicketScreen,
  feedback: FeedbackScreen, info: InfoScreen,
};
const TAB_SCREENS = {
  agenda: AgendaScreen, speakers: SpeakersScreen, connect: ConnectScreen, profile: ProfileScreen,
};

function ConferenceApp({ homeVariant = 'cards' }) {
  const [tab, setTab] = useState('home');
  const [stack, setStack] = useState([]); // [{screen, params}]
  const [bookmarks, setBookmarks] = useState(() => new Set(window.DATA.ME.bookmarks));
  const [notifs, setNotifs] = useState(() => window.DATA.NOTIFICATIONS.map(n => ({ ...n })));
  const [toast, setToast] = useState(null);
  const scrollRef = useRef(null);
  const toastTimer = useRef(null);

  const unread = notifs.filter(n => n.unread).length;
  const top = stack[stack.length - 1] || null;
  const screenKey = tab + '·' + stack.length + '·' + (top ? top.screen : '');

  // reset scroll on navigation
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = 0; }, [screenKey]);

  const showToast = (m) => {
    setToast(m); clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1900);
  };

  const ctx = {
    params: top ? top.params : {},
    isBookmarked: (id) => bookmarks.has(id),
    toggleBookmark: (id) => setBookmarks(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; }),
    openSession: (s) => setStack(st => [...st, { screen: 'session', params: { session: s } }]),
    push: (screen, params) => setStack(st => [...st, { screen, params: params || {} }]),
    back: () => setStack(st => st.slice(0, -1)),
    setTab: (t) => { setStack([]); setTab(t); },
    toast: showToast,
    unread, notifications: notifs,
    readOne: (id) => setNotifs(ns => ns.map(n => n.id === id ? { ...n, unread: false } : n)),
    markAllRead: () => setNotifs(ns => ns.map(n => ({ ...n, unread: false }))),
  };

  let ScreenEl;
  if (top) ScreenEl = PUSH_SCREENS[top.screen];
  else if (tab === 'home') ScreenEl = window.HOME_VARIANTS[homeVariant] || window.HOME_VARIANTS.cards;
  else ScreenEl = TAB_SCREENS[tab];

  return (
    <div style={{ height: '100%', position: 'relative', background: '#fff', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch' }}>
        <div key={screenKey} className="wc-screen">
          {ScreenEl ? <ScreenEl ctx={ctx} /> : null}
        </div>
      </div>
      <Toast msg={toast} />
      <BottomNav active={tab} onSelect={ctx.setTab} unread={unread} />
    </div>
  );
}

window.ConferenceApp = ConferenceApp;
window.TABS = TABS;
})();
