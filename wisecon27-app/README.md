# WISEcon27 — Event App

A phone-first event/conference app for **WISEcon27** (Uniwise's annual assessment
conference), built from the design handoff in [`../README.md`](../README.md) and the
reference prototype in [`../prototype/`](../prototype).

Implemented as a **React + Vite + TypeScript PWA** (installable, phone-first). The
visual language is the WISEflow design system: Signika + Onest typography, brand green
`#628010`, neutral chrome.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build (outputs dist/, incl. PWA service worker)
npm run preview  # serve the production build
```

Open in a narrow viewport (or your browser's device toolbar) for the intended
phone layout. On wider screens the app is centered in a phone-sized frame.

## What's implemented

All 13 screens from the handoff:

- **Home** — ships **Bold** as the default (full-bleed green hero, stat tiles, up-next
  card, quick actions, "Then today"). Classic and Cards variants are also built and
  switchable in **Profile → Settings → Home layout** (the documented A/B).
- **Agenda** — day selector, track-filter chips, grouped session list.
- **Session Detail** — hero, add-to-schedule / remind, and **Details · Q&A · Live poll**
  tabs (Q&A add + upvote-resort, single-vote poll with animated result bars).
- **Speakers** (live search) and **Speaker Profile**.
- **Connect** — your badge card, Discover/Requests/Messages, 3-state connection buttons.
- **My Schedule**, **Profile**, **Ticket/Badge**, **Sponsors**, **Notifications**,
  **Feedback**, **Event Info**.

### Behaviour & state

- **Bookmarks**, **notifications** (read state), **connection statuses**, and the
  **home-layout** choice are persisted per-device in `localStorage` (`store.tsx`).
- Bottom tab bar with stack-over-tab navigation; scroll resets on navigation; the
  browser/hardware **Back** button pops the stack.
- Toasts, press feedback, live-dot pulse, and poll bar animations match the spec.

### Deltas from the prototype (intentional, per the handoff)

- **Real QR codes** (`qrcode.react`) encoding the badge id, replacing the prototype's
  decorative faux-QR.
- "Now"/"today" is pinned to **Day 1 @ 10:50** (in `data.ts` → `CLOCK`) so "up next" /
  "live" match the design — swap for the real clock in production.
- Prototype-only scaffolding (iOS bezel, desktop stage toolbar, "Compare homes",
  Tweaks panel) is **not** ported.
- Sample event content (speakers, sessions, sponsors) and monogram avatars/logos are
  **placeholders** — replace with real WISEcon27 data and assets.

## Structure

```
src/
  index.css            WISEflow design tokens + base + utility/animation classes
  theme.ts             token shorthand (T) + layout insets
  types.ts             domain types
  data.ts              event content + seed (placeholder)
  store.tsx            app state + persistence + navigation context
  App.tsx              shell: tab bar, nav stack, toast, screen routing
  components/
    Icon.tsx           line icon set (ported)
    primitives.tsx     Avatar, TrackTag, Btn, IconBtn, BookmarkBtn, SessionRow, …
    QR.tsx             real QR badge
  screens/             Home (3 variants) + the 12 other screens
public/
  logo-icon.svg, logo-mark.svg
```
