import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import { Button } from './ui'

export interface ConfirmState {
  title: string
  message: string
  confirmLabel?: string
  tone?: 'danger' | 'primary'
  onConfirm: () => void
}

export function ConfirmDialog({
  state,
  onClose,
}: {
  state: ConfirmState | null
  onClose: () => void
}) {
  return (
    <AnimatePresence>
      {state && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-5">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 340 }}
            className="card relative w-full max-w-sm p-6 text-center"
          >
            <div
              className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${
                state.tone === 'primary'
                  ? 'bg-primary/12 text-primary'
                  : 'bg-danger/12 text-danger'
              }`}
            >
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-lg font-semibold">{state.title}</h3>
            <p className="mt-1.5 text-sm text-subtle">{state.message}</p>
            <div className="mt-6 flex gap-3">
              <Button variant="secondary" block onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant={state.tone === 'primary' ? 'primary' : 'danger'}
                block
                onClick={() => {
                  state.onConfirm()
                  onClose()
                }}
              >
                {state.confirmLabel ?? 'Confirm'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
