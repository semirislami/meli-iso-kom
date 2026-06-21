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
  /** Saved cost & profit calculations for this project. */
  calculations?: CostCalculation[]
  createdAt: number
  updatedAt: number
  // ── Future-ready fields (unused today, reserved so the schema is stable) ──
  /** Price per m² for future cost estimation. */
  pricePerUnit?: number
  currency?: string
  archived?: boolean
}

// ── Cost & Profit calculator ─────────────────────────────────────────

/** A single line of additional (non-material) expense, in MKD. */
export interface ExpenseItem {
  id: string
  name: string
  amount: number
  notes: string
}

/**
 * One material line in a calculation. Two modes:
 *  - 'auto'   → quantity derived from area (e.g. Mallter: kg → bags), rounded up.
 *  - 'manual' → user types the quantity (e.g. Llajsne, MP75).
 * All prices are in MKD.
 */
export interface MaterialLine {
  id: string
  /** Stable key for the preset, e.g. 'mallter' | 'llajsne' | 'mp75'. */
  key: string
  name: string
  mode: 'auto' | 'manual'
  /** Label for one purchasable unit: 'thes' | 'copë' | 'njësi' | 'm³'. */
  unitLabel: string

  // ── auto mode ──
  /**
   * Which auto formula to apply (defaults to 'kg-bags'):
   *  - 'kg-bags'     → kg = area × consumptionPerM2; bags = ⌈kg ÷ unitSize⌉ (Mallter)
   *  - 'volume'      → m³ = area × consumptionPerM2; priced per m³ (Zalli)
   *  - 'volume-bags' → m³ = area × consumptionPerM2; bags = ⌈m³ × bagsPerM3⌉ (Betoni)
   */
  autoKind?: 'kg-bags' | 'volume' | 'volume-bags'
  /** Amount per m²: kg/m² for 'kg-bags', m³/m² for the volume kinds. */
  consumptionPerM2?: number
  /** kg contained in one bag (kg-bags). */
  unitSize?: number
  /** Bags produced per m³ (volume-bags). */
  bagsPerM3?: number

  // ── manual mode ──
  /** User-entered quantity of units (manual). */
  quantity?: number

  /** Price of one unit in MKD (both modes). */
  pricePerUnit: number
}

/** Work type preset. 'mallter' and 'kushulica' exist today; others reserved. */
export type WorkType = 'mallter' | 'kushulica' | 'fasada' | 'boje' | 'izolim' | 'other'

export interface CostCalculation {
  id: string
  workType: WorkType
  /** m² used for this calc — defaults to the project's measured total. */
  areaM2: number
  /** Client price per m², in EUR. */
  pricePerM2Eur: number
  /** 1 EUR = N MKD. Default 61.5, editable. */
  exchangeRate: number
  materials: MaterialLine[]
  expenses: ExpenseItem[]
  createdAt: number
  updatedAt: number
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
