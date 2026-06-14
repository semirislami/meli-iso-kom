import { create } from 'zustand'
import type { ConfirmState } from '../components/ConfirmDialog'

export interface Toast {
  id: number
  message: string
  tone: 'default' | 'success' | 'danger'
}

interface UIState {
  confirm: ConfirmState | null
  toasts: Toast[]
  ask: (c: ConfirmState) => void
  closeConfirm: () => void
  toast: (message: string, tone?: Toast['tone']) => void
  dismissToast: (id: number) => void
}

export const useUI = create<UIState>((set) => ({
  confirm: null,
  toasts: [],
  ask: (c) => set({ confirm: c }),
  closeConfirm: () => set({ confirm: null }),
  toast: (message, tone = 'default') => {
    const id = Date.now() + Math.random()
    set((s) => ({ toasts: [...s.toasts, { id, message, tone }] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, 2600)
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
