'use client'

import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useState,
} from 'react'

import { Dialog } from '@/components/ui/dialog'

import { Message } from '../types'
import { ChatFeedbackType } from './types'

type ChatFeedbackContextType = {
  toggleFeedback: (messageId: string, type: ChatFeedbackType) => void
  type?: ChatFeedbackType
  messageId?: string
  reset: () => void
  messages: Message[]
}

const ChatFeedbackContext = createContext<ChatFeedbackContextType>(
  {} as ChatFeedbackContextType
)

const ChatFeedbackContextProvider = ({
  children,
  messages,
}: PropsWithChildren<{
  messages: Message[]
}>) => {
  const [open, setOpen] = useState(false)
  const [messageId, setMessageId] = useState<string>()
  const [type, setType] = useState<ChatFeedbackType>()

  const toggleFeedback = useCallback(
    (messageId: string, type: ChatFeedbackType) => {
      setOpen(true)
      setMessageId(messageId)
      setType(type)
    },
    []
  )

  const reset = useCallback(() => {
    setOpen(false)
    setMessageId(undefined)
    setType(undefined)
  }, [])

  return (
    <ChatFeedbackContext.Provider
      value={{
        toggleFeedback,
        messageId,
        type,
        reset,
        messages,
      }}
    >
      <Dialog open={open} onOpenChange={(open) => setOpen(open)}>
        {children}
      </Dialog>
    </ChatFeedbackContext.Provider>
  )
}

const useChatFeedbackContext = () => useContext(ChatFeedbackContext)

export {
  ChatFeedbackContext,
  ChatFeedbackContextProvider,
  useChatFeedbackContext,
}
