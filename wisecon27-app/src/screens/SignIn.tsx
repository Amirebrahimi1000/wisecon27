// WISEcon27 — magic-link sign-in screen (brand hero + email → link).
import { useState } from 'react'
import { useAuth } from '../auth'
import { T, STATUS_INSET } from '../theme'
import { Icon } from '../components/Icon'
import { Btn, Press } from '../components/primitives'

export function SignIn() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState('')

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

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--wf-grey-2)' }}>
      {/* brand hero */}
      <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(160deg, var(--wf-green-8) 0%, var(--wf-green-10) 55%, var(--wf-green-12) 130%)', padding: STATUS_INSET + 'px 24px 48px' }}>
        <img src={import.meta.env.BASE_URL + 'logo-mark.svg'} alt="" style={{ position: 'absolute', right: -40, top: 0, width: 230, opacity: 0.12, filter: 'brightness(0) invert(1)', transform: 'rotate(-8deg)' }} />
        <div style={{ position: 'relative', paddingTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src={import.meta.env.BASE_URL + 'logo-icon.svg'} width="34" height="34" style={{ borderRadius: 8 }} alt="" />
            <span style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 20, color: '#fff', letterSpacing: '-0.01em' }}>
              WISEcon<span style={{ color: 'var(--wf-lime-9)' }}>27</span>
            </span>
          </div>
          <h1 style={{ fontFamily: T.onest, fontWeight: 700, fontSize: 34, color: '#fff', lineHeight: 1.05, letterSpacing: '-0.02em', marginTop: 28 }}>
            Welcome to<br />the conference.
          </h1>
          <div style={{ fontFamily: T.sig, fontSize: 15, color: 'rgba(255,255,255,0.85)', marginTop: 10, lineHeight: 1.5 }}>
            14–16 September · Aarhus
          </div>
        </div>
      </div>

      {/* sheet */}
      <div style={{ flex: 1, marginTop: -28, background: 'var(--wf-grey-2)', borderRadius: '24px 24px 0 0', padding: '28px 22px' }}>
        {status === 'sent' ? (
          <div style={{ textAlign: 'center', paddingTop: 12 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: T.green1, color: T.green9, display: 'grid', placeItems: 'center', margin: '0 auto 18px' }}>
              <Icon name="message" size={32} />
            </div>
            <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 21, color: T.ink }}>Check your email</div>
            <p style={{ fontFamily: T.sig, fontSize: 15, color: T.body, marginTop: 8, lineHeight: 1.55 }}>
              We sent a sign-in link to <b style={{ color: T.ink }}>{email.trim()}</b>. Open it on this device to continue.
            </p>
            <Press onClick={() => { setStatus('idle'); setEmail('') }} style={{ display: 'inline-block', marginTop: 22, fontFamily: T.sig, fontWeight: 600, fontSize: 14, color: T.green10 }}>
              Use a different email
            </Press>
          </div>
        ) : (
          <>
            <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 19, color: T.ink }}>Sign in</div>
            <p style={{ fontFamily: T.sig, fontSize: 14.5, color: T.muted, marginTop: 6, lineHeight: 1.5 }}>
              Enter your email and we'll send you a one-tap sign-in link — no password needed.
            </p>
            <div style={{ marginTop: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', borderRadius: 'var(--radius-4)', padding: '0 14px', boxShadow: 'inset 0 0 0 1px var(--wf-grey-6)' }}>
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
                {status === 'sending' ? 'Sending…' : 'Send magic link'}
              </Btn>
            </div>
            <div style={{ fontFamily: T.onest, fontSize: 11.5, color: T.muted, marginTop: 18, lineHeight: 1.5, textAlign: 'center' }}>
              By continuing you agree to the event terms. Your badge is created automatically on first sign-in.
            </div>
          </>
        )}
      </div>
    </div>
  )
}
