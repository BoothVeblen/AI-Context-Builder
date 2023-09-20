'use client'

import { useCallback } from 'react'
import { ThumbsDown, ThumbsUp } from 'lucide-react'
import { mutate } from 'swr'
import useSWRMutation from 'swr/mutation'

import ChatAction, { actionCommonButtonProps } from '../chat-action'
import { useChatContext } from '../chat-context'
import { ChatMessage, Message } from '../types'
import { useChatFeedbackContext } from './chat-feedback-context'
import submitFeedback from './service'
import { ChatFeedbackType } from './types'

type Props = {
  message: ChatMessage
}

const ChatFeedbackButtons = (props: Props) => {
  const { message } = props
  const { id, feedback, meta } = message
  const { session } = useChatContext()
  const { short_id: session_id } = session || {}

  const { toggleFeedback, messages } = useChatFeedbackContext()

  const { trigger } = useSWRMutation('/api/chat/feedback', submitFeedback)

  const handleClick = useCallback(
    (type: ChatFeedbackType) => () => {
      if (id) {
        trigger({
          message_id: id,
          type,
        })

        mutate<Message[]>(
          ['/api/chat', session_id],
          messages
            .filter((message: Message) => message.type === 'chat') // filter out event messages
            .map((message: Message) => {
              if (message.type === 'chat' && message.id === id) {
                return {
                  ...message,
                  feedback: type,
                }
              }
              return message
            })
        )

        toggleFeedback(id, type)
      }
    },
    [id, trigger, session_id, messages, toggleFeedback]
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
        <ChatAction onClick={clickable ? handleClick(type) : undefined}>
          <Comp {...actionCommonButtonProps} className={color} />
        </ChatAction>
      )
    },
    [handleClick]
  )

  if (!id) {
    return null
  }

  const status = feedback

  return (
    <div className="flex w-[4.75rem] flex-row-reverse">
      {!status && (
        <>
          {renderButton('good', true)}
          {renderButton('bad', true)}
        </>
      )}
      {status === 'good' && renderButton('good', false)}
      {status === 'bad' && renderButton('bad', false)}
    </div>
  )
}

export default ChatFeedbackButtons
