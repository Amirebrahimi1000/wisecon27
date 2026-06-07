// WISEcon27 — core screens: Agenda, SessionDetail, Speakers, SpeakerProfile
(function () {
const { useState } = React;
const { Icon, T, Press, Eyebrow, Avatar, AvatarStack, TrackTag, Btn, IconBtn, BookmarkBtn, SessionRow, Card, Divider, TYPE_META, speakersOf } = window;
const STATUS_INSET = 54;
const TABBAR_H = 82;

/* ── sticky app header ── */
function AppHeader({ title, onBack, right, sub, sticky = true }) {
  return (
    <div style={{ position: sticky ? 'sticky' : 'static', top: 0, zIndex: 30, background: 'rgba(255,255,255,0.86)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderBottom: '1px solid ' + T.line, paddingTop: STATUS_INSET }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px 12px', minHeight: 44 }}>
        {onBack && <IconBtn name="chevronLeft" onClick={onBack} size={38} stroke={2.2} />}
        <div style={{ flex: 1, minWidth: 0, paddingLeft: onBack ? 0 : 8 }}>
          <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 21, color: T.ink, lineHeight: 1.1, letterSpacing: '-0.01em' }}>{title}</div>
          {sub && <div style={{ fontFamily: T.onest, fontSize: 12, color: T.muted, marginTop: 1 }}>{sub}</div>}
        </div>
        {right}
      </div>
    </div>
  );
}

/* ── horizontally-scrolling chip row ── */
function ChipRow({ children, style = {} }) {
  return <div className="wc-noscroll" style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '12px 16px', ...style }}>{children}</div>;
}
function Chip({ active, onClick, children, color }) {
  return (
    <Press onClick={onClick} style={{ flexShrink: 0, height: 34, padding: '0 14px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: T.sig, fontWeight: 600, fontSize: 13.5, background: active ? '#111' : '#fff', color: active ? '#fff' : T.body, boxShadow: active ? 'none' : 'inset 0 0 0 1px var(--wf-grey-6)', whiteSpace: 'nowrap' }}>
      {color && <span style={{ width: 7, height: 7, borderRadius: 999, background: color }} />}{children}
    </Press>
  );
}

/* ════════ AGENDA ════════ */
function AgendaScreen({ ctx }) {
  const { DAYS, SESSIONS, TRACKS } = window.DATA;
  const [day, setDay] = useState(ctx.params.day || 'd1');
  const [track, setTrack] = useState('all');
  const list = SESSIONS.filter(s => s.day === day && (track === 'all' || s.track === track))
    .sort((a, b) => a.start.localeCompare(b.start));
  return (
    <div>
      <AppHeader title="Agenda" sub="14–16 September · Aarhus" right={<IconBtn name="search" onClick={() => ctx.toast('Search coming soon')} />} />
      {/* day selector */}
      <div style={{ display: 'flex', gap: 8, padding: '14px 16px 4px' }}>
        {DAYS.map(d => (
          <Press key={d.id} onClick={() => setDay(d.id)} style={{ flex: 1, padding: '9px 4px', borderRadius: 'var(--radius-4)', textAlign: 'center', background: day === d.id ? T.green9 : '#fff', color: day === d.id ? '#fff' : T.body, boxShadow: day === d.id ? 'none' : 'inset 0 0 0 1px var(--wf-grey-6)' }}>
            <div style={{ fontFamily: T.onest, fontSize: 11, fontWeight: 600, opacity: day === d.id ? 0.85 : 0.6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d.dow}</div>
            <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 16, marginTop: 1 }}>{d.date}</div>
          </Press>
        ))}
      </div>
      <ChipRow style={{ paddingBottom: 4 }}>
        <Chip active={track === 'all'} onClick={() => setTrack('all')}>All tracks</Chip>
        {Object.entries(TRACKS).filter(([k]) => k !== 'plenary').map(([k, t]) => (
          <Chip key={k} active={track === k} onClick={() => setTrack(k)} color={t.dot}>{t.name}</Chip>
        ))}
      </ChipRow>
      <div style={{ padding: '4px 12px ' + (TABBAR_H + 16) + 'px' }}>
        {list.map((s, i) => (
          <div key={s.id} style={{ background: '#fff', borderRadius: i === 0 ? 'var(--radius-5) var(--radius-5) 0 0' : (i === list.length - 1 ? '0 0 var(--radius-5) var(--radius-5)' : 0), boxShadow: 'var(--shadow-sm)', borderBottom: i === list.length - 1 ? 'none' : '1px solid ' + T.line }}>
            <SessionRow s={s} bookmarked={ctx.isBookmarked(s.id)} onToggle={() => ctx.toggleBookmark(s.id)} onOpen={ctx.openSession} />
          </div>
        ))}
        {list.length === 0 && <div style={{ textAlign: 'center', color: T.muted, padding: 40, fontFamily: T.sig }}>No sessions in this track today.</div>}
      </div>
    </div>
  );
}

/* ════════ SESSION DETAIL ════════ */
function SessionDetail({ ctx }) {
  const s = ctx.params.session;
  const t = window.DATA.TRACKS[s.track];
  const sp = speakersOf(s);
  const isBreak = s.type === 'break' || s.type === 'social';
  const [tab, setTab] = useState('details');
  const bm = ctx.isBookmarked(s.id);
  const day = window.DATA.DAYS.find(d => d.id === s.day);

  return (
    <div style={{ paddingBottom: TABBAR_H + 16 }}>
      {/* hero */}
      <div style={{ position: 'relative', padding: STATUS_INSET + 8 + 'px 18px 22px', background: isBreak ? 'linear-gradient(150deg, var(--wf-grey-11), var(--wf-grey-12))' : `linear-gradient(150deg, ${t.dot}, color-mix(in srgb, ${t.dot} 62%, #000))`, color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <IconBtn name="chevronLeft" onClick={ctx.back} stroke={2.2} color="#fff" bg="rgba(255,255,255,0.16)" />
          <IconBtn name="share" onClick={() => ctx.toast('Share link copied')} color="#fff" bg="rgba(255,255,255,0.16)" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.2)', borderRadius: 999, padding: '4px 11px', fontFamily: T.onest, fontWeight: 600, fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <Icon name={TYPE_META[s.type].icon} size={14} stroke={2} />{TYPE_META[s.type].label}
          </span>
        </div>
        <h2 style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 27, lineHeight: 1.15, color: '#fff', letterSpacing: '-0.01em', textWrap: 'balance' }}>{s.title}</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', marginTop: 14, fontFamily: T.sig, fontSize: 14, color: 'rgba(255,255,255,0.92)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="calendar" size={16} />{day.dow} {day.date}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="clock" size={16} />{s.start}–{s.end}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name="pin" size={16} />{s.room}</span>
        </div>
      </div>

      {/* action bar */}
      {!isBreak && (
        <div style={{ display: 'flex', gap: 10, padding: '14px 16px', background: '#fff', borderBottom: '1px solid ' + T.line }}>
          <Btn kind={bm ? 'default' : 'primary'} full icon={bm ? 'check' : 'plus'} onClick={() => ctx.toggleBookmark(s.id)}>{bm ? 'In my schedule' : 'Add to schedule'}</Btn>
          <Btn kind="outline" icon="bell" onClick={() => ctx.toast('Reminder set for ' + s.start)} style={{ flexShrink: 0 }}>Remind</Btn>
        </div>
      )}

      {/* tabs */}
      {!isBreak && (
        <div style={{ display: 'flex', gap: 4, padding: '12px 16px 0', background: '#fff', position: 'sticky', top: 0, zIndex: 20 }}>
          {[['details', 'Details'], ['qa', 'Q&A'], ['poll', 'Live poll']].map(([k, label]) => (
            <Press key={k} onClick={() => setTab(k)} style={{ flex: 1, textAlign: 'center', paddingBottom: 10, fontFamily: T.sig, fontWeight: 600, fontSize: 14, color: tab === k ? T.green10 : T.muted, borderBottom: '2.5px solid ' + (tab === k ? T.green9 : 'transparent') }}>
              {label}{k === 'qa' && <span style={{ fontFamily: T.onest, fontSize: 11, color: tab === k ? T.green9 : T.muted, marginLeft: 5 }}>4</span>}
            </Press>
          ))}
        </div>
      )}

      <div style={{ padding: '18px 16px 0' }}>
        {(isBreak || tab === 'details') && <SessionDetailsTab s={s} sp={sp} ctx={ctx} />}
        {!isBreak && tab === 'qa' && <QATab sId={s.id} ctx={ctx} />}
        {!isBreak && tab === 'poll' && <PollTab sId={s.id} />}
      </div>
    </div>
  );
}

function SessionDetailsTab({ s, sp, ctx }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <p style={{ fontFamily: T.sig, fontSize: 15.5, lineHeight: 1.55, color: T.body, textWrap: 'pretty' }}>{s.desc}</p>
      {s.tags && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{s.tags.map(tag => <span key={tag} style={{ fontFamily: T.sig, fontSize: 12.5, fontWeight: 600, color: T.subtle, background: T.sunken, borderRadius: 999, padding: '5px 12px' }}>#{tag}</span>)}</div>}
      {sp.length > 0 && (
        <div>
          <Eyebrow style={{ marginBottom: 10 }}>{sp.length > 1 ? 'Speakers' : 'Speaker'}</Eyebrow>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sp.map(p => (
              <Press key={p.id} onClick={() => ctx.push('speaker', { speaker: p })} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', borderRadius: 'var(--radius-4)', padding: 12, boxShadow: 'var(--shadow-sm)' }}>
                <Avatar initials={p.initials} color={p.color} size={44} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 15, color: T.ink }}>{p.name}</div>
                  <div style={{ fontFamily: T.sig, fontSize: 13, color: T.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.role} · {p.org}</div>
                </div>
                <Icon name="chevronRight" size={18} stroke={2} style={{ color: T.line2 }} />
              </Press>
            ))}
          </div>
        </div>
      )}
      {s.going > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: T.muted, fontFamily: T.sig, fontSize: 13.5 }}>
          <Icon name="speakers" size={17} /> {s.going.toLocaleString('en')} delegates planning to attend
        </div>
      )}
    </div>
  );
}

/* ── Q&A tab ── */
function QATab({ sId, ctx }) {
  const seed = [
    { id: 1, q: 'How do you handle false positives in AI detection at scale?', who: 'Camille R.', up: 18, voted: false },
    { id: 2, q: 'Is there guidance on setting thresholds for different disciplines?', who: 'Anonymous', up: 12, voted: false },
    { id: 3, q: 'Will the slides be shared afterwards?', who: 'Tom B.', up: 9, voted: false },
    { id: 4, q: 'How does this interact with open-book formats?', who: 'Daniel O.', up: 5, voted: false },
  ];
  const [items, setItems] = useState(seed);
  const [text, setText] = useState('');
  const sorted = [...items].sort((a, b) => b.up - a.up);
  const submit = () => {
    if (!text.trim()) return;
    setItems([...items, { id: Date.now(), q: text.trim(), who: 'You', up: 0, voted: false }]);
    setText(''); ctx.toast('Question submitted');
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Ask the speaker a question…" rows={1}
          style={{ flex: 1, resize: 'none', border: '1px solid var(--wf-grey-6)', borderRadius: 'var(--radius-4)', padding: '11px 13px', fontFamily: T.sig, fontSize: 14.5, color: T.ink, outline: 'none', lineHeight: 1.4 }} />
        <Btn kind="primary" onClick={submit} icon="send" style={{ height: 44, padding: '0 14px' }} />
      </div>
      {sorted.map(it => (
        <div key={it.id} style={{ display: 'flex', gap: 12, background: '#fff', borderRadius: 'var(--radius-4)', padding: '13px 14px', boxShadow: 'var(--shadow-sm)' }}>
          <Press onClick={() => setItems(items.map(x => x.id === it.id ? { ...x, up: x.voted ? x.up - 1 : x.up + 1, voted: !x.voted } : x))}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, width: 38, flexShrink: 0, color: it.voted ? T.green9 : T.muted, background: it.voted ? T.green1 : T.sunken, borderRadius: 'var(--radius-3)', padding: '6px 0' }}>
            <Icon name="arrowUp" size={17} stroke={2.2} />
            <span style={{ fontFamily: T.onest, fontWeight: 700, fontSize: 13 }}>{it.up}</span>
          </Press>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.sig, fontSize: 14.5, color: T.ink, lineHeight: 1.4, textWrap: 'pretty' }}>{it.q}</div>
            <div style={{ fontFamily: T.onest, fontSize: 11.5, color: T.muted, marginTop: 5 }}>{it.who}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── live poll tab ── */
function PollTab({ sId }) {
  const opts = [
    { id: 'a', label: 'Detection tools', v: 34 },
    { id: 'b', label: 'Redesigning assessments', v: 52 },
    { id: 'c', label: 'Both equally', v: 71 },
    { id: 'd', label: 'Neither — policy first', v: 19 },
  ];
  const [votes, setVotes] = useState(opts);
  const [picked, setPicked] = useState(null);
  const total = votes.reduce((a, b) => a + b.v, 0);
  const vote = (id) => { if (picked) return; setPicked(id); setVotes(votes.map(o => o.id === id ? { ...o, v: o.v + 1 } : o)); };
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--wf-tomato-9)' }} className="wc-pulse" />
        <Eyebrow color="var(--wf-tomato-11)">Live now</Eyebrow>
      </div>
      <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 18, color: T.ink, lineHeight: 1.3, marginBottom: 16, textWrap: 'pretty' }}>Where should institutions invest first to protect integrity?</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {votes.map(o => {
          const pct = Math.round((o.v / total) * 100);
          const mine = picked === o.id;
          return (
            <Press key={o.id} onClick={() => vote(o.id)} style={{ position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-4)', border: '1.5px solid ' + (mine ? T.green9 : 'var(--wf-grey-6)'), padding: '13px 14px', background: '#fff' }}>
              {picked && <div style={{ position: 'absolute', inset: 0, width: pct + '%', background: mine ? T.green1 : T.sunken, transition: 'width .6s var(--ease-out)' }} />}
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: T.sig, fontWeight: 600, fontSize: 14.5, color: T.ink, display: 'flex', alignItems: 'center', gap: 8 }}>{mine && <Icon name="check" size={16} stroke={2.4} style={{ color: T.green9 }} />}{o.label}</span>
                {picked && <span style={{ fontFamily: T.onest, fontWeight: 700, fontSize: 14, color: mine ? T.green10 : T.subtle }}>{pct}%</span>}
              </div>
            </Press>
          );
        })}
      </div>
      <div style={{ fontFamily: T.onest, fontSize: 12, color: T.muted, marginTop: 14, textAlign: 'center' }}>{picked ? `${total} votes · thanks for voting` : `${total} votes · tap to cast yours`}</div>
    </div>
  );
}

/* ════════ SPEAKERS ════════ */
function SpeakersScreen({ ctx }) {
  const { SPEAKERS } = window.DATA;
  const [q, setQ] = useState('');
  const list = SPEAKERS.filter(s => (s.name + s.org + s.role).toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <AppHeader title="Speakers" sub={`${SPEAKERS.length} speakers`} />
      <div style={{ padding: '12px 16px 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', borderRadius: 'var(--radius-4)', padding: '0 12px', boxShadow: 'inset 0 0 0 1px var(--wf-grey-6)' }}>
          <Icon name="search" size={18} style={{ color: T.muted }} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search speakers" style={{ flex: 1, border: 'none', outline: 'none', padding: '11px 0', fontFamily: T.sig, fontSize: 15, color: T.ink, background: 'transparent' }} />
        </div>
      </div>
      <div style={{ padding: '8px 12px ' + (TABBAR_H + 16) + 'px' }}>
        {list.map(p => (
          <Press key={p.id} onClick={() => ctx.push('speaker', { speaker: p })} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 8px', borderBottom: '1px solid ' + T.line }}>
            <Avatar initials={p.initials} color={p.color} size={52} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 16, color: T.ink }}>{p.name}</div>
              <div style={{ fontFamily: T.sig, fontSize: 13.5, color: T.body }}>{p.role}</div>
              <div style={{ fontFamily: T.onest, fontSize: 12, color: T.muted, marginTop: 1 }}>{p.org}</div>
            </div>
            <Icon name="chevronRight" size={20} stroke={2} style={{ color: T.line2 }} />
          </Press>
        ))}
      </div>
    </div>
  );
}

/* ════════ SPEAKER PROFILE ════════ */
function SpeakerProfile({ ctx }) {
  const p = ctx.params.speaker;
  const sessions = window.DATA.SESSIONS.filter(s => (s.speakers || []).includes(p.id));
  return (
    <div style={{ paddingBottom: TABBAR_H + 16 }}>
      <div style={{ position: 'relative', padding: STATUS_INSET + 8 + 'px 18px 24px', background: `linear-gradient(150deg, color-mix(in srgb, ${p.color} 88%, #fff), color-mix(in srgb, ${p.color} 70%, #000))`, color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
          <IconBtn name="chevronLeft" onClick={ctx.back} stroke={2.2} color="#fff" bg="rgba(255,255,255,0.16)" />
          <IconBtn name="share" onClick={() => ctx.toast('Profile link copied')} color="#fff" bg="rgba(255,255,255,0.16)" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Avatar initials={p.initials} color="rgba(255,255,255,0.22)" size={72} style={{ boxShadow: '0 0 0 2px rgba(255,255,255,0.4)' }} />
          <div style={{ flex: 1 }}>
            <h2 style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 23, color: '#fff', lineHeight: 1.15 }}>{p.name}</h2>
            <div style={{ fontFamily: T.sig, fontSize: 14.5, color: 'rgba(255,255,255,0.92)', marginTop: 3 }}>{p.role}</div>
            <div style={{ fontFamily: T.onest, fontSize: 12.5, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>{p.org}</div>
          </div>
        </div>
      </div>
      <div style={{ padding: '16px 16px 0', display: 'flex', gap: 10 }}>
        <Btn kind="primary" full icon="connect" onClick={() => ctx.toast('Connection request sent')}>Connect</Btn>
        <Btn kind="outline" icon="message" onClick={() => ctx.toast('Messaging coming soon')} style={{ flexShrink: 0 }}>Message</Btn>
      </div>
      <div style={{ padding: '20px 16px 0', display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div>
          <Eyebrow style={{ marginBottom: 8 }}>About</Eyebrow>
          <p style={{ fontFamily: T.sig, fontSize: 15.5, lineHeight: 1.55, color: T.body, textWrap: 'pretty' }}>{p.bio}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {p.topics.map(t => <span key={t} style={{ fontFamily: T.sig, fontSize: 12.5, fontWeight: 600, color: T.subtle, background: T.sunken, borderRadius: 999, padding: '5px 12px' }}>{t}</span>)}
          </div>
        </div>
        {sessions.length > 0 && (
          <div>
            <Eyebrow style={{ marginBottom: 10 }}>Sessions ({sessions.length})</Eyebrow>
            <div style={{ background: '#fff', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
              {sessions.map((s, i) => (
                <div key={s.id} style={{ borderBottom: i === sessions.length - 1 ? 'none' : '1px solid ' + T.line }}>
                  <SessionRow s={s} bookmarked={ctx.isBookmarked(s.id)} onToggle={() => ctx.toggleBookmark(s.id)} onOpen={ctx.openSession} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { AppHeader, ChipRow, Chip, AgendaScreen, SessionDetail, SpeakersScreen, SpeakerProfile, STATUS_INSET, TABBAR_H });
})();
