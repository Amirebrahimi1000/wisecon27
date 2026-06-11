// WISEcon27 — guided app tour. Auto-opens once after sign-in (per device);
// a pre-ticked "don't show again" checkbox controls future sign-ins, and the
// tour stays reachable from Profile and Event info.
import { useState } from 'react'
import { T, STATUS_INSET, TABBAR_H } from '../theme'
import type { AppCtx, PushScreen, TabId } from '../appState'
import type { IconName } from '../components/Icon'
import { Icon } from '../components/Icon'
import { Btn, Press } from '../components/primitives'

const SEEN_KEY = 'wc27.tour.seen'
export const tourSeen = () => {
  try { return localStorage.getItem(SEEN_KEY) === '1' } catch { return true }
}
const setTourSeen = (seen: boolean) => {
  try { seen ? localStorage.setItem(SEEN_KEY, '1') : localStorage.removeItem(SEEN_KEY) } catch { /* ignore */ }
}

interface Step {
  icon: IconName
  title: string
  body: string
  hint?: string
  // "Try it now": closes the tour and lands on the real screen
  cta?: { label: string; tab?: TabId; push?: PushScreen }
}

const STEPS: Step[] = [
  {
    icon: 'sparkles',
    title: 'Welcome to WISEcon27',
    body: 'Your conference companion — the programme, the people, and everything in between. Here’s a quick tour of what it can do for you.',
    hint: 'Takes under a minute.',
  },
  {
    icon: 'calendar',
    title: 'Build your own plan',
    body: 'Browse the Agenda in timeline, detailed or list view and bookmark what you like. Your day shows up on Home, and My schedule exports straight to your calendar.',
    hint: 'Agenda tab · bookmark icon on any session',
    cta: { label: 'Open the Agenda', tab: 'agenda' },
  },
  {
    icon: 'connect',
    title: 'Meet people, properly',
    body: 'Discover delegates with shared interests, connect and chat — or suggest a 1:1 meeting with a time and meeting point. Set your availability so requests only land when it suits you.',
    hint: 'Connect tab · My meetings on your profile',
    cta: { label: 'Open Connect', tab: 'connect' },
  },
  {
    icon: 'sparkles',
    title: 'Suggestions made for you',
    body: 'Add a few interests to your profile and Home will recommend sessions and people that actually match them. No interests, no guessing.',
    hint: 'Profile → Edit my profile → interests',
    cta: { label: 'Add my interests', push: 'editprofile' },
  },
  {
    icon: 'message',
    title: 'The Community wall',
    body: 'Share takeaways, questions and photos with fellow delegates. Photos stay inside the app — visible to signed-in delegates only — and any post can be removed at any time.',
    hint: 'Home → Community',
    cta: { label: 'Open the wall', push: 'community' },
  },
  {
    icon: 'map',
    title: 'Find your way',
    body: 'The venue map shows every room and booth — tap one to see what’s happening there. Session pages and exhibitor cards link straight to it.',
    hint: 'Home → Venue map',
    cta: { label: 'Open the map', push: 'venuemap' },
  },
  {
    icon: 'mic',
    title: 'Join the conversation',
    body: 'On any session page: ask the speaker a question, vote in live polls, rate the session, and grab slides and resources the speakers share.',
    hint: 'Open any session from the Agenda',
  },
  {
    icon: 'qr',
    title: 'Your badge is your key',
    body: 'Show your QR badge at the entrance, and scan other delegates’ badges to connect instantly. You’ll find it on Home and on your profile.',
    hint: 'Home → Badge',
    cta: { label: 'Show my badge', push: 'ticket' },
  },
]

export function Tour({ ctx }: { ctx: AppCtx }) {
  const [step, setStep] = useState(0)
  const [dontShow, setDontShow] = useState(true)
  const s = STEPS[step]
  const last = step === STEPS.length - 1

  const close = () => {
    setTourSeen(dontShow)
    ctx.back()
  }

  // "Try it now" — leave the tour and land on the real screen
  const tryIt = (cta: NonNullable<Step['cta']>) => {
    setTourSeen(dontShow)
    if (cta.tab) {
      ctx.setTab(cta.tab) // clears the stack (and the tour with it)
    } else {
      ctx.back()
      ctx.push(cta.push!, {})
    }
  }

  return (
    // anchored to the app frame so the gradient and controls always fill the
    // screen exactly, whatever the device height
    <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', background: 'linear-gradient(160deg, var(--wf-green-8) 0%, var(--wf-green-10) 55%, var(--wf-green-12) 130%)', paddingTop: STATUS_INSET, paddingBottom: TABBAR_H + 12 }}>
      {/* skip */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 16px 0' }}>
        <Press onClick={close} style={{ fontFamily: T.sig, fontWeight: 600, fontSize: 13.5, color: 'rgba(255,255,255,0.85)', padding: '6px 10px' }}>
          {last ? '' : 'Skip tour'}
        </Press>
      </div>

      {/* slide */}
      <div key={step} style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 32px' }}>
        <div style={{ width: 92, height: 92, borderRadius: '50%', background: 'rgba(255,255,255,0.16)', display: 'grid', placeItems: 'center', color: '#fff', backdropFilter: 'blur(4px)' }}>
          <Icon name={s.icon} size={44} stroke={1.6} />
        </div>
        <h2 style={{ fontFamily: T.onest, fontWeight: 700, fontSize: 27, color: '#fff', lineHeight: 1.15, letterSpacing: '-0.01em', marginTop: 26 }}>{s.title}</h2>
        <p style={{ fontFamily: T.sig, fontSize: 15.5, color: 'rgba(255,255,255,0.92)', lineHeight: 1.55, marginTop: 14, maxWidth: 320 }}>{s.body}</p>
        {s.hint && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 16, background: 'rgba(255,255,255,0.14)', borderRadius: 999, padding: '7px 14px', fontFamily: T.onest, fontSize: 12, color: 'rgba(255,255,255,0.88)' }}>
            <Icon name="info" size={14} />
            {s.hint}
          </div>
        )}
        {s.cta && (
          <Press onClick={() => tryIt(s.cta!)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 18, height: 40, padding: '0 18px', borderRadius: 999, background: 'rgba(255,255,255,0.18)', boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.55)', color: '#fff', fontFamily: T.sig, fontWeight: 600, fontSize: 14 }}>
            {s.cta.label}
            <Icon name="arrowRight" size={16} stroke={2.2} />
          </Press>
        )}
      </div>

      {/* dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 7, padding: '14px 0' }}>
        {STEPS.map((_, i) => (
          <Press key={i} onClick={() => setStep(i)} style={{ width: i === step ? 22 : 8, height: 8, borderRadius: 999, background: i === step ? '#fff' : 'rgba(255,255,255,0.35)', transition: 'width .2s var(--ease-out)' }}>
            <span />
          </Press>
        ))}
      </div>

      {/* don't show again */}
      <Press onClick={() => setDontShow((v) => !v)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, padding: '4px 16px 14px' }}>
        <span style={{ width: 21, height: 21, borderRadius: 6, background: dontShow ? '#fff' : 'rgba(255,255,255,0.18)', boxShadow: dontShow ? 'none' : 'inset 0 0 0 1.5px rgba(255,255,255,0.6)', display: 'grid', placeItems: 'center', color: T.green10, flexShrink: 0 }}>
          {dontShow && <Icon name="check" size={14} stroke={3} />}
        </span>
        <span style={{ fontFamily: T.sig, fontSize: 13.5, color: 'rgba(255,255,255,0.9)' }}>Don't show this again when I sign in</span>
      </Press>

      {/* nav buttons */}
      <div style={{ display: 'flex', gap: 10, padding: '0 20px' }}>
        {step > 0 && (
          <Btn kind="outline" size="lg" onClick={() => setStep(step - 1)} style={{ background: 'rgba(255,255,255,0.14)', color: '#fff', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.4)', flexShrink: 0 }}>
            Back
          </Btn>
        )}
        <Btn kind="primary" full size="lg" icon={last ? 'check' : 'arrowRight'} onClick={() => (last ? close() : setStep(step + 1))} style={{ background: '#fff', color: T.green11 }}>
          {last ? "Let's go" : step === 0 ? 'Show me around' : 'Next'}
        </Btn>
      </div>
    </div>
  )
}
