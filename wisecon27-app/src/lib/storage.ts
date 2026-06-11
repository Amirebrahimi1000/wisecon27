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

/* ── community photo wall (private bucket; delegates-only via signed URLs) ── */

/** Re-encode an image via canvas: strips ALL metadata (EXIF/GPS), fixes
 *  orientation, caps dimensions, and compresses to JPEG. */
async function recompressImage(file: File, maxDim = 1600, quality = 0.82): Promise<Blob | null> {
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const scale = Math.min(1, maxDim / Math.max(bmp.width, bmp.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bmp.width * scale))
    canvas.height = Math.max(1, Math.round(bmp.height * scale))
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height)
    return await new Promise((res) => canvas.toBlob(res, 'image/jpeg', quality))
  } catch {
    return null
  }
}

/** Upload a wall photo into the user's own folder of the PRIVATE bucket. */
export async function uploadWallPhoto(userId: string, file: File): Promise<{ path: string | null; error: string | null }> {
  const blob = await recompressImage(file)
  if (!blob) return { path: null, error: 'That image could not be read — try another photo' }
  const path = `${userId}/${Date.now()}.jpg`
  const { error } = await supabase.storage.from('wall-photos').upload(path, blob, { contentType: 'image/jpeg' })
  if (error) return { path: null, error: error.message }
  return { path, error: null }
}

/** Short-lived signed URLs so only signed-in delegates can view wall photos. */
export async function wallPhotoUrls(paths: string[]): Promise<Record<string, string>> {
  if (!paths.length) return {}
  const { data } = await supabase.storage.from('wall-photos').createSignedUrls(paths, 60 * 60)
  const out: Record<string, string> = {}
  for (const r of data ?? []) if (r.signedUrl && r.path) out[r.path] = r.signedUrl
  return out
}

export async function removeWallPhoto(path: string) {
  await supabase.storage.from('wall-photos').remove([path])
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
