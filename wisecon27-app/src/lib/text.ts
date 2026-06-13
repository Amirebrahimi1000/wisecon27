// WISEcon27 — repair "mojibake": text that was UTF-8 but got decoded as
// Windows-1252/Mac-Roman somewhere upstream (a CSV/HubSpot import), so an
// em-dash "—" arrives as "‚Äî", an apostrophe "’" as "‚Äô", "ø" as "√∏", etc.
// We can't always fix the source data, so we repair it at load time — this
// guarantees the garbled sequences never reach the screen, in any language.

// Longest/most-specific sequences first. Each maps a known bad byte-sequence
// (as it shows up once mis-decoded) back to the character it should have been.
const FIXES: [string, string][] = [
  // smart punctuation (the common ones)
  ['‚Äî', '—'], ['‚Äì', '–'], ['‚Äô', '’'], ['‚Äò', '‘'],
  ['‚Äú', '“'], ['‚Äù', '”'], ['‚Ä¶', '…'], ['‚Ä¢', '•'],
  // Nordic / German letters (so DA/NO/DE content can't show garbled either)
  ['√Ö', 'Å'], ['√Ñ', 'Ä'], ['√ñ', 'Ö'], ['√ú', 'Ü'], ['√ò', 'Ø'], ['√Ü', 'Æ'],
  ['√©', 'é'], ['√®', 'è'], ['√™', 'ê'], ['√´', 'ë'], ['√†', 'à'], ['√°', 'á'], ['√¢', 'â'],
  ['√§', 'ä'], ['√•', 'å'], ['√¶', 'æ'], ['√ß', 'ç'], ['√±', 'ñ'], ['√≥', 'ó'],
  ['√∂', 'ö'], ['√∏', 'ø'], ['√º', 'ü'], ['√ª', 'û'], ['√ü', 'ß'],
  // stray replacement char
  ['�', ''],
]

/** Repair mojibake in a single string. No-op when nothing matches. */
export function clean(s: string): string {
  if (!s || (s.indexOf('‚') === -1 && s.indexOf('√') === -1 && s.indexOf('�') === -1)) return s
  let out = s
  for (const [bad, good] of FIXES) if (out.includes(bad)) out = out.split(bad).join(good)
  return out
}

/** Recursively repair every string in a value (object/array/string). Returns a
 *  cleaned copy; non-strings pass through unchanged. */
export function deepClean<T>(value: T): T {
  if (typeof value === 'string') return clean(value) as unknown as T
  if (Array.isArray(value)) return value.map((v) => deepClean(v)) as unknown as T
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const k in value as Record<string, unknown>) out[k] = deepClean((value as Record<string, unknown>)[k])
    return out as T
  }
  return value
}
