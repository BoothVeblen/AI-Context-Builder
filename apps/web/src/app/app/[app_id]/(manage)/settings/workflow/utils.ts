import { safeParse } from '@/lib/utils'
import { TreeItem } from '@/components/dnd/types'

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
