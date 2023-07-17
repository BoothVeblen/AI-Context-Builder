import { RefObject, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { UploadFile } from '@/components/upload/type'

import DocumentLoader, { FileProps, stringUrlToFile } from './document-loader'
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

function editDataset(url: string, { arg }: { arg: SchemaProps }) {
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
      ? files.reduce((m: UploadFile<any>[], item: FileProps) => {
          const file = stringUrlToFile(item)
          m?.push(file)
          return m
        }, [])
      : []
  }, [files])

  const [data, setData] = useState<UploadFile<any>[]>(uploadFiles)
  const [values, setValues] = useState<SchemaProps>(defaultValues)

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    values,
  })

  const { handleSubmit } = form
  const { trigger } = useSWRMutation(`/api/datasets/${datasetId}`, editDataset)
  const router = useRouter()
  const current = useDebounce(form.getValues(), 1000)

  const onSubmit = async (data: SchemaProps) => {
    try {
      const json = await trigger(data)
      setValues(json.body)
      router.refresh()
      console.log(`edit Dataset onSubmit json:`, json)
    } catch (error) {
      console.log('edit dataset error', error)
    }
  }

  const checkFiles = useMemo(() => {
    const files = current?.files
    const origin = values?.files
    if (files?.length !== origin?.length) {
      return true
    }
    files?.forEach((item: FileProps) => {
      const index = origin?.findIndex((m: FileProps) => m?.url === item?.url)
      if (index === -1) {
        return true
      }
    })
    return false
  }, [current?.files, values?.files])

  const checkIsUpdate = useMemo(() => {
    if (checkFiles) {
      return true
    }
    for (let k in current) {
      // @ts-ignore
      if (k !== 'files' && current?.[k] !== values?.[k]) {
        return true
      }
    }
    return false
  }, [checkFiles, current, values])

  useEffect(() => {
    if (checkIsUpdate) {
      handleSubmit(onSubmit)()
    } else {
      return
    }
  }, [current])

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
