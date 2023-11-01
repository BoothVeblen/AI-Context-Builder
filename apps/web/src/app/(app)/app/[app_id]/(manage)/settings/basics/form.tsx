'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { isEqual } from 'lodash'
import { InfoIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import useSWRMutation from 'swr/mutation'
import { useDebounce } from 'usehooks-ts'
import { z } from 'zod'

import { flags } from '@/lib/flags'
import { fetcher, getAvatarBgColor, getFirstLetter } from '@/lib/utils'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useToast } from '@/components/ui/use-toast'
import { UPLOAD_ACCEPT_MAP } from '@/components/upload/type'
import Upload from '@/components/upload/upload'
import { FileProps } from '@/components/upload/utils'

function editApp(
  url: string,
  { arg }: { arg: { name: string; description?: string; icon?: string } }
) {
  return fetcher(url, {
    method: 'PATCH',
    body: JSON.stringify(arg),
  })
}

const formSchema = z.object({
  name: z
    .string()
    .trim()
    .nonempty('App name is required.')
    .min(2, {
      message: 'App name at least 2 characters.',
    })
    .max(50, { message: 'App name must be less than 50 characters.' }),
  description: z
    .string()
    .max(300, {
      message: 'Short description must be less than 300 characters.',
    })
    .optional(),
  icon: z.string().optional(),
  opening_remarks: z
    .string()
    .max(500, {
      message: 'Opening remarks must be less than 500 characters.',
    })
    .optional(),
  enable_video_interaction: z.boolean().optional(),
})

interface IProps {
  appId: string
  defaultValues: {
    name: string
    description?: string
    icon?: string
    opening_remarks?: string
    enable_video_interaction?: boolean
  }
}

export default function BasicsSettingForm({ appId, defaultValues }: IProps) {
  const { trigger } = useSWRMutation(`/api/apps/${appId}`, editApp)
  const { toast } = useToast()
  const values = defaultValues?.icon
    ? [
        {
          url: defaultValues?.icon,
          name: '',
        },
      ]
    : []
  const [image, setImage] = useState<FileProps[]>(values)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  const { watch, handleSubmit } = form

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const formValue = useMemo(() => watch(), [JSON.stringify(watch())])
  const debouncedFormValue = useDebounce(formValue, 1000)
  const latestFormValueRef = useRef(defaultValues)

  const router = useRouter()
  const onSubmit = async () => {
    const newValue = watch()
    const response = await trigger(newValue)
    if (response?.error) {
      toast({ variant: 'destructive', description: response.error })
    } else {
      latestFormValueRef.current = newValue
      router.refresh()
    }
  }

  useEffect(() => {
    if (!isEqual(debouncedFormValue, latestFormValueRef.current)) {
      handleSubmit(onSubmit)()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(debouncedFormValue)])

  const color = getAvatarBgColor(appId)
  const bgText = getFirstLetter(watch().name || '')

  return (
    <div>
      <h2 className="mb-6	text-2xl font-semibold leading-8">Basics</h2>
      <Form {...form}>
        <form className="space-y-8">
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
                    placeholder="Type your description here"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="mt-6 space-y-2">
            <label className="text-sm font-medium">Image</label>
            <Upload
              listType="update-image"
              accept={UPLOAD_ACCEPT_MAP['image']}
              fileList={image}
              bgColor={color}
              listProps={false}
              bgText={bgText}
              onChangeFileList={(files) => {
                const current = files[files?.length - 1]
                form.setValue('icon', current?.url)
                setImage(files)
              }}
            />
          </div>

          {flags.enabledVideoInteraction && (
            <>
              <FormField
                control={form.control}
                name="opening_remarks"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center space-x-2">
                      <FormLabel>Opening Remarks</FormLabel>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InfoIcon className="h-4 w-4 text-slate-400" />
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p className="max-w-xs">
                            Set the opening remarks, and the app will actively
                            send the content you set to improve communication
                            with users.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <FormControl>
                      <Textarea
                        minRows={3}
                        placeholder="Type your message here"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="h-px bg-slate-200" />

              <h3 className="text-xl font-semibold">Video</h3>

              <FormField
                control={form.control}
                name="enable_video_interaction"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex space-x-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <FormLabel>Video Interaction</FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </div>
                        <FormDescription>
                          Once activated, the App will communicate with users
                          through video and voice.
                        </FormDescription>
                      </div>
                      <img
                        alt=""
                        src="https://storage.googleapis.com/context-builder/public-tmp/rpzyVShaSqc8.jpeg"
                        className="h-[170px] w-[250px] shrink-0 rounded-md"
                      />
                    </div>
                  </FormItem>
                )}
              />
            </>
          )}
        </form>
      </Form>
    </div>
  )
}
