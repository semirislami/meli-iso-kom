import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, AlertCircle, Info } from 'lucide-react'
import { useUI } from '../store/useUI'

const icons = {
  default: Info,
  success: CheckCircle2,
  danger: AlertCircle,
}

export function Toaster() {
  const toasts = useUI((s) => s.toasts)
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[70] flex flex-col items-center gap-2 px-4 pt-safe">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = icons[t.tone]
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.96 }}
              transition={{ type: 'spring', damping: 26, stiffness: 360 }}
              className="glass pointer-events-auto flex max-w-sm items-center gap-2.5 rounded-2xl border border-border px-4 py-3 text-sm font-medium shadow-soft"
            >
              <Icon
                size={18}
                className={
                  t.tone === 'success'
                    ? 'text-success'
                    : t.tone === 'danger'
                      ? 'text-danger'
                      : 'text-primary'
                }
              />
              <span>{t.message}</span>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
