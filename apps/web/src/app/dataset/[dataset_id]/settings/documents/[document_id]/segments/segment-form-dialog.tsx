'use client'

import NiceModal from '@ebay/nice-modal-react'
import { zodResolver } from '@hookform/resolvers/zod'
import { FileType2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import useSWRMutation from 'swr/mutation'
import { z } from 'zod'

import { fetcher } from '@/lib/utils'
import useNiceModal from '@/hooks/use-nice-modal'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'

import { ISegmentEditProps } from './type'

function addSegment(
  url: string,
  { arg }: { arg: { dataset_id: string; uid: string; content: string } }
) {
  return fetcher(url, {
    method: 'POST',
    body: JSON.stringify(arg),
  })
}

export function editSegment(
  url: string,
  {
    arg,
  }: {
    arg: {
      dataset_id: string
      uid: string
      segment_id: string
      content: string
    }
  }
) {
  return fetcher(url, {
    method: 'PATCH',
    body: JSON.stringify(arg),
  })
}

const formSchema = z.object({
  segment: z.string().min(1, 'please input segment content'),
})

export default NiceModal.create(
  ({
    content = '',
    dataset_id = '',
    document_id = '',
    segment_id = '',
    handelRefresh,
  }: ISegmentEditProps) => {
    const { modal, onOpenChange } = useNiceModal()

    const form = useForm<z.infer<typeof formSchema>>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        segment: content,
      },
    })
    const { watch, handleSubmit } = form
    const { trigger: triggerAdd, isMutating } = useSWRMutation(
      `/api/datasets/segment`,
      addSegment
    )

    const { trigger: triggerEdit, isMutating: editMutating } = useSWRMutation(
      `/api/datasets/segment`,
      editSegment
    )
    const onSubmit = async () => {
      const segment = watch().segment
      if (!segment_id) {
        await triggerAdd({ dataset_id, uid: document_id, content: segment })
      } else {
        await triggerEdit({
          dataset_id,
          segment_id,
          uid: document_id,
          content: segment,
        })
      }
      onOpenChange(false)
      handelRefresh()
    }
    const disabled = isMutating || editMutating
    return (
      <AlertDialog open={modal.visible} onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {content ? 'Edit' : 'Add'} Segment
            </AlertDialogTitle>
          </AlertDialogHeader>
          <Form {...form}>
            <form className="space-y-8">
              <FormField
                control={form.control}
                name="segment"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        className="whitespace-pre-line "
                        placeholder="please input segment"
                        {...field}
                        minRows={4}
                        maxRows={10}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-center justify-between">
                <div className="flex gap-2 text-sm text-slate-500">
                  <FileType2 size={18} /> {watch()?.segment?.length} characters
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit(onSubmit)}
                    disabled={disabled}
                    type="button"
                  >
                    {disabled ? 'Saving' : 'Save'}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </AlertDialogContent>
      </AlertDialog>
    )
  }
)
