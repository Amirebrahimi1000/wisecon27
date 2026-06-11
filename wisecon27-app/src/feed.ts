// WISEcon27 — community feed: posts (with optional photos) + likes, live
// across every device. Photos live in a PRIVATE bucket and are rendered via
// short-lived signed URLs, so only signed-in delegates ever see them.
import { useCallback, useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { removeWallPhoto, wallPhotoUrls } from './lib/storage'
import type { FeedPost } from './types'

interface PostRow { id: string; user_id: string | null; body: string; created_at: string; photo_path?: string | null }

export function useFeed(userId: string) {
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data: ps } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
    const ids = (ps ?? []).map((p) => p.id as string)
    let likes: { post_id: string; user_id: string }[] = []
    if (ids.length) {
      const { data: ls } = await supabase.from('post_likes').select('post_id, user_id').in('post_id', ids)
      likes = (ls ?? []) as typeof likes
    }
    setPosts(
      ((ps ?? []) as PostRow[]).map((p) => {
        const mine = likes.filter((l) => l.post_id === p.id)
        return {
          id: p.id, userId: p.user_id, body: p.body, createdAt: p.created_at, photoPath: p.photo_path ?? null,
          likes: mine.length, liked: mine.some((l) => l.user_id === userId),
        }
      }),
    )
    // resolve signed URLs for any photos in view
    const paths = ((ps ?? []) as PostRow[]).map((p) => p.photo_path).filter(Boolean) as string[]
    setPhotoUrls(await wallPhotoUrls(paths))
    setLoading(false)
  }, [userId])

  useEffect(() => {
    load()
    const ch = supabase
      .channel('wc27-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_likes' }, () => load())
      .subscribe()
    return () => {
      supabase.removeChannel(ch)
    }
  }, [load])

  const submit = async (body: string, photoPath?: string | null) => {
    const text = body.trim()
    if (!text && !photoPath) return false
    // only mention photo_path when there is one — keeps text posts working
    // even before the photo-wall migration has been applied
    const row: Record<string, unknown> = { user_id: userId, body: text }
    if (photoPath) row.photo_path = photoPath
    const { error } = await supabase.from('posts').insert(row)
    if (!error) load()
    return !error
  }

  const toggleLike = async (p: FeedPost) => {
    // optimistic
    setPosts((prev) => prev.map((x) => (x.id === p.id ? { ...x, liked: !x.liked, likes: x.likes + (x.liked ? -1 : 1) } : x)))
    if (p.liked) await supabase.from('post_likes').delete().eq('post_id', p.id).eq('user_id', userId)
    else await supabase.from('post_likes').upsert({ post_id: p.id, user_id: userId })
    load()
  }

  const remove = async (p: FeedPost) => {
    setPosts((prev) => prev.filter((x) => x.id !== p.id))
    // take the photo down with the post — no orphaned files in storage
    if (p.photoPath) await removeWallPhoto(p.photoPath)
    await supabase.from('posts').delete().eq('id', p.id)
    load()
  }

  return { posts, photoUrls, loading, submit, toggleLike, remove }
}
