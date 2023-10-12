'use client'

import {
  createContext,
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  useContext,
} from 'react'
import { create } from 'zustand'

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
  api?: string
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

type Thunk<S> = S | ((s: S) => S)

type ChatSlice = {
  loading: boolean
  messages: ChatMessage[]
  error?: Error
  events: EventMessage[]
}

type ChatStore = {
  store: Record<string, ChatSlice>
  getSlice: (id: string, defaultValues: Partial<ChatSlice>) => ChatSlice
  mutate: (id: string, fn: (s: ChatSlice) => ChatSlice) => void
}

const useChatStore = create<ChatStore>((set, get) => ({
  store: {},
  mutate: (id, fn) =>
    set((state) => ({
      store: {
        ...state.store,
        [id]: fn(state.store[id] ?? {}),
      },
    })),
  getSlice: (id: string, defaultValues: Partial<ChatSlice>) => {
    return {
      ...defaultValues,
      ...(get().store[id] ?? {}),
    }
  },
}))

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
  const { getSlice, mutate } = useChatStore()
  const id = props.session.short_id
  const slice = getSlice(id, {
    loading: false,
    messages: initialMessages,
    events: initialEvents,
  })

  const _setLoading = (loading: boolean) => {
    mutate(id, (s) => ({ ...s, loading }))
  }

  const _setError = (error?: Error) => {
    mutate(id, (s) => ({ ...s, error }))
  }

  const setMessages = (messages: Thunk<ChatMessage[]>) => {
    mutate(id, (s) => ({
      ...s,
      messages:
        typeof messages === 'function' ? messages(s.messages ?? []) : messages,
    }))
  }

  const setEvents = (events: Thunk<EventMessage[]>) => {
    mutate(id, (s) => ({
      ...s,
      events: typeof events === 'function' ? events(s.events ?? []) : events,
    }))
  }

  return (
    <ChatContext.Provider
      value={{
        ...props,
        ...slice,
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
