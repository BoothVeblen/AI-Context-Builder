import { RefObject } from 'react'
import { UseFormReturn } from 'react-hook-form'

import { cn } from '@/lib/utils'
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

import DocumentLoader from './document-loader'
import { SchemaProps } from './setting-page'
import TextSplits from './splitter'
import TextEmbedding from './text-embedding'
import VectorStores from './vector-stores'

interface IProps {
  error: string
  showMore?: boolean
  setError: (s: string) => void
  setSaved: (s: boolean) => void
  form: UseFormReturn<any>
  setShowMore?: (s: boolean) => void
  scrollRef: RefObject<HTMLDivElement>
  sectionRefs: RefObject<HTMLDivElement>[]
}

const DatasetForm = ({
  error,
  setError,
  setSaved,
  form,
  setShowMore,
  showMore,
  scrollRef,
  sectionRefs,
}: IProps) => {
  const handelCancel = () => {
    setError('')
    form.reset()
  }

  const onSubmit = (data: SchemaProps) => {
    setSaved(true)
    setError('')
    console.log(data, '---data')
  }
  return (
    <div
      className="h-full w-full overflow-auto px-6 pb-[100px] pt-12"
      ref={scrollRef}
    >
      <div className="sm:w-full md:max-w-[600px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
            <section
              id="dataset-name"
              ref={sectionRefs[0]}
              className="border-b-[1px] py-6"
            >
              <div className="mb-6 text-2xl font-semibold leading-8">
                DataSet Name
              </div>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="w-[332px]">
                    <FormLabel className="flex">
                      DataSet Name <div className="text-red-500">*</div>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Input your dataset name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>
            <DocumentLoader form={form} sectionRef={sectionRefs[1]} />
            {showMore ? (
              <>
                <TextSplits form={form} sectionRef={sectionRefs[2]} />
                <TextEmbedding form={form} sectionRef={sectionRefs[3]} />
                <VectorStores form={form} sectionRef={sectionRefs[4]} />
              </>
            ) : (
              <div className="flex w-full justify-center py-6">
                <div
                  className="cursor-pointer rounded-md border px-4 py-1	"
                  onClick={() => {
                    setShowMore?.(true)
                  }}
                >
                  Show more options
                </div>
              </div>
            )}
            <div
              className={cn(
                'fixed bottom-6 mt-2 flex w-[600px] items-center justify-between rounded-lg border bg-white	px-4 py-2 shadow-xl',
                error ? 'bg-red-500 text-slate-100' : ''
              )}
            >
              <div className="max-w-[500px]"> {error}</div>
              <div className="flex justify-end gap-2 ">
                <Button
                  type="reset"
                  onClick={handelCancel}
                  variant="outline"
                  className={cn(error ? 'border-none bg-red-500' : '')}
                >
                  Cancel
                </Button>
                <Button type="submit">Submit</Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
export default DatasetForm
