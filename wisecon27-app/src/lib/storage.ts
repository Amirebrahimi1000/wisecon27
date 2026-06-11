// WISEcon27 — Supabase Storage helpers for avatars and speaker slides.
import { supabase } from './supabase'

/** Upload a profile picture to the user's own folder; returns a cache-busted public URL. */
export async function uploadAvatar(userId: string, file: File): Promise<{ url: string | null; error: string | null }> {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `${userId}/avatar.${ext}`
  const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type })
  if (error) return { url: null, error: error.message }
  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return { url: `${data.publicUrl}?t=${Date.now()}`, error: null }
}

/** Upload a slide deck for a session (admin only, enforced by RLS). */
export async function uploadSlides(sessionId: string, file: File): Promise<{ path: string | null; name: string | null; error: string | null }> {
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${sessionId}/${safe}`
  const { error } = await supabase.storage.from('session-files').upload(path, file, { upsert: true, contentType: file.type })
  if (error) return { path: null, name: null, error: error.message }
  return { path, name: file.name, error: null }
}

export function slidesPublicUrl(path: string): string {
  return supabase.storage.from('session-files').getPublicUrl(path).data.publicUrl
}

/** Upload a session resource (speakers of that session or admins, enforced by RLS). */
export async function uploadResource(sessionId: string, file: File): Promise<{ path: string | null; name: string | null; error: string | null }> {
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `resources/${sessionId}/${Date.now()}-${safe}`
  const { error } = await supabase.storage.from('session-files').upload(path, file, { upsert: true, contentType: file.type })
  if (error) return { path: null, name: null, error: error.message }
  return { path, name: file.name, error: null }
}

/** Upload a speaker photo (admin only) to the public session-files bucket. */
export async function uploadSpeakerPhoto(speakerId: string, file: File): Promise<{ url: string | null; error: string | null }> {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `speakers/${speakerId}.${ext}`
  const { error } = await supabase.storage.from('session-files').upload(path, file, { upsert: true, contentType: file.type })
  if (error) return { url: null, error: error.message }
  const { data } = supabase.storage.from('session-files').getPublicUrl(path)
  return { url: `${data.publicUrl}?t=${Date.now()}`, error: null }
}
