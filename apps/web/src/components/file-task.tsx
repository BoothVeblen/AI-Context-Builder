'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Info, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form'

interface IProps {
  open?: boolean
}
const FormSchema = z.object({
  title: z.string().min(2, {
    message: 'title must be at least 2 characters.',
  }),
  key: z.string().min(8, {
    message: 'title must be at least 8 characters.',
  }),
})

const defaultValues = {
  title: '',
  key: '',
}

const AddorEditTask = (props: IProps) => {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues,
  })

  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    console.log(data, '---data')
  }

  const { control } = useForm([form])

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Edit Task</Button>
      </SheetTrigger>
      <SheetContent position="right" size="sm">
        <SheetHeader>
          <SheetTitle>
            <div className="mb-8 flex items-center justify-between pr-4">
              Edit upload files task
              <Trash2 size={16} className="pt-[-4px]" />
            </div>
          </SheetTitle>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={control}
              // @ts-ignore
              name="title"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="flex flex-row items-center gap-1">
                    Title<div className="w-1 text-rose-600">*</div>
                    <Info size={18} className="ml-2" />
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="please input title" {...field} />
                  </FormControl>
                  <FormMessage className="mt-0">{'error'}</FormMessage>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              // @ts-ignore
              name="key"
              render={({ field, fieldState: { error } }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="flex flex-row items-center gap-1">
                    Key<div className="w-1 text-rose-600">*</div>
                    <Info size={18} className="ml-2" />
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="please input key" {...field} />
                  </FormControl>
                  {/* @ts-ignore */}
                  <FormMessage className="mt-0">{error}</FormMessage>
                </FormItem>
              )}
            />
          </form>
        </Form>

        <SheetFooter>
          <SheetClose asChild>
            <Button type="submit">Save changes</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export default AddorEditTask
