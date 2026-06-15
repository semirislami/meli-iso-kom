import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Plus, Search, FolderKanban, X, ArrowDownUp } from 'lucide-react'
import { useStore } from '../store/useStore'
import { useUI } from '../store/useUI'
import { projectTotal } from '../lib/calc'
import { Button, EmptyState, Input, cn } from '../components/ui'
import { ProjectCard } from '../components/ProjectCard'
import { ProjectForm, type ProjectDraft } from '../components/ProjectForm'

type SortKey = 'updated' | 'name' | 'date' | 'largest'

const sortOptions: { key: SortKey; label: string }[] = [
  { key: 'updated', label: 'Të fundit' },
  { key: 'date', label: 'Data' },
  { key: 'name', label: 'Emri' },
  { key: 'largest', label: 'Më i madhi' },
]

export function Projects() {
  const navigate = useNavigate()
  const projects = useStore((s) => s.projects)
  const createProject = useStore((s) => s.createProject)
  const duplicateProject = useStore((s) => s.duplicateProject)
  const deleteProject = useStore((s) => s.deleteProject)
  const { ask, toast } = useUI()

  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('updated')
  const [formOpen, setFormOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = projects.filter((p) =>
      !q
        ? true
        : [p.name, p.client, p.location, p.notes].some((f) => f.toLowerCase().includes(q))
    )
    list = [...list].sort((a, b) => {
      switch (sort) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'date':
          return (b.date || '').localeCompare(a.date || '')
        case 'largest':
          return projectTotal(b) - projectTotal(a)
        default:
          return b.updatedAt - a.updatedAt
      }
    })
    return list
  }, [projects, query, sort])

  const handleCreate = (draft: ProjectDraft) => {
    const project = createProject(draft)
    setFormOpen(false)
    navigate(`/projects/${project.id}`)
  }

  return (
    <div className="space-y-4 py-2">
      <header className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projektet</h1>
          <p className="text-sm text-subtle">{projects.length} gjithsej</p>
        </div>
        <Button size="sm" onClick={() => setFormOpen(true)}>
          <Plus size={18} /> I ri
        </Button>
      </header>

      {/* Search */}
      <div className="relative">
        <Search
          size={18}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle"
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Kërko emër, klient, vendndodhje…"
          className="pl-11 pr-10"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle hover:text-fg"
            aria-label="Pastro kërkimin"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Sort chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <ArrowDownUp size={15} className="shrink-0 text-subtle" />
        {sortOptions.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setSort(opt.key)}
            className={cn(
              'shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition',
              sort === opt.key
                ? 'bg-primary text-primary-fg'
                : 'bg-muted text-subtle hover:text-fg'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* List */}
      {projects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban size={26} />}
          title="Ende pa projekte"
          description="Krijo projektin tënd të parë për të filluar matjet."
          action={
            <Button onClick={() => setFormOpen(true)}>
              <Plus size={18} /> Krijo projekt
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Search size={26} />}
          title="S'ka përputhje"
          description={`Asgjë nuk përputhet me "${query}". Provo një kërkim tjetër.`}
        />
      ) : (
        <div className="space-y-2.5">
          <AnimatePresence mode="popLayout">
            {filtered.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                onDuplicate={() => {
                  duplicateProject(p.id)
                  toast('Projekti u kopjua', 'success')
                }}
                onDelete={() =>
                  ask({
                    title: 'Të fshihet projekti?',
                    message: `"${p.name}" do të fshihet përgjithmonë. Ky veprim nuk mund të zhbëhet.`,
                    confirmLabel: 'Fshij',
                    onConfirm: () => {
                      deleteProject(p.id)
                      toast('Projekti u fshi')
                    },
                  })
                }
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <ProjectForm
        open={formOpen}
        mode="create"
        onClose={() => setFormOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  )
}
