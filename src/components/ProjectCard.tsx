import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MapPin, User, Copy, Trash2, FileDown, Layers } from 'lucide-react'
import type { Project } from '../types'
import { projectTotal, projectMeasurementCount } from '../lib/calc'
import { formatValue, formatDate } from '../lib/format'
import { useSettings, settingsSnapshot } from '../store/useSettings'
import { IconButton } from './ui'
import { exportProjectPdf } from '../lib/pdf'

export function ProjectCard({
  project,
  onDuplicate,
  onDelete,
}: {
  project: Project
  onDuplicate: () => void
  onDelete: () => void
}) {
  const navigate = useNavigate()
  const settings = useSettings()
  const total = projectTotal(project)
  const count = projectMeasurementCount(project)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ type: 'spring', damping: 26, stiffness: 320 }}
      className="card group relative overflow-hidden p-4 transition active:scale-[0.99]"
    >
      <button
        onClick={() => navigate(`/projects/${project.id}`)}
        className="absolute inset-0 z-0"
        aria-label={`Hap ${project.name}`}
      />
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[17px] font-semibold text-fg">{project.name}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-subtle">
            {project.client && (
              <span className="inline-flex items-center gap-1">
                <User size={13} /> {project.client}
              </span>
            )}
            {project.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin size={13} /> {project.location}
              </span>
            )}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-lg font-bold tabular-nums text-primary">
            {formatValue(total, settings)}
          </div>
          <div className="text-[11px] text-subtle">{formatDate(project.date)}</div>
        </div>
      </div>

      <div className="relative z-10 mt-3 flex items-center justify-between border-t border-border pt-3">
        <div className="flex items-center gap-3 text-[12px] text-subtle">
          <span className="inline-flex items-center gap-1">
            <Layers size={13} /> {project.sections.length} seksione
          </span>
          <span>·</span>
          <span>{count} matje</span>
        </div>
        <div className="flex items-center gap-0.5">
          <IconButton
            label="Eksporto PDF"
            onClick={() => exportProjectPdf(project, settingsSnapshot(settings))}
          >
            <FileDown size={17} />
          </IconButton>
          <IconButton label="Kopjo" onClick={onDuplicate}>
            <Copy size={17} />
          </IconButton>
          <IconButton label="Fshij" tone="danger" onClick={onDelete}>
            <Trash2 size={17} />
          </IconButton>
        </div>
      </div>
    </motion.div>
  )
}
