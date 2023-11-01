'use client'

import * as React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronRightIcon, Info } from 'lucide-react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

import AddTemplateButton from './add-template-button'
import {
  MAX_MAX_TOKENS,
  SUB_TYPE_MAP,
  SYSTEM_PROMPT_TEMPLATES,
  TASK_DEFAULT_VALUE_MAP,
} from './const'
import {
  InputItem,
  MemoryFormItem,
  MentionTextareaItem,
  SelectItem,
  SlideItem,
  TextareaItem,
} from './form-item'
import FormItemTitle from './form-item-title'
import { useWorkflowContext } from './store'
import useAutoSave from './use-auto-save'
import useResetForm from './use-reset-form'
import {
  formatWorkflowDataToSuggestionData,
  suggestionDataFormatter,
} from './utils'

interface IProps {
  taskId: string
  keyLabel?: string
  formValue: any
}

export const TemplateInfo = () => (
  <div className="flex items-center gap-1">
    System Prompt
    <Tooltip>
      <TooltipTrigger asChild>
        <Info size={18} color="#94A3B8" />
      </TooltipTrigger>
      <TooltipContent className="relative left-[88px] w-[332px]">
        <p className="break-words text-sm font-normal">{`If you want to quote the output results of another chain, please enter {key.output}.`}</p>
      </TooltipContent>
    </Tooltip>
  </div>
)

export default function TaskItemSelfCheckingChain({
  taskId,
  keyLabel,
  formValue,
}: IProps) {
  return (
    <FormProvider taskId={taskId} formValue={formValue}>
      <FormItems keyLabel={keyLabel} />
    </FormProvider>
  )
}

const FormSchema = z.object({
  llm: z.object({
    name: z.string({
      required_error: 'Please select a model.',
    }),
    api_key: z
      .string()
      .regex(/^sk-[a-zA-Z0-9]{48}$/, 'Please enter a valid key.')
      .optional()
      .or(z.literal('')),
    temperature: z.number().min(0).max(2).optional(),
    max_tokens: z.number().min(0).max(MAX_MAX_TOKENS).optional(),
    top_p: z.number().min(0).max(1).optional(),
    frequency_penalty: z.number().min(0).max(2).optional(),
    presence_penalty: z.number().min(0).max(2).optional(),
  }),
  prompt: z.object({
    template: z.string().optional(),
    target: z.string().optional(),
    check_prompt: z.string().optional(),
    follow_up_questions_num: z.number().min(0).step(1),
    output_definition: z.string().optional(),
  }),
  memory: z.object({
    memory_type: z.string().optional(),
    k: z.number().optional(),
    max_token_limit: z.number().optional(),
  }),
})

type IFormSchema = z.infer<typeof FormSchema>

interface FormProviderProps {
  children: React.ReactNode
  taskId: string
  formValue: any
}

const DEFAULT_VALUES: IFormSchema =
  TASK_DEFAULT_VALUE_MAP['self_checking_chain']

function FormProvider({ children, taskId, formValue }: FormProviderProps) {
  const defaultValues = formValue || DEFAULT_VALUES

  const form = useForm<IFormSchema>({
    resolver: zodResolver(FormSchema),
    defaultValues,
  })

  const editTaskFormValueStr = useWorkflowContext(
    (state) => state.editTaskFormValueStr
  )

  function onSave(data: IFormSchema) {
    editTaskFormValueStr(taskId, JSON.stringify(data))
  }

  useAutoSave<IFormSchema>(form, defaultValues, onSave)
  useResetForm<IFormSchema>(form, defaultValues)

  return (
    <Form {...form}>
      <form>{children}</form>
    </Form>
  )
}

function FormItems({ keyLabel }: { keyLabel?: string }) {
  return (
    <div className="h-full w-[380px] shrink-0 overflow-auto border-l border-slate-200 scrollbar-none">
      <div className="space-y-6 p-6 pb-[280px]">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">
            {SUB_TYPE_MAP['self_checking_chain'].title}
          </h2>
          {keyLabel && <Badge variant="secondary">key: {keyLabel}</Badge>}
        </div>
        <div className="space-y-6">
          <FormItemLLM />
          <div className="-mx-6 h-px shrink-0 bg-slate-100" />
          <FormItemPrompt />
          <div className="-mx-6 h-px shrink-0 bg-slate-100" />
          <MemoryFormItem />
        </div>
      </div>
    </div>
  )
}

const LLM_MODEL_NAME_OPTIONS = [
  { label: 'OpenAI-GPT-3.5', value: 'gpt-3.5-turbo' },
  { label: 'OpenAI-GPT-4', value: 'gpt-4' },
]

function FormItemLLM() {
  const [isExpend, setIsExpend] = React.useState(false)

  function toggle() {
    setIsExpend((v) => !v)
  }

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium text-slate-500">LLM</div>
      <div className="space-y-8">
        <SelectItem<IFormSchema>
          name="llm.name"
          label="Model"
          options={LLM_MODEL_NAME_OPTIONS}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full bg-slate-100"
          onClick={toggle}
        >
          <ChevronRightIcon
            className={cn(
              'mr-2 h-4 w-4 transition-transform',
              isExpend && ' rotate-90'
            )}
          />
          More model options
        </Button>
        {isExpend && (
          <>
            <InputItem<IFormSchema>
              name="llm.api_key"
              type="password"
              label="OpenAI Key"
            />
            <SlideItem<IFormSchema>
              name="llm.temperature"
              label="Temperature"
              min={0}
              max={2}
              step={0.01}
            />
            <SlideItem<IFormSchema>
              name="llm.max_tokens"
              label="Max Tokens"
              min={0}
              max={MAX_MAX_TOKENS}
              step={1}
            />
            <SlideItem<IFormSchema>
              name="llm.top_p"
              label="Top P"
              min={0}
              max={1}
              step={0.01}
            />
            <SlideItem<IFormSchema>
              name="llm.frequency_penalty"
              label="Frequency penalty"
              min={0}
              max={2}
              step={0.01}
            />
            <SlideItem<IFormSchema>
              name="llm.presence_penalty"
              label="Presence penalty"
              min={0}
              max={2}
              step={0.01}
            />
          </>
        )}
      </div>
    </div>
  )
}

function FormItemPrompt() {
  const workflowData = useWorkflowContext((state) => state.workflowData)

  const suggestionData = React.useMemo(
    () => [
      ...['target'].map(suggestionDataFormatter),
      ...formatWorkflowDataToSuggestionData(workflowData, ['output', 'dialog']),
    ],
    [workflowData]
  )

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium text-slate-500">PROMPT</div>
      <div className="space-y-8">
        <MentionTextareaItem<IFormSchema>
          name="prompt.template"
          label={
            <div className="flex items-center justify-between">
              <FormItemTitle
                title="System Prompt"
                tip="If you want to quote the output results of another chain, please enter {key.output}."
              />
              <AddTemplateButton config={SYSTEM_PROMPT_TEMPLATES} />
            </div>
          }
          data={suggestionData}
        />
        <TextareaItem<IFormSchema>
          name="prompt.target"
          label={
            <FormItemTitle
              title="Target"
              tip="Enter your goal, and let the AI determine whether the conversation has achieved its target."
            />
          }
        />
        <MentionTextareaItem<IFormSchema>
          name="prompt.check_prompt"
          label={
            <FormItemTitle
              title="Check Prompt"
              tip="This is where the AI makes its judgments, and it is recommended not to make any modifications."
            />
          }
          data={suggestionData}
        />
        <InputItem<IFormSchema>
          name="prompt.follow_up_questions_num"
          type="number"
          label="Maximum follow-up questions"
          min={0}
        />
        <MentionTextareaItem<IFormSchema>
          name="prompt.output_definition"
          label={
            <FormItemTitle
              title="Output Definition"
              tip="With the following configuration,to define the potential output of this conversation."
            />
          }
          data={suggestionData}
        />
      </div>
    </div>
  )
}
