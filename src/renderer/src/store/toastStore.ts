import { create } from 'zustand'

export type ToastSeverity = 'success' | 'warning' | 'error'

export interface Toast {
  id: string
  severity: ToastSeverity
  title: string
  message?: string
  duration?: number
}

interface ToastState {
  current: Toast | null
  queue: Toast[]
  show: (toast: Omit<Toast, 'id'>) => void
  dismiss: () => void
}

export const useToastStore = create<ToastState>((set) => ({
  current: null,
  queue: [],

  show: (toast) => {
    const item: Toast = { ...toast, id: crypto.randomUUID() }

    set((state) => {
      if (!state.current) {
        return { current: item }
      }

      return { queue: [...state.queue, item] }
    })
  },

  dismiss: () => {
    set((state) => {
      if (state.queue.length === 0) {
        return { current: null }
      }

      const [next, ...rest] = state.queue
      return { current: next, queue: rest }
    })
  }
}))
