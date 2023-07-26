'use client'

import * as React from 'react'

import { useWorkflowContext } from './store'
import TaskItemConversationChain from './task-item-conversation-chain'
import TaskItemConversationalRetrievalQA from './task-item-conversational-retrieval-qa'

export default function TaskDetail() {
  const selectedTask = useWorkflowContext((state) =>
    state.workflowData.find((d) => d.id === state.selectedTaskId)
  )

  const selectedTaskFormValue = React.useMemo(() => {
    try {
      if (selectedTask?.formValueStr && selectedTask?.formValueStr !== '{}') {
        return JSON.parse(selectedTask.formValueStr)
      }
      return null
    } catch (error) {
      return null
    }
  }, [selectedTask?.formValueStr])

  if (!selectedTask) return null

  switch (selectedTask.subType) {
    case 'conversation-chain':
      return (
        <TaskItemConversationChain
          key={selectedTask.id}
          taskId={selectedTask.id}
          formValue={selectedTaskFormValue}
        />
      )
    case 'conversational-retrieval-qa':
      return (
        <TaskItemConversationalRetrievalQA
          key={selectedTask.id}
          taskId={selectedTask.id}
          formValue={selectedTaskFormValue}
        />
      )
    default:
      return null
  }
}
