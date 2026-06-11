// WISEcon27 — community feed (pushed): a shared wall for every delegate.
// Post a thought or a photo, like others' posts; organisers (and authors) can
// remove posts. Photos are re-encoded on-device (EXIF/GPS stripped) and stored
// in a private bucket — visible to signed-in delegates only.
import { useRef, useState } from 'react'
import { T, TABBAR_H } from '../theme'
import type { AppCtx } from '../appState'
import type { FeedPost } from '../types'
import { useFeed } from '../feed'
import { uploadWallPhoto, removeWallPhoto } from '../lib/storage'
import { Icon } from '../components/Icon'
import { AppHeader, Avatar, Btn, Empty, IconBtn, Press } from '../components/primitives'
import { FirstTimeHint } from '../components/Hint'

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
      <FirstTimeHint id="community" text="Share takeaways, questions and photos with fellow delegates. Everything stays inside the app, and you can remove your posts at any time." />
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
            )
          })}
        </div>
      </div>
    </div>
  )
}
