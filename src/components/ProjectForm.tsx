import { useEffect, useState } from 'react'
import type { Project } from '../types'
import { todayISO } from '../lib/format'
import { Sheet } from './Sheet'
import { Button, Field, Input, Textarea } from './ui'

export interface ProjectDraft {
  name: string
  client: string
  location: string
  date: string
  notes: string
}

const empty: ProjectDraft = {
  name: '',
  client: '',
  location: '',
  date: todayISO(),
  notes: '',
}

export function ProjectForm({
  open,
  onClose,
  onSubmit,
  initial,
  mode,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (draft: ProjectDraft) => void
  initial?: Project
  mode: 'create' | 'edit'
}) {
  const [draft, setDraft] = useState<ProjectDraft>(empty)

  useEffect(() => {
    if (open) {
      setDraft(
        initial
          ? {
              name: initial.name,
              client: initial.client,
              location: initial.location,
              date: initial.date,
              notes: initial.notes,
            }
          : empty
      )
    }
  }, [open, initial])

  const set = (patch: Partial<ProjectDraft>) => setDraft((d) => ({ ...d, ...patch }))
  const canSave = draft.name.trim().length > 0

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={mode === 'create' ? 'Projekt i ri' : 'Ndrysho projektin'}
      footer={
        <div className="flex gap-3">
          <Button variant="secondary" block onClick={onClose}>
            Anulo
          </Button>
          <Button
            block
            disabled={!canSave}
            onClick={() => {
              if (canSave) onSubmit(draft)
            }}
          >
            {mode === 'create' ? 'Krijo projektin' : 'Ruaj ndryshimet'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Field label="Emri i projektit *">
          <Input
            autoFocus
            value={draft.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder="Renovim banese — Rruga Ilindenit 12"
            sizing="lg"
          />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Klienti">
            <Input
              value={draft.client}
              onChange={(e) => set({ client: e.target.value })}
              placeholder="Emri i klientit"
            />
          </Field>
          <Field label="Vendndodhja">
            <Input
              value={draft.location}
              onChange={(e) => set({ location: e.target.value })}
              placeholder="Qyteti / adresa"
            />
          </Field>
        </div>
        <Field label="Data">
          <Input type="date" value={draft.date} onChange={(e) => set({ date: e.target.value })} />
        </Field>
        <Field label="Shënime">
          <Textarea
            value={draft.notes}
            onChange={(e) => set({ notes: e.target.value })}
            placeholder="Çdo gjë me vlerë për ta mbajtur mend për këtë punë…"
          />
        </Field>
      </div>
    </Sheet>
  )
}
