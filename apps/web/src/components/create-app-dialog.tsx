import { ReactNode, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Camera } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

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
  desc?: string
  image?: string
}
const formSchema = z.object({
  name: z
    .string()
    .min(2, {
      message: 'App name is required.',
    })
    .max(50, { message: 'App name must be less than 50 characters.' }),
  desc: z
    .string()
    .max(120, {
      message: 'Short description must be less than 120 characters.',
    })
    .min(0),
  image: z.string().min(0),
})

const defaultValues = {
  name: '',
  desc: '',
  image: '',
}
const CreateAppDialog = (props: IProps) => {
  const { dialogTrigger } = props
  const [open, setOpen] = useState<boolean>(false)
  const [disabled, setDisabled] = useState<boolean>(false)
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })
  const { reset, setValue } = form

  const [image, setImage] = useState<UploadFile[]>([])

  const onSubmit = (data: FormValuesProps) => {
    console.log(data, '----------data')
    setOpen(false)
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
    setValue('image', file[0]?.url || '')
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
              name="desc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Short Description</FormLabel>
                  <FormControl>
                    <Textarea
                      minRows={3}
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
              name="image"
              render={({ field }) => {
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
              <Button type="submit" disabled={disabled}>
                Create
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
export default CreateAppDialog
