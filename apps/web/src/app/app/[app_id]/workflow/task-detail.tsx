import { Database, XIcon } from 'lucide-react'
import { Mention, MentionsInput } from 'react-mentions'

import { safeParse } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PdfImage } from '@/components/upload/component'

import { SUB_TYPE_MAP } from '../(manage)/settings/workflow/const'
import { WorkflowItem } from '../(manage)/settings/workflow/type'
import { formatRetrieverType } from '../(manage)/settings/workflow/utils'
import styles from './mention-textarea.module.css'
import { DatasetProps } from './page'
import { useWorkflowContext } from './store'

interface IProps {
  value?: WorkflowItem
  onClose: () => void
}

export default function TaskDetail({ value, onClose }: IProps) {
  const linkedDatasets = useWorkflowContext((state) => state.linkedDatasets)
  if (!value) return null

  const { subType, formValueStr, key, type } = value
  const formValue = safeParse(formValueStr, {})
  const title = SUB_TYPE_MAP[subType as keyof typeof SUB_TYPE_MAP]?.title ?? ''
  const modelName = formValue.llm?.name
  const temperature = formValue.llm?.temperature
  const topP = formValue.llm?.top_p
  const presencePenalty = formValue.llm?.presence_penalty
  const frequencyPenalty = formValue.llm?.frequency_penalty
  const systemPrompt = formValue.prompt?.template
  const basicPrompt = formValue.prompt?.basic_prompt
  const target = formValue.prompt?.target
  const checkPrompt = formValue.prompt?.check_prompt
  const followUpQuestionsNumber = formValue.prompt?.follow_up_questions_num
  const retriever = formatRetrieverType(formValue?.retriever?.type)
  const keyLabel = `${type}-${key}`
  const datasetIds = formValue?.data?.datasets
  const datasets = linkedDatasets?.filter(
    (item) => datasetIds?.includes(item?.dataset_id)
  )

  return (
    <div className="space-y-8">
      <div className="-mr-2 -mt-2">
        <div className="-mr-2 -mt-2 flex items-center justify-between">
          <h2 className="truncate text-lg font-semibold">{title}</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="shrink-0"
          >
            <XIcon className="h-4 w-4" />
          </Button>
        </div>
        {keyLabel && <Badge variant="secondary">key: {keyLabel}</Badge>}
      </div>

      <Item label="Model" value={modelName} />
      {systemPrompt && (
        <PromptItem title="System Prompt" value={systemPrompt} />
      )}
      {basicPrompt && <PromptItem title="Basic Prompt" value={basicPrompt} />}
      {target && <Item label="Target" value={target} />}
      {checkPrompt && <PromptItem title="Check Prompt" value={checkPrompt} />}
      {followUpQuestionsNumber != null && (
        <Item
          label="Maximum follow-up questions"
          value={followUpQuestionsNumber}
        />
      )}

      <Item label="Temperature" value={temperature} />
      <Item label="Top P" value={topP} />
      <Item label="Presence Penalty" value={presencePenalty} />
      <Item label="Frequency Penalty" value={frequencyPenalty} />
      <Item label="Retrievers" value={retriever} />
      <DatasetItem datasets={datasets} />
    </div>
  )
}

const PromptItem = ({ title, value }: { title: string; value: string }) => {
  return (
    <div className="space-y-2">
      <div className="text-base font-medium">{title}</div>
      <MentionsInput value={value} disabled classNames={styles}>
        <Mention
          data={[]}
          markup="[__display__]"
          className={styles.mentions__mention}
          trigger="{"
        />
      </MentionsInput>
    </div>
  )
}

function Item({ label, value }: { label: string; value: string }) {
  if (value == null || value === '') return null

  return (
    <div className="space-y-2">
      <div className="text-base font-medium">{label}</div>
      <div className="whitespace-pre-line  break-words text-sm">{value}</div>
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
            <Database size={24} className="shrink-0 text-orange-600" />
            <div className="truncate text-sm">{item?.name}</div>
          </div>
        )
      })}
    </div>
  )
}
