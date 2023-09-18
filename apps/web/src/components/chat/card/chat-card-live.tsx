'use client'

import { useChatContext } from '../chat-context'
import ChatFeedbackButtons from '../feedback/chat-feedback-buttons'
import { IChatCardProps } from './chat-card'
import ChatCardLayout from './layout'

const ChatCardLive = (props: IChatCardProps) => {
  const { isLoading } = useChatContext()
  const { message, isEnd } = props
  return (
    <ChatCardLayout
      {...props}
      actions={
        message?.type === 'chat' &&
        message?.role !== 'user' &&
        ((isEnd && !isLoading) || !isEnd) && (
          <ChatFeedbackButtons message={message} />
        )
      }
    />
  )
}

export default ChatCardLive
