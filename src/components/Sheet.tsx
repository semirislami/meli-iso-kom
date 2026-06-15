import { type ReactNode, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { IconButton } from './ui'

/**
 * Mobile-first bottom sheet. Slides up from the bottom on phones and
 * centers as a dialog on larger screens. Closes on backdrop tap / Esc.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%', opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0.6 }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            className="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-border bg-surface
              shadow-soft sm:max-w-lg sm:rounded-3xl"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="hidden h-1.5 w-9 rounded-full bg-border sm:hidden" />
                <h2 className="text-lg font-semibold">{title}</h2>
              </div>
              <IconButton label="Mbyll" onClick={onClose}>
                <X size={20} />
              </IconButton>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
            {footer && (
              <div className="border-t border-border bg-surface px-5 py-4 pb-safe">{footer}</div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
