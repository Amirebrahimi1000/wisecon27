// WISEcon27 — community feed (pushed): a shared wall for every delegate.
// Post a thought or a photo, like others' posts; organisers (and authors) can
// remove posts. Photos are re-encoded on-device (EXIF/GPS stripped) and stored
// in a private bucket — visible to signed-in delegates only.
import { Fragment, useEffect, useRef, useState } from 'react'
import { STATUS_INSET, T, TABBAR_H } from '../theme'
import type { AppCtx } from '../appState'
import type { FeedPost } from '../types'
import { useFeed } from '../feed'
import { uploadWallPhoto, removeWallPhoto } from '../lib/storage'
import { Icon } from '../components/Icon'
import { AppHeader, Avatar, Btn, Empty, IconBtn, Press } from '../components/primitives'

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
  // "new posts" tracking: remember the newest post the delegate has already
  // seen (per-user, client-side) so we can flag what's new, mark a "last read"
  // divider, and offer a one-tap jump to the newest.
  const readKey = `wc27-feed-read-${ctx.userId}`
  // boundary = where the delegate was when they opened (drives the "New" badges
  // and the divider; fixed for the session). seenAt = what they've since caught
  // up to (drives the pill; advances when they reach the top or tap it, so a
  // later post re-shows the pill).
  const [boundary, setBoundary] = useState<string | null>(() => localStorage.getItem(readKey))
  const [seenAt, setSeenAt] = useState<string | null>(() => localStorage.getItem(readKey))
  const topRef = useRef<HTMLDivElement>(null)
  const dividerRef = useRef<HTMLDivElement>(null)
  const didResume = useRef(false)
  const postsRef = useRef(feed.posts)
  postsRef.current = feed.posts

  const isUnread = (p: FeedPost) => !!boundary && p.createdAt > boundary && p.userId !== ctx.userId
  const newSinceVisit = feed.posts.reduce((n, p) => n + (isUnread(p) ? 1 : 0), 0)
  const firstReadIdx = boundary ? feed.posts.findIndex((p) => p.createdAt <= boundary) : -1
  const pillCount = feed.posts.reduce((n, p) => n + (!!seenAt && p.createdAt > seenAt && p.userId !== ctx.userId ? 1 : 0), 0)
  const showPill = pillCount > 0

  // "caught up" — advance the seen marker to the newest post (hides the pill and
  // persists for next time). A post that arrives afterwards re-shows the pill.
  const catchUp = () => {
    const newest = postsRef.current[0]?.createdAt
    if (newest) { setSeenAt(newest); localStorage.setItem(readKey, newest) }
  }
  const jumpToNewest = () => {
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    catchUp()
  }

  // On open, resume at the last-read divider once (after the shell resets the
  // scroll to the top) so the delegate keeps their place; a first-ever visit
  // just records the newest post as seen, so nothing is wrongly flagged "new".
  useEffect(() => {
    if (feed.loading || didResume.current) return
    didResume.current = true
    if (boundary === null) {
      const newest = postsRef.current[0]?.createdAt ?? null
      if (newest) localStorage.setItem(readKey, newest)
      setBoundary(newest)
      setSeenAt(newest)
      return
    }
    if (newSinceVisit > 0 && dividerRef.current) {
      const el = dividerRef.current
      requestAnimationFrame(() => requestAnimationFrame(() => el.scrollIntoView({ block: 'center' })))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feed.loading])

  // Clear the pill once the delegate reaches the top — by tapping it OR scrolling
  // up themselves. We watch the nearest scrollable ancestor; armed shortly after
  // mount so the resume scroll (which starts from the top) doesn't trip it.
  useEffect(() => {
    let sc = topRef.current?.parentElement ?? null
    while (sc && sc !== document.body) {
      const oy = getComputedStyle(sc).overflowY
      if (oy === 'auto' || oy === 'scroll') break
      sc = sc.parentElement
    }
    if (!sc || sc === document.body) return
    const scroller = sc
    let armed = false
    const t = setTimeout(() => { armed = true }, 600)
    const onScroll = () => { if (armed && scroller.scrollTop <= 4) catchUp() }
    scroller.addEventListener('scroll', onScroll, { passive: true })
    return () => { clearTimeout(t); scroller.removeEventListener('scroll', onScroll) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // catch-all: advance the marker to the newest post when leaving the screen
  useEffect(() => () => { const n = postsRef.current[0]?.createdAt; if (n) localStorage.setItem(readKey, n) }, [readKey])

  const [text, setText] = useState('')
  const [posting, setPosting] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  // photo attachment: uploaded immediately (so we can preview via object URL),
  // cleaned up again if the delegate changes their mind before posting
  const fileRef = useRef<HTMLInputElement>(null)
  const [photo, setPhoto] = useState<{ path: string; preview: string } | null>(null)
  const [attaching, setAttaching] = useState(false)

  const pickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || attaching) return
    setAttaching(true)
    const r = await uploadWallPhoto(ctx.userId, file)
    setAttaching(false)
    if (r.error || !r.path) return ctx.toast(r.error ?? 'Upload failed')
    if (photo) removeWallPhoto(photo.path) // replacing a previous attachment
    setPhoto({ path: r.path, preview: URL.createObjectURL(file) })
  }

  const clearPhoto = () => {
    if (photo) removeWallPhoto(photo.path)
    setPhoto(null)
  }

  const post = async () => {
    if ((!text.trim() && !photo) || posting) return
    setPosting(true)
    const ok = await feed.submit(text, photo?.path)
    setPosting(false)
    if (ok) {
      setText('')
      setPhoto(null)
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
        <div ref={topRef} />
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
          {photo && (
            <div style={{ position: 'relative', marginTop: 10, display: 'inline-block' }}>
              <img src={photo.preview} alt="" style={{ maxHeight: 140, maxWidth: '100%', borderRadius: 'var(--radius-3)', display: 'block' }} />
              <Press onClick={clearPhoto} style={{ position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: '50%', background: 'rgba(17,17,17,0.7)', color: '#fff', display: 'grid', placeItems: 'center' }}>
                <Icon name="close" size={14} stroke={2.2} />
              </Press>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input ref={fileRef} type="file" accept="image/*" onChange={pickPhoto} style={{ display: 'none' }} />
              <IconBtn name="camera" size={34} color={attaching ? T.muted : T.green10} bg={T.sunken} onClick={() => !attaching && fileRef.current?.click()} />
              <span style={{ fontFamily: T.onest, fontSize: 11, color: T.muted }}>{attaching ? 'Preparing photo…' : `${text.length}/400`}</span>
            </div>
            <Btn kind="primary" size="sm" icon="send" onClick={post} disabled={(!text.trim() && !photo) || posting || attaching}>{posting ? 'Posting…' : 'Post'}</Btn>
          </div>
          <div style={{ fontFamily: T.onest, fontSize: 10.5, color: T.muted, marginTop: 8, lineHeight: 1.45 }}>
            Photos are visible to signed-in delegates only. Be mindful of who's in frame — you or the organisers can remove a post at any time.
          </div>
        </div>

        {/* jump-to-newest pill — appears for unread posts (live or since last visit) */}
        {showPill && (
          <div style={{ position: 'sticky', top: STATUS_INSET + 64, zIndex: 25, display: 'flex', justifyContent: 'center', marginBottom: 12, pointerEvents: 'none' }}>
            <Press onClick={jumpToNewest} style={{ pointerEvents: 'auto', display: 'inline-flex', alignItems: 'center', gap: 7, background: T.green9, color: '#fff', padding: '9px 16px', borderRadius: 999, boxShadow: 'var(--shadow-card)', fontFamily: T.sig, fontWeight: 600, fontSize: 13.5 }}>
              <Icon name="arrowUp" size={15} stroke={2.4} />
              {pillCount} new post{pillCount === 1 ? '' : 's'}
            </Press>
          </div>
        )}

        {/* posts */}
        {!feed.loading && feed.posts.length === 0 && (
          <Empty icon="message" text="Nothing here yet — be the first to post." />
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {feed.posts.map((p, i) => {
            const a = authorOf(p)
            const canRemove = p.userId === ctx.userId || ctx.isAdmin
            const unread = isUnread(p)
            return (
              <Fragment key={p.id}>
                {i === firstReadIdx && firstReadIdx > 0 && (
                  <div ref={dividerRef} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '2px 2px' }}>
                    <div style={{ flex: 1, height: 1, background: T.line2 }} />
                    <span style={{ fontFamily: T.onest, fontWeight: 600, fontSize: 11, color: T.muted, whiteSpace: 'nowrap' }}>Last read · caught up below</span>
                    <div style={{ flex: 1, height: 1, background: T.line2 }} />
                  </div>
                )}
                <div style={{ background: 'var(--wf-surface)', borderRadius: 'var(--radius-5)', boxShadow: 'var(--shadow-card)', padding: 14 }}>
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
                    {unread && <span style={{ fontFamily: T.onest, fontWeight: 700, fontSize: 10.5, color: T.green10, background: T.green1, borderRadius: 999, padding: '3px 9px', flexShrink: 0 }}>New</span>}
                    {canRemove && (
                      <Press onClick={() => (confirmId === p.id ? (setConfirmId(null), feed.remove(p)) : setConfirmId(p.id))} style={{ color: confirmId === p.id ? 'var(--wf-negative-9)' : T.line2, padding: 4, fontFamily: T.sig, fontWeight: 600, fontSize: 12.5 }}>
                        {confirmId === p.id ? 'Remove?' : <Icon name="close" size={16} />}
                      </Press>
                    )}
                  </div>
                  {p.body && <div style={{ fontFamily: T.sig, fontSize: 14.5, color: T.body, lineHeight: 1.5, marginTop: 10, whiteSpace: 'pre-wrap' }}>{p.body}</div>}
                  {p.photoPath && feed.photoUrls[p.photoPath] && (
                    <img src={feed.photoUrls[p.photoPath]} alt="" style={{ width: '100%', maxHeight: 340, objectFit: 'cover', borderRadius: 'var(--radius-3)', marginTop: 10, display: 'block' }} />
                  )}
                  <Press onClick={() => feed.toggleLike(p)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, padding: '5px 11px', borderRadius: 999, background: p.liked ? 'var(--wf-tomato-2)' : T.sunken, color: p.liked ? 'var(--wf-tomato-9)' : T.muted }}>
                    <Icon name="heart" size={15} stroke={2} />
                    <span style={{ fontFamily: T.onest, fontWeight: 700, fontSize: 12.5 }}>{p.likes || ''}</span>
                    <span style={{ fontFamily: T.sig, fontWeight: 600, fontSize: 12.5 }}>{p.liked ? 'Liked' : 'Like'}</span>
                  </Press>
                </div>
              </Fragment>
            )
          })}
        </div>
      </div>
    </div>
  )
}
