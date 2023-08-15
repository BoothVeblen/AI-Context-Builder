import { RefObject, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { isEqual } from 'lodash'
import { useForm } from 'react-hook-form'
import useSWRMutation from 'swr/mutation'
import { useDebounce } from 'usehooks-ts'
import { z } from 'zod'

import { fetcher } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { FileProps } from '@/components/upload/utils'

import DocumentLoader, { stringUrlToFile } from './document-loader'
import { SchemaProps } from './setting-page'
import TextSplits from './splitter'
import TextEmbedding from './text-embedding'
import { FormSchema } from './utils'
import VectorStores from './vector-stores'

interface IProps {
  datasetId?: string
  showMore?: boolean
  files?: FileProps[]
  defaultValues: SchemaProps
  setShowMore?: (s: boolean) => void
  scrollRef: RefObject<HTMLDivElement>
  sectionRefs: RefObject<HTMLDivElement>[]
  setUploading?: (s: boolean) => void
}

type Params = SchemaProps

function editDataset(
  url: string,
  { arg }: { arg: { name: string; config: Omit<Params, 'name'> } }
) {
  return fetcher(url, {
    method: 'PATCH',
    body: JSON.stringify(arg),
  })
}

const DatasetForm = ({
  datasetId,
  defaultValues,
  setShowMore,
  showMore,
  scrollRef,
  sectionRefs,
  files,
  setUploading,
}: IProps) => {
  const uploadFiles = useMemo(() => {
    return files
      ? files.reduce((m: FileProps[], item: FileProps) => {
          const file = stringUrlToFile(item)
          m?.push(file)
          return m
        }, [])
      : []
  }, [files])

  const [data, setData] = useState<FileProps[]>(uploadFiles)
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
      console.log(`edit Dataset onSubmit json:`, json)
    } catch (error) {
      console.log('edit dataset error', error)
    }
  }

  useEffect(() => {
    if (!isEqual(debouncedFormValue, latestFormValueRef.current)) {
      handleSubmit(onSubmit)()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(debouncedFormValue)])

  return (
    <div
      className="h-full w-full overflow-auto px-14 pb-[100px] pt-12"
      ref={scrollRef}
    >
      <div className="sm:w-full md:max-w-[600px]">
        <Form {...form}>
          <form className="w-full">
            <section
              id="dataset-name"
              ref={sectionRefs[0]}
              className="border-b-[1px] py-6"
            >
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
            <DocumentLoader
              form={form}
              sectionRef={sectionRefs[1]}
              data={data}
              setData={setData}
              setUploading={setUploading}
            />
            {showMore ? (
              <>
                <TextSplits form={form} sectionRef={sectionRefs[2]} />
                <TextEmbedding form={form} sectionRef={sectionRefs[3]} />
                <VectorStores form={form} sectionRef={sectionRefs[4]} />
              </>
            ) : (
              <div className="flex w-full justify-center py-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowMore?.(true)
                  }}
                >
                  Show more options
                </Button>
              </div>
            )}
          </form>
        </Form>
      </div>
    </div>
  )
}
export default DatasetForm
