'use client'

import { useMemo, useState } from 'react'
import { Loader2Icon, Plus, X } from 'lucide-react'
import { UseFormReturn } from 'react-hook-form'
import useSWRMutation from 'swr/mutation'

import { fetcher } from '@/lib/utils'
import { AlertDialog, AlertDialogContent } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { DocumentProps } from '@/app/dataset/type'

import { useDataContext } from './data-context'
import NotedDataCard from './noted-data-card'
import AnnotatedForm from './noted-form'

interface IProps {
  form: UseFormReturn<any>
}

function getDisabledData(url: string) {
  return fetcher(url, {
    method: 'GET',
  })
}

const AddAnnotatedData = ({ form }: IProps) => {
  const { getValues } = form
  const formValue = getValues()

  const { datasetId, isAdd, defaultValues } = useDataContext()
  const [disabledData, setDisabledData] = useState<DocumentProps[]>([])

  const cardList = formValue.notedData
  const [open, setOpen] = useState(false)
  const { trigger, isMutating } = useSWRMutation(
    `/api/datasets/preview?dataset_id=${datasetId}`,
    getDisabledData
  )
  const [selected, setSelected] = useState<DocumentProps[]>(cardList)

  const deleteNotedData = (id: string) => {
    const newData =
      cardList?.filter((item: DocumentProps) => item?.uid !== id) || []
    form.setValue('notedData', newData)
    setSelected(newData)
  }

  const showButton = useMemo(
    () => isAdd || (!isAdd && cardList?.length == 0),
    [cardList?.length, isAdd]
  )

  const choseNotedData = async () => {
    const data = await trigger()
    if (isAdd) {
      setDisabledData(data)
    } else {
      const current = defaultValues?.notedData?.[0]
      const disabled = data?.filter(
        (item: DocumentProps) => item?.uid !== current?.uid
      )
      setDisabledData(disabled)
    }
    setOpen(true)
  }

  return (
    <div>
      <AlertDialog open={open} onOpenChange={setOpen}>
        {showButton && (
          <Button
            type="button"
            onClick={choseNotedData}
            disabled={isMutating}
            className="gap-1"
          >
            {isMutating ? (
              <Loader2Icon className="h-4 w-4 animate-spin" />
            ) : (
              <Plus size={16} />
            )}
            Add Annotated Data
          </Button>
        )}

        <AlertDialogContent className="flex max-h-[60%] flex-col overflow-hidden p-0">
          <AnnotatedForm
            form={form}
            selected={selected}
            cardList={cardList}
            disabledData={disabledData}
            setSelected={setSelected}
            setOpen={setOpen}
          />
        </AlertDialogContent>
      </AlertDialog>
      <div className="mt-4 space-y-2">
        {cardList?.map((item: DocumentProps) => {
          return (
            <div
              key={item?.uid}
              className="flex flex-row items-center justify-between gap-2 space-x-3 space-y-0 truncate rounded-lg border border-slate-200 p-4"
            >
              <NotedDataCard data={item} />
              <Button
                variant="outline"
                type="button"
                className="h-8 w-8 p-0 text-black"
                onClick={() => deleteNotedData(item?.uid || '')}
              >
                <X size={16} />
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default AddAnnotatedData
