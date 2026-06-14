import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Trash2, Pencil, Check, X, GripVertical } from 'lucide-react'
import type { Section } from '../types'
import { sectionTotal, evaluate } from '../lib/calc'
import { formatValue } from '../lib/format'
import { useSettings } from '../store/useSettings'
import { useStore } from '../store/useStore'
import { useUI } from '../store/useUI'
import { Badge, IconButton, Input, cn } from './ui'
import { MeasurementInput } from './MeasurementInput'

export function SectionCard({
  projectId,
  section,
  defaultOpen = true,
}: {
  projectId: string
  section: Section
  defaultOpen?: boolean
}) {
  const settings = useSettings()
  const ask = useUI((s) => s.ask)
  const { addMeasurement, deleteMeasurement, updateMeasurement, deleteSection, renameSection } =
    useStore()

  const [open, setOpen] = useState(defaultOpen)
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(section.name)

  const total = sectionTotal(section)

  const saveName = () => {
    renameSection(projectId, section.id, nameDraft)
    setEditingName(false)
  }

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-3">
        <GripVertical size={16} className="shrink-0 text-subtle/50" />
        {editingName ? (
          <div className="flex flex-1 items-center gap-1.5">
            <Input
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveName()
                if (e.key === 'Escape') setEditingName(false)
              }}
              sizing="sm"
            />
            <IconButton label="Save" onClick={saveName}>
              <Check size={18} className="text-success" />
            </IconButton>
            <IconButton label="Cancel" onClick={() => setEditingName(false)}>
              <X size={18} />
            </IconButton>
          </div>
        ) : (
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex flex-1 items-center gap-2 text-left"
          >
            <span className="text-[15px] font-semibold">{section.name}</span>
            <Badge>{section.measurements.length}</Badge>
            <ChevronDown
              size={16}
              className={cn('text-subtle transition-transform', open && 'rotate-180')}
            />
          </button>
        )}

        <span className="shrink-0 text-[15px] font-bold tabular-nums text-primary">
          {formatValue(total, settings)}
        </span>

        {!editingName && (
          <div className="flex items-center">
            <IconButton
              label="Rename section"
              onClick={() => {
                setNameDraft(section.name)
                setEditingName(true)
              }}
            >
              <Pencil size={15} />
            </IconButton>
            <IconButton
              label="Delete section"
              tone="danger"
              onClick={() =>
                ask({
                  title: 'Delete section?',
                  message: `"${section.name}" and its ${section.measurements.length} measurements will be removed.`,
                  confirmLabel: 'Delete',
                  onConfirm: () => deleteSection(projectId, section.id),
                })
              }
            >
              <Trash2 size={15} />
            </IconButton>
          </div>
        )}
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-2 border-t border-border px-3 py-3">
              <AnimatePresence initial={false}>
                {section.measurements.map((m, i) => (
                  <MeasurementRow
                    key={m.id}
                    index={i + 1}
                    description={m.description}
                    expression={m.expression}
                    value={m.value}
                    onSave={(expression, description) =>
                      updateMeasurement(projectId, section.id, m.id, { expression, description })
                    }
                    onDelete={() => deleteMeasurement(projectId, section.id, m.id)}
                  />
                ))}
              </AnimatePresence>

              <MeasurementInput
                onAdd={(expression, description) =>
                  addMeasurement(projectId, section.id, expression, description)
                }
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Single measurement row with inline editing ───────────────────────
function MeasurementRow({
  index,
  description,
  expression,
  value,
  onSave,
  onDelete,
}: {
  index: number
  description: string
  expression: string
  value: number
  onSave: (expression: string, description: string) => void
  onDelete: () => void
}) {
  const settings = useSettings()
  const [editing, setEditing] = useState(false)
  const [exprDraft, setExprDraft] = useState(expression)
  const [descDraft, setDescDraft] = useState(description)

  const result = evaluate(exprDraft)

  const save = () => {
    if (!result.valid) return
    onSave(exprDraft, descDraft)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="rounded-xl border border-primary/40 bg-surface p-2.5">
        <input
          value={descDraft}
          onChange={(e) => setDescDraft(e.target.value)}
          placeholder="Description (optional)"
          className="input-base mb-2 h-10 text-sm"
        />
        <div className="flex items-center gap-2">
          <input
            autoFocus
            value={exprDraft}
            onChange={(e) => setExprDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') save()
              if (e.key === 'Escape') setEditing(false)
            }}
            className="input-base h-11 flex-1 font-mono text-base"
          />
          <span className="w-16 shrink-0 text-right text-sm font-bold tabular-nums text-success">
            {result.valid ? formatValue(result.value, settings) : '—'}
          </span>
          <IconButton label="Save" onClick={save}>
            <Check size={18} className="text-success" />
          </IconButton>
          <IconButton label="Cancel" onClick={() => setEditing(false)}>
            <X size={18} />
          </IconButton>
        </div>
      </div>
    )
  }

  return (
    <motion.button
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, height: 0, marginTop: 0, paddingTop: 0, paddingBottom: 0 }}
      onClick={() => {
        setExprDraft(expression)
        setDescDraft(description)
        setEditing(true)
      }}
      className="group flex w-full items-center gap-3 rounded-xl bg-muted/60 px-3 py-2.5 text-left transition hover:bg-muted"
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-surface text-[11px] font-semibold text-subtle">
        {index}
      </span>
      <div className="min-w-0 flex-1">
        {description && <div className="truncate text-sm font-medium text-fg">{description}</div>}
        <div className="font-mono text-[13px] text-subtle">{expression}</div>
      </div>
      <span className="shrink-0 text-[15px] font-bold tabular-nums text-fg">
        {formatValue(value, settings)}
      </span>
      <span
        role="button"
        tabIndex={-1}
        aria-label="Delete measurement"
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-subtle opacity-0 transition hover:bg-danger/10 hover:text-danger group-hover:opacity-100"
      >
        <Trash2 size={15} />
      </span>
    </motion.button>
  )
}
