import type { Settings } from '../types'

/** Format a number using the user's decimal/precision settings. */
export function formatNumber(value: number, settings: Settings): string {
  const fixed = trimTrailing(value, settings.decimals)
  return settings.decimalSeparator === 'comma'
    ? fixed.replace('.', ',')
    : fixed
}

/** Like formatNumber but with the unit appended, e.g. "16,5 m²". */
export function formatValue(value: number, settings: Settings): string {
  const n = formatNumber(value, settings)
  return settings.unit ? `${n} ${settings.unit}` : n
}

/**
 * Show up to `maxDecimals` places but drop pointless trailing zeros so
 * 16 stays "16" while 16.5 stays "16.5".
 */
function trimTrailing(value: number, maxDecimals: number): string {
  if (!Number.isFinite(value)) return '0'
  const fixed = value.toFixed(Math.max(0, Math.min(6, maxDecimals)))
  return fixed.includes('.') ? fixed.replace(/\.?0+$/, '') : fixed
}

export function formatDate(iso: string | number): string {
  if (!iso) return '—'
  const d = typeof iso === 'number' ? new Date(iso) : new Date(iso + 'T00:00:00')
  if (Number.isNaN(d.getTime())) return String(iso)
  return d.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function relativeTime(ts: number): string {
  const diff = Date.now() - ts
  const min = Math.round(diff / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min} min ago`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr} h ago`
  const day = Math.round(hr / 24)
  if (day < 30) return `${day} d ago`
  return formatDate(ts)
}

export function todayISO(): string {
  const d = new Date()
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10)
}
