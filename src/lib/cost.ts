// ── Cost & Profit engine ─────────────────────────────────────────────
// Pure functions: given a calculation's inputs, derive every number on
// the profit dashboard. All money is MKD unless suffixed Eur.

import type { CostCalculation, MaterialLine, WorkType } from '../types'
import { uid } from './id'

export const DEFAULT_EXCHANGE_RATE = 61.5 // 1 EUR = 61.5 MKD

export const WORK_TYPES: { key: WorkType; label: string; available: boolean }[] = [
  { key: 'mallter', label: 'Mallter', available: true },
  { key: 'fasada', label: 'Fasadë', available: false },
  { key: 'boje', label: 'Bojë', available: false },
  { key: 'izolim', label: 'Izolim', available: false },
  { key: 'other', label: 'Tjetër', available: false },
]

/** Material preset for a work type. Mallter is the only one defined so far. */
export function materialsForWorkType(workType: WorkType): MaterialLine[] {
  switch (workType) {
    case 'mallter':
      return [
        {
          id: uid(),
          key: 'mallter',
          name: 'Mallter',
          mode: 'auto',
          unitLabel: 'thes',
          consumptionPerM2: 20, // kg për m²
          unitSize: 30, // kg për thes
          pricePerUnit: 180.5, // MKD për thes
        },
        {
          id: uid(),
          key: 'llajsne',
          name: 'Llajsne',
          mode: 'manual',
          unitLabel: 'copë',
          quantity: 0,
          pricePerUnit: 70, // MKD për copë
        },
        {
          id: uid(),
          key: 'mp75',
          name: 'MP75',
          mode: 'manual',
          unitLabel: 'njësi',
          quantity: 0,
          pricePerUnit: 480, // MKD për njësi
        },
      ]
    default:
      return []
  }
}

export function createCalculation(areaM2: number): CostCalculation {
  const now = Date.now()
  return {
    id: uid(),
    workType: 'mallter',
    areaM2: Math.round((areaM2 || 0) * 1e6) / 1e6,
    pricePerM2Eur: 0,
    exchangeRate: DEFAULT_EXCHANGE_RATE,
    materials: materialsForWorkType('mallter'),
    expenses: [],
    createdAt: now,
    updatedAt: now,
  }
}

// ── Per-material result ──────────────────────────────────────────────
export interface MaterialResult {
  line: MaterialLine
  /** kg required (auto mode only). */
  requiredKg?: number
  /** Number of units purchased (bags rounded up, or manual quantity). */
  units: number
  /** Line cost in MKD. */
  cost: number
}

export function computeMaterial(line: MaterialLine, area: number): MaterialResult {
  if (line.mode === 'auto') {
    const requiredKg = area * (line.consumptionPerM2 ?? 0)
    const size = line.unitSize ?? 0
    const units = size > 0 ? Math.ceil(requiredKg / size) : 0 // always round UP
    return { line, requiredKg, units, cost: units * line.pricePerUnit }
  }
  const units = line.quantity ?? 0
  return { line, units, cost: units * line.pricePerUnit }
}

// ── Full calculation result ──────────────────────────────────────────
export interface CostResult {
  area: number
  rate: number
  materials: MaterialResult[]
  materialCostMkd: number
  additionalMkd: number
  totalExpensesMkd: number
  totalExpensesEur: number
  incomeEur: number
  incomeMkd: number
  profitMkd: number
  profitEur: number
  profitPct: number
  profitable: boolean
}

export function computeCost(calc: CostCalculation): CostResult {
  const area = calc.areaM2 || 0
  const rate = calc.exchangeRate || DEFAULT_EXCHANGE_RATE

  const materials = calc.materials.map((m) => computeMaterial(m, area))
  const materialCostMkd = materials.reduce((s, m) => s + m.cost, 0)
  const additionalMkd = calc.expenses.reduce((s, e) => s + (e.amount || 0), 0)
  const totalExpensesMkd = materialCostMkd + additionalMkd

  const incomeEur = area * (calc.pricePerM2Eur || 0)
  const incomeMkd = incomeEur * rate
  const profitMkd = incomeMkd - totalExpensesMkd
  const profitEur = rate ? profitMkd / rate : 0
  const profitPct = incomeEur > 0 ? (profitEur / incomeEur) * 100 : 0

  return {
    area,
    rate,
    materials,
    materialCostMkd,
    additionalMkd,
    totalExpensesMkd,
    totalExpensesEur: rate ? totalExpensesMkd / rate : 0,
    incomeEur,
    incomeMkd,
    profitMkd,
    profitEur,
    profitPct,
    profitable: profitMkd >= 0,
  }
}

export function workTypeLabel(key: WorkType): string {
  return WORK_TYPES.find((w) => w.key === key)?.label ?? key
}
