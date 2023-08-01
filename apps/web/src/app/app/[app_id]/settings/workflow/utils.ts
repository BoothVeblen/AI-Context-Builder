import { safeParse } from '@/lib/utils'

import { WorkflowItem } from './type'

export function taskToApiFormatter(task: WorkflowItem) {
  const { key, type, subType } = task
  const chain = safeParse(task.formValueStr, {})
  return {
    key: `${type}-${key}`,
    chain_type: subType,
    ...chain,
  }
}
