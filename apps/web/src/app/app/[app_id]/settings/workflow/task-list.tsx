'use client'

import { useWorkflowContext } from './store'
import WorkflowTree from './workflow-tree'

export default function TaskList() {
  const workflowTree = useWorkflowContext((state) => state.workflowTree)
  const setWorkflowTree = useWorkflowContext((state) => state.setWorkflowTree)
  const workflowData = useWorkflowContext((state) => state.workflowData)

  return (
    <WorkflowTree
      value={workflowTree}
      onChange={setWorkflowTree}
      data={workflowData}
    />
  )
}
