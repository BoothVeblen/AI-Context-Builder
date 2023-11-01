import { set } from 'lodash'

import { safeParse } from '@/lib/utils'
import { TreeItem } from '@/components/dnd/types'

import { TASK_DEFAULT_VALUE_MAP } from './const'
import { WorkflowItem } from './type'

export function taskToApiFormatter(task: WorkflowItem) {
  const { key, type, subType } = task
  const chain = safeParse(task.formValueStr, {})
  if (chain.data) {
    chain.datasets = chain.data.datasets || []
    delete chain.data
  }
  return {
    key: `${type}-${key}`,
    chain_type: subType,
    ...chain,
  }
}

export function formatTreeWithData(
  tree: TreeItem[],
  data: WorkflowItem[],
  result: WorkflowItem[] = []
): WorkflowItem[] {
  for (const t of tree) {
    const task = data.find((d) => d.id === t.id)
    if (task) result.push(task)

    if (t.children && t.children.length > 0) {
      formatTreeWithData(t.children, data, result)
    }
  }

  return result
}

export const formatWorkflowDataToSuggestionData = (
  workflowData: WorkflowItem[],
  keywords: string[]
) => {
  return workflowData?.reduce(
    (m: { id: string; display: string }[], item: WorkflowItem) => {
      for (const keyword of keywords) {
        const key = `${item?.type}-${item?.key}.${keyword}`
        m?.push({ id: key, display: key })
      }
      return m
    },
    []
  )
}

export function suggestionDataFormatter(id: string) {
  return { id, display: id }
}

export function formatRetrieverType(str: string) {
  return str
    ?.split('_')
    ?.join(' ')
    .toLowerCase()
    .replace(/( |^)[a-z]/g, (L) => L.toUpperCase())
}

export function getTaskDefaultValue(
  subType: keyof typeof TASK_DEFAULT_VALUE_MAP,
  options: Record<string, any>
) {
  const formValue = TASK_DEFAULT_VALUE_MAP[subType]
  Object.entries(options)?.forEach(([key, value]) => {
    set(formValue, key, value)
  })
  return formValue
}
