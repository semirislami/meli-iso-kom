import type { BackupFile, Project, Settings } from '../types'

/** Download all data as a JSON backup file. */
export function downloadBackup(projects: Project[], settings: Settings) {
  const data: BackupFile = {
    app: 'construction-measurement-calculator',
    version: 1,
    exportedAt: Date.now(),
    projects,
    settings,
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `cmc-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/** Parse and validate a backup file's contents. Throws on bad input. */
export function parseBackup(text: string): BackupFile {
  const data = JSON.parse(text)
  if (!data || data.app !== 'construction-measurement-calculator' || !Array.isArray(data.projects)) {
    throw new Error('Not a valid backup file.')
  }
  return data as BackupFile
}
