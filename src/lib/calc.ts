// ── Measurement expression engine ────────────────────────────────────
// Turns what a builder naturally writes in a notebook into a number.
//
// Supported, in order of how often a tiler/mason types it:
//   8 x 2            → 16      (width × height)
//   8x2              → 16      (no spaces)
//   8 × 2            → 16      (unicode times)
//   5,5 x 3          → 16.5    (decimal comma, Balkan style)
//   8x2 + 3x4        → 28      (sum several areas on one line)
//   8x2 - 1x2.1      → 13.8    (subtract an opening: window / door)
//   2 x 8 x 2        → 32      (quantity × width × height)
//   (8+2) x 3        → 30      (grouping)
//
// Implemented as a tiny, safe recursive-descent evaluator. No eval(),
// so a malformed string can never execute anything.

export interface CalcResult {
  value: number
  valid: boolean
  /** True when the input was blank (neither valid nor an error to show). */
  empty: boolean
}

const EMPTY: CalcResult = { value: 0, valid: false, empty: true }

export function evaluate(raw: string): CalcResult {
  if (raw == null) return EMPTY
  const normalized = normalize(raw)
  if (normalized.trim() === '') return EMPTY

  try {
    const parser = new Parser(normalized)
    const value = parser.parseExpression()
    parser.expectEnd()
    if (!Number.isFinite(value)) return { value: 0, valid: false, empty: false }
    // Round to kill floating-point dust (e.g. 0.1 + 0.2).
    const cleaned = Math.round(value * 1e6) / 1e6
    return { value: cleaned, valid: true, empty: false }
  } catch {
    return { value: 0, valid: false, empty: false }
  }
}

/** Lowercase, unify separators, turn `x`/`×`/`·` into `*`, comma into dot. */
function normalize(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/×|·|\*/g, '*')
    .replace(/x/g, '*')
    .replace(/,/g, '.')
    .replace(/[^0-9.+\-*/() ]/g, '') // drop stray characters
}

// ── Recursive descent: expr = term (('+'|'-') term)* ─────────────────
class Parser {
  private pos = 0
  constructor(private readonly s: string) {}

  parseExpression(): number {
    let value = this.parseTerm()
    for (;;) {
      this.skipWs()
      const c = this.s[this.pos]
      if (c === '+') {
        this.pos++
        value += this.parseTerm()
      } else if (c === '-') {
        this.pos++
        value -= this.parseTerm()
      } else break
    }
    return value
  }

  private parseTerm(): number {
    let value = this.parseFactor()
    for (;;) {
      this.skipWs()
      const c = this.s[this.pos]
      if (c === '*') {
        this.pos++
        value *= this.parseFactor()
      } else if (c === '/') {
        this.pos++
        const d = this.parseFactor()
        if (d === 0) throw new Error('div by zero')
        value /= d
      } else break
    }
    return value
  }

  private parseFactor(): number {
    this.skipWs()
    const c = this.s[this.pos]
    if (c === '+') {
      this.pos++
      return this.parseFactor()
    }
    if (c === '-') {
      this.pos++
      return -this.parseFactor()
    }
    if (c === '(') {
      this.pos++
      const v = this.parseExpression()
      this.skipWs()
      if (this.s[this.pos] !== ')') throw new Error('unclosed paren')
      this.pos++
      return v
    }
    return this.parseNumber()
  }

  private parseNumber(): number {
    this.skipWs()
    const start = this.pos
    while (this.pos < this.s.length && /[0-9.]/.test(this.s[this.pos])) {
      this.pos++
    }
    const slice = this.s.slice(start, this.pos)
    if (slice === '' || slice === '.') throw new Error('expected number')
    const n = Number(slice)
    if (!Number.isFinite(n)) throw new Error('bad number')
    return n
  }

  expectEnd() {
    this.skipWs()
    if (this.pos !== this.s.length) throw new Error('trailing input')
  }

  private skipWs() {
    while (this.s[this.pos] === ' ') this.pos++
  }
}

// ── Aggregation helpers ──────────────────────────────────────────────
import type { Project, Section } from '../types'

export function sectionTotal(section: Section): number {
  return round(section.measurements.reduce((sum, m) => sum + (m.value || 0), 0))
}

export function projectTotal(project: Project): number {
  return round(project.sections.reduce((sum, s) => sum + sectionTotal(s), 0))
}

export function projectMeasurementCount(project: Project): number {
  return project.sections.reduce((n, s) => n + s.measurements.length, 0)
}

function round(n: number): number {
  return Math.round(n * 1e6) / 1e6
}
