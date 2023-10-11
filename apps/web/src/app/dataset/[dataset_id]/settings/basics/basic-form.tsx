'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { isEqual, omit } from 'lodash'
import { useForm } from 'react-hook-form'
import useSWRMutation from 'swr/mutation'
import { useDebounce } from 'usehooks-ts'
import { z } from 'zod'

import { fetcher } from '@/lib/utils'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { SchemaProps } from '@/app/dataset/type'

import { FormSchema } from '../../../type'
import TextEmbedding from './text-embedding'
import VectorStores from './vector-stores'

export interface FormProps {
  datasetId?: string
  name?: string
  config?: any
  setUploading?: (s: boolean) => void
}

type Params = SchemaProps

function editDataset(
  url: string,
  {
    arg,
  }: {
    arg: { name: string; config: Omit<Params, 'name'> }
  }
) {
  return fetcher(url, {
    method: 'PATCH',
    body: JSON.stringify(arg),
  })
}

const BasicsForm = ({ datasetId, config, name }: FormProps) => {
  const defaultValues = useMemo(() => {
    const basicsConfig = omit(config, [
      'files',
      'splitType',
      'chunkSize',
      'chunkOverlap',
      'loaderType',
    ])
    return { name, ...basicsConfig } as SchemaProps
  }, [name, config])
  const [values, setValues] = useState<SchemaProps>(defaultValues)
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    values,
  })

  const { handleSubmit, watch } = form
  const { trigger } = useSWRMutation(`/api/datasets/${datasetId}`, editDataset)
  const router = useRouter()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const formValue = useMemo(() => watch(), [JSON.stringify(watch())])
  const debouncedFormValue = useDebounce(formValue, 1000)
  const latestFormValueRef = useRef(defaultValues)
  const onSubmit = async (data: SchemaProps) => {
    try {
      const { name, ...rest } = data
      const json = await trigger({ name, config: rest })
      setValues({ name: json.body?.name, ...json?.body?.config })
      latestFormValueRef.current = data
      router.refresh()
    } catch (error) {}
  }

  useEffect(() => {
    if (!isEqual(debouncedFormValue, latestFormValueRef.current)) {
      handleSubmit(onSubmit)()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(debouncedFormValue)])

  return (
    <div className="hidden h-full w-full overflow-auto px-14 pb-[100px] pt-12 lg:block">
      <div className="sm:w-full md:max-w-[600px]">
        <Form {...form}>
          <form className="w-full">
            <section id="dataset-name" className="border-b py-6">
              <div className="mb-6 text-2xl font-semibold leading-8">
                Dataset Name
              </div>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="w-[332px]">
                    <FormLabel className="flex">
                      Dataset Name <div className="text-red-500">*</div>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Input your dataset name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>
            <TextEmbedding form={form} />
            <VectorStores form={form} />
          </form>
        </Form>
      </div>
    </div>
  )
}
export default BasicsForm
