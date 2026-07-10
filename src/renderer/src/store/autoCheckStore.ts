import { create } from 'zustand'

interface AutoCheckScheduleState {
  nextCheckAt: number | null
  scheduleEpoch: number
  setNextCheckAt: (nextCheckAt: number | null) => void
  bumpSchedule: () => void
}

export const useAutoCheckStore = create<AutoCheckScheduleState>((set) => ({
  nextCheckAt: null,
  scheduleEpoch: 0,
  setNextCheckAt: (nextCheckAt) => set({ nextCheckAt }),
  bumpSchedule: () => set((state) => ({ scheduleEpoch: state.scheduleEpoch + 1 }))
}))
