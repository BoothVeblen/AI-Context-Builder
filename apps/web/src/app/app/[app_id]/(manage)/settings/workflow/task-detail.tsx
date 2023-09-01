'use client'

import * as React from 'react'

import { useWorkflowContext } from './store'
import TaskItemConversationChain from './task-item-conversation-chain'
import TaskItemConversationalRetrievalQA from './task-item-conversational-retrieval-qa'
import TaskItemSelfCheckingChain from './task-item-self-checking-chain'

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

  const keyLabel =
    selectedTask.key != null
      ? `${selectedTask.type}-${selectedTask.key}`
      : undefined

  switch (selectedTask.subType) {
    case 'conversation_chain':
      return (
        <TaskItemConversationChain
          key={selectedTask.id}
          keyLabel={keyLabel}
          taskId={selectedTask.id}
          formValue={selectedTaskFormValue}
        />
      )
    case 'conversational_retrieval_qa_chain':
      return (
        <TaskItemConversationalRetrievalQA
          key={selectedTask.id}
          keyLabel={keyLabel}
          taskId={selectedTask.id}
          formValue={selectedTaskFormValue}
        />
      )
    case 'self_checking_chain':
      return (
        <TaskItemSelfCheckingChain
          key={selectedTask.id}
          keyLabel={keyLabel}
          taskId={selectedTask.id}
          formValue={selectedTaskFormValue}
        />
      )
    default:
      return null
  }
}
