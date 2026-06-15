import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ChevronLeft,
  FileDown,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Package,
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { useSettings, settingsSnapshot } from '../store/useSettings'
import { useUI } from '../store/useUI'
import { projectTotal } from '../lib/calc'
import { computeCost, WORK_TYPES } from '../lib/cost'
import type { CostCalculation, ExpenseItem, MaterialLine, WorkType } from '../types'
import { formatMoney, formatNumber } from '../lib/format'
import { exportCostPdf } from '../lib/pdf'
import { uid } from '../lib/id'
import { Button, Card, Field, IconButton, Input, NumberField, cn } from '../components/ui'

export function CostEditor() {
  const { id = '', calcId = '' } = useParams()
  const navigate = useNavigate()
  const project = useStore((s) => s.projects.find((p) => p.id === id))
  const calc = project?.calculations?.find((c) => c.id === calcId)
  const updateCalculation = useStore((s) => s.updateCalculation)
  const settings = useSettings()
  const { ask, toast } = useUI()

  if (!project || !calc) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-subtle">Llogaritja nuk u gjet.</p>
        <Button className="mt-4" onClick={() => navigate(`/projects/${id}/cost`)}>
          Prapa
        </Button>
      </div>
    )
  }

  const measured = projectTotal(project)
  const r = computeCost(calc)
  const patch = (p: Partial<CostCalculation>) => updateCalculation(project.id, calc.id, p)

  const updateMaterial = (matId: string, mp: Partial<MaterialLine>) =>
    patch({ materials: calc.materials.map((m) => (m.id === matId ? { ...m, ...mp } : m)) })

  const addExpense = () =>
    patch({
      expenses: [...calc.expenses, { id: uid(), name: '', amount: 0, notes: '' }],
    })
  const updateExpense = (eid: string, ep: Partial<ExpenseItem>) =>
    patch({ expenses: calc.expenses.map((e) => (e.id === eid ? { ...e, ...ep } : e)) })
  const removeExpense = (eid: string) =>
    patch({ expenses: calc.expenses.filter((e) => e.id !== eid) })

  return (
    <div className="space-y-4 pb-6">
      {/* Top bar */}
      <header className="sticky top-0 z-30 -mx-4 px-4 pt-safe sm:-mx-6 sm:px-6">
        <div className="glass -mx-1 flex items-center gap-1 rounded-b-2xl border-b border-border px-1 py-2">
          <IconButton label="Prapa" onClick={() => navigate(`/projects/${project.id}/cost`)}>
            <ChevronLeft size={22} />
          </IconButton>
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold">Llogaritje</div>
            <div className="truncate text-[12px] text-subtle">{project.name}</div>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => exportCostPdf(project, calc, settingsSnapshot(settings))}
          >
            <FileDown size={16} /> PDF
          </Button>
        </div>
      </header>

      {/* Project summary */}
      <Card className="p-4">
        <h2 className="mb-3 text-sm font-semibold text-subtle">Projekti</h2>
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <span className="text-subtle">Emri</span>
          <span className="text-right font-medium">{project.name}</span>
          <span className="text-subtle">Klienti</span>
          <span className="text-right font-medium">{project.client || '—'}</span>
          <span className="text-subtle">Vendndodhja</span>
          <span className="text-right font-medium">{project.location || '—'}</span>
        </div>
        <div className="mt-3 border-t border-border pt-3">
          <Field label="Sipërfaqja totale (m²)">
            <NumberField
              value={calc.areaM2}
              onValueChange={(n) => patch({ areaM2: n })}
              align="right"
              suffix="m²"
            />
          </Field>
          {Math.abs(calc.areaM2 - measured) > 1e-6 && (
            <button
              onClick={() => patch({ areaM2: measured })}
              className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-medium text-primary"
            >
              <RotateCcw size={12} /> Rikthe te e matura ({formatNumber(measured, settings)} m²)
            </button>
          )}
        </div>
      </Card>

      {/* Work type */}
      <Card className="p-4">
        <h2 className="mb-3 text-sm font-semibold text-subtle">Lloji i punës</h2>
        <div className="flex flex-wrap gap-2">
          {WORK_TYPES.map((w) => (
            <button
              key={w.key}
              disabled={!w.available}
              onClick={() => w.available && switchWorkType(w.key)}
              className={cn(
                'rounded-xl px-4 py-2.5 text-sm font-semibold transition',
                calc.workType === w.key
                  ? 'bg-primary text-primary-fg'
                  : w.available
                    ? 'bg-muted text-fg hover:bg-elevated'
                    : 'cursor-not-allowed bg-muted/50 text-subtle/50'
              )}
            >
              {w.label}
              {!w.available && <span className="ml-1 text-[10px]">së shpejti</span>}
            </button>
          ))}
        </div>
      </Card>

      {/* Income */}
      <Card className="p-4">
        <h2 className="mb-3 text-sm font-semibold text-subtle">Çmimi i klientit &amp; të ardhurat</h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Çmimi për m² (EUR)">
            <NumberField
              value={calc.pricePerM2Eur}
              onValueChange={(n) => patch({ pricePerM2Eur: n })}
              align="right"
              suffix="€"
            />
          </Field>
          <Field label="Kursi i këmbimit" hint="1 EUR = ? MKD">
            <NumberField
              value={calc.exchangeRate}
              onValueChange={(n) => patch({ exchangeRate: n })}
              align="right"
            />
          </Field>
        </div>
        <div className="mt-3 flex items-center justify-between rounded-xl bg-muted px-4 py-3">
          <span className="text-sm text-subtle">Të ardhurat totale</span>
          <div className="text-right">
            <div className="text-lg font-bold tabular-nums">{formatMoney(r.incomeEur, settings)} €</div>
            <div className="text-[12px] text-subtle tabular-nums">
              {formatMoney(r.incomeMkd, settings)} MKD
            </div>
          </div>
        </div>
      </Card>

      {/* Materials */}
      <div>
        <h2 className="mb-2.5 flex items-center gap-1.5 px-1 text-sm font-semibold text-subtle">
          <Package size={16} /> Materialet
        </h2>
        <div className="space-y-2.5">
          {calc.materials.map((m, i) => (
            <MaterialCard
              key={m.id}
              line={m}
              result={r.materials[i]}
              settings={settings}
              onChange={(mp) => updateMaterial(m.id, mp)}
            />
          ))}
          {calc.materials.length === 0 && (
            <Card className="p-4 text-center text-sm text-subtle">
              Ende pa materiale për këtë lloj pune.
            </Card>
          )}
        </div>
        <div className="mt-2.5 flex items-center justify-between rounded-xl bg-primary/10 px-4 py-3">
          <span className="text-sm font-medium text-primary">Kostoja e materialeve</span>
          <span className="text-lg font-bold tabular-nums text-primary">
            {formatMoney(r.materialCostMkd, settings)} MKD
          </span>
        </div>
      </div>

      {/* Additional expenses */}
      <div>
        <div className="mb-2.5 flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold text-subtle">Shpenzime shtesë</h2>
          <button
            onClick={addExpense}
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
          >
            <Plus size={16} /> Shto
          </button>
        </div>
        <div className="space-y-2.5">
          {calc.expenses.map((e) => (
            <Card key={e.id} className="space-y-2 p-3">
              <div className="flex items-center gap-2">
                <Input
                  value={e.name}
                  onChange={(ev) => updateExpense(e.id, { name: ev.target.value })}
                  placeholder="Punëtorë, karburant, transport…"
                  sizing="sm"
                  className="flex-1"
                />
                <IconButton label="Fshij shpenzimin" tone="danger" onClick={() => removeExpense(e.id)}>
                  <Trash2 size={16} />
                </IconButton>
              </div>
              <div className="flex items-center gap-2">
                <NumberField
                  value={e.amount}
                  onValueChange={(n) => updateExpense(e.id, { amount: n })}
                  align="right"
                  suffix="MKD"
                  className="h-11 flex-1"
                  placeholder="0"
                />
              </div>
              <Input
                value={e.notes}
                onChange={(ev) => updateExpense(e.id, { notes: ev.target.value })}
                placeholder="Shënime (opsionale)"
                sizing="sm"
              />
            </Card>
          ))}
          {calc.expenses.length === 0 && (
            <Card className="p-4 text-center text-sm text-subtle">
              Pa shpenzime shtesë. Prek “Shto” për punëtorë, karburant, transport, ushqim, vegla…
            </Card>
          )}
        </div>
        <div className="mt-2.5 flex items-center justify-between rounded-xl bg-muted px-4 py-3">
          <span className="text-sm text-subtle">Totali shtesë</span>
          <span className="text-lg font-bold tabular-nums">
            {formatMoney(r.additionalMkd, settings)} MKD
          </span>
        </div>
      </div>

      {/* Profit dashboard */}
      <ProfitDashboard r={r} settings={settings} />
    </div>
  )

  function switchWorkType(key: WorkType) {
    // For now only mallter has presets; keep existing materials if already set.
    if (key === calc!.workType) return
    patch({ workType: key })
    toast(`Lloji i punës: ${WORK_TYPES.find((w) => w.key === key)?.label}`)
  }
}

// ── Material card ────────────────────────────────────────────────────
function MaterialCard({
  line,
  result,
  settings,
  onChange,
}: {
  line: MaterialLine
  result: ReturnType<typeof computeCost>['materials'][number]
  settings: ReturnType<typeof useSettings>
  onChange: (p: Partial<MaterialLine>) => void
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="font-semibold">{line.name}</span>
        <span className="text-base font-bold tabular-nums text-fg">
          {formatMoney(result.cost, settings)} MKD
        </span>
      </div>

      {line.mode === 'auto' ? (
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Nevojiten" value={`${formatNumber(result.requiredKg ?? 0, settings)} kg`} />
            <Stat label="Thasë (↑)" value={`${result.units}`} highlight />
            <Stat label="për m²" value={`${formatNumber(line.consumptionPerM2 ?? 0, settings)} kg`} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Madhësia e thesit (kg)">
              <NumberField
                value={line.unitSize ?? 0}
                onValueChange={(n) => onChange({ unitSize: n })}
                align="right"
              />
            </Field>
            <Field label="Çmimi / thes (MKD)">
              <NumberField
                value={line.pricePerUnit}
                onValueChange={(n) => onChange({ pricePerUnit: n })}
                align="right"
              />
            </Field>
          </div>
          <Field label="Konsumi (kg për m²)">
            <NumberField
              value={line.consumptionPerM2 ?? 0}
              onValueChange={(n) => onChange({ consumptionPerM2: n })}
              align="right"
            />
          </Field>
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label={`Sasia (${line.unitLabel})`}>
            <NumberField
              value={line.quantity ?? 0}
              onValueChange={(n) => onChange({ quantity: n })}
              align="right"
            />
          </Field>
          <Field label={`Çmimi / ${line.unitLabel} (MKD)`}>
            <NumberField
              value={line.pricePerUnit}
              onValueChange={(n) => onChange({ pricePerUnit: n })}
              align="right"
            />
          </Field>
        </div>
      )}
    </Card>
  )
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={cn('rounded-xl px-2 py-2', highlight ? 'bg-primary/10' : 'bg-muted')}>
      <div className={cn('text-base font-bold tabular-nums', highlight && 'text-primary')}>
        {value}
      </div>
      <div className="text-[10px] text-subtle">{label}</div>
    </div>
  )
}

// ── Profit dashboard ─────────────────────────────────────────────────
function ProfitDashboard({
  r,
  settings,
}: {
  r: ReturnType<typeof computeCost>
  settings: ReturnType<typeof useSettings>
}) {
  const good = r.profitable
  return (
    <motion.div
      layout
      className={cn(
        'overflow-hidden rounded-3xl border p-5',
        good ? 'border-success/30 bg-success/10' : 'border-danger/30 bg-danger/10'
      )}
    >
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-xl',
            good ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'
          )}
        >
          {good ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
        </div>
        <span className={cn('text-sm font-bold uppercase tracking-wide', good ? 'text-success' : 'text-danger')}>
          {good ? 'Me fitim' : 'Humbje'}
        </span>
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div>
          <div className={cn('text-4xl font-extrabold tabular-nums', good ? 'text-success' : 'text-danger')}>
            {formatMoney(r.profitMkd, settings)}
          </div>
          <div className="text-sm text-subtle">fitim MKD</div>
        </div>
        <div className="text-right">
          <div className={cn('text-xl font-bold tabular-nums', good ? 'text-success' : 'text-danger')}>
            {formatMoney(r.profitEur, settings)} €
          </div>
          <div className={cn('text-sm font-bold tabular-nums', good ? 'text-success' : 'text-danger')}>
            {formatNumber(r.profitPct, settings)}%
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 border-t border-border/60 pt-4 text-sm">
        <Line label="Të ardhura" value={`${formatMoney(r.incomeMkd, settings)} MKD`} />
        <Line label="Të ardhura €" value={`${formatMoney(r.incomeEur, settings)} €`} />
        <Line label="Kosto materiali" value={`${formatMoney(r.materialCostMkd, settings)} MKD`} />
        <Line label="Shpenzime shtesë" value={`${formatMoney(r.additionalMkd, settings)} MKD`} />
        <Line label="Shpenzime gjithsej" value={`${formatMoney(r.totalExpensesMkd, settings)} MKD`} strong />
        <Line label="Shpenzime €" value={`${formatMoney(r.totalExpensesEur, settings)} €`} />
      </div>
    </motion.div>
  )
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-subtle">{label}</span>
      <span className={cn('tabular-nums', strong ? 'font-bold text-fg' : 'font-medium text-fg')}>
        {value}
      </span>
    </div>
  )
}
