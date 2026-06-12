// WISEcon27 — tag picker: selected values as removable chips inside the input,
// free text for anything new, and tappable suggestions drawn from the live
// programme. Delegates discover topics they hadn't thought of, admins keep one
// shared tag vocabulary — and chip-picked values match sessions exactly.
import { useEffect, useRef, useState } from 'react'
import { T } from '../theme'
import { Icon } from './Icon'
import { Press } from './primitives'

export interface TagSuggestion {
  label: string
  count: number
}

// Distinct tags with usage counts, most-used first. Case-insensitive dedupe;
// the first-seen casing becomes the canonical label.
export function tagSuggestions(lists: string[][]): TagSuggestion[] {
  const seen = new Map<string, TagSuggestion>()
  for (const tags of lists)
    for (const t of tags) {
      const key = t.trim().toLowerCase()
      if (!key) continue
      const cur = seen.get(key)
      if (cur) cur.count += 1
      else seen.set(key, { label: t.trim(), count: 1 })
    }
  return [...seen.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}

export function TagPicker({
  value,
  onChange,
  suggestions,
  max,
  placeholder = 'Add a tag…',
  countNoun,
  disabled = false,
  autoFocus = false,
}: {
  value: string[]
  onChange: (v: string[]) => void
  suggestions: TagSuggestion[]
  max?: number
  placeholder?: string
  countNoun?: string // e.g. 'session' → suggestion chips read "AI · 6 sessions"
  disabled?: boolean
  autoFocus?: boolean
}) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!autoFocus || disabled) return
    boxRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    inputRef.current?.focus()
  }, [autoFocus, disabled])

  const selected = new Set(value.map((v) => v.toLowerCase()))
  const full = max != null && value.length >= max

  const add = (label: string) => {
    const v = label.trim()
    if (!v || full || selected.has(v.toLowerCase())) return
    // a free-typed value that matches a known tag adopts its canonical casing
    const canon = suggestions.find((s) => s.label.toLowerCase() === v.toLowerCase())
    onChange([...value, canon ? canon.label : v])
    setQuery('')
  }
  const remove = (label: string) => onChange(value.filter((v) => v !== label))

  const onInput = (raw: string) => {
    // comma commits whatever precedes it, so paste/typing habits keep working
    if (raw.includes(',')) {
      const parts = raw.split(',')
      parts.slice(0, -1).forEach(add)
      setQuery(parts[parts.length - 1])
    } else setQuery(raw)
  }
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      add(query)
    } else if (e.key === 'Backspace' && !query && value.length) {
      remove(value[value.length - 1])
    }
  }

  const q = query.trim().toLowerCase()
  const visible = suggestions.filter(
    (s) => !selected.has(s.label.toLowerCase()) && (!q || s.label.toLowerCase().includes(q)),
  )

  return (
    <div ref={boxRef}>
      <div
        onClick={() => inputRef.current?.focus()}
        style={{
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, background: 'var(--wf-surface)',
          borderRadius: 'var(--radius-4)', padding: '8px 10px', boxShadow: 'inset 0 0 0 1px var(--wf-grey-6)',
          cursor: 'text', opacity: disabled ? 0.6 : 1,
        }}
      >
        {value.map((v) => (
          <span key={v} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 30, padding: '0 6px 0 11px', borderRadius: 999, background: 'var(--wf-grey-12)', color: 'var(--wf-grey-1)', fontFamily: T.sig, fontWeight: 600, fontSize: 13 }}>
            {v}
            <Press onClick={() => remove(v)} style={{ display: 'grid', placeItems: 'center', width: 20, height: 20, borderRadius: '50%', color: 'var(--wf-grey-5)' }} ariaLabel={'Remove ' + v}>
              <Icon name="close" size={13} stroke={2.4} />
            </Press>
          </span>
        ))}
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => onInput(e.target.value)}
          onKeyDown={onKey}
          onBlur={() => add(query)}
          placeholder={full ? (max + ' of ' + max + ' added') : value.length ? 'Add another…' : placeholder}
          disabled={disabled || full}
          enterKeyHint="done"
          style={{ flex: 1, minWidth: 90, border: 'none', outline: 'none', background: 'transparent', padding: '6px 3px', fontFamily: T.sig, fontSize: 15, color: T.ink }}
        />
      </div>
      {!full && visible.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 10 }}>
          {visible.map((s) => (
            <Press key={s.label.toLowerCase()} onClick={() => add(s.label)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 31, padding: '0 12px', borderRadius: 999, background: 'var(--wf-surface)', boxShadow: 'inset 0 0 0 1px var(--wf-grey-6)', fontFamily: T.sig, fontWeight: 600, fontSize: 13, color: T.body }}>
              <Icon name="plus" size={12} stroke={2.4} style={{ color: T.green10 }} />
              {s.label}
              {countNoun && <span style={{ fontFamily: T.onest, fontSize: 11, color: T.muted, fontWeight: 400 }}>{s.count} {countNoun}{s.count === 1 ? '' : 's'}</span>}
            </Press>
          ))}
        </div>
      )}
    </div>
  )
}
