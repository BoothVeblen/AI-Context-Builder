import { produce } from 'immer'
import { create } from 'zustand'

interface ExploreState {
  selectedCategoryId: string

  resetState: () => void
  setSelectedCategoryId: (id: string) => void
}

const defaultState = {
  selectedCategoryId: 'all',
}

export const useExploreStore = create<ExploreState>((set) => ({
  ...defaultState,
  resetState: () => {
    set(() => defaultState)
  },
  setSelectedCategoryId: (id: string) => {
    set(
      produce((draft: ExploreState) => {
        draft.selectedCategoryId = id
      })
    )
  },
}))
