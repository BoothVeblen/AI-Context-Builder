import { create } from 'zustand'

interface State {
  isOpen: boolean
  pageTitle: string

  setIsOpen: (isOpen: boolean) => void
  setPageTitle: (pageTitle: string) => void
}

const defaultState = {
  isOpen: false,
  pageTitle: '',
}

export const useSidebarStore = create<State>((set) => ({
  ...defaultState,

  setIsOpen: (isOpen) => {
    set({ isOpen })
  },
  setPageTitle: (pageTitle) => {
    set({ pageTitle })
  },
}))
