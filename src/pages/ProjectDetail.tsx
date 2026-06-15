import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ChevronLeft,
  Pencil,
  Copy,
  FileDown,
  Plus,
  Layers,
  User,
  MapPin,
  Calendar,
  StickyNote,
  Calculator,
  ChevronRight,
} from 'lucide-react'
import { useStore } from '../store/useStore'
import { useSettings, settingsSnapshot } from '../store/useSettings'
import { useUI } from '../store/useUI'
import { projectTotal, projectMeasurementCount } from '../lib/calc'
import { formatValue, formatDate } from '../lib/format'
import { exportProjectPdf } from '../lib/pdf'
import { Button, Card, IconButton, Input, cn } from '../components/ui'
import { SectionCard } from '../components/SectionCard'
import { ProjectForm, type ProjectDraft } from '../components/ProjectForm'

const SECTION_PRESETS = [
  'Përdhesa',
  'Kati 1',
  'Kati 2',
  'Bodrumi',
  'Çatia',
  'Fasada',
  'Banjo',
  'Kuzhina',
]

export function ProjectDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const project = useStore((s) => s.projects.find((p) => p.id === id))
  const { updateProject, duplicateProject, addSection } = useStore()
  const settings = useSettings()
  const { toast } = useUI()

  const [editOpen, setEditOpen] = useState(false)
  const [newSection, setNewSection] = useState('')
  const [showInfo, setShowInfo] = useState(false)

  const total = useMemo(() => (project ? projectTotal(project) : 0), [project])

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

  const usedPresets = new Set(project.sections.map((s) => s.name.toLowerCase()))
  const availablePresets = SECTION_PRESETS.filter((p) => !usedPresets.has(p.toLowerCase()))

  const handleAddSection = (name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    addSection(project.id, trimmed)
    setNewSection('')
  }

  const handleEdit = (draft: ProjectDraft) => {
    updateProject(project.id, draft)
    setEditOpen(false)
    toast('Projekti u përditësua', 'success')
  }

  return (
    <div className="pb-4">
      {/* Top bar */}
      <header className="sticky top-0 z-30 -mx-4 mb-3 px-4 pt-safe sm:-mx-6 sm:px-6">
        <div className="glass -mx-1 flex items-center gap-1 rounded-b-2xl border-b border-border px-1 py-2">
          <IconButton label="Prapa" onClick={() => navigate(-1)}>
            <ChevronLeft size={22} />
          </IconButton>
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold">{project.name}</div>
          </div>
          <IconButton label="Ndrysho" onClick={() => setEditOpen(true)}>
            <Pencil size={18} />
          </IconButton>
          <IconButton
            label="Kopjo"
            onClick={() => {
              const copy = duplicateProject(project.id)
              if (copy) {
                toast('U kopjua', 'success')
                navigate(`/projects/${copy.id}`)
              }
            }}
          >
            <Copy size={18} />
          </IconButton>
        </div>
      </header>

      {/* Total hero */}
      <motion.div
        layout
        className="relative mb-4 overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/15 via-card to-card p-5"
      >
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[13px] font-medium text-subtle">Totali i projektit</p>
            <div className="mt-1 text-4xl font-extrabold tracking-tight tabular-nums text-fg">
              {formatValue(total, settings)}
            </div>
            <div className="mt-2 flex items-center gap-3 text-[12px] text-subtle">
              <span className="inline-flex items-center gap-1">
                <Layers size={13} /> {project.sections.length} seksione
              </span>
              <span>·</span>
              <span>{projectMeasurementCount(project)} matje</span>
            </div>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => exportProjectPdf(project, settingsSnapshot(settings))}
          >
            <FileDown size={16} /> PDF
          </Button>
        </div>
      </motion.div>

      {/* Cost & Profit entry */}
      <button
        onClick={() => navigate(`/projects/${project.id}/cost`)}
        className="mb-4 flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left shadow-card transition active:scale-[0.99] hover:border-primary/40"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/12 text-accent">
          <Calculator size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold">Kostoja &amp; Fitimi</div>
          <div className="text-[13px] text-subtle">
            {project.calculations && project.calculations.length > 0
              ? `${project.calculations.length} llogaritje · materiale, shpenzime, fitim`
              : 'Materiale, shpenzime & fitim nga m²-të e tua'}
          </div>
        </div>
        <ChevronRight size={20} className="shrink-0 text-subtle" />
      </button>

      {/* Project info (collapsible) */}
      <button
        onClick={() => setShowInfo((v) => !v)}
        className="mb-3 flex w-full items-center justify-between rounded-xl px-1 text-sm text-subtle"
      >
        <span className="font-medium">Detajet e projektit</span>
        <span className="text-primary">{showInfo ? 'Fshih' : 'Shfaq'}</span>
      </button>
      {showInfo && (
        <Card className="mb-4 space-y-2.5 p-4 text-sm">
          <InfoRow icon={<User size={15} />} label="Klienti" value={project.client} />
          <InfoRow icon={<MapPin size={15} />} label="Vendndodhja" value={project.location} />
          <InfoRow icon={<Calendar size={15} />} label="Data" value={formatDate(project.date)} />
          {project.notes && (
            <InfoRow icon={<StickyNote size={15} />} label="Shënime" value={project.notes} />
          )}
        </Card>
      )}

      {/* Sections */}
      <div className="space-y-3">
        {project.sections.map((section) => (
          <SectionCard key={section.id} projectId={project.id} section={section} />
        ))}
      </div>

      {/* Add section */}
      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-2">
          <Input
            value={newSection}
            onChange={(e) => setNewSection(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddSection(newSection)}
            placeholder="Emër i seksionit të ri…"
          />
          <Button
            onClick={() => handleAddSection(newSection)}
            disabled={!newSection.trim()}
            className="shrink-0"
          >
            <Plus size={20} />
          </Button>
        </div>

        {availablePresets.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {availablePresets.map((preset) => (
              <button
                key={preset}
                onClick={() => handleAddSection(preset)}
                className={cn(
                  'rounded-full border border-dashed border-border px-3 py-1.5 text-[13px] font-medium text-subtle transition',
                  'hover:border-primary/50 hover:text-primary active:scale-95'
                )}
              >
                + {preset}
              </button>
            ))}
          </div>
        )}
      </div>

      <ProjectForm
        open={editOpen}
        mode="edit"
        initial={project}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEdit}
      />
    </div>
  )
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-subtle">{icon}</span>
      <span className="w-20 shrink-0 text-subtle">{label}</span>
      <span className="flex-1 font-medium text-fg">{value || '—'}</span>
    </div>
  )
}
