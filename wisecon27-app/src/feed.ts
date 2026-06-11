// WISEcon27 — community feed: posts + likes, live across every device.
// Same pattern as sessionLive.ts: load on mount, reload on Postgres changes.
import { useCallback, useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import type { FeedPost } from './types'

interface PostRow { id: string; user_id: string | null; body: string; created_at: string }

export function useFeed(userId: string) {
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data: ps } = await supabase
      .from('posts')
      .select('id, user_id, body, created_at')
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
          id: p.id, userId: p.user_id, body: p.body, createdAt: p.created_at,
          likes: mine.length, liked: mine.some((l) => l.user_id === userId),
        }
      }),
    )
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

  const submit = async (body: string) => {
    const text = body.trim()
    if (!text) return false
    const { error } = await supabase.from('posts').insert({ user_id: userId, body: text })
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
    await supabase.from('posts').delete().eq('id', p.id)
    load()
  }

  return { posts, loading, submit, toggleLike, remove }
}
