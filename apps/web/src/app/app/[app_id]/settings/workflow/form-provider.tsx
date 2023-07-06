'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useFormContext as useFormContextHook } from 'react-hook-form'
import * as z from 'zod'

import { Form } from '@/components/ui/form'
import { toast } from '@/components/ui/use-toast'

export const FormSchema = z.object({
  model_name: z.string({
    required_error: 'Please select a model.',
  }),
  model_temperature: z.array(z.number().min(0).max(1)),
  memory_key: z.string().optional(),
  prompt_template: z.string().optional(),
  data_datasets: z.array(z.string()).optional(),
})

export type IFormSchema = z.infer<typeof FormSchema>

export function useFormContext() {
  return useFormContextHook<IFormSchema>()
}

interface IProps {
  children: React.ReactNode
}

export default function FormProvider({ children }: IProps) {
  const form = useForm<IFormSchema>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      model_name: 'openai-gpt4',
      model_temperature: [0.9],
      prompt_template: '',
    },
  })

  function onSubmit(data: IFormSchema) {
    toast({
      title: 'You submitted the following values:',
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="h-full">
        {children}
      </form>
    </Form>
  )
}
