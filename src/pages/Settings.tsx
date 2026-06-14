import { useRef } from 'react'
import {
  Sun,
  Moon,
  Monitor,
  Download,
  Upload,
  Trash2,
  Building2,
  Ruler,
  Github,
  Info,
} from 'lucide-react'
import { useSettings, settingsSnapshot } from '../store/useSettings'
import { useStore } from '../store/useStore'
import { useUI } from '../store/useUI'
import type { ThemeMode } from '../types'
import { Button, Card, Field, Input, cn } from '../components/ui'
import { downloadBackup, parseBackup } from '../lib/backup'

export function Settings() {
  const settings = useSettings()
  const projects = useStore((s) => s.projects)
  const replaceProjects = useStore((s) => s.replaceProjects)
  const { ask, toast } = useUI()
  const fileRef = useRef<HTMLInputElement>(null)

  const themes: { key: ThemeMode; label: string; icon: typeof Sun }[] = [
    { key: 'light', label: 'Light', icon: Sun },
    { key: 'dark', label: 'Dark', icon: Moon },
    { key: 'system', label: 'Auto', icon: Monitor },
  ]

  const handleImport = async (file: File) => {
    try {
      const text = await file.text()
      const backup = parseBackup(text)
      ask({
        title: 'Restore backup?',
        message: `This replaces your current data with ${backup.projects.length} project(s) from the backup.`,
        confirmLabel: 'Restore',
        tone: 'primary',
        onConfirm: () => {
          replaceProjects(backup.projects)
          if (backup.settings) settings.replaceAll(backup.settings)
          toast('Backup restored', 'success')
        },
      })
    } catch {
      toast('Invalid backup file', 'danger')
    }
  }

  return (
    <div className="space-y-6 py-2">
      <header className="pt-2">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-subtle">Personalize your reports and app.</p>
      </header>

      {/* Appearance */}
      <Section title="Appearance">
        <div className="grid grid-cols-3 gap-2">
          {themes.map((t) => {
            const active = settings.theme === t.key
            const Icon = t.icon
            return (
              <button
                key={t.key}
                onClick={() => settings.update({ theme: t.key })}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl border py-4 transition active:scale-95',
                  active
                    ? 'border-primary/60 bg-primary/10 text-primary'
                    : 'border-border bg-surface text-subtle hover:text-fg'
                )}
              >
                <Icon size={22} />
                <span className="text-[13px] font-semibold">{t.label}</span>
              </button>
            )
          })}
        </div>
      </Section>

      {/* Company / branding */}
      <Section title="Report branding" icon={<Building2 size={16} />}>
        <div className="space-y-4">
          <Field label="Name on PDF reports" hint="Appears as the header on every exported report.">
            <Input
              value={settings.companyName}
              onChange={(e) => settings.update({ companyName: e.target.value })}
              placeholder="Your name or company"
            />
          </Field>
          <Field label="Contact line (optional)" hint="Phone, email or address — shown under your name.">
            <Input
              value={settings.companyContact}
              onChange={(e) => settings.update({ companyContact: e.target.value })}
              placeholder="+387 ·· ··· ··· · info@example.com"
            />
          </Field>
        </div>
      </Section>

      {/* Units */}
      <Section title="Measurement format" icon={<Ruler size={16} />}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Unit label">
              <Input
                value={settings.unit}
                onChange={(e) => settings.update({ unit: e.target.value })}
                placeholder="m²"
              />
            </Field>
            <Field label="Decimals">
              <div className="flex gap-1.5">
                {[0, 1, 2, 3].map((d) => (
                  <button
                    key={d}
                    onClick={() => settings.update({ decimals: d })}
                    className={cn(
                      'h-12 flex-1 rounded-xl border text-sm font-semibold transition',
                      settings.decimals === d
                        ? 'border-primary/60 bg-primary/10 text-primary'
                        : 'border-border bg-surface text-subtle'
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </Field>
          </div>
          <Field label="Decimal separator">
            <div className="grid grid-cols-2 gap-2">
              {(['comma', 'dot'] as const).map((sep) => (
                <button
                  key={sep}
                  onClick={() => settings.update({ decimalSeparator: sep })}
                  className={cn(
                    'h-12 rounded-xl border text-sm font-semibold transition',
                    settings.decimalSeparator === sep
                      ? 'border-primary/60 bg-primary/10 text-primary'
                      : 'border-border bg-surface text-subtle'
                  )}
                >
                  {sep === 'comma' ? '16,5  (comma)' : '16.5  (dot)'}
                </button>
              ))}
            </div>
          </Field>
        </div>
      </Section>

      {/* Data / backup */}
      <Section title="Data & backup">
        <div className="space-y-2.5">
          <Button
            variant="secondary"
            block
            onClick={() => downloadBackup(projects, settingsSnapshot(settings))}
          >
            <Download size={18} /> Export backup ({projects.length})
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleImport(f)
              e.target.value = ''
            }}
          />
          <Button variant="secondary" block onClick={() => fileRef.current?.click()}>
            <Upload size={18} /> Restore from backup
          </Button>
          <Button
            variant="ghost"
            block
            className="text-danger hover:bg-danger/10"
            onClick={() =>
              ask({
                title: 'Delete everything?',
                message: 'All projects and measurements will be permanently erased from this device.',
                confirmLabel: 'Erase all',
                onConfirm: () => {
                  replaceProjects([])
                  toast('All data cleared')
                },
              })
            }
          >
            <Trash2 size={18} /> Clear all data
          </Button>
        </div>
      </Section>

      {/* About */}
      <Card className="flex items-start gap-3 p-4 text-sm text-subtle">
        <Info size={18} className="mt-0.5 shrink-0 text-primary" />
        <div>
          <p className="font-medium text-fg">Works offline.</p>
          <p className="mt-0.5">
            Your data lives only on this device. Export a backup regularly and add the app to your
            home screen for one-tap access on site.
          </p>
        </div>
      </Card>

      <p className="flex items-center justify-center gap-1.5 pb-2 text-center text-xs text-subtle">
        <Github size={13} /> Construction Measurement Calculator · v1.0
      </p>
    </div>
  )
}

function Section({
  title,
  icon,
  children,
}: {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section>
      <h2 className="mb-2.5 flex items-center gap-1.5 px-1 text-sm font-semibold text-subtle">
        {icon}
        {title}
      </h2>
      {children}
    </section>
  )
}
