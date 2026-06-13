// WISEcon27 — private per-session notes. Notes are personal and stay on the
// device (localStorage), so nothing is uploaded and no one else can read them.
const noteKey = (userId: string, sessionId: string) => `wc27.note.${userId}.${sessionId}`
const prefix = (userId: string) => `wc27.note.${userId}.`

export interface StoredNote {
  sessionId: string
  text: string
  updatedAt: number
}

export function getNote(userId: string, sessionId: string): string {
  try {
    const raw = localStorage.getItem(noteKey(userId, sessionId))
    if (!raw) return ''
    return (JSON.parse(raw) as StoredNote).text ?? ''
  } catch {
    return ''
  }
}

export function setNote(userId: string, sessionId: string, text: string) {
  try {
    if (text.trim()) {
      localStorage.setItem(noteKey(userId, sessionId), JSON.stringify({ sessionId, text, updatedAt: Date.now() }))
    } else {
      localStorage.removeItem(noteKey(userId, sessionId))
    }
  } catch {
    /* ignore */
  }
}

/** Every note this user has written, most-recently-edited first. */
export function allNotes(userId: string): StoredNote[] {
  const out: StoredNote[] = []
  try {
    const p = prefix(userId)
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (!k || !k.startsWith(p)) continue
      const note = JSON.parse(localStorage.getItem(k) || '{}') as StoredNote
      if (note.text?.trim()) out.push(note)
    }
  } catch {
    /* ignore */
  }
  return out.sort((a, b) => b.updatedAt - a.updatedAt)
}
