import { ReactNode, useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { Camera } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useSWRConfig } from 'swr'
import useSWRMutation from 'swr/mutation'
import { z } from 'zod'

import { fetcher } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { UploadFile } from './upload/type'
import Upload from './upload/upload'

interface IProps {
  dialogTrigger?: ReactNode
  submit?: () => void
}

interface FormValuesProps {
  name: string
  description?: string
  icon?: string
}
const formSchema = z.object({
  name: z
    .string()
    .min(1, {
      message: 'App name is required.',
    })
    .max(50, { message: 'App name must be less than 50 characters.' }),
  description: z
    .string()
    .max(120, {
      message: 'Short description must be less than 120 characters.',
    })
    .min(0),
  icon: z.string().min(0),
})

const defaultValues = {
  name: '',
  description: '',
  icon: '',
}

function addApp(
  url: string,
  { arg }: { arg: { name: string; description?: string; icon?: string } }
) {
  return fetcher(url, {
    method: 'POST',
    body: JSON.stringify(arg),
  })
}

const CreateAppDialog = (props: IProps) => {
  const { dialogTrigger } = props
  const router = useRouter()
  const { mutate } = useSWRConfig()
  const [open, setOpen] = useState<boolean>(false)
  const [disabled, setDisabled] = useState<boolean>(false)
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })
  const { reset, setValue } = form

  const [image, setImage] = useState<UploadFile[]>([])

  const { trigger, isMutating } = useSWRMutation('/api/me/apps', addApp)

  const onSubmit = async (data: FormValuesProps) => {
    try {
      const json = await trigger(data)
      console.log('CreateAppDialog onSubmit json:', json)
      setOpen(false)
      mutate('/api/me/workspace')
      router.push(`/app/${json.appId}/session/${json.sessionId}`)
    } catch (error) {
      console.log('CreateAppDialog onSubmit error:', error)
    }
  }
  const onCancel = (open: boolean) => {
    setOpen(open)
    reset()
    setImage([])
  }

  const handleFiles = (file: UploadFile<any>[]) => {
    if (file[0]?.status === 'uploading') {
      setDisabled(true)
    } else {
      setDisabled(false)
    }
    setImage(file)
    setValue('icon', file[0]?.url || '')
  }

  return (
    <Dialog onOpenChange={(open) => onCancel(open)} open={open}>
      <DialogTrigger asChild>{dialogTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[488px]">
        <DialogHeader>
          <DialogTitle>Create App</DialogTitle>
        </DialogHeader>
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
                    <Input placeholder="Give your App a name" {...field} />
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
                        onRemove={() => {
                          setImage([])
                          setDisabled(false)
                        }}
                        listType="image"
                        accept=".png, .jpeg,.webp,.jpg"
                        fileList={image}
                        handleFiles={handleFiles}
                        customRequest={() => {}}
                        className=" h-16 w-16 rounded-lg border border-slate-300 bg-slate-50	"
                      >
                        <div className="flex h-16 w-16 items-center justify-center border-none bg-slate-50">
                          <Camera size={28} />
                        </div>
                      </Upload>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )
              }}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onCancel(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={disabled || isMutating}>
                {isMutating ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
export default CreateAppDialog
