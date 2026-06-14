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
  { key: 'updated', label: 'Recent' },
  { key: 'date', label: 'Date' },
  { key: 'name', label: 'Name' },
  { key: 'largest', label: 'Largest' },
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
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-subtle">{projects.length} total</p>
        </div>
        <Button size="sm" onClick={() => setFormOpen(true)}>
          <Plus size={18} /> New
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
          placeholder="Search name, client, location…"
          className="pl-11 pr-10"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle hover:text-fg"
            aria-label="Clear search"
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
          title="No projects yet"
          description="Create your first project to start measuring."
          action={
            <Button onClick={() => setFormOpen(true)}>
              <Plus size={18} /> Create project
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Search size={26} />}
          title="No matches"
          description={`Nothing matches "${query}". Try a different search.`}
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
                  toast('Project duplicated', 'success')
                }}
                onDelete={() =>
                  ask({
                    title: 'Delete project?',
                    message: `"${p.name}" will be permanently deleted. This cannot be undone.`,
                    confirmLabel: 'Delete',
                    onConfirm: () => {
                      deleteProject(p.id)
                      toast('Project deleted')
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
