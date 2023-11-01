'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import useSWRMutation from 'swr/mutation'
import { z } from 'zod'

import { cn, fetcher } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { useToast } from '@/components/ui/use-toast'

import { DataSchema, DataSchemeProps, SegmentProps } from '../../../type'
import { useDataContext } from './data-context'
import DocumentLoader from './document-loader'
import Preview from './preview'
import TextSplits from './splitter'

function addData(
  url: string,
  { arg }: { arg: { dataset_id: string; dataConfig: DataSchemeProps } }
) {
  return fetcher(url, {
    method: 'POST',
    body: JSON.stringify(arg),
  })
}

function editData(
  url: string,
  {
    arg,
  }: {
    arg: {
      dataset_id: string
      dataConfig: DataSchemeProps
      uid: string
      document_id: string
    }
  }
) {
  return fetcher(url, {
    method: 'PATCH',
    body: JSON.stringify(arg),
  })
}

function getPreview(
  url: string,
  {
    arg,
  }: {
    arg: {
      dataset_id: string
      dataConfig: DataSchemeProps
      uid: string
      preview: number
    }
  }
) {
  return fetcher(url, {
    method: 'POST',
    body: JSON.stringify(arg),
  })
}

const DataForm = () => {
  const {
    defaultValues,
    datasetId,
    step,
    setStep,
    isAdd,
    uid = '',
    documentId,
  } = useDataContext()
  const [isPending, startTransition] = useTransition()
  const [previews, setPreviews] = useState<SegmentProps[]>([])
  const { toast } = useToast()

  const form = useForm<z.infer<typeof DataSchema>>({
    resolver: zodResolver(DataSchema),
    defaultValues,
  })

  const { getValues } = form
  const formValues = getValues()
  const dataConfig = { ...formValues }

  const { trigger: triggerAdd, isMutating } = useSWRMutation(
    `/api/datasets/document`,
    addData
  )

  const { trigger: triggerEdit, isMutating: editMutating } = useSWRMutation(
    `/api/datasets/document`,
    editData
  )

  const { trigger: triggerPreview, isMutating: previewMutating } =
    useSWRMutation(`/api/datasets/preview`, getPreview)
  const router = useRouter()
  const onSubmit = async () => {
    try {
      if (isAdd) {
        await triggerAdd({
          dataset_id: datasetId,
          dataConfig,
        })
      } else {
        await triggerEdit({
          dataset_id: datasetId,
          dataConfig,
          uid: uid,
          document_id: documentId,
        })
      }
    } catch (error) {}
  }

  const handleClick = async () => {
    const type = formValues?.loaderType
    const isNotedData = type === 'annotated_data'
    const current = isNotedData
      ? formValues?.notedData
      : formValues?.files?.filter((item) => item?.type === type)
    const text = type === 'annotated_data' ? 'Annotated Data' : 'document'
    if (!current?.length) {
      toast({
        variant: 'destructive',
        description: `Please select a ${text}.`,
      })
      return
    }
    if (step === 1) {
      setStep?.(step + 1)
      return
    }
    if (step === 2) {
      setStep?.(step + 1)
      const data = await triggerPreview({
        dataset_id: datasetId,
        dataConfig,
        uid: uid,
        preview: 5,
      })
      setPreviews(data?.segments)
      return
    } else {
      await onSubmit()
      router.refresh()
      startTransition(() => {
        const nextUrl = '/datasets'
        router.push(
          `/dataset/${datasetId}/settings/documents?nextUrl=${nextUrl}`
        )
      })
    }
  }

  return (
    <div className="h-full w-full">
      <div
        className={cn(
          'sm:w-full md:max-w-[600px]',
          step === 3 && 'md:max-w-[740px]'
        )}
      >
        <Form {...form}>
          <form className="w-full">
            {step === 1 && <DocumentLoader form={form} />}
            {step === 2 && <TextSplits form={form} />}
            {step === 3 && (
              <Preview data={previews} isLoading={previewMutating} />
            )}
          </form>
        </Form>
        <div
          className={cn('flex justify-between', step === 1 && 'justify-end')}
        >
          {step !== 1 && (
            <Button variant="outline" onClick={() => setStep?.(step - 1)}>
              Previous
            </Button>
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                form.reset()
                const nextUrl = '/datasets'
                router.push(
                  `/dataset/${datasetId}/settings/documents?nextUrl=${nextUrl}`
                )
              }}
            >
              Cancel
            </Button>
            {isAdd && (
              <Button onClick={handleClick} disabled={isPending || isMutating}>
                {step !== 3
                  ? 'Next'
                  : isPending || isMutating
                  ? 'Creating'
                  : 'Create'}
              </Button>
            )}
            {!isAdd && (
              <Button
                onClick={handleClick}
                disabled={isPending || editMutating}
              >
                {step !== 3
                  ? 'Next'
                  : isPending || editMutating
                  ? 'Saving'
                  : 'Save'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
export default DataForm
