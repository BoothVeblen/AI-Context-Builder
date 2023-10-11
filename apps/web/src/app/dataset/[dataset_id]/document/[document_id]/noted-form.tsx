'use client'

import { UseFormReturn } from 'react-hook-form'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { DocumentProps } from '@/app/dataset/type'

import { useDataContext } from './data-context'
import NotedDataCard from './noted-data-card'

interface IProps {
  form: UseFormReturn<any>
  selected: DocumentProps[]
  cardList: DocumentProps[]
  disabledData: DocumentProps[]
  setOpen: (s: boolean) => void
  setSelected: (s: DocumentProps[]) => void
}

const AnnotatedForm = ({
  form,
  cardList = [],
  disabledData,
  setOpen,
  selected,
  setSelected,
}: IProps) => {
  const { notedData, isAdd } = useDataContext()
  const { setValue } = form

  const onCancel = () => {
    setOpen(false)
    if (isAdd) {
      setSelected(cardList)
      return
    } else {
      setSelected([])
    }
  }

  const onSave = () => {
    setValue('notedData', selected)
    setOpen(false)
  }

  return (
    <div className="relative flex flex-col overflow-hidden">
      <div className="px-6 pb-4 pt-6 text-lg font-semibold">
        Add Annotated Data
      </div>
      <FormField
        control={form.control}
        name="notedData"
        render={() => (
          <FormItem className="flex flex-1 flex-col overflow-auto px-6 pb-4">
            {notedData?.map((item) => {
              const isDisabled =
                disabledData?.findIndex((cur) => cur?.uid === item?.uid) !== -1
              const isSelect = !isAdd && selected?.[0]?.uid === item?.uid
              return (
                <FormField
                  key={item.uid}
                  control={form.control}
                  name="notedData"
                  render={({ field }) => {
                    return (
                      <FormItem
                        data-disabled={isDisabled}
                        key={item.uid}
                        onClick={() => {
                          // edit noted data
                          if (!isAdd && !isDisabled) {
                            setSelected([item])
                          }
                        }}
                        className={cn(
                          'flex flex-row items-center space-x-3 space-y-0 rounded-lg border border-slate-200 p-4',
                          !isAdd && !isDisabled && 'cursor-pointer',
                          !isAdd && 'space-x-0',
                          isSelect && !isDisabled
                            ? 'border-blue-500'
                            : 'border-slate-200',
                          isDisabled && 'opacity-70'
                        )}
                      >
                        <FormControl>
                          <Checkbox
                            disabled={isDisabled}
                            checked={
                              selected?.findIndex(
                                (cur: DocumentProps) => cur?.uid === item?.uid
                              ) !== -1 || isDisabled
                            }
                            className={!isAdd ? 'hidden' : 'block'}
                            onCheckedChange={(checked) => {
                              // add noted data
                              if (checked) {
                                setSelected([...selected, item])
                              } else {
                                const newData =
                                  selected?.filter(
                                    (cur: DocumentProps) =>
                                      cur?.uid !== item?.uid
                                  ) || []
                                setSelected(newData)
                              }
                            }}
                          />
                        </FormControl>
                        <FormLabel>
                          <NotedDataCard
                            data={item}
                            isAdd={isAdd}
                            isDisabled={isDisabled}
                          />
                        </FormLabel>
                      </FormItem>
                    )
                  }}
                />
              )
            })}
          </FormItem>
        )}
      />

      <div className="flex justify-end gap-2 px-6 pb-6 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" onClick={onSave}>
          Save
        </Button>
      </div>
    </div>
  )
}

export default AnnotatedForm
