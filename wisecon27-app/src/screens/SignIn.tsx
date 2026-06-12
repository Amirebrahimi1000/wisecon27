// WISEcon27 — magic-link sign-in screen (brand hero + email → link).
import { useEffect, useState } from 'react'
import { useAuth } from '../auth'
import { supabase } from '../lib/supabase'
import { T, STATUS_INSET } from '../theme'
import { Icon } from '../components/Icon'
import { Btn, Press } from '../components/primitives'
import { InstallCard, isStandalone } from '../install'

export function SignIn() {
  const { signIn, verifyCode } = useAuth()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState('')
  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [dateline, setDateline] = useState('')
  const [location, setLocation] = useState('')

  // event headline is editable in Admin → Event; settings are public-readable
  useEffect(() => {
    supabase.from('settings').select('key, value').then(({ data }) => {
      if (!data) return
      const m = new Map((data as { key: string; value: string }[]).map((r) => [r.key, r.value]))
      setDateline(m.get('event_dateline') ?? '')
      setLocation(m.get('event_location') ?? '')
    })
  }, [])

  const valid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())

  const submit = async () => {
    if (!valid || status === 'sending') return
    setStatus('sending')
    const { error } = await signIn(email)
    if (error) {
      setError(error)
      setStatus('error')
    } else {
      setStatus('sent')
    }
  }

  const verify = async () => {
    if (code.trim().length < 6 || verifying) return
    setVerifying(true)
    const { error } = await verifyCode(email, code)
    setVerifying(false)
    if (error) setError(error)
    // on success the auth listener swaps to the app automatically
  }

  return (
    // full-bleed brand gradient (same family as the Home hero and the tour);
    // the form floats in a white card instead of hugging the green band
    <div className="wc-noscroll" style={{ height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', position: 'relative', background: 'linear-gradient(160deg, var(--wf-green-8) 0%, var(--wf-green-10) 55%, var(--wf-green-12) 130%)' }}>
      {/* faint rotated watermark (UNIwise bubble), echoing the Home hero */}
      <img src={import.meta.env.BASE_URL + 'logo-mark.svg'} alt="" style={{ position: 'absolute', right: -54, top: -18, width: 240, opacity: 0.1, filter: 'brightness(0) invert(1)', transform: 'rotate(-10deg)', pointerEvents: 'none' }} />

      {/* brand block — stacked tight like the Home hero so the form card and
          install steps fit on one screen */}
      <div style={{ position: 'relative', padding: (STATUS_INSET + 10) + 'px 26px 0' }}>
        <div style={{ fontFamily: T.onest, fontWeight: 600, fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.8)' }}>
          UNIwise presents
        </div>
        <img
          src={import.meta.env.BASE_URL + 'wisecon27-logo.svg'}
          alt="WISEcon27 — Connect. Create. Transform Assessment."
          style={{ width: 290, maxWidth: '88%', display: 'block', marginTop: 12, filter: 'brightness(0) invert(1)' }}
        />
        {(dateline || location) && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 16, fontFamily: T.sig, fontWeight: 600, fontSize: 14, color: 'rgba(255,255,255,0.95)', background: 'rgba(255,255,255,0.14)', borderRadius: 999, padding: '7px 16px', backdropFilter: 'blur(4px)' }}>
            <Icon name="calendar" size={15} />
            {[dateline, location].filter(Boolean).join(' · ')}
          </div>
        )}
      </div>

      <div style={{ height: 22, flexShrink: 0 }} />

      {/* floating form card */}
      <div style={{ position: 'relative', padding: '0 16px calc(20px + env(safe-area-inset-bottom, 0px))' }}>
        <div style={{ background: 'var(--wf-surface)', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', padding: '24px 22px' }}>
        {status === 'sent' ? (
          <div>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: T.green1, color: T.green9, display: 'grid', placeItems: 'center', margin: '0 auto 18px' }}>
              <Icon name="message" size={32} />
            </div>
            <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 21, color: T.ink, textAlign: 'center' }}>Check your email</div>
            <p style={{ fontFamily: T.sig, fontSize: 14.5, color: T.body, marginTop: 8, lineHeight: 1.55, textAlign: 'center' }}>
              Sent to <b style={{ color: T.ink }}>{email.trim()}</b>. Type the code from the email here to sign in.
            </p>
            <p style={{ fontFamily: T.sig, fontSize: 13, color: T.muted, marginTop: 6, lineHeight: 1.5, textAlign: 'center' }}>
              It can take a minute to arrive — and please check your spam / junk folder.
            </p>
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => { setCode(e.target.value.replace(/\D/g, '').slice(0, 10)); if (error) setError('') }}
              onKeyDown={(e) => e.key === 'Enter' && verify()}
              placeholder="Enter code"
              style={{ width: '100%', boxSizing: 'border-box', textAlign: 'center', letterSpacing: '0.25em', border: 'none', outline: 'none', background: 'var(--wf-surface)', borderRadius: 'var(--radius-4)', padding: '16px 0', marginTop: 18, fontFamily: T.onest, fontWeight: 700, fontSize: 24, color: T.ink, boxShadow: 'inset 0 0 0 1px var(--wf-grey-6)' }}
            />
            {error && <div style={{ fontFamily: T.sig, fontSize: 13, color: 'var(--wf-negative-9)', marginTop: 8, textAlign: 'center' }}>{error}</div>}
            <Btn kind="primary" full size="lg" onClick={verify} disabled={code.length < 6 || verifying} style={{ marginTop: 16 }}>
              {verifying ? 'Signing in…' : 'Sign in'}
            </Btn>
            <div style={{ fontFamily: T.sig, fontSize: 12.5, color: T.muted, marginTop: 16, lineHeight: 1.5, textAlign: 'center' }}>
              Always enter the code here in the app — don't tap the link in the email (it opens a browser instead of the app).
            </div>
            <div style={{ fontFamily: T.sig, fontSize: 12.5, color: T.muted, marginTop: 8, lineHeight: 1.5, textAlign: 'center' }}>
              {isStandalone()
                ? 'You only need to do this once — the app keeps you signed in.'
                : 'Signed in here in the browser? Installing the app later needs one more code — the app keeps you signed in from then on.'}
            </div>
            <Press onClick={() => { setStatus('idle'); setCode(''); setError('') }} style={{ display: 'block', marginTop: 16, fontFamily: T.sig, fontWeight: 600, fontSize: 14, color: T.green10, textAlign: 'center' }}>
              Use a different email
            </Press>
          </div>
        ) : (
          <>
            <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 22, color: T.ink }}>Welcome, delegate</div>
            <p style={{ fontFamily: T.sig, fontSize: 14.5, color: T.muted, marginTop: 6, lineHeight: 1.5 }}>
              Sign in with your email and we'll send you a code — no password needed.
            </p>
            <div style={{ marginTop: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--wf-surface)', borderRadius: 'var(--radius-4)', padding: '0 14px', boxShadow: 'inset 0 0 0 1px var(--wf-grey-6)' }}>
                <Icon name="message" size={18} style={{ color: T.muted }} />
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (status === 'error') setStatus('idle') }}
                  onKeyDown={(e) => e.key === 'Enter' && submit()}
                  placeholder="you@university.edu"
                  style={{ flex: 1, border: 'none', outline: 'none', padding: '14px 0', fontFamily: T.sig, fontSize: 15.5, color: T.ink, background: 'transparent' }}
                />
              </div>
              {status === 'error' && (
                <div style={{ fontFamily: T.sig, fontSize: 13, color: 'var(--wf-negative-9)', marginTop: 8 }}>{error}</div>
              )}
              <Btn kind="primary" full size="lg" onClick={submit} disabled={!valid || status === 'sending'} style={{ marginTop: 16 }}>
                {status === 'sending' ? 'Sending…' : 'Email me a code'}
              </Btn>
            </div>
            <div style={{ fontFamily: T.onest, fontSize: 11.5, color: T.muted, marginTop: 18, lineHeight: 1.5, textAlign: 'center' }}>
              By continuing you agree to the event terms. Your badge is created automatically on first sign-in.
            </div>
          </>
        )}
        </div>

        {status !== 'sent' && !isStandalone() && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 6px 12px' }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.28)' }} />
              <div style={{ fontFamily: T.onest, fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)' }}>
                For the best experience
              </div>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.28)' }} />
            </div>
            <InstallCard />
          </>
        )}
      </div>
    </div>
  )
}
