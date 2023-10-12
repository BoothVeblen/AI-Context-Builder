'use client'

import { Ref } from 'react'

import { cn } from '@/lib/utils'

import ChatCard from './card/chat-card'
import { ChatFeedbackContextProvider } from './feedback/chat-feedback-context'
import ChatFeedbackDialog from './feedback/chat-feedback-dialog'
import { Message } from './types'
import { useChat } from './useChat'
import { keyBuilder } from './utils'

interface IProps {
  messages: Message[]
  error?: string
  scrollRef?: Ref<HTMLDivElement>
  setAutoScroll?: (s: boolean) => void
}

const ChatList = ({ messages, scrollRef, setAutoScroll, error }: IProps) => {
  const { loading, mode } = useChat()
  const isDebug = mode === 'debug'

  return (
    <div
      className={cn(
        'flex flex-1 flex-col gap-12 overflow-auto pb-24 pl-6 pr-18 pt-6 scrollbar-none',
        isDebug && 'px-0'
      )}
      ref={scrollRef}
      onWheel={() => setAutoScroll?.(false)}
    >
      <ChatFeedbackContextProvider messages={messages}>
        {messages?.map((message: any, index: number) => {
          const key = keyBuilder(message)
          return (
            <ChatCard
              message={message}
              key={key}
              error={error}
              isEnd={index === messages.length - 1}
            />
          )
        })}
        {mode === 'live' && <ChatFeedbackDialog />}
      </ChatFeedbackContextProvider>
      {loading && messages[messages.length - 1]?.role === 'user' && (
        <ChatCard
          message={{ id: '', content: '', role: 'assistant', type: 'chat' }}
        />
      )}
    </div>
  )
}

export default ChatList
