'use client'

import { useState } from 'react'

import ChatFeedbackHistory from '../feedback/chat-feedback-history'
import ChatAnnotation from './chat-annotation'
import { IChatCardProps } from './chat-card'
import ChatCardLayout from './layout'

const ChatCardHistory = (props: IChatCardProps) => {
  const { message } = props
  const isAIChat = message.type === 'chat' && message.role !== 'user'
  const [annotating, setAnnotating] = useState(false)
  return (
    <ChatCardLayout
      {...props}
      actions={
        isAIChat && (
          <ChatFeedbackHistory
            message={message}
            annotating={annotating}
            onAnnotate={() => setAnnotating(true)}
          />
        )
      }
      footer={
        isAIChat && (
          <ChatAnnotation
            message={message}
            stopAnnotation={() => setAnnotating(false)}
            annotating={annotating}
          />
        )
      }
    />
  )
}

export default ChatCardHistory
