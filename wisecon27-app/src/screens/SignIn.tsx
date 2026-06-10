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
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--wf-grey-2)' }}>
      {/* brand hero */}
      <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(160deg, var(--wf-green-8) 0%, var(--wf-green-10) 55%, var(--wf-green-12) 130%)', padding: STATUS_INSET + 'px 24px 48px' }}>
        <div style={{ position: 'relative', paddingTop: 28 }}>
          <img
            src={import.meta.env.BASE_URL + 'wisecon27-logo.svg'}
            alt="WISEcon27 — Connect. Create. Transform Assessment."
            style={{ width: 250, maxWidth: '78%', display: 'block', filter: 'brightness(0) invert(1)' }}
          />
          <div style={{ fontFamily: T.sig, fontSize: 15, color: 'rgba(255,255,255,0.9)', marginTop: 18, lineHeight: 1.5 }}>
            {[dateline, location].filter(Boolean).join(' · ')}
          </div>
        </div>
      </div>

      {/* sheet */}
      <div style={{ flex: 1, marginTop: -28, background: 'var(--wf-grey-2)', borderRadius: '24px 24px 0 0', padding: '28px 22px' }}>
        {status === 'sent' ? (
          <div>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: T.green1, color: T.green9, display: 'grid', placeItems: 'center', margin: '0 auto 18px' }}>
              <Icon name="message" size={32} />
            </div>
            <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 21, color: T.ink, textAlign: 'center' }}>Check your email</div>
            <p style={{ fontFamily: T.sig, fontSize: 14.5, color: T.body, marginTop: 8, lineHeight: 1.55, textAlign: 'center' }}>
              Sent to <b style={{ color: T.ink }}>{email.trim()}</b>. Enter the code from the email below to stay in the app — or tap the sign-in link.
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
              On an iPhone home-screen app, the code keeps you in the app; the link opens Safari.
            </div>
            <Press onClick={() => { setStatus('idle'); setCode(''); setError('') }} style={{ display: 'block', marginTop: 16, fontFamily: T.sig, fontWeight: 600, fontSize: 14, color: T.green10, textAlign: 'center' }}>
              Use a different email
            </Press>
          </div>
        ) : (
          <>
            <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 19, color: T.ink }}>Sign in</div>
            <p style={{ fontFamily: T.sig, fontSize: 14.5, color: T.muted, marginTop: 6, lineHeight: 1.5 }}>
              Enter your email and we'll send a sign-in code — no password needed.
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

            {!isStandalone() && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0 16px' }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--wf-grey-6)' }} />
                  <div style={{ fontFamily: T.onest, fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.muted }}>
                    For the best experience
                  </div>
                  <div style={{ flex: 1, height: 1, background: 'var(--wf-grey-6)' }} />
                </div>
                <InstallCard />
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
