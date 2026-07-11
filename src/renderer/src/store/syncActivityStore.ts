import { create } from 'zustand'

interface SyncActivityState {
  activeCount: number
  isActive: boolean
  begin: () => void
  end: () => void
}

export const useSyncActivityStore = create<SyncActivityState>((set, get) => ({
  activeCount: 0,
  isActive: false,

  begin: () => {
    const activeCount = get().activeCount + 1

    set({
      activeCount,
      isActive: activeCount > 0
    })
  },

  end: () => {
    const activeCount = Math.max(0, get().activeCount - 1)

    set({
      activeCount,
      isActive: activeCount > 0
    })
  }
}))
