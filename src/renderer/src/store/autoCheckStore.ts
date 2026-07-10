import { create } from 'zustand'

interface AutoCheckScheduleState {
  nextCheckAt: number | null
  setNextCheckAt: (nextCheckAt: number | null) => void
}

export const useAutoCheckStore = create<AutoCheckScheduleState>((set) => ({
  nextCheckAt: null,
  setNextCheckAt: (nextCheckAt) => set({ nextCheckAt })
}))
