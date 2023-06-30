'use client'

import { useMemo, useState } from 'react'
import { useChat } from 'ai/react'

import { useScrollToBottom } from '@/hooks/useScrollToBottom'

import ChatHeader from './chat-header'
import ChatInput from './chat-input'
import ChatList from './chat-list'

interface IProps {
  sessionId: string
  name: string
}

const Chat = ({ sessionId, name }: IProps) => {
  const [waiting, setWaiting] = useState<boolean>(false)
  const { scrollRef, setAutoScroll } = useScrollToBottom()

  const { messages, input, setInput, isLoading, reload, stop, append, error } =
    useChat({
      id: sessionId,
      onResponse: () => {
        setWaiting(false)
      },
    })

  const handelReload = () => {
    setAutoScroll(true)
    reload()
    setWaiting(true)
  }

  const handelStop = () => {
    setWaiting(false)
    stop()
  }

  const showResend = useMemo(() => messages?.length > 0, [messages])

  return (
    <div className="flex h-full w-full flex-col">
      <ChatHeader name={name} />
      <ChatList
        messages={messages}
        waiting={waiting}
        scrollRef={scrollRef}
        error={error?.message}
        setAutoScroll={setAutoScroll}
      />
      <ChatInput
        input={input}
        setInput={setInput}
        onSubmit={async (value) => {
          setAutoScroll(true)
          setWaiting(true)
          await append({
            id: sessionId,
            content: value,
            role: 'user',
            createdAt: new Date(),
          })
        }}
        isLoading={isLoading}
        showResend={showResend}
        reload={handelReload}
        stop={handelStop}
      />
    </div>
  )
}

export default Chat