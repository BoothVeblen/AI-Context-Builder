'use client'

import { Ref } from 'react'
import { Message } from 'ai'

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
}: IProps) => {
  return (
    <div
      className="flex flex-1 flex-col gap-12 overflow-auto px-6 pb-24 pt-6"
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
