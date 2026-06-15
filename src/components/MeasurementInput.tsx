import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Tag } from 'lucide-react'
import { evaluate } from '../lib/calc'
import { formatValue } from '../lib/format'
import { useSettings } from '../store/useSettings'
import { cn } from './ui'

/**
 * The heart of the app: enter "8 x 2" and it's added instantly.
 * Designed for one-handed, rapid-fire entry — focus stays put, the
 * field clears, and the live result confirms before you commit.
 */
export function MeasurementInput({
  onAdd,
}: {
  onAdd: (expression: string, description: string) => void
}) {
  const settings = useSettings()
  const [expr, setExpr] = useState('')
  const [desc, setDesc] = useState('')
  const [showDesc, setShowDesc] = useState(false)
  const exprRef = useRef<HTMLInputElement>(null)

  const result = evaluate(expr)
  const invalid = !result.empty && !result.valid

  const commit = () => {
    if (!result.valid) return
    onAdd(expr, desc)
    setExpr('')
    setDesc('')
    // Keep keyboard up for the next line.
    requestAnimationFrame(() => exprRef.current?.focus())
  }

  return (
    <div className="card border-primary/30 p-3">
      {showDesc && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-2 overflow-hidden"
        >
          <input
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Përshkrimi (p.sh. Muri i sallonit)"
            className="input-base h-11 text-[15px]"
            onKeyDown={(e) => e.key === 'Enter' && exprRef.current?.focus()}
          />
        </motion.div>
      )}

      <div className="flex items-stretch gap-2">
        <button
          type="button"
          onClick={() => setShowDesc((v) => !v)}
          aria-label="Shfaq/fsheh përshkrimin"
          className={cn(
            'flex h-14 w-12 shrink-0 items-center justify-center rounded-xl border transition',
            showDesc || desc
              ? 'border-primary/40 bg-primary/10 text-primary'
              : 'border-border bg-surface text-subtle hover:text-fg'
          )}
        >
          <Tag size={18} />
        </button>

        <div className="relative flex-1">
          <input
            ref={exprRef}
            value={expr}
            onChange={(e) => setExpr(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && commit()}
            inputMode="text"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder="8 x 2"
            className={cn(
              'h-14 w-full rounded-xl border bg-surface px-4 pr-24 font-mono text-lg outline-none transition',
              'focus:ring-4',
              invalid
                ? 'border-danger/60 focus:border-danger focus:ring-danger/15'
                : 'border-border focus:border-primary/70 focus:ring-primary/15'
            )}
          />
          {!result.empty && (
            <span
              className={cn(
                'pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-sm font-bold tabular-nums',
                result.valid ? 'bg-success/12 text-success' : 'text-danger'
              )}
            >
              {result.valid ? `= ${formatValue(result.value, settings)}` : 'e pavlefshme'}
            </span>
          )}
        </div>

        <motion.button
          type="button"
          onClick={commit}
          disabled={!result.valid}
          whileTap={{ scale: 0.9 }}
          aria-label="Shto matje"
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-fg shadow-glow transition disabled:opacity-40 disabled:shadow-none"
        >
          <Plus size={24} strokeWidth={2.5} />
        </motion.button>
      </div>

      <p className="mt-2 px-1 text-[11px] text-subtle">
        Shkruaj <span className="font-mono text-fg">8x2</span>,{' '}
        <span className="font-mono text-fg">5,5x3</span> ose{' '}
        <span className="font-mono text-fg">8x2 + 3x4</span>. Shtyp Enter për ta shtuar.
      </p>
    </div>
  )
}
