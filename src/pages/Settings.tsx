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
    { key: 'light', label: 'E çelët', icon: Sun },
    { key: 'dark', label: 'E errët', icon: Moon },
    { key: 'system', label: 'Auto', icon: Monitor },
  ]

  const handleImport = async (file: File) => {
    try {
      const text = await file.text()
      const backup = parseBackup(text)
      ask({
        title: 'Të rikthehet rezervimi?',
        message: `Kjo i zëvendëson të dhënat aktuale me ${backup.projects.length} projekt(e) nga rezervimi.`,
        confirmLabel: 'Rikthe',
        tone: 'primary',
        onConfirm: () => {
          replaceProjects(backup.projects)
          if (backup.settings) settings.replaceAll(backup.settings)
          toast('Rezervimi u rikthye', 'success')
        },
      })
    } catch {
      toast('Skedar rezervimi i pavlefshëm', 'danger')
    }
  }

  return (
    <div className="space-y-6 py-2">
      <header className="pt-2">
        <h1 className="text-2xl font-bold tracking-tight">Cilësimet</h1>
        <p className="text-sm text-subtle">Personalizo raportet dhe aplikacionin.</p>
      </header>

      {/* Appearance */}
      <Section title="Pamja">
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
      <Section title="Markimi i raportit" icon={<Building2 size={16} />}>
        <div className="space-y-4">
          <Field label="Emri në raportet PDF" hint="Shfaqet si titull në çdo raport të eksportuar.">
            <Input
              value={settings.companyName}
              onChange={(e) => settings.update({ companyName: e.target.value })}
              placeholder="Emri yt ose kompania"
            />
          </Field>
          <Field label="Rreshti i kontaktit (opsional)" hint="Telefon, email ose adresë — shfaqet nën emrin tënd.">
            <Input
              value={settings.companyContact}
              onChange={(e) => settings.update({ companyContact: e.target.value })}
              placeholder="+389 ·· ··· ··· · info@example.com"
            />
          </Field>
        </div>
      </Section>

      {/* Units */}
      <Section title="Formati i matjeve" icon={<Ruler size={16} />}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Etiketa e njësisë">
              <Input
                value={settings.unit}
                onChange={(e) => settings.update({ unit: e.target.value })}
                placeholder="m²"
              />
            </Field>
            <Field label="Decimalet">
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
          <Field label="Ndarësi dhjetor">
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
                  {sep === 'comma' ? '16,5  (presje)' : '16.5  (pikë)'}
                </button>
              ))}
            </div>
          </Field>
        </div>
      </Section>

      {/* Data / backup */}
      <Section title="Të dhënat & rezervimi">
        <div className="space-y-2.5">
          <Button
            variant="secondary"
            block
            onClick={() => downloadBackup(projects, settingsSnapshot(settings))}
          >
            <Download size={18} /> Eksporto rezervim ({projects.length})
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
            <Upload size={18} /> Rikthe nga rezervimi
          </Button>
          <Button
            variant="ghost"
            block
            className="text-danger hover:bg-danger/10"
            onClick={() =>
              ask({
                title: 'Të fshihet gjithçka?',
                message: 'Të gjitha projektet dhe matjet do të fshihen përgjithmonë nga kjo pajisje.',
                confirmLabel: 'Fshij gjithçka',
                onConfirm: () => {
                  replaceProjects([])
                  toast('Të gjitha të dhënat u fshinë')
                },
              })
            }
          >
            <Trash2 size={18} /> Fshij të gjitha të dhënat
          </Button>
        </div>
      </Section>

      {/* About */}
      <Card className="flex items-start gap-3 p-4 text-sm text-subtle">
        <Info size={18} className="mt-0.5 shrink-0 text-primary" />
        <div>
          <p className="font-medium text-fg">Punon pa internet.</p>
          <p className="mt-0.5">
            Të dhënat ruhen vetëm në këtë pajisje. Eksporto një rezervim rregullisht dhe shto
            aplikacionin në ekranin kryesor për qasje me një prekje në terren.
          </p>
        </div>
      </Card>

      <p className="flex items-center justify-center gap-1.5 pb-2 text-center text-xs text-subtle">
        <Github size={13} /> Llogaritësi i Matjeve në Ndërtim · v1.0
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
