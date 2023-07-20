'use client'

import { Ref } from 'react'
import { Message } from 'ai'

import { cn } from '@/lib/utils'

import ChatCard from './chat-card'

interface IProps {
  messages: Message[]
  error?: string
  waiting: boolean
  scrollRef: Ref<HTMLDivElement>
  setAutoScroll: (s: boolean) => void
  appId: string
  appName: string
  appIcon: string
  isDebug?: boolean
}

const ChatList = ({
  messages,
  waiting,
  scrollRef,
  setAutoScroll,
  error,
  appId,
  appName,
  appIcon,
  isDebug = false,
}: IProps) => {
  return (
    <div
      className={cn(
        'flex flex-1 flex-col gap-12 overflow-auto px-6 pb-24 pt-6 scrollbar-none',
        isDebug && 'px-0'
      )}
      ref={scrollRef}
      onWheel={() => setAutoScroll(false)}
    >
      {messages?.map((message: Message, index: number) => {
        return (
          <ChatCard
            message={message}
            key={message?.id}
            error={error}
            isEnd={index === messages.length - 1}
            appName={appName}
            appIcon={appIcon}
            appId={appId}
            isDebug={isDebug}
          />
        )
      })}
      {waiting && (
        <ChatCard
          message={{ id: '', content: '', role: 'assistant' }}
          appId={appId}
          appName={appName}
          appIcon={appIcon}
        />
      )}
    </div>
  )
}

export default ChatList
