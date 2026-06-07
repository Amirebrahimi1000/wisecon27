// WISEcon27 — Connect, MySchedule, Profile, Ticket, Sponsors, Notifications, Feedback
(function () {
const { useState } = React;
const { Icon, T, Press, Eyebrow, Avatar, TrackTag, Btn, IconBtn, BookmarkBtn, SessionRow, Divider, AppHeader, ChipRow, Chip, STATUS_INSET, TABBAR_H } = window;

/* ── faux QR (decorative placeholder) ── */
function FauxQR({ size = 180, seed = 7 }) {
  const n = 21, cell = size / n;
  let x = seed * 9301 + 49297;
  const rnd = () => { x = (x * 9301 + 49297) % 233280; return x / 233280; };
  const isFinder = (r, c) => {
    const inBox = (br, bc) => r >= br && r < br + 7 && c >= bc && c < bc + 7;
    return inBox(0, 0) || inBox(0, n - 7) || inBox(n - 7, 0);
  };
  const cells = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (isFinder(r, c)) continue;
    if (rnd() > 0.52) cells.push(<rect key={r + '-' + c} x={c * cell} y={r * cell} width={cell} height={cell} rx={cell * 0.18} fill="#111" />);
  }
  const finder = (fx, fy) => (
    <g>
      <rect x={fx} y={fy} width={cell * 7} height={cell * 7} rx={cell * 1.4} fill="#111" />
      <rect x={fx + cell} y={fy + cell} width={cell * 5} height={cell * 5} rx={cell} fill="#fff" />
      <rect x={fx + cell * 2} y={fy + cell * 2} width={cell * 3} height={cell * 3} rx={cell * 0.7} fill="#111" />
    </g>
  );
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      {cells}{finder(0, 0)}{finder(size - cell * 7, 0)}{finder(0, size - cell * 7)}
    </svg>
  );
}

/* ════════ CONNECT ════════ */
function ConnectScreen({ ctx }) {
  const { ATTENDEES, ME } = window.DATA;
  const [tab, setTab] = useState('discover');
  const [people, setPeople] = useState(ATTENDEES);
  const label = { connect: 'Connect', pending: 'Pending', connected: 'Connected' };
  const toggle = (id) => setPeople(people.map(p => {
    if (p.id !== id) return p;
    const next = p.status === 'connect' ? 'pending' : p.status === 'pending' ? 'connect' : 'connected';
    if (p.status === 'connect') ctx.toast('Request sent to ' + p.name.split(' ')[0]);
    return { ...p, status: next };
  }));
  const requests = people.filter(p => p.status === 'pending');
  return (
    <div>
      <AppHeader title="Connect" sub="Meet fellow delegates" right={<IconBtn name="search" onClick={() => ctx.toast('Search coming soon')} />} />
      {/* your card */}
      <div style={{ padding: '12px 16px 0' }}>
        <Press onClick={() => ctx.push('ticket', {})} style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'linear-gradient(135deg, var(--wf-green-9), var(--wf-green-11))', borderRadius: 'var(--radius-5)', padding: 16, color: '#fff' }}>
          <Avatar initials={ME.initials} color="rgba(255,255,255,0.2)" size={48} style={{ boxShadow: '0 0 0 2px rgba(255,255,255,0.4)' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 16 }}>{ME.name}</div>
            <div style={{ fontFamily: T.onest, fontSize: 12.5, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>Tap to share your badge</div>
          </div>
          <div style={{ background: '#fff', borderRadius: 'var(--radius-3)', padding: 5 }}><FauxQR size={44} seed={3} /></div>
        </Press>
      </div>
      {/* tabs */}
      <div style={{ display: 'flex', gap: 4, padding: '14px 16px 0' }}>
        {[['discover', 'Discover'], ['requests', `Requests${requests.length ? ' · ' + requests.length : ''}`], ['messages', 'Messages']].map(([k, l]) => (
          <Press key={k} onClick={() => setTab(k)} style={{ flex: 1, textAlign: 'center', paddingBottom: 10, fontFamily: T.sig, fontWeight: 600, fontSize: 13.5, color: tab === k ? T.green10 : T.muted, borderBottom: '2.5px solid ' + (tab === k ? T.green9 : 'transparent') }}>{l}</Press>
        ))}
      </div>
      <Divider />
      <div style={{ padding: '12px 12px ' + (TABBAR_H + 16) + 'px' }}>
        {tab === 'messages' ? <MessagesList ctx={ctx} people={people} /> : (
          (tab === 'requests' ? requests : people).map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 6px', borderBottom: '1px solid ' + T.line }}>
              <Avatar initials={p.initials} color={p.color} size={46} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 15, color: T.ink }}>{p.name}</div>
                <div style={{ fontFamily: T.sig, fontSize: 13, color: T.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.role} · {p.org}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 5 }}>
                  {p.mutual > 0 && <span style={{ fontFamily: T.onest, fontSize: 11, color: T.green10, background: T.green1, borderRadius: 999, padding: '2px 8px' }}>{p.mutual} shared interests</span>}
                </div>
              </div>
              <Btn kind={p.status === 'connect' ? 'primary' : p.status === 'pending' ? 'default' : 'outline'} size="sm" onClick={() => toggle(p.id)} icon={p.status === 'connected' ? 'message' : undefined}>{label[p.status]}</Btn>
            </div>
          ))
        )}
        {tab === 'requests' && requests.length === 0 && <Empty icon="connect" text="No pending requests." />}
      </div>
    </div>
  );
}

function MessagesList({ ctx, people }) {
  const threads = [
    { p: people.find(x => x.id === 'a6'), last: 'See you at the reception tonight!', time: '14:02', unread: 0 },
    { p: people.find(x => x.id === 'a3'), last: 'Thanks — really enjoyed your question.', time: '11:20', unread: 2 },
  ];
  return (
    <div>
      {threads.map((t, i) => (
        <Press key={i} onClick={() => ctx.toast('Chat coming soon')} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 6px', borderBottom: '1px solid ' + T.line }}>
          <Avatar initials={t.p.initials} color={t.p.color} size={46} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 15, color: T.ink }}>{t.p.name}</span>
              <span style={{ fontFamily: T.onest, fontSize: 11, color: T.muted }}>{t.time}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: T.sig, fontSize: 13.5, color: T.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.last}</span>
              {t.unread > 0 && <span style={{ background: T.green9, color: '#fff', fontFamily: T.onest, fontWeight: 700, fontSize: 11, minWidth: 18, height: 18, borderRadius: 999, display: 'grid', placeItems: 'center', padding: '0 5px' }}>{t.unread}</span>}
            </div>
          </div>
        </Press>
      ))}
    </div>
  );
}

function Empty({ icon, text }) {
  return <div style={{ textAlign: 'center', padding: '48px 20px', color: T.muted }}><Icon name={icon} size={32} style={{ margin: '0 auto 10px', color: T.line2 }} /><div style={{ fontFamily: T.sig, fontSize: 14.5 }}>{text}</div></div>;
}

/* ════════ MY SCHEDULE ════════ */
function MyScheduleScreen({ ctx }) {
  const { DAYS, SESSIONS } = window.DATA;
  const mine = SESSIONS.filter(s => ctx.isBookmarked(s.id));
  return (
    <div>
      <AppHeader title="My schedule" sub={`${mine.length} saved sessions`} onBack={ctx.params._fromTab ? null : ctx.back} />
      <div style={{ padding: '8px 12px ' + (TABBAR_H + 16) + 'px' }}>
        {DAYS.map(d => {
          const day = mine.filter(s => s.day === d.id).sort((a, b) => a.start.localeCompare(b.start));
          if (day.length === 0) return null;
          return (
            <div key={d.id} style={{ marginBottom: 18 }}>
              <Eyebrow style={{ padding: '8px 6px 10px' }}>{d.long}</Eyebrow>
              <div style={{ background: '#fff', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
                {day.map((s, i) => <div key={s.id} style={{ borderBottom: i === day.length - 1 ? 'none' : '1px solid ' + T.line }}><SessionRow s={s} bookmarked onToggle={() => ctx.toggleBookmark(s.id)} onOpen={ctx.openSession} /></div>)}
              </div>
            </div>
          );
        })}
        {mine.length === 0 && <Empty icon="bookmark" text="Bookmark sessions to build your schedule." />}
      </div>
    </div>
  );
}

/* ════════ PROFILE ════════ */
function ProfileScreen({ ctx }) {
  const { ME, SESSIONS } = window.DATA;
  const count = SESSIONS.filter(s => ctx.isBookmarked(s.id)).length;
  const rows = [
    { icon: 'calendar', label: 'My schedule', detail: count + ' saved', to: () => ctx.push('myschedule', {}) },
    { icon: 'bell', label: 'Notifications', detail: ctx.unread > 0 ? ctx.unread + ' new' : '', to: () => ctx.push('notifications', {}) },
    { icon: 'connect', label: 'My connections', detail: '1', to: () => ctx.setTab('connect') },
    { icon: 'grid', label: 'Sponsors & exhibitors', to: () => ctx.push('sponsors', {}) },
    { icon: 'star', label: 'Give feedback', to: () => ctx.push('feedback', {}) },
    { icon: 'info', label: 'Event info & Wi-Fi', to: () => ctx.push('info', {}) },
    { icon: 'settings', label: 'Settings', to: () => ctx.toast('Settings coming soon') },
  ];
  return (
    <div>
      <AppHeader title="Profile" right={<IconBtn name="settings" onClick={() => ctx.toast('Settings coming soon')} />} />
      <div style={{ padding: '8px 16px ' + (TABBAR_H + 16) + 'px' }}>
        {/* identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '8px 4px 18px' }}>
          <Avatar initials={ME.initials} color={ME.color} size={64} />
          <div>
            <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 20, color: T.ink }}>{ME.name}</div>
            <div style={{ fontFamily: T.sig, fontSize: 14, color: T.body }}>{ME.role}</div>
            <div style={{ fontFamily: T.onest, fontSize: 12.5, color: T.muted, marginTop: 1 }}>{ME.org}</div>
          </div>
        </div>
        {/* ticket */}
        <Press onClick={() => ctx.push('ticket', {})} style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'linear-gradient(135deg, #111, #2a2a2a)', borderRadius: 'var(--radius-5)', padding: 16, color: '#fff', marginBottom: 18 }}>
          <div style={{ background: '#fff', borderRadius: 'var(--radius-3)', padding: 6 }}><FauxQR size={56} seed={11} /></div>
          <div style={{ flex: 1 }}>
            <Eyebrow color="rgba(255,255,255,0.6)">My badge</Eyebrow>
            <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 16, marginTop: 3 }}>{ME.ticket}</div>
            <div style={{ fontFamily: T.onest, fontSize: 12.5, color: 'rgba(255,255,255,0.7)', marginTop: 1 }}>{ME.badgeId}</div>
          </div>
          <Icon name="qr" size={22} style={{ color: 'rgba(255,255,255,0.7)' }} />
        </Press>
        {/* list */}
        <div style={{ background: '#fff', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
          {rows.map((r, i) => (
            <Press key={r.label} onClick={r.to} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 16px', borderBottom: i === rows.length - 1 ? 'none' : '1px solid ' + T.line }}>
              <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-3)', background: T.sunken, display: 'grid', placeItems: 'center', color: T.body }}><Icon name={r.icon} size={18} /></div>
              <span style={{ flex: 1, fontFamily: T.sig, fontWeight: 500, fontSize: 15.5, color: T.ink }}>{r.label}</span>
              {r.detail && <span style={{ fontFamily: T.onest, fontSize: 12.5, color: T.muted }}>{r.detail}</span>}
              <Icon name="chevronRight" size={18} stroke={2} style={{ color: T.line2 }} />
            </Press>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 18 }}>
          <Btn kind="danger" icon="logout" onClick={() => ctx.toast('Signed out (demo)')}>Sign out</Btn>
        </div>
        <div style={{ textAlign: 'center', fontFamily: T.onest, fontSize: 11.5, color: T.muted, marginTop: 18 }}>WISEcon27 · v1.0 · Powered by WISEflow</div>
      </div>
    </div>
  );
}

/* ════════ TICKET ════════ */
function TicketScreen({ ctx }) {
  const { ME } = window.DATA;
  return (
    <div style={{ minHeight: '100%', background: 'linear-gradient(160deg, var(--wf-green-9), var(--wf-green-11))', paddingBottom: TABBAR_H + 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: STATUS_INSET + 6 + 'px 14px 6px' }}>
        <IconBtn name="chevronLeft" onClick={ctx.back} stroke={2.2} color="#fff" bg="rgba(255,255,255,0.16)" />
        <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 17, color: '#fff' }}>My badge</div>
        <div style={{ width: 38 }} />
      </div>
      <div style={{ padding: '20px 22px' }}>
        <div style={{ background: '#fff', borderRadius: 22, overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.3)' }}>
          <div style={{ padding: '22px 22px 16px', textAlign: 'center', borderBottom: '2px dashed ' + T.line }}>
            <Eyebrow style={{ marginBottom: 6 }} color="var(--wf-green-10)">WISEcon27 · Aarhus</Eyebrow>
            <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 24, color: T.ink }}>{ME.name}</div>
            <div style={{ fontFamily: T.sig, fontSize: 14.5, color: T.body, marginTop: 2 }}>{ME.org}</div>
            <span style={{ display: 'inline-flex', marginTop: 12, background: T.green1, color: T.green11, fontFamily: T.sig, fontWeight: 600, fontSize: 13, borderRadius: 999, padding: '5px 14px' }}>{ME.ticket}</span>
          </div>
          <div style={{ padding: '24px', display: 'grid', placeItems: 'center' }}>
            <FauxQR size={200} seed={11} />
            <div style={{ fontFamily: T.onest, fontSize: 13, letterSpacing: '0.18em', color: T.body, marginTop: 16 }}>{ME.badgeId}</div>
            <div style={{ fontFamily: T.sig, fontSize: 12.5, color: T.muted, marginTop: 4 }}>Scan at registration & session doors</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════ SPONSORS ════════ */
function SponsorsScreen({ ctx }) {
  const { SPONSORS } = window.DATA;
  const tiers = ['Host', 'Platinum', 'Gold', 'Silver'];
  return (
    <div>
      <AppHeader title="Sponsors" sub="With thanks to our partners" onBack={ctx.back} />
      <div style={{ padding: '12px 16px ' + (TABBAR_H + 16) + 'px' }}>
        {tiers.map(tier => {
          const list = SPONSORS.filter(s => s.tier === tier);
          if (!list.length) return null;
          const big = tier === 'Host' || tier === 'Platinum';
          return (
            <div key={tier} style={{ marginBottom: 22 }}>
              <Eyebrow style={{ marginBottom: 10 }}>{tier}</Eyebrow>
              <div style={{ display: 'grid', gridTemplateColumns: big ? '1fr' : '1fr 1fr', gap: 10 }}>
                {list.map(sp => (
                  <Press key={sp.name} onClick={() => ctx.toast(sp.name)} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', borderRadius: 'var(--radius-5)', padding: big ? 16 : 13, boxShadow: 'var(--shadow-card)' }}>
                    <div style={{ width: big ? 48 : 40, height: big ? 48 : 40, borderRadius: 'var(--radius-3)', background: sp.color, color: '#fff', display: 'grid', placeItems: 'center', fontFamily: T.onest, fontWeight: 700, fontSize: big ? 17 : 14, flexShrink: 0 }}>{sp.initials}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: big ? 16 : 14, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sp.name}</div>
                      {big && <div style={{ fontFamily: T.sig, fontSize: 13, color: T.muted, marginTop: 1 }}>{sp.blurb}</div>}
                    </div>
                  </Press>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ════════ NOTIFICATIONS ════════ */
function NotificationsScreen({ ctx }) {
  const meta = {
    reminder: { icon: 'clock', color: 'var(--wf-green-9)', bg: 'var(--wf-green-1)' },
    connect: { icon: 'connect', color: 'var(--wf-purple-8)', bg: 'var(--wf-purple-2)' },
    announce: { icon: 'info', color: 'var(--wf-blue-9)', bg: 'var(--wf-blue-1)' },
    social: { icon: 'heart', color: 'var(--wf-tomato-9)', bg: 'var(--wf-tomato-2)' },
    feedback: { icon: 'star', color: 'var(--wf-orange-9)', bg: 'var(--wf-orange-2)' },
  };
  return (
    <div>
      <AppHeader title="Notifications" onBack={ctx.params._fromTab ? null : ctx.back} right={<Press onClick={() => { ctx.markAllRead(); ctx.toast('All marked read'); }} style={{ fontFamily: T.sig, fontWeight: 600, fontSize: 13.5, color: T.green10, padding: '0 6px' }}>Mark read</Press>} />
      <div style={{ padding: '8px 12px ' + (TABBAR_H + 16) + 'px' }}>
        {ctx.notifications.map(n => {
          const m = meta[n.type];
          return (
            <Press key={n.id} onClick={() => ctx.readOne(n.id)} style={{ display: 'flex', gap: 12, padding: '14px 10px', borderBottom: '1px solid ' + T.line, background: n.unread ? T.green1 + '55' : 'transparent', borderRadius: 'var(--radius-3)' }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: m.bg, color: m.color, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name={m.icon} size={19} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 14.5, color: T.ink }}>{n.title}</span>
                  <span style={{ fontFamily: T.onest, fontSize: 11, color: T.muted, flexShrink: 0 }}>{n.time}</span>
                </div>
                <div style={{ fontFamily: T.sig, fontSize: 13.5, color: T.body, marginTop: 2, lineHeight: 1.4 }}>{n.body}</div>
              </div>
              {n.unread && <span style={{ width: 8, height: 8, borderRadius: 999, background: T.green9, flexShrink: 0, marginTop: 6 }} />}
            </Press>
          );
        })}
      </div>
    </div>
  );
}

/* ════════ FEEDBACK ════════ */
function FeedbackScreen({ ctx }) {
  const [stars, setStars] = useState(0);
  const [tags, setTags] = useState([]);
  const [text, setText] = useState('');
  const [done, setDone] = useState(false);
  const chips = ['Great speaker', 'Well organised', 'Too short', 'Right level', 'Practical', 'Loved the venue'];
  const toggle = (c) => setTags(tags.includes(c) ? tags.filter(x => x !== c) : [...tags, c]);
  if (done) return (
    <div>
      <AppHeader title="Feedback" onBack={ctx.back} />
      <div style={{ padding: '60px 30px', textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: T.green1, color: T.green9, display: 'grid', placeItems: 'center', margin: '0 auto 18px' }}><Icon name="checkCircle" size={40} /></div>
        <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 22, color: T.ink }}>Thank you</div>
        <p style={{ fontFamily: T.sig, fontSize: 15, color: T.body, marginTop: 8, lineHeight: 1.5 }}>Your feedback helps us shape WISEcon28.</p>
        <Btn kind="primary" onClick={ctx.back} style={{ marginTop: 22 }}>Done</Btn>
      </div>
    </div>
  );
  return (
    <div>
      <AppHeader title="Give feedback" onBack={ctx.back} />
      <div style={{ padding: '20px 18px ' + (TABBAR_H + 16) + 'px' }}>
        <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 18, color: T.ink, textWrap: 'pretty' }}>How was your WISEcon27 so far?</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', margin: '22px 0 8px' }}>
          {[1, 2, 3, 4, 5].map(i => (
            <Press key={i} onClick={() => setStars(i)} style={{ color: i <= stars ? 'var(--wf-yellow-8)' : T.line2 }}><Icon name={i <= stars ? 'starFill' : 'star'} size={38} /></Press>
          ))}
        </div>
        <div style={{ textAlign: 'center', fontFamily: T.onest, fontSize: 12.5, color: T.muted, marginBottom: 22 }}>{['Tap to rate', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][stars]}</div>
        <Eyebrow style={{ marginBottom: 10 }}>What stood out?</Eyebrow>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 22 }}>
          {chips.map(c => <Press key={c} onClick={() => toggle(c)} style={{ fontFamily: T.sig, fontWeight: 600, fontSize: 13.5, padding: '8px 14px', borderRadius: 999, background: tags.includes(c) ? T.green9 : '#fff', color: tags.includes(c) ? '#fff' : T.body, boxShadow: tags.includes(c) ? 'none' : 'inset 0 0 0 1px var(--wf-grey-6)' }}>{c}</Press>)}
        </div>
        <Eyebrow style={{ marginBottom: 10 }}>Anything else?</Eyebrow>
        <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Share your thoughts (optional)" rows={4} style={{ width: '100%', boxSizing: 'border-box', resize: 'none', border: '1px solid var(--wf-grey-6)', borderRadius: 'var(--radius-4)', padding: 13, fontFamily: T.sig, fontSize: 15, color: T.ink, outline: 'none', lineHeight: 1.5 }} />
        <Btn kind="primary" full size="lg" onClick={() => setDone(true)} disabled={stars === 0} style={{ marginTop: 18 }}>Submit feedback</Btn>
      </div>
    </div>
  );
}

/* ════════ EVENT INFO ════════ */
function InfoScreen({ ctx }) {
  const items = [
    { icon: 'wifi', label: 'Wi-Fi network', detail: 'WISEcon27' },
    { icon: 'shield', label: 'Wi-Fi password', detail: 'assessment27' },
    { icon: 'pin', label: 'Venue', detail: 'Musikhuset Aarhus' },
    { icon: 'clock', label: 'Registration', detail: 'Opens 08:00 daily' },
    { icon: 'coffee', label: 'Catering', detail: 'Foyer & terrace' },
    { icon: 'info', label: 'Help desk', detail: 'Main foyer' },
  ];
  return (
    <div>
      <AppHeader title="Event info" onBack={ctx.back} />
      <div style={{ padding: '14px 16px ' + (TABBAR_H + 16) + 'px' }}>
        <div style={{ background: '#fff', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
          {items.map((it, i) => (
            <div key={it.label} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 16px', borderBottom: i === items.length - 1 ? 'none' : '1px solid ' + T.line }}>
              <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-3)', background: T.sunken, display: 'grid', placeItems: 'center', color: T.body }}><Icon name={it.icon} size={18} /></div>
              <span style={{ flex: 1, fontFamily: T.sig, fontWeight: 500, fontSize: 15, color: T.body }}>{it.label}</span>
              <span style={{ fontFamily: T.sig, fontWeight: 600, fontSize: 15, color: T.ink }}>{it.detail}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { FauxQR, ConnectScreen, MyScheduleScreen, ProfileScreen, TicketScreen, SponsorsScreen, NotificationsScreen, FeedbackScreen, InfoScreen, Empty });
})();
