# Handoff: WISEcon27 Event App

## Overview
A **phone-first event/conference app** for **WISEcon27** (Uniwise's annual assessment
conference). Attendees use it to browse the agenda, build a personal schedule,
explore speakers, participate in live Q&A and polls, network with other delegates,
view their entry badge (QR), browse sponsors, read announcements, and give feedback.

The visual language is the **WISEflow design system**: Signika typography, a green
brand accent (`#628010`), black/neutral chrome, calm-but-confident institutional tone
flexed slightly warmer for an event context.

---

## About the Design Files
The files in `prototype/` are a **design reference created in HTML + React (via in-browser
Babel)** — a working prototype that demonstrates the intended look, layout, copy, and
behavior. **They are not production code to ship directly.**

Your task is to **recreate these designs in the target environment**. This is a native
mobile app (the prototype is rendered inside an iPhone frame), so the natural targets are
**React Native / Expo**, **Swift/SwiftUI (iOS)**, or **Kotlin/Jetpack Compose (Android)** —
or a mobile web/PWA build if that's the chosen direction. If a codebase already exists,
follow its established patterns, component library, navigation, and state conventions.
If not, pick the most appropriate stack and implement the designs there.

The prototype's React structure (a screen registry + a navigation stack + a small set of
shared primitives) maps cleanly onto any of those targets — treat it as a behavioral spec,
not a code dependency.

> **Ignore the prototype-only scaffolding when porting:** the `IOSDevice` bezel
> (`ios-frame.jsx`), the desktop stage/toolbar, the "Compare homes" mode, and the
> `tweaks-panel.jsx` Tweaks UI exist only to present the design in a browser. The real app
> is just the phone content: a tab bar + screens.

---

## Fidelity
**High-fidelity.** Colors, typography, spacing, radii, shadows, copy, and interactions are
final and intentional. Recreate the UI faithfully using the target platform's primitives,
mapping the design tokens below to the platform's theming system. Exact hex/px values are
given so you don't have to measure.

---

## Design Tokens

All tokens come from the WISEflow design system (`prototype/colors_and_type.css`, which
defines them as CSS custom properties). The values you actually need:

### Color — brand & accent
| Role | Hex | Notes |
|---|---|---|
| **Primary accent / brand green** | `#628010` | Buttons, active states, links, bookmarks |
| Brand green (light hover) | `#4e6712` | Primary button hover |
| Brand tile green | `#82AE40` | App-icon background |
| Green deep (gradients) | `#3a4e10`, `#1f2a08` | Bold hero gradient end stops |
| Green tint bg | `#f0f5ea` | Soft green surfaces, chips |
| Lime (live dot) | `#bdee63` | "Live" indicator on dark hero |

### Color — neutrals (grey ramp)
`#fcfcfc · #f8f8f8 · #f2f2f2 · #ebebeb · #e6e6e6 · #d7d7d8 · #cacacb · #bdbdbe · #8c8c8c · #747475 · #474748 · #1a1a1a`
- Page/sunken background: `#f8f8f8`
- Card/surface: `#ffffff`
- Body text: `#474748`  ·  Primary/heading text: `#000000`  ·  Muted text: `#8c8c8c`  ·  Subtle: `#747475`
- Default border: `#cacacb`  ·  Subtle border (hairlines): `#e6e6e6`

### Color — track / category accents (used on session tags & detail heroes)
Each track has `{ background, text, dot }`:
| Track | bg | text | dot |
|---|---|---|---|
| Integrity | `#eaedff` | `#2d1d96` | `#4e35f2` (purple) |
| Pedagogy | `#f0f5ea` | `#3a4e10` | `#628010` (green) |
| Platform | `#ecf3f8` | `#234560` | `#3d75a0` (blue) |
| Research | `#fff7ed` | `#cc4e00` | `#f76b15` (orange) |
| Workshop | `#e7f9f3` | `#067a68` | `#12a594` (teal) |
| Plenary (breaks/keynotes) | `#f2f2f2` | `#474748` | `#747475` (grey) |

Detail/hero gradients are `linear-gradient(150deg, <dot>, mix(<dot> 62%, black))`.

### Color — semantic
- Positive `#3d9a50` / bg `#f3faf3` · Warning `#8a6a10` / bg `#fffbe0` · Negative `#b13030` (hover `#942626`) / bg `#fff8f7` · Info `#3d75a0` / bg `#ecf3f8`
- Notification toast: `rgba(17,17,17,0.94)` bg, white text.

### Typography
Two families, loaded from Google Fonts (`Signika` + `Onest`), weights **400 / 500 / 700**.
- **Signika** — primary UI font: headings, body, buttons, session titles.
- **Onest** — used for **UPPERCASE eyebrow labels**, numeric/stat values, captions, and timestamps (gives a more "forensic" tone). Letter-spacing on uppercase labels ≈ `0.07em`.

Type scale used in the app (size / line-height):
| Use | Size | Weight | Font |
|---|---|---|---|
| Bold hero display ("Assessment, reimagined.") | 40px / 1.0 | 700 | Onest |
| Screen title (sticky header) | 21px | 700 | Signika |
| Greeting H1 (home) | 24–28px | 700 | Signika |
| Session/card title | 15–18px | 700 | Signika |
| Detail hero title | 27px | 700 | Signika |
| Body text | 14–15.5px / 1.5 | 400–500 | Signika |
| Eyebrow label | 11px | 600 | Onest, uppercase |
| Caption / timestamp | 11–12.5px | 400–600 | Onest |
| Stat value (hero tiles) | 24px | 700 | Onest |

### Spacing, radius, elevation
- **Spacing scale (px):** 4, 8, 10, 12, 14, 16, 20, 24, 28, 32, 40, 48.
- **Radius:** small `4.5px` (buttons), `6px`, `10px` (inputs, small cards), `15.5px` (cards/sheets), `22–26px` (ticket card, iOS list groups, bottom-sheet top), `999px` (pills/chips/avatars).
- **Card shadow** (`--shadow-card`): `0 0 0 1px rgba(78,53,242,.05), 0 12px 60px rgba(0,0,0,.05), 0 16px 64px rgba(78,53,242,.05), 0 16px 36px -9px rgba(0,0,0,.10)` — a soft, slightly purple-tinted lift.
- **Small shadow** (`--shadow-sm`): `0 1px 3px rgba(0,0,0,.08), 0 1px 2px -1px rgba(0,0,0,.05)`.

### Motion
- Standard easing: `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out); durations 80 / 150 / 240 / 320 ms.
- Press feedback: scale to `0.975`, opacity `0.92`, ~80ms.
- "Live" dot: 1.8s opacity/scale pulse.
- Poll result bars animate width over ~600ms.
- **Do not** rely on entrance/opacity animations for content reveal (caused capture issues in the prototype; keep content visible by default and animate transforms only).

---

## App Structure & Navigation

**Bottom tab bar (5 tabs), always visible:** Home · Agenda · Speakers · Connect · Profile.
- Active tab: brand green icon + 700-weight green label. Inactive: muted grey.
- Profile tab shows a red dot when there are unread notifications.
- Tab bar: white at 92% opacity + blur, 1px top hairline, ~60px tall + safe-area bottom inset (~22px for the home indicator).

**Navigation model:** each tab has a root screen. Tapping into detail screens
(session, speaker, ticket, sponsors, notifications, feedback, my schedule, event info)
**pushes** onto a stack rendered above the current tab; a back chevron pops. Switching
tabs clears the stack. Scroll position resets to top on every navigation.

**Persistent app state (survives navigation; should persist per-device in the real app):**
- `bookmarks: Set<sessionId>` — the user's personal schedule. Seeded with 5 sessions.
- `notifications[]` with per-item `unread` flag; `unread` count drives badges.
- Connection request statuses (`connect → pending → connected`).
- Selected home layout direction (see Tweaks → ship **Bold** as default; see below).

**Status bar inset:** screens reserve ~54px at top for the device status bar; sticky
headers and hero sections start below it.

---

## Screens / Views

### 1. Home — **three directions exist; ship "Bold" as the default**
All three show the same data (greeting, "up next", personal schedule, quick actions) with
different visual treatments. The product decision is **Bold**. The other two are documented
in case you want them as a setting or A/B.

**Home content (all variants):**
- Greeting: "Good morning, <FirstName>" + the user's name.
- **Up next** — the next bookmarked session for "today" (prototype pins "today" = Day 1,
  "now" = 10:50, so up-next = the 11:00 Integrity talk).
- **Quick actions** (4): Agenda, Speakers, Connect, My badge (→ ticket screen).
- The personal schedule for the day.
- Bell icon → Notifications (with unread dot).

**Variant C — "Bold" (DEFAULT):**
- Full-bleed hero with green gradient `linear-gradient(160deg,#769b08 0%,#4e6712 55%,#1f2a08 130%)`, a faint white dolphin watermark (logo rotated -8°, opacity .12), top-left "● LIVE · DAY 1 OF 3" (lime pulsing dot, Onest uppercase), top-right bell.
- Big Onest 700 display headline "Assessment, reimagined." (40px, line-height 1.0).
- Three translucent **stat tiles**: sessions today / in your plan / speakers (Onest 24px value + caption).
- A white **sheet** with 24px top radius pulled up ~34px over the hero.
- **Up next** card inside the sheet: white, left color bar in the track's dot color, large track tag, bookmark toggle, 21px title, time + room row.
- **Quick actions** row: first tile filled green (white icon), rest white with small shadow.
- **"Then today"** list: remaining bookmarked sessions as compact rows (left = time + track dot, title + room, bookmark toggle).

**Variant A — "Classic" (safe / institutional):** white background; small "WISEcon27" wordmark + bell; "Good morning / <Name>" + "Tuesday, 14 September · Day 1 of 3"; bordered (not shadowed) Up-next card; quick links as 4 grey-tinted tiles; "Your schedule today" as a single bordered list card with "See all".

**Variant B — "Cards" (balanced / warm):** light grey page; greeting + avatar + bell; **Up-next hero card** filled with the track gradient (rounded, white text, pulsing "Up next · <time>" pill, bookmark); 4 quick-action tiles (white, circular green-tint icon badges); a blue **announcement banner** ("Room change…"); horizontally-scrolling **"Your day"** mini session cards (210px wide).

### 2. Agenda
- Sticky header "Agenda" + subtitle "14–16 September · Aarhus" + search icon.
- **Day selector:** 3 segmented buttons (Tue 14 / Wed 15 / Thu 16); active = green fill, white text, showing weekday (Onest 11px upper) + date (Signika 16px 700).
- **Track filter chips:** horizontally scrolling pills — "All tracks" + one per track (colored dot). Active chip = black fill/white text; inactive = white with `#cacacb` inset border.
- **Session list:** sessions for the selected day, sorted by start time, grouped into one rounded card (hairline dividers). Each is a **Session Row** (see Components). Breaks/socials render without a bookmark control and with a muted type label instead of a track tag.

### 3. Session Detail (pushed)
- **Hero** (track gradient, white): back + share icons (translucent circular), a type pill ("● TALK/KEYNOTE/PANEL/WORKSHOP…"), 27px title, then a meta row: date · time · room (each with a line icon).
- **Action bar** (white): primary full-width button — "Add to schedule" (green, + icon) toggling to "In my schedule" (grey, check icon); secondary "Remind" outline button (bell) → toast "Reminder set for <time>".
- **Tabs:** Details · Q&A (with count) · Live poll. Underline-style active tab in green.
  - **Details:** description paragraph, `#hashtag` chips, **Speakers** list (tappable rows → Speaker Profile), and "<N> delegates planning to attend".
  - **Q&A:** a one-line textarea + green send button (adds your question, toast "Question submitted"); list of questions sorted by upvotes; each row has an upvote button (count + arrow; toggles green when voted) and the asker name.
  - **Live poll:** "● LIVE NOW" label, a question, and tappable options. Before voting: plain bordered rows. After voting: each row fills a horizontal bar to its `%`, your choice highlighted green with a check; footer shows total votes. One vote only.
- Breaks/socials show a simplified Details-only view (no action bar/tabs).

### 4. Speakers
- Header "Speakers" + count; search input (filters by name/role/org live).
- Vertical list: 52px circular monogram avatar (brand-colored) + name (16px 700) + role + org, chevron. Tap → Speaker Profile.

### 5. Speaker Profile (pushed)
- Hero in the speaker's accent color (gradient), back + share, 72px ringed monogram, name (23px), role, org.
- Actions: "Connect" (green, full) + "Message" (outline) → toasts.
- "About" bio paragraph + topic chips.
- "Sessions (<N>)" — that speaker's sessions as Session Rows in a card.

### 6. Connect (networking)
- Header "Connect" + "Meet fellow delegates" + search.
- **Your badge card:** green gradient card with your monogram, "Tap to share your badge", and a small QR thumbnail → opens Ticket screen.
- **Tabs:** Discover · Requests (count) · Messages.
  - Discover/Requests: attendee rows — avatar, name, role · org, "<N> shared interests" green pill, and a status button cycling **Connect (green) → Pending (grey) → Connected (outline + message icon)**. Sending a request shows a toast.
  - Messages: thread list — avatar, name, last message, time, unread count badge (green pill). Tapping → toast (chat is a stub).

### 7. My Schedule (pushed from Home/Profile)
- "My schedule" + saved count. Bookmarked sessions grouped by day (Onest eyebrow per day = "Tuesday, 14 September"), each group a card of Session Rows. Empty state when no bookmarks.

### 8. Profile
- Header "Profile" + settings icon.
- Identity block: 64px monogram + name (20px 700) + role + org.
- **Badge card** (black gradient): QR thumbnail + "MY BADGE" eyebrow + ticket type + badge id → Ticket screen.
- **List menu** (rounded card, icon tiles): My schedule (count) · Notifications (unread count) · My connections · Sponsors & exhibitors · Give feedback · Event info & Wi-Fi · Settings. Each row → its screen (or toast).
- "Sign out" (danger outline) + footer "WISEcon27 · v1.0 · Powered by WISEflow".

### 9. Ticket / Badge (pushed)
- Full green-gradient screen, back + "My badge" title.
- White ticket card with a perforated dashed divider: top section = "WISECON27 · AARHUS" eyebrow, name (24px), org, ticket-type pill; bottom = large QR (200px), badge id in spaced Onest, "Scan at registration & session doors".
- *(QR in the prototype is a decorative faux-QR; replace with a real QR encoding the badge id.)*

### 10. Sponsors (pushed)
- "Sponsors" + "With thanks to our partners". Grouped by tier: **Host / Platinum** as full-width cards (logo tile + name + blurb); **Gold / Silver** as 2-column cards. Logo tiles are colored monograms (placeholders → swap for real logos).

### 11. Notifications (pushed)
- "Notifications" + "Mark read" action. Each item: colored circular icon by type (reminder=green clock, connect=purple, announce=blue info, social=red heart, feedback=orange star), title + body + time, unread items have a soft green-tint background + green dot. Tap marks one read; "Mark read" clears all.

### 12. Feedback (pushed)
- "Give feedback". 5-star rating (fills yellow `#d4b51b`), a rating word, multi-select chips ("Great speaker", "Well organised", …), optional textarea, "Submit feedback" (disabled until rated) → success state (green check, "Thank you").

### 13. Event Info (pushed)
- Wi-Fi network + password, venue, registration hours, catering, help desk — as a labeled key/value list card.

---

## Interactions & Behavior — summary
- **Bookmark toggle** everywhere updates the shared schedule instantly (home "up next", "then today", agenda, detail action bar, my schedule all reflect it).
- **Toasts**: bottom-center dark pill, auto-dismiss ~1.9s (reminders, share, connect, submit).
- **Tabs/segments**: instant content swap, scroll resets to top.
- **Press feedback** on all tappable surfaces (subtle scale/opacity).
- **Live poll**: single vote, animated result bars. **Q&A**: add + upvote, list re-sorts by votes.
- **Connection button**: 3-state cycle with toast on request.
- **Search**: live client-side filter (Speakers implemented; Agenda/Connect search are stubs → wire to real filtering).

## State Management
- `bookmarks: Set<id>` (personal schedule) — persist per device/account.
- `notifications: [{id,type,title,body,time,unread}]` + derived `unreadCount`.
- `connections: status per attendee` (`connect|pending|connected`).
- Per-screen ephemeral state: agenda selected day + track filter; detail active tab; Q&A list + draft; poll choice; feedback stars/chips/text; search query.
- Navigation: a stack of `{screen, params}` over the active tab.
- "Now"/"today" is hard-coded to Day 1 @ 10:50 in the prototype — replace with the real clock to compute "up next" / "live".

## Data Model
All content lives in **`prototype/app/data.js`** (`window.DATA`) — use it as the schema and
seed. Shapes:
- `TRACKS{ id: {name,bg,fg,dot} }`
- `DAYS[ {id,dow,date,long} ]`
- `SPEAKERS[ {id,name,role,org,initials,color,bio,topics[]} ]`
- `SESSIONS[ {id,day,start,end,title,type,track,room,speakers[ids],desc,tags[],going,capacity?} ]`
  — `type ∈ keynote|talk|panel|workshop|break|social|plenary`
- `ATTENDEES[ {id,name,role,org,initials,color,interests[],mutual,status} ]`
- `NOTIFICATIONS[ {id,type,title,body,time,unread} ]`
- `SPONSORS[ {name,tier,blurb,initials,color} ]` — `tier ∈ Host|Platinum|Gold|Silver`
- `ME{ name,initials,role,org,color,ticket,badgeId,bookmarks[] }`

> The sample event content (dates 14–16 Sep 2027 in Aarhus, speakers, sessions, sponsors)
> is **placeholder** — replace with real WISEcon27 data. Sponsor logos and any speaker
> photos are colored-monogram placeholders.

## Reusable Components (build these first)
- **Avatar / monogram** (circular, brand-colored initials; + stacked variant).
- **TrackTag** (pill: colored dot + track name).
- **Button** (kinds: primary green, dark, secondary blue, default grey, ghost, outline, danger; sizes 34/42/48; 4.5px radius; optional leading icon).
- **IconBtn** (round, optional red notification dot).
- **BookmarkBtn** (outline ↔ filled, green when on; light variant for dark backgrounds).
- **Session Row** — time block (start/end) · track-colored bar · track tag · title · room + first speaker · bookmark toggle. The workhorse list item.
- **Card** (white, 15.5px radius, card shadow), **Eyebrow** (Onest uppercase label), **Chip**, **Divider**, **Toast**, **Empty state**.
- **Line icon set** — see `prototype/app/icons.jsx` for the exact glyphs used (24px artboard, 1.8px stroke, round caps, currentColor). `lucide` is an acceptable stylistic match if you don't want to port these.

## Screenshots
Rendered states of the prototype are in `screenshots/` (the device sits on a neutral
desktop "stage" — ignore the surrounding toolbar/background, that's prototype chrome):
| # | Screen |
|---|---|
| 01 | Home — **Bold** (default) |
| 02 | Agenda (day + track filters) |
| 03 | Session Detail — Details tab |
| 04 | Session Detail — Live poll (after voting) |
| 05 | Session Detail — Q&A |
| 06 | Speakers list |
| 07 | Speaker Profile |
| 08 | Connect (networking) |
| 09 | Profile |
| 10 | Ticket / badge (QR) |
| 11 | Sponsors |
| 12 | Feedback |
| 13 | Home — all three directions side by side (Classic / Cards / Bold) |

## Assets
- `prototype/assets/logo-icon.svg` — green app-icon tile w/ white dolphin (home wordmark, toolbar, app icon).
- `prototype/assets/logo-mark-green.svg` — dolphin mark on transparent (recolored white via filter for the Bold hero watermark).
- `prototype/assets/logo-mark-black.svg` — monochrome mark.
- Fonts: **Signika** & **Onest** (Google Fonts; bundle locally for a native app).
- All sponsor logos, speaker photos, and the QR are **placeholders** — supply real assets.

## Files in this bundle (reference)
```
prototype/
  wisecon27.html          entry: loads tokens + scripts, mounts the desktop "stage"
  colors_and_type.css     WISEflow design tokens (colors, type, spacing, radius, shadow)
  app/
    data.js               ALL event content + schema (window.DATA)
    icons.jsx             line icon set
    components.jsx         shared primitives (Avatar, TrackTag, Button, SessionRow, …)
    screens-core.jsx       Agenda, Session Detail (Q&A + Poll), Speakers, Speaker Profile
    screens-more.jsx       Connect, My Schedule, Profile, Ticket, Sponsors, Notifications, Feedback, Info, faux-QR
    home.jsx               the 3 home directions (HomeA Classic / HomeB Cards / HomeC Bold)
    app.jsx                app shell: tab bar, navigation stack, bookmarks, notifications, toast
  ios-frame.jsx           PROTOTYPE-ONLY iPhone bezel (do not port)
  tweaks-panel.jsx        PROTOTYPE-ONLY design-tweak panel (do not port)
```

To run the prototype locally: serve the `prototype/` folder over HTTP (e.g.
`npx serve prototype`) and open `wisecon27.html` — it needs a server because it loads the
`app/*.jsx` modules. The Home layout defaults to **Bold**; the toolbar's "Compare homes"
shows all three side by side.
