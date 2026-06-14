import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Settings } from '../types'

export const defaultSettings: Settings = {
  companyName: 'Meli ISO KOM',
  companyContact: '',
  unit: 'm²',
  decimalSeparator: 'comma',
  decimals: 2,
  theme: 'system',
}

interface SettingsState extends Settings {
  update: (patch: Partial<Settings>) => void
  replaceAll: (s: Settings) => void
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,
      update: (patch) => set((s) => ({ ...s, ...patch })),
      replaceAll: (s) => set((prev) => ({ ...prev, ...s })),
    }),
    {
      name: 'cmc-settings',
      // Keep only the data fields in storage (not the actions).
      partialize: (s) => ({
        companyName: s.companyName,
        companyContact: s.companyContact,
        unit: s.unit,
        decimalSeparator: s.decimalSeparator,
        decimals: s.decimals,
        theme: s.theme,
      }),
    }
  )
)

/** Snapshot of just the data fields, for backups. */
export function settingsSnapshot(s: SettingsState): Settings {
  return {
    companyName: s.companyName,
    companyContact: s.companyContact,
    unit: s.unit,
    decimalSeparator: s.decimalSeparator,
    decimals: s.decimals,
    theme: s.theme,
  }
}
