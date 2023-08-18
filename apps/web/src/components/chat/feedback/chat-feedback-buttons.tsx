'use client'

import { useCallback, useState } from 'react'
import { ThumbsDown, ThumbsUp } from 'lucide-react'
import useSWRMutation from 'swr/mutation'

import { cn } from '@/lib/utils'
import { Dialog } from '@/components/ui/dialog'

import { useChatContext } from '../chat-context'
import { useChatFeedbackContext } from './chat-feedback-context'
import submitFeedback from './service'
import { ChatFeedbackType } from './types'

type Props = {
  messageId?: string
}

const commonButtonProps = {
  size: 16,
  strokeWidth: 3,
} as const

const ChatFeedbackButtons = (props: Props) => {
  const { messageId } = props
  const { session } = useChatContext()
  const { short_id: session_id } = session

  const { toggleFeedback, feedbacked } = useChatFeedbackContext()

  const { trigger } = useSWRMutation('/api/chat/feedback', submitFeedback)

  const handleClick = useCallback(
    (type: ChatFeedbackType) => () => {
      if (messageId) {
        trigger({
          message_id: messageId,
          type,
          session_id,
        })

        toggleFeedback(messageId, type)
      }
    },
    [messageId, toggleFeedback, session_id, trigger]
  )

  const renderButton = useCallback(
    (type: ChatFeedbackType, clickable: boolean) => {
      const compMap = {
        good: ThumbsUp,
        bad: ThumbsDown,
      } as const

      const Comp = compMap[type]

      let color = 'stroke-slate-400'
      if (!clickable) {
        if (type === 'good') {
          color = 'stroke-green-500'
        }
        if (type === 'bad') {
          color = 'stroke-red-500'
        }
      }

      return (
        <div
          className={cn(
            'ml-1 rounded-md border bg-white p-2',
            clickable && 'cursor-pointer hover:bg-slate-100 active:bg-slate-300'
          )}
          {...(clickable
            ? {
                onClick: handleClick(type),
              }
            : {})}
        >
          <Comp {...commonButtonProps} className={color} />
        </div>
      )
    },
    [handleClick]
  )

  if (!messageId) {
    return null
  }

  const status = feedbacked[messageId]

  return (
    <>
      {!status && (
        <>
          {renderButton('good', true)}
          {renderButton('bad', true)}
        </>
      )}
      {status === 'good' && renderButton('good', false)}
      {status === 'bad' && renderButton('bad', false)}
    </>
  )
}

export default ChatFeedbackButtons
