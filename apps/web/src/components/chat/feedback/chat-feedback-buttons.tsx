'use client'

import { startTransition, useCallback } from 'react'
import { ThumbsDown, ThumbsUp } from 'lucide-react'
import useSWRMutation from 'swr/mutation'

import ChatActionCopy from '../actions/copy'
import ChatAction, { actionCommonButtonProps } from '../chat-action'
import { ChatMessage } from '../types'
import { useChat } from '../useChat'
import { useChatFeedbackContext } from './chat-feedback-context'
import submitFeedback from './service'
import { ChatFeedbackType } from './types'

type Props = {
  message: ChatMessage
}

const ChatFeedbackButtons = (props: Props) => {
  const { message } = props
  const { id, feedback, content } = message
  const { updateMessage } = useChat()

  const { toggleFeedback } = useChatFeedbackContext()

  const { trigger } = useSWRMutation('/api/chat/feedback', submitFeedback)

  const handleClick = useCallback(
    (type: ChatFeedbackType) => () => {
      if (id) {
        toggleFeedback(id, type)
        startTransition(() => {
          trigger({
            message_id: id,
            type,
          })

          updateMessage(id, {
            feedback: type,
          })
        })
      }
    },
    [id, trigger, updateMessage, toggleFeedback]
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
    <div className="flex">
      <ChatActionCopy content={content} />
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
