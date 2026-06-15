import { useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ChevronLeft,
  Plus,
  TrendingUp,
  TrendingDown,
  Copy,
  Trash2,
  Calculator,
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { useSettings } from '../store/useSettings'
import { useUI } from '../store/useUI'
import { projectTotal } from '../lib/calc'
import { computeCost, createCalculation, workTypeLabel } from '../lib/cost'
import { formatValue, formatMoney, formatDate, formatNumber } from '../lib/format'
import { Button, Card, EmptyState, IconButton } from '../components/ui'

export function CostCalculator() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const project = useStore((s) => s.projects.find((p) => p.id === id))
  const { addCalculation, deleteCalculation, duplicateCalculation } = useStore()
  const settings = useSettings()
  const { ask, toast } = useUI()

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-subtle">Projekti nuk u gjet.</p>
        <Button className="mt-4" onClick={() => navigate('/projects')}>
          Kthehu te projektet
        </Button>
      </div>
    )
  }

  const area = projectTotal(project)
  const calcs = project.calculations ?? []

  const handleNew = () => {
    const calc = createCalculation(area)
    addCalculation(project.id, calc)
    navigate(`/projects/${project.id}/cost/${calc.id}`)
  }

  return (
    <div className="pb-4">
      {/* Top bar */}
      <header className="sticky top-0 z-30 -mx-4 mb-3 px-4 pt-safe sm:-mx-6 sm:px-6">
        <div className="glass -mx-1 flex items-center gap-1 rounded-b-2xl border-b border-border px-1 py-2">
          <IconButton label="Prapa" onClick={() => navigate(`/projects/${project.id}`)}>
            <ChevronLeft size={22} />
          </IconButton>
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold">Kostoja &amp; Fitimi</div>
            <div className="truncate text-[12px] text-subtle">{project.name}</div>
          </div>
        </div>
      </header>

      {/* Imported summary */}
      <Card className="mb-4 flex items-center justify-between p-4">
        <div>
          <p className="text-[13px] text-subtle">Sipërfaqja e matur (importuar)</p>
          <div className="text-2xl font-extrabold tabular-nums text-primary">
            {formatValue(area, settings)}
          </div>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
          <Calculator size={24} />
        </div>
      </Card>

      <Button size="lg" block onClick={handleNew} className="mb-5">
        <Plus size={22} strokeWidth={2.5} /> Llogaritje e re
      </Button>

      {calcs.length === 0 ? (
        <EmptyState
          icon={<Calculator size={26} />}
          title="Ende pa llogaritje"
          description="Krijo një llogaritje për të nxjerrë materialet, shpenzimet dhe fitimin për këtë projekt."
          action={
            <Button onClick={handleNew}>
              <Plus size={18} /> Llogaritje e re
            </Button>
          }
        />
      ) : (
        <div className="space-y-2.5">
          <AnimatePresence mode="popLayout">
            {calcs.map((calc) => {
              const r = computeCost(calc)
              const profit = r.profitable
              return (
                <motion.div
                  key={calc.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="card relative overflow-hidden p-4"
                >
                  <button
                    onClick={() => navigate(`/projects/${project.id}/cost/${calc.id}`)}
                    className="absolute inset-0 z-0"
                    aria-label="Hap llogaritjen"
                  />
                  <div className="relative z-10 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{workTypeLabel(calc.workType)}</span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                            profit ? 'bg-success/12 text-success' : 'bg-danger/12 text-danger'
                          }`}
                        >
                          {profit ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          {formatNumber(r.profitPct, settings)}%
                        </span>
                      </div>
                      <div className="mt-1 text-[12px] text-subtle">
                        {formatDate(calc.createdAt)} · Të ardhura {formatMoney(r.incomeMkd, settings)} MKD
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div
                        className={`text-lg font-extrabold tabular-nums ${
                          profit ? 'text-success' : 'text-danger'
                        }`}
                      >
                        {formatMoney(r.profitMkd, settings)}
                      </div>
                      <div className="text-[11px] text-subtle">fitim MKD</div>
                    </div>
                  </div>
                  <div className="relative z-10 mt-3 flex items-center justify-end gap-0.5 border-t border-border pt-2">
                    <IconButton
                      label="Kopjo"
                      onClick={() => {
                        duplicateCalculation(project.id, calc.id)
                        toast('Llogaritja u kopjua', 'success')
                      }}
                    >
                      <Copy size={16} />
                    </IconButton>
                    <IconButton
                      label="Fshij"
                      tone="danger"
                      onClick={() =>
                        ask({
                          title: 'Të fshihet llogaritja?',
                          message: 'Kjo llogaritje do të hiqet përgjithmonë.',
                          confirmLabel: 'Fshij',
                          onConfirm: () => {
                            deleteCalculation(project.id, calc.id)
                            toast('Llogaritja u fshi')
                          },
                        })
                      }
                    >
                      <Trash2 size={16} />
                    </IconButton>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
