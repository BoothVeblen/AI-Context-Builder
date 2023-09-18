'use client'

import { useChatContext } from '../chat-context'
import { Message } from '../types'
import ChatCardDebug from './chat-card-debug'
import ChatCardHistory from './chat-card-history'
import ChatCardLive from './chat-card-live'

export interface IChatCardProps {
  message: Message
  error?: string
  isEnd?: boolean
}

const ChatCard = (props: IChatCardProps) => {
  const { mode } = useChatContext()

  switch (mode) {
    case 'live': {
      return <ChatCardLive {...props} />
    }
    case 'history': {
      return <ChatCardHistory {...props} />
    }
    case 'debug': {
      return <ChatCardDebug {...props} />
    }
  }
}

export default ChatCard
