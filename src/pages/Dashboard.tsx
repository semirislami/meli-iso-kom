import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, FolderKanban, Ruler, Hash, ArrowRight, Sparkles } from 'lucide-react'
import { useStore } from '../store/useStore'
import { useSettings } from '../store/useSettings'
import { projectTotal, projectMeasurementCount } from '../lib/calc'
import { formatValue, relativeTime } from '../lib/format'
import { Button, Card, EmptyState } from '../components/ui'
import { ProjectForm, type ProjectDraft } from '../components/ProjectForm'

export function Dashboard() {
  const navigate = useNavigate()
  const projects = useStore((s) => s.projects)
  const createProject = useStore((s) => s.createProject)
  const settings = useSettings()
  const [formOpen, setFormOpen] = useState(false)

  const stats = useMemo(() => {
    const totalArea = projects.reduce((sum, p) => sum + projectTotal(p), 0)
    const totalMeasurements = projects.reduce((n, p) => n + projectMeasurementCount(p), 0)
    return { count: projects.length, totalArea, totalMeasurements }
  }, [projects])

  const recent = useMemo(
    () => [...projects].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 4),
    [projects]
  )

  const handleCreate = (draft: ProjectDraft) => {
    const project = createProject(draft)
    setFormOpen(false)
    navigate(`/projects/${project.id}`)
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Mirëmëngjes' : hour < 18 ? 'Mirëdita' : 'Mirëmbrëma'

  return (
    <div className="space-y-6 py-2">
      {/* Header */}
      <header className="flex items-center justify-between pt-2">
        <div>
          <p className="text-sm text-subtle">{greeting} 👋</p>
          <h1 className="text-2xl font-bold tracking-tight">{settings.companyName || 'Paneli'}</h1>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/12 text-primary">
          <Ruler size={22} />
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={<FolderKanban size={18} />} label="Projekte" value={String(stats.count)} />
        <StatCard
          icon={<Ruler size={18} />}
          label="Matur gjithsej"
          value={formatValue(stats.totalArea, settings)}
          accent
        />
        <StatCard
          icon={<Hash size={18} />}
          label="Hyrje"
          value={String(stats.totalMeasurements)}
        />
      </div>

      {/* Primary CTA */}
      <Button size="lg" block onClick={() => setFormOpen(true)} className="shadow-glow">
        <Plus size={22} strokeWidth={2.5} /> Projekt i ri
      </Button>

      {/* Recent */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold text-subtle">Përditësuar së fundi</h2>
          {projects.length > 0 && (
            <button
              onClick={() => navigate('/projects')}
              className="inline-flex items-center gap-1 text-sm font-medium text-primary"
            >
              Të gjitha <ArrowRight size={15} />
            </button>
          )}
        </div>

        {recent.length === 0 ? (
          <EmptyState
            icon={<Sparkles size={26} />}
            title="Ende pa projekte"
            description="Krijo projektin tënd të parë dhe fillo të masësh më shpejt se në bllok."
            action={
              <Button onClick={() => setFormOpen(true)}>
                <Plus size={18} /> Krijo projekt
              </Button>
            }
          />
        ) : (
          <div className="space-y-2.5">
            {recent.map((p) => (
              <motion.button
                key={p.id}
                layout
                onClick={() => navigate(`/projects/${p.id}`)}
                className="w-full"
              >
                <Card className="flex items-center gap-3 p-3.5 text-left transition active:scale-[0.99]">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted text-subtle">
                    <FolderKanban size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{p.name}</div>
                    <div className="truncate text-[13px] text-subtle">
                      {p.client || 'Pa klient'} · {relativeTime(p.updatedAt)}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-bold tabular-nums text-primary">
                      {formatValue(projectTotal(p), settings)}
                    </div>
                  </div>
                </Card>
              </motion.button>
            ))}
          </div>
        )}
      </section>

      <ProjectForm
        open={formOpen}
        mode="create"
        onClose={() => setFormOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <Card className="p-3.5">
      <div
        className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${
          accent ? 'bg-primary/12 text-primary' : 'bg-muted text-subtle'
        }`}
      >
        {icon}
      </div>
      <div className="truncate text-lg font-bold tabular-nums">{value}</div>
      <div className="truncate text-[11px] text-subtle">{label}</div>
    </Card>
  )
}
