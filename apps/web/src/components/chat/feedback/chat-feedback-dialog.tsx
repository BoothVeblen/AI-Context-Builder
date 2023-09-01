import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import useSWRMutation from 'swr/mutation'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'

import { DialogContent, DialogHeader } from '../../ui/dialog'
import { useChatContext } from '../chat-context'
import { useChatFeedbackContext } from './chat-feedback-context'
import submitFeedback from './service'

type Remark = {
  id: string
  label: string
}

// remarks might be dynamic
const remarks = [
  {
    id: 'harmful',
    label: 'This is harmful / unsafe',
  },
  {
    id: 'wrong',
    label: "This isn't true",
  },
  {
    id: 'unhelpful',
    label: "This isn't helpful",
  },
] as const

const ChatFeedbackDialog = () => {
  const { messageId, type, reset } = useChatFeedbackContext()
  const { session } = useChatContext()
  const { short_id: session_id } = session

  const {
    register,
    getValues,
    control,
    reset: resetForm,
  } = useForm<{
    content: string
    harmful: boolean
    wrong: boolean
    unhelpful: boolean
  }>()

  const { trigger } = useSWRMutation('/api/chat/feedback', submitFeedback)

  useEffect(() => {
    resetForm()
  }, [messageId])

  if (!messageId || !type) {
    return null
  }

  const negative = type === 'bad'

  const placeholder = negative
    ? 'What was the issue with the response? How could it be improved?'
    : 'What do you like about the response?'

  const renderOptions = remarks.map(({ id, label }) => (
    <Controller
      key={id}
      name={id}
      control={control}
      render={({ field }) => (
        <div className="flex items-center space-x-2">
          <Checkbox
            id={id}
            checked={field.value}
            onCheckedChange={field.onChange}
          />
          <label
            htmlFor={id}
            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
          </label>
        </div>
      )}
    />
  ))

  const onSubmit = async () => {
    const values = getValues()
    let { content } = values

    const validRemarks = remarks.filter((remark) => values[remark.id])

    validRemarks.forEach((remark) => {
      content += `\n# ${remark.label}`
    })

    reset()

    const trimmed = content.trim()

    if (!trimmed) {
      return
    }

    trigger({
      content: trimmed,
      message_id: messageId,
      session_id,
      type,
    })
  }

  return (
    <DialogContent>
      <DialogHeader>Provide additional feedback</DialogHeader>
      <Textarea placeholder={placeholder} {...register('content')} />
      {negative && renderOptions}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="default" onClick={onSubmit}>
          Submit Feedback
        </Button>
      </div>
    </DialogContent>
  )
}

export default ChatFeedbackDialog
