'use client'

import * as React from 'react'
import { UniqueIdentifier } from '@dnd-kit/core'
import { produce } from 'immer'
import { createStore, useStore } from 'zustand'

import { TreeItem } from '@/components/dnd/types'

import { WorkflowItem } from '../(manage)/settings/workflow/type'
import { DatasetProps } from './page'

interface Props {
  workflowTree: TreeItem[]
  workflowData: WorkflowItem[]
  selectedTaskId: UniqueIdentifier | null
  linkedDatasets: DatasetProps[]
}

interface State extends Props {
  selectTask: (id: UniqueIdentifier | null) => void
}

type Store = ReturnType<typeof createLocalStore>

const createLocalStore = (initProps?: Partial<Props>) => {
  const defaultProps: Props = {
    workflowTree: [],
    workflowData: [],
    selectedTaskId: null,
    linkedDatasets: [],
  }
  return createStore<State>()((set) => ({
    ...defaultProps,
    ...initProps,

    selectTask: (id) => {
      set(
        produce((draft: State) => {
          draft.selectedTaskId = id
        })
      )
    },
  }))
}

const Context = React.createContext<Store | null>(null)

type ProviderProps = React.PropsWithChildren<Props>

export function WorkflowProvider({ children, ...props }: ProviderProps) {
  const storeRef = React.useRef<Store>()
  if (!storeRef.current) {
    storeRef.current = createLocalStore(props)
  }
  return (
    <Context.Provider value={storeRef.current}>{children}</Context.Provider>
  )
}

export function useWorkflowContext<T>(
  selector: (state: State) => T,
  equalityFn?: (left: T, right: T) => boolean
): T {
  const store = React.useContext(Context)
  if (!store) throw new Error('Missing WorkflowProvider in the tree')
  return useStore(store, selector, equalityFn)
}
