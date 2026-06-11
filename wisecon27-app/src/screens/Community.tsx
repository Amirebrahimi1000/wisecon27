// WISEcon27 — community feed (pushed): a shared wall for every delegate.
// Post a thought, like others' posts; organisers (and authors) can remove posts.
import { useState } from 'react'
import { T, TABBAR_H } from '../theme'
import type { AppCtx } from '../appState'
import type { FeedPost } from '../types'
import { useFeed } from '../feed'
import { Icon } from '../components/Icon'
import { AppHeader, Avatar, Btn, Empty, Press } from '../components/primitives'

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'now'
  if (m < 60) return m + 'm'
  const h = Math.floor(m / 60)
  if (h < 24) return h + 'h'
  return Math.floor(h / 24) + 'd'
}

export function Community({ ctx }: { ctx: AppCtx }) {
  const feed = useFeed(ctx.userId)
  const [text, setText] = useState('')
  const [posting, setPosting] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const post = async () => {
    if (!text.trim() || posting) return
    setPosting(true)
    const ok = await feed.submit(text)
    setPosting(false)
    if (ok) {
      setText('')
      ctx.toast('Posted to the community feed')
    } else {
      ctx.toast('Could not post — try again')
    }
  }

  const authorOf = (p: FeedPost) => {
    if (p.userId === ctx.userId) return { name: 'You', initials: ctx.me.initials, color: ctx.me.color, avatarUrl: ctx.me.avatarUrl, sub: [ctx.me.role, ctx.me.org].filter(Boolean).join(' · ') }
    const a = ctx.attendees.find((x) => x.id === p.userId)
    return { name: a?.name ?? 'A delegate', initials: a?.initials ?? '?', color: a?.color ?? 'var(--wf-blue-9)', avatarUrl: a?.avatarUrl, sub: [a?.role, a?.org].filter(Boolean).join(' · ') }
  }

  return (
    <div>
      <AppHeader title="Community" sub="The delegate wall" onBack={ctx.back} />
      <div style={{ padding: '14px 16px ' + (TABBAR_H + 16) + 'px' }}>
        {/* composer */}
        <div style={{ background: 'var(--wf-surface)', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', padding: 14, marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <Avatar initials={ctx.me.initials} color={ctx.me.color} size={38} src={ctx.me.avatarUrl} />
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 400))}
              placeholder="Share a takeaway, a question, or a photo-worthy moment…"
              rows={2}
              style={{ flex: 1, resize: 'none', border: 'none', outline: 'none', background: 'transparent', fontFamily: T.sig, fontSize: 14.5, color: T.ink, lineHeight: 1.5, paddingTop: 8 }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <span style={{ fontFamily: T.onest, fontSize: 11, color: T.muted }}>{text.length}/400</span>
            <Btn kind="primary" size="sm" icon="send" onClick={post} disabled={!text.trim() || posting}>{posting ? 'Posting…' : 'Post'}</Btn>
          </div>
        </div>

        {/* posts */}
        {!feed.loading && feed.posts.length === 0 && (
          <Empty icon="message" text="Nothing here yet — be the first to post." />
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {feed.posts.map((p) => {
            const a = authorOf(p)
            const canRemove = p.userId === ctx.userId || ctx.isAdmin
            return (
              <div key={p.id} style={{ background: 'var(--wf-surface)', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Press onClick={() => p.userId && p.userId !== ctx.userId && ctx.push('delegate', { peerId: p.userId })}>
                    <Avatar initials={a.initials} color={a.color} size={38} src={a.avatarUrl} />
                  </Press>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: T.sig, fontWeight: 700, fontSize: 14.5, color: T.ink }}>{a.name}</div>
                    <div style={{ fontFamily: T.onest, fontSize: 11.5, color: T.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {[a.sub, relTime(p.createdAt)].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  {canRemove && (
                    <Press onClick={() => (confirmId === p.id ? (setConfirmId(null), feed.remove(p)) : setConfirmId(p.id))} style={{ color: confirmId === p.id ? 'var(--wf-negative-9)' : T.line2, padding: 4, fontFamily: T.sig, fontWeight: 600, fontSize: 12.5 }}>
                      {confirmId === p.id ? 'Remove?' : <Icon name="close" size={16} />}
                    </Press>
                  )}
                </div>
                <div style={{ fontFamily: T.sig, fontSize: 14.5, color: T.body, lineHeight: 1.5, marginTop: 10, whiteSpace: 'pre-wrap' }}>{p.body}</div>
                <Press onClick={() => feed.toggleLike(p)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, padding: '5px 11px', borderRadius: 999, background: p.liked ? 'var(--wf-tomato-2)' : T.sunken, color: p.liked ? 'var(--wf-tomato-9)' : T.muted }}>
                  <Icon name="heart" size={15} stroke={2} />
                  <span style={{ fontFamily: T.onest, fontWeight: 700, fontSize: 12.5 }}>{p.likes || ''}</span>
                  <span style={{ fontFamily: T.sig, fontWeight: 600, fontSize: 12.5 }}>{p.liked ? 'Liked' : 'Like'}</span>
                </Press>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
