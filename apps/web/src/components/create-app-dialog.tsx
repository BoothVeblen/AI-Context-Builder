'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import NiceModal from '@ebay/nice-modal-react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useSWRConfig } from 'swr'
import useSWRMutation from 'swr/mutation'
import { z } from 'zod'

import { fetcher, nanoid } from '@/lib/utils'
import { NewApp } from '@/db/apps/schema'
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
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import Upload from '@/components/upload/upload'
import { FileProps } from '@/components/upload/utils'

import { UPLOAD_ACCEPT_MAP } from './upload/type'

interface IProps {
  defaultValues?: z.infer<typeof formSchema>
  parentAppId?: string
}

interface FormValuesProps {
  name: string
  description?: string
  icon?: string
}
const formSchema = z.object({
  name: z
    .string()
    .trim()
    .nonempty('App name is required.')
    .min(2, {
      message: 'App name must be at least 2 characters.',
    })
    .max(50, { message: 'App name must be less than 50 characters.' }),
  description: z
    .string()
    .max(300, {
      message: 'Short description must be less than 300 characters.',
    })
    .optional(),
  icon: z.string().optional(),
})

function addApp(url: string, { arg }: { arg: Partial<NewApp> }) {
  return fetcher(url, {
    method: 'POST',
    body: JSON.stringify(arg),
  })
}

export default NiceModal.create((props: IProps) => {
  const { defaultValues: _defaultValues, parentAppId } = props
  const isCopy = !!parentAppId

  const router = useRouter()
  const { mutate } = useSWRConfig()
  const { trigger, isMutating } = useSWRMutation('/api/me/apps', addApp)
  const { modal, onOpenChange } = useNiceModal()
  const { toast } = useToast()

  const defaultValues = {
    name: _defaultValues?.name || '',
    description: _defaultValues?.description || '',
    icon: _defaultValues?.icon || '',
  }
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })
  const { reset, setValue } = form
  const _image = defaultValues?.icon
    ? [
        {
          uid: nanoid(),
          url: defaultValues?.icon,
          type: 'image',
          name: '',
        },
      ]
    : []
  const [image, setImage] = useState<FileProps[]>(_image)
  const [uploading, setUploading] = useState(false)

  const onSubmit = async (data: FormValuesProps) => {
    try {
      const json = await trigger({ ...data, parent_app_id: parentAppId })
      onOpenChange(false)
      mutate('/api/me/workspace')
      router.push(`/app/${json.appId}/settings/basics`)
      router.refresh()
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Create failed!',
        description: error.message,
      })
    }
  }
  const handleCancel = () => {
    reset()
    onOpenChange(false)
    if (isCopy) {
      setImage(_image)
    } else {
      setImage([])
    }
  }

  const onChangeFileList = (files: FileProps[]) => {
    setImage(files)
    const current = files[files?.length - 1]
    setValue('icon', current?.url)
  }

  return (
    <AlertDialog open={modal.visible} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[488px]">
        <AlertDialogHeader>
          <AlertDialogTitle>Create App</AlertDialogTitle>
        </AlertDialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex">
                    App Name <div className="text-red-500">*</div>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Give your App a name"
                      autoFocus
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Short Description</FormLabel>
                  <FormControl>
                    <Textarea
                      minRows={3}
                      maxRows={8}
                      placeholder="Type your description here"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="icon"
              render={() => {
                return (
                  <FormItem>
                    <FormLabel>Image</FormLabel>
                    <FormControl>
                      <Upload
                        listType={image?.length ? 'update-image' : 'image'}
                        setUploading={setUploading}
                        accept={UPLOAD_ACCEPT_MAP.image}
                        fileList={image}
                        onChangeFileList={onChangeFileList}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )
              }}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isMutating || uploading}>
                {isMutating ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  )
})
