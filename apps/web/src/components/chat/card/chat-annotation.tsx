import { useLayoutEffect, useMemo, useRef } from 'react'
import { useForm } from 'react-hook-form'
import useSWRMutation from 'swr/mutation'
import { useIntersectionObserver } from 'usehooks-ts'

import { fetcher } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'

import { ChatMessage } from '../types'

interface Props {
  message: ChatMessage
  stopAnnotation: () => void
  annotating: boolean
}

async function submitAnnotation(
  params: [string, string],
  {
    arg,
  }: {
    arg: {
      annotation: string
    }
  }
) {
  const [url, messageId] = params
  await fetcher(url, {
    method: 'POST',
    body: JSON.stringify({
      ...arg,
      messageId,
    }),
  })
  return arg.annotation
}

const ChatAnnotation = ({ message, stopAnnotation, annotating }: Props) => {
  const { trigger, isMutating, data } = useSWRMutation(
    ['/api/chat/annotation', message.id],
    submitAnnotation
  )

  const ref = useRef<HTMLDivElement>(null)

  const entry = useIntersectionObserver(ref, {})

  const annotation = useMemo(() => data || message.annotation, [data, message])

  const formattedAnnotation = useMemo(
    () => annotation?.split('\n').map((line, i) => <div key={i}>{line}</div>),
    [annotation]
  )

  const { handleSubmit, register, watch, reset } = useForm({
    defaultValues: {
      annotation,
    },
  })
  const onSubmit = async (data: { annotation?: string }) => {
    if (!data.annotation) return
    await trigger({
      annotation: data.annotation,
    })

    stopAnnotation()
  }

  useLayoutEffect(() => {
    if (annotating && !entry?.isIntersecting) {
      ref.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
    if (!annotating) {
      reset({
        annotation,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [annotating])

  if (!annotation && !annotating) {
    return null
  }

  const form = (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
      <Textarea
        {...register('annotation')}
        minRows={2}
        className="min-w-[473px] bg-white placeholder:text-slate-400"
        placeholder={
          "Enter the response you expect the AI to provide. The annotated response data will be used for AI model learning, improving the accuracy of AI's responses."
        }
      />
      <div className="flex space-x-2">
        <Button type="submit" disabled={isMutating || !watch('annotation')}>
          Save
        </Button>
        <Button className="" variant="outline" onClick={stopAnnotation}>
          Cancel
        </Button>
      </div>
    </form>
  )

  return (
    <div className="space-y-2 text-[14px]">
      <div className="flex h-5 w-full items-center space-x-4">
        <Separator className="w-auto flex-1" />
        <div className="text-xs leading-5 text-slate-400">
          Annotated Improvements
        </div>
        <Separator className="w-auto flex-1" />
      </div>
      <div ref={ref}>{annotating ? form : formattedAnnotation}</div>
    </div>
  )
}

export default ChatAnnotation
