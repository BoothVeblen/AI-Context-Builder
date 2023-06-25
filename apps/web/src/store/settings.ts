import { produce } from 'immer'
import { create } from 'zustand'

import { nanoid } from '@/lib/utils'
import { TreeItem } from '@/components/dnd/types'

export type WorkflowType = 'model' | 'tool' | 'agent' | string

export type WorkflowItem = {
  id: string
  type: WorkflowType
  subType: string
  name: string
}

interface State {
  workflowTree: TreeItem[]
  workflowData: WorkflowItem[]

  resetState: () => void
  addWorkflow: (type: WorkflowType, subType: string) => void
  setWorkflowTree: (tree: TreeItem[]) => void
}

const defaultState = {
  workflowTree: [],
  workflowData: [],
}

export const useSettingsStore = create<State>((set) => ({
  ...defaultState,

  resetState: () => {
    set(() => defaultState)
  },
  addWorkflow: (type: WorkflowType, subType: string) => {
    set(
      produce((draft: State) => {
        const id = nanoid()
        console.log('id:', id)
        draft.workflowData.push({
          id,
          type,
          subType,
          name: subType, // tmp name
        })
        draft.workflowTree.push({
          id,
          children: [],
        })
      })
    )
  },
  setWorkflowTree: (tree: TreeItem[]) => {
    set(
      produce((draft: State) => {
        draft.workflowTree = tree
      })
    )
  },
}))
