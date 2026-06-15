import {
  forwardRef,
  useEffect,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
  type ReactNode,
} from 'react'

// ── className helper ─────────────────────────────────────────────────
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

// ── Button ───────────────────────────────────────────────────────────
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type Size = 'sm' | 'md' | 'lg'

const variants: Record<Variant, string> = {
  primary:
    'bg-primary text-primary-fg hover:brightness-110 active:brightness-95 shadow-glow',
  secondary: 'bg-elevated text-fg border border-border hover:bg-muted',
  outline: 'border border-border text-fg hover:bg-muted',
  ghost: 'text-subtle hover:text-fg hover:bg-muted',
  danger: 'bg-danger text-white hover:brightness-110 active:brightness-95',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm rounded-lg gap-1.5',
  md: 'h-11 px-4 text-[15px] rounded-xl gap-2',
  lg: 'h-14 px-6 text-base rounded-2xl gap-2.5',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  block?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', block, className, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex select-none items-center justify-center font-semibold',
        'transition active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50',
        'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25',
        variants[variant],
        sizes[size],
        block && 'w-full',
        className
      )}
      {...props}
    />
  )
)
Button.displayName = 'Button'

// ── IconButton ───────────────────────────────────────────────────────
interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  tone?: 'default' | 'danger'
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, tone = 'default', className, children, ...props }, ref) => (
    <button
      ref={ref}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition active:scale-90',
        'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25',
        tone === 'danger'
          ? 'text-subtle hover:bg-danger/10 hover:text-danger'
          : 'text-subtle hover:bg-muted hover:text-fg',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
)
IconButton.displayName = 'IconButton'

// ── Input ────────────────────────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  sizing?: Size
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, sizing = 'md', ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'input-base',
        sizing === 'lg' ? 'h-14 text-lg' : sizing === 'sm' ? 'h-10 text-sm' : 'h-12 text-base',
        className
      )}
      {...props}
    />
  )
)
Input.displayName = 'Input'

// ── Textarea ─────────────────────────────────────────────────────────
export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn('input-base min-h-[88px] resize-none py-3 text-base leading-relaxed', className)}
    {...props}
  />
))
Textarea.displayName = 'Textarea'

// ── NumberField ──────────────────────────────────────────────────────
// Owns its own text buffer so decimals/commas type smoothly even while the
// parent re-renders from the parsed numeric value. Accepts comma or dot.
function parseLoose(text: string): number {
  const n = parseFloat(text.replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

interface NumberFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'size'> {
  value: number
  onValueChange: (n: number) => void
  align?: 'left' | 'right'
  prefix?: string
  suffix?: string
}

export function NumberField({
  value,
  onValueChange,
  align = 'left',
  prefix,
  suffix,
  className,
  ...props
}: NumberFieldProps) {
  const [text, setText] = useState(value ? String(value) : '')

  // Sync only when the external value diverges from what's typed (e.g. reset).
  useEffect(() => {
    if (parseLoose(text) !== value) setText(value ? String(value) : '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <div className="relative">
      {prefix && (
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-subtle">
          {prefix}
        </span>
      )}
      <input
        inputMode="decimal"
        autoComplete="off"
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          onValueChange(parseLoose(e.target.value))
        }}
        onFocus={(e) => e.target.select()}
        className={cn(
          'input-base h-12 text-base tabular-nums',
          align === 'right' && 'text-right',
          prefix && 'pl-8',
          suffix && 'pr-12',
          className
        )}
        {...props}
      />
      {suffix && (
        <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-subtle">
          {suffix}
        </span>
      )}
    </div>
  )
}

// ── Field wrapper ────────────────────────────────────────────────────
export function Field({
  label,
  hint,
  children,
}: {
  label?: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      {label && <span className="label">{label}</span>}
      {children}
      {hint && <span className="mt-1 block text-xs text-subtle">{hint}</span>}
    </label>
  )
}

// ── Card ─────────────────────────────────────────────────────────────
export function Card({
  className,
  children,
  onClick,
}: {
  className?: string
  children: ReactNode
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={cn('card', onClick && 'cursor-pointer transition hover:border-primary/40', className)}
    >
      {children}
    </div>
  )
}

// ── Badge ────────────────────────────────────────────────────────────
export function Badge({
  children,
  tone = 'default',
  className,
}: {
  children: ReactNode
  tone?: 'default' | 'primary' | 'accent' | 'success'
  className?: string
}) {
  const tones = {
    default: 'bg-muted text-subtle',
    primary: 'bg-primary/12 text-primary',
    accent: 'bg-accent/12 text-accent',
    success: 'bg-success/12 text-success',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  )
}

// ── EmptyState ───────────────────────────────────────────────────────
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border px-6 py-14 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-subtle">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-fg">{title}</h3>
      <p className="mt-1.5 max-w-xs text-sm text-subtle">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
