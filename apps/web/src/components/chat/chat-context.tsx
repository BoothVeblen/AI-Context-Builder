'use client'

import {
  createContext,
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  useContext,
  useState,
} from 'react'

import {
  ChatApp,
  ChatMessage,
  ChatSession,
  ChatUser,
  EventMessage,
} from './types'

export type ChatMode = 'live' | 'debug' | 'history'

interface BaseChatContextType {
  app?: ChatApp | null
  session: ChatSession
  user?: ChatUser | null
  mode: ChatMode
}

interface InternalChatContextType {
  loading: boolean
  messages: ChatMessage[]
  error?: Error
  _setLoading: (loading: boolean) => void
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>
  _setError: (error?: Error) => void
  events: EventMessage[]
  setEvents: Dispatch<SetStateAction<EventMessage[]>>
}

interface LiveChatContextType
  extends BaseChatContextType,
    InternalChatContextType {
  mode: 'live'
}

interface DebugChatContextType
  extends BaseChatContextType,
    InternalChatContextType {
  mode: 'debug'
}

interface HistoryChatContextType
  extends BaseChatContextType,
    InternalChatContextType {
  mode: 'history'
}

export type ChatContextType =
  | LiveChatContextType
  | DebugChatContextType
  | HistoryChatContextType

const ChatContext = createContext<ChatContextType>({} as ChatContextType)

type ChatContextProps = {
  initialMessages?: ChatMessage[]
  initialEvents?: EventMessage[]
} & Omit<PropsWithChildren<ChatContextType>, keyof InternalChatContextType>

const ChatContextProvider = ({
  children,
  initialMessages = [],
  initialEvents = [],
  ...props
}: ChatContextProps) => {
  const [loading, _setLoading] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [error, _setError] = useState<Error>()
  const [events, setEvents] = useState<EventMessage[]>(initialEvents)
  return (
    <ChatContext.Provider
      value={{
        ...props,
        loading,
        messages,
        error,
        events,
        _setLoading,
        setMessages,
        _setError,
        setEvents,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

const useChatContext = () => useContext(ChatContext)

export { ChatContext, ChatContextProvider, useChatContext }
