import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Project, Section, Measurement, CostCalculation } from '../types'
import { uid } from '../lib/id'
import { evaluate } from '../lib/calc'
import { todayISO } from '../lib/format'

interface NewProjectInput {
  name: string
  client?: string
  location?: string
  date?: string
  notes?: string
}

interface ProjectsState {
  projects: Project[]

  // Project CRUD
  createProject: (input: NewProjectInput) => Project
  updateProject: (id: string, patch: Partial<Project>) => void
  deleteProject: (id: string) => void
  duplicateProject: (id: string) => Project | undefined
  getProject: (id: string) => Project | undefined

  // Sections
  addSection: (projectId: string, name: string) => Section | undefined
  renameSection: (projectId: string, sectionId: string, name: string) => void
  deleteSection: (projectId: string, sectionId: string) => void

  // Measurements
  addMeasurement: (
    projectId: string,
    sectionId: string,
    expression: string,
    description?: string
  ) => void
  updateMeasurement: (
    projectId: string,
    sectionId: string,
    measurementId: string,
    patch: Partial<Pick<Measurement, 'expression' | 'description'>>
  ) => void
  deleteMeasurement: (
    projectId: string,
    sectionId: string,
    measurementId: string
  ) => void

  // Cost & profit calculations
  addCalculation: (projectId: string, calc: CostCalculation) => void
  updateCalculation: (
    projectId: string,
    calcId: string,
    patch: Partial<CostCalculation>
  ) => void
  deleteCalculation: (projectId: string, calcId: string) => void
  duplicateCalculation: (projectId: string, calcId: string) => CostCalculation | undefined

  // Bulk (used by backup import)
  replaceProjects: (projects: Project[]) => void
}

/** Immutably map over the matching project, bumping updatedAt. */
function patchProject(
  projects: Project[],
  id: string,
  fn: (p: Project) => Project
): Project[] {
  return projects.map((p) => (p.id === id ? { ...fn(p), updatedAt: Date.now() } : p))
}

export const useStore = create<ProjectsState>()(
  persist(
    (set, get) => ({
      projects: [],

      createProject: (input) => {
        const now = Date.now()
        const project: Project = {
          id: uid(),
          name: input.name.trim() || 'Untitled project',
          client: input.client?.trim() ?? '',
          location: input.location?.trim() ?? '',
          date: input.date || todayISO(),
          notes: input.notes?.trim() ?? '',
          sections: [],
          createdAt: now,
          updatedAt: now,
        }
        set((s) => ({ projects: [project, ...s.projects] }))
        return project
      },

      updateProject: (id, patch) =>
        set((s) => ({
          projects: patchProject(s.projects, id, (p) => ({ ...p, ...patch })),
        })),

      deleteProject: (id) =>
        set((s) => ({ projects: s.projects.filter((p) => p.id !== id) })),

      duplicateProject: (id) => {
        const original = get().projects.find((p) => p.id === id)
        if (!original) return undefined
        const now = Date.now()
        const copy: Project = {
          ...original,
          id: uid(),
          name: `${original.name} (copy)`,
          createdAt: now,
          updatedAt: now,
          sections: original.sections.map((sec) => ({
            ...sec,
            id: uid(),
            measurements: sec.measurements.map((m) => ({ ...m, id: uid() })),
          })),
        }
        set((s) => ({ projects: [copy, ...s.projects] }))
        return copy
      },

      getProject: (id) => get().projects.find((p) => p.id === id),

      addSection: (projectId, name) => {
        const section: Section = { id: uid(), name: name.trim() || 'Section', measurements: [] }
        set((s) => ({
          projects: patchProject(s.projects, projectId, (p) => ({
            ...p,
            sections: [...p.sections, section],
          })),
        }))
        return section
      },

      renameSection: (projectId, sectionId, name) =>
        set((s) => ({
          projects: patchProject(s.projects, projectId, (p) => ({
            ...p,
            sections: p.sections.map((sec) =>
              sec.id === sectionId ? { ...sec, name: name.trim() || sec.name } : sec
            ),
          })),
        })),

      deleteSection: (projectId, sectionId) =>
        set((s) => ({
          projects: patchProject(s.projects, projectId, (p) => ({
            ...p,
            sections: p.sections.filter((sec) => sec.id !== sectionId),
          })),
        })),

      addMeasurement: (projectId, sectionId, expression, description = '') => {
        const result = evaluate(expression)
        const measurement: Measurement = {
          id: uid(),
          description: description.trim(),
          expression: expression.trim(),
          value: result.valid ? result.value : 0,
        }
        set((s) => ({
          projects: patchProject(s.projects, projectId, (p) => ({
            ...p,
            sections: p.sections.map((sec) =>
              sec.id === sectionId
                ? { ...sec, measurements: [...sec.measurements, measurement] }
                : sec
            ),
          })),
        }))
      },

      updateMeasurement: (projectId, sectionId, measurementId, patch) =>
        set((s) => ({
          projects: patchProject(s.projects, projectId, (p) => ({
            ...p,
            sections: p.sections.map((sec) =>
              sec.id === sectionId
                ? {
                    ...sec,
                    measurements: sec.measurements.map((m) => {
                      if (m.id !== measurementId) return m
                      const next = { ...m, ...patch }
                      if (patch.expression !== undefined) {
                        const r = evaluate(patch.expression)
                        next.value = r.valid ? r.value : 0
                      }
                      return next
                    }),
                  }
                : sec
            ),
          })),
        })),

      deleteMeasurement: (projectId, sectionId, measurementId) =>
        set((s) => ({
          projects: patchProject(s.projects, projectId, (p) => ({
            ...p,
            sections: p.sections.map((sec) =>
              sec.id === sectionId
                ? {
                    ...sec,
                    measurements: sec.measurements.filter((m) => m.id !== measurementId),
                  }
                : sec
            ),
          })),
        })),

      addCalculation: (projectId, calc) =>
        set((s) => ({
          projects: patchProject(s.projects, projectId, (p) => ({
            ...p,
            calculations: [calc, ...(p.calculations ?? [])],
          })),
        })),

      updateCalculation: (projectId, calcId, patch) =>
        set((s) => ({
          projects: patchProject(s.projects, projectId, (p) => ({
            ...p,
            calculations: (p.calculations ?? []).map((c) =>
              c.id === calcId ? { ...c, ...patch, updatedAt: Date.now() } : c
            ),
          })),
        })),

      deleteCalculation: (projectId, calcId) =>
        set((s) => ({
          projects: patchProject(s.projects, projectId, (p) => ({
            ...p,
            calculations: (p.calculations ?? []).filter((c) => c.id !== calcId),
          })),
        })),

      duplicateCalculation: (projectId, calcId) => {
        const project = get().projects.find((p) => p.id === projectId)
        const original = project?.calculations?.find((c) => c.id === calcId)
        if (!original) return undefined
        const now = Date.now()
        const copy: CostCalculation = {
          ...original,
          id: uid(),
          createdAt: now,
          updatedAt: now,
          materials: original.materials.map((m) => ({ ...m, id: uid() })),
          expenses: original.expenses.map((e) => ({ ...e, id: uid() })),
        }
        set((s) => ({
          projects: patchProject(s.projects, projectId, (p) => ({
            ...p,
            calculations: [copy, ...(p.calculations ?? [])],
          })),
        }))
        return copy
      },

      replaceProjects: (projects) => set({ projects }),
    }),
    { name: 'cmc-projects' }
  )
)
