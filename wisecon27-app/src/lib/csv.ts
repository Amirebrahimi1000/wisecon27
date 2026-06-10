// WISEcon27 — tiny CSV builder + browser download.
type Cell = string | number | boolean | null | undefined

const escape = (v: Cell): string => {
  const s = v == null ? '' : String(v)
  return /[",\n\r;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
}

/** Build a CSV and trigger a download (UTF-8 BOM so Excel opens it cleanly). */
export function downloadCsv(filename: string, rows: Cell[][]) {
  const csv = '﻿' + rows.map((r) => r.map(escape).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}
