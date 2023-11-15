'use client'

import { useRouter } from 'next/navigation'
import NiceModal from '@ebay/nice-modal-react'
import { zodResolver } from '@hookform/resolvers/zod'
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
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

import { FormSchema, SchemaProps } from '../app/dataset/type'

const defaultValues = {
  name: '',
  embeddingType: 'openAI',
  storeType: 'pinecone',
  collectionName: '',
  chromaUrl: '',
  apiKey: '',
  instanceName: '',
  developmentName: '',
  apiVersion: '',
}

function addDataset(url: string, { arg }: { arg: SchemaProps }) {
  return fetcher(url, {
    method: 'POST',
    body: JSON.stringify(arg),
  })
}

export default NiceModal.create(() => {
  const { modal, onOpenChange } = useNiceModal()

  const router = useRouter()
  const { trigger, isMutating } = useSWRMutation(
    `/api/datasets/add-dataset`,
    addDataset
  )

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues,
  })

  const onSubmit = async (data: SchemaProps) => {
    try {
      const json = await trigger(data)
      onOpenChange(false)
      router.refresh()
      router.push(`/dataset/${json?.datasetId}/settings/documents`)
    } catch (error) {}
  }

  const handleCancel = () => {
    if (!isMutating) {
      onOpenChange(false)
      form.reset()
    }
  }

  return (
    <AlertDialog open={modal.visible} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[488px]">
        <AlertDialogHeader>
          <AlertDialogTitle>Create Dataset</AlertDialogTitle>
        </AlertDialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-full space-y-6"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex">
                    Dataset Name <div className="text-red-500">*</div>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Give your Dataset a name"
                      autoFocus
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="reset"
                variant="outline"
                disabled={isMutating}
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isMutating}>
                {isMutating ? 'Creating' : 'Create'}
              </Button>
            </div>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  )
})
