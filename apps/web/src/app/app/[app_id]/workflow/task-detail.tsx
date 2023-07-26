import { XIcon } from 'lucide-react'

import { safeParse } from '@/lib/utils'
import { Button } from '@/components/ui/button'

import { WorkflowItem } from '../settings/workflow/type'

interface IProps {
  value?: WorkflowItem
  onClose: () => void
}

export default function TaskDetail({ value, onClose }: IProps) {
  if (!value) return null

  const { subType, formValueStr } = value
  const formValue = safeParse(formValueStr, {})

  const title =
    subType === 'conversation-chain'
      ? 'Conversation Chain'
      : 'Conversational Retrieval QA'
  const apiKey = formValue.llm?.api_key
  const modelName = formValue.llm?.model_name
  const temperature = formValue.llm?.temperature
  const topP = formValue.llm?.top_p
  const presencePenalty = formValue.llm?.presence_penalty
  const frequencyPenalty = formValue.llm?.frequency_penalty
  const promptTemplate = formValue.prompt?.template

  return (
    <div className="space-y-8">
      <div className="-mr-2 -mt-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold">View App task</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <XIcon className="h-4 w-4" />
        </Button>
      </div>
      <Item label="Title" value={title} />
      <Item label="Key" value={apiKey} />
      <Item label="Model" value={modelName} />
      <Item label="Prompt" value={promptTemplate} />
      <Item label="Temperature" value={temperature} />
      <Item label="Top P" value={topP} />
      <Item label="Presence Penalty" value={presencePenalty} />
      <Item label="Frequency Penalty" value={frequencyPenalty} />
    </div>
  )
}

function Item({ label, value }: { label: string; value: string }) {
  if (value == null || value === '') return null

  return (
    <div className="space-y-2">
      <div className="text-base font-medium">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  )
}
