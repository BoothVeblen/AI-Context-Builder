'use client'

import * as React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronRightIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'

import { MAX_MAX_TOKENS } from './const'
import {
  InputItem,
  ListSelectItem,
  SelectItem,
  SlideItem,
  TextareaItem,
} from './form-item'
import { useWorkflowContext } from './store'
import { TaskDefaultValueMap } from './task-default-value'
import useAutoSave from './use-auto-save'
import useResetForm from './use-reset-form'

interface IProps {
  taskId: string
  formValue: any
}

export default function TaskItemConversationChain({
  taskId,
  formValue,
}: IProps) {
  return (
    <FormProvider taskId={taskId} formValue={formValue}>
      <FormItems />
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
  }),
})

type IFormSchema = z.infer<typeof FormSchema>

interface FormProviderProps {
  children: React.ReactNode
  taskId: string
  formValue: any
}

const DEFAULT_VALUES: IFormSchema = TaskDefaultValueMap['conversation_chain']

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

function FormItems() {
  return (
    <div className="h-full w-[380px] shrink-0 overflow-auto border-l border-slate-200 scrollbar-none">
      <div className="space-y-6 p-6">
        <h2 className="text-lg font-semibold">Conversation Chain</h2>
        <div className="space-y-6">
          <FormItemLLM />
          <div className="-mx-6 h-px shrink-0 bg-slate-100" />
          <FormItemPrompt />
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
  return (
    <div className="space-y-4">
      <div className="text-sm font-medium text-slate-500">prompt</div>
      <div className="space-y-8">
        <TextareaItem<IFormSchema> name="prompt.template" label="Template" />
      </div>
    </div>
  )
}
