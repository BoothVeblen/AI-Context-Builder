'use client'

import ChatFeedbackButtons from '../feedback/chat-feedback-buttons'
import { useChat } from '../useChat'
import { IChatCardProps } from './chat-card'
import ChatCardLayout from './layout'

const ChatCardLive = (props: IChatCardProps) => {
  const { loading } = useChat()
  const { message, isEnd } = props
  return (
    <ChatCardLayout
      {...props}
      actions={
        message?.type === 'chat' &&
        message?.role !== 'user' &&
        ((isEnd && !loading) || !isEnd) && (
          <ChatFeedbackButtons message={message} />
        )
      }
    />
  )
}

export default ChatCardLive
