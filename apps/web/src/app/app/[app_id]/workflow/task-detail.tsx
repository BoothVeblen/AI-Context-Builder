import { XIcon } from 'lucide-react'

import { safeParse } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PdfImage } from '@/components/upload/component'

import { WorkflowItem } from '../settings/workflow/type'
import { DatasetProps } from './page'
import { useWorkflowContext } from './store'

interface IProps {
  value?: WorkflowItem
  onClose: () => void
}

function UpCaseStr(str: string) {
  return str
    ?.split('_')
    ?.join(' ')
    .toLowerCase()
    .replace(/( |^)[a-z]/g, (L) => L.toUpperCase())
}

export default function TaskDetail({ value, onClose }: IProps) {
  const dataset = useWorkflowContext((state) => state.dataset)
  if (!value) return null

  const { subType, formValueStr, key, type } = value
  const formValue = safeParse(formValueStr, {})
  const title =
    subType === 'conversation_chain'
      ? 'Conversation Chain'
      : 'Conversational Retrieval QA'
  const apiKey = formValue.llm?.api_key
  const modelName = formValue.llm?.name
  const temperature = formValue.llm?.temperature
  const topP = formValue.llm?.top_p
  const presencePenalty = formValue.llm?.presence_penalty
  const frequencyPenalty = formValue.llm?.frequency_penalty
  const promptTemplate = formValue.prompt?.template
  const retriever = UpCaseStr(formValue?.retriever?.type)
  const keyLabel = `${type}-${key}`
  const data = formValue?.data?.datasets
  const curDataset = dataset?.filter((item) => data?.includes(item?.dataset_id))
  return (
    <div className="space-y-8">
      <div className="-mr-2 -mt-2">
        <div className="-mr-2 -mt-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold">View App task</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <XIcon className="h-4 w-4" />
          </Button>
        </div>
        {keyLabel && <Badge variant="secondary">key: {keyLabel}</Badge>}
      </div>

      <Item label="Title" value={title} />
      <Item label="Key" value={apiKey} />
      <Item label="Model" value={modelName} />
      <Item label="Prompt" value={promptTemplate} />
      <Item label="Temperature" value={temperature} />
      <Item label="Top P" value={topP} />
      <Item label="Presence Penalty" value={presencePenalty} />
      <Item label="Frequency Penalty" value={frequencyPenalty} />
      <Item label="Retrievers" value={retriever} />
      <DatasetItem datasets={curDataset} />
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

function DatasetItem({ datasets }: { datasets?: DatasetProps[] }) {
  if (!datasets?.length) return null
  return (
    <div className="space-y-2">
      <div className="text-base font-medium">Data</div>
      {datasets?.map((item) => {
        return (
          <div
            className="flex items-center rounded-md border p-3"
            key={item?.dataset_id}
          >
            {item?.icon === 'pdf' && <PdfImage className="h-6" />}
            <div className="truncate text-sm">{item?.name}</div>
          </div>
        )
      })}
    </div>
  )
}
