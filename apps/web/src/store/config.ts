import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ConfigState {
  timeframeFilter: string
  changeTimeframeFilter: (timeframe: string) => void
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      timeframeFilter: 'last7days',
      changeTimeframeFilter: (timeframe: string) =>
        set({ timeframeFilter: timeframe }),
    }),
    {
      name: 'config-storage',
      partialize: (state) => ({ timeframeFilter: state.timeframeFilter }),
    }
  )
)
