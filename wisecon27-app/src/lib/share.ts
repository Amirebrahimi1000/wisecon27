// WISEcon27 — share via the native share sheet, falling back to the clipboard.
export async function shareOrCopy(title: string, text: string): Promise<'shared' | 'copied' | 'failed'> {
  if (navigator.share) {
    try {
      await navigator.share({ title, text })
      return 'shared'
    } catch (e) {
      // user dismissed the sheet — not a failure worth reporting
      if ((e as DOMException)?.name === 'AbortError') return 'shared'
    }
  }
  try {
    await navigator.clipboard.writeText(text)
    return 'copied'
  } catch {
    return 'failed'
  }
}
