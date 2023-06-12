import { create } from 'zustand'

export const useFlagStore = create(() => ({
  enabledAuth: false,
}))
