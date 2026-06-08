// WISEcon27 — realtime Q&A and live polls, scoped to one session.
// Both subscribe to Postgres changes so questions, upvotes and poll results
// update live across every delegate's device.
import { useCallback, useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

/* ════════ Q&A ════════ */
export interface QAItem {
  id: string
  body: string
  anonymous: boolean
  userId: string | null
  up: number
  voted: boolean
}

export function useQA(sessionId: string, userId: string) {
  const [items, setItems] = useState<QAItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data: qs } = await supabase
      .from('questions')
      .select('id, body, anonymous, user_id, created_at')
      .eq('session_id', sessionId)
      .order('created_at')
    const ids = (qs ?? []).map((q) => q.id as string)
    let votes: { question_id: string; user_id: string }[] = []
    if (ids.length) {
      const { data: vs } = await supabase.from('question_votes').select('question_id, user_id').in('question_id', ids)
      votes = (vs ?? []) as typeof votes
    }
    setItems(
      (qs ?? []).map((q) => {
        const mine = votes.filter((v) => v.question_id === q.id)
        return {
          id: q.id as string,
          body: q.body as string,
          anonymous: q.anonymous as boolean,
          userId: q.user_id as string | null,
          up: mine.length,
          voted: mine.some((v) => v.user_id === userId),
        }
      }),
    )
    setLoading(false)
  }, [sessionId, userId])

  useEffect(() => {
    load()
    const ch = supabase
      .channel('qa-' + sessionId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'questions', filter: `session_id=eq.${sessionId}` }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'question_votes' }, () => load())
      .subscribe()
    return () => {
      supabase.removeChannel(ch)
    }
  }, [sessionId, load])

  const submit = async (body: string, anonymous: boolean) => {
    const text = body.trim()
    if (!text) return
    await supabase.from('questions').insert({ session_id: sessionId, user_id: userId, body: text, anonymous })
    load()
  }

  const toggleVote = async (q: QAItem) => {
    // optimistic
    setItems((prev) => prev.map((x) => (x.id === q.id ? { ...x, voted: !x.voted, up: x.up + (x.voted ? -1 : 1) } : x)))
    if (q.voted) await supabase.from('question_votes').delete().eq('question_id', q.id).eq('user_id', userId)
    else await supabase.from('question_votes').upsert({ question_id: q.id, user_id: userId })
    load()
  }

  return { items: [...items].sort((a, b) => b.up - a.up), loading, submit, toggleVote }
}

/* ════════ Live poll ════════ */
export interface PollOption {
  id: string
  label: string
  votes: number
}
export interface PollState {
  pollId: string | null
  question: string
  options: PollOption[]
  total: number
  myOption: string | null
  loading: boolean
}

export function usePoll(sessionId: string, userId: string) {
  const [state, setState] = useState<PollState>({
    pollId: null, question: '', options: [], total: 0, myOption: null, loading: true,
  })

  const load = useCallback(async () => {
    const { data: poll } = await supabase
      .from('polls')
      .select('id, question')
      .eq('session_id', sessionId)
      .maybeSingle()
    if (!poll) {
      setState({ pollId: null, question: '', options: [], total: 0, myOption: null, loading: false })
      return
    }
    const [{ data: results }, { data: mine }] = await Promise.all([
      supabase.from('poll_results').select('option_id, label, sort, votes').eq('poll_id', poll.id).order('sort'),
      supabase.from('poll_votes').select('option_id').eq('poll_id', poll.id).eq('user_id', userId).maybeSingle(),
    ])
    const options = (results ?? []).map((r) => ({ id: r.option_id as string, label: r.label as string, votes: r.votes as number }))
    setState({
      pollId: poll.id as string,
      question: poll.question as string,
      options,
      total: options.reduce((a, b) => a + b.votes, 0),
      myOption: (mine?.option_id as string) ?? null,
      loading: false,
    })
  }, [sessionId, userId])

  useEffect(() => {
    load()
    const ch = supabase
      .channel('poll-' + sessionId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'poll_votes' }, () => load())
      .subscribe()
    return () => {
      supabase.removeChannel(ch)
    }
  }, [sessionId, load])

  const vote = async (pollId: string, optionId: string) => {
    setState((s) => ({ ...s, myOption: optionId })) // optimistic lock
    await supabase.from('poll_votes').upsert({ poll_id: pollId, option_id: optionId, user_id: userId })
    load()
  }

  return { ...state, vote }
}
