// ── Core domain model ────────────────────────────────────────────────
// Everything is plain, serializable data so it persists cleanly to
// localStorage and (in the future) syncs to a backend without changes.

export interface Measurement {
  id: string
  /** Optional human label, e.g. "Living room wall". */
  description: string
  /** Raw expression exactly as typed, e.g. "8 x 2" or "8x2 + 3x4". */
  expression: string
  /** Cached computed value of `expression`. Source of truth is the expression. */
  value: number
}

export interface Section {
  id: string
  name: string
  measurements: Measurement[]
}

export interface Project {
  id: string
  name: string
  client: string
  location: string
  /** ISO date string (yyyy-mm-dd). */
  date: string
  notes: string
  sections: Section[]
  createdAt: number
  updatedAt: number
  // ── Future-ready fields (unused today, reserved so the schema is stable) ──
  /** Price per m² for future cost estimation. */
  pricePerUnit?: number
  currency?: string
  archived?: boolean
}

export type ThemeMode = 'light' | 'dark' | 'system'

export interface Settings {
  /** Name shown on PDF reports + app header. */
  companyName: string
  /** Optional secondary line on the PDF, e.g. phone / email. */
  companyContact: string
  /** Unit label appended to totals, e.g. "m²". */
  unit: string
  /** 'comma' renders 16,5 — 'dot' renders 16.5. */
  decimalSeparator: 'comma' | 'dot'
  /** Number of decimals shown in totals. */
  decimals: number
  theme: ThemeMode
}

/** Shape of an exported backup file. */
export interface BackupFile {
  app: 'construction-measurement-calculator'
  version: 1
  exportedAt: number
  projects: Project[]
  settings: Settings
}
