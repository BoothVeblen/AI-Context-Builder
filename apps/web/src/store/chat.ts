// import { Message } from 'ai/react/dist'
// import { nanoid } from 'nanoid'
// import { create } from 'zustand'

// export type ChatMessage = {
//   createdAt?: string
//   streaming?: boolean
//   isError?: boolean
//   id?: string
//   role?: 'user' | 'assistant'
//   content: string
// }

// export function createMessage(override: Partial<ChatMessage>): ChatMessage {
//   return {
//     id: nanoid(),
//     role: 'user',
//     content: '',
//     ...override,
//   }
// }

// export interface ChatSession {
//   chat_id: string
//   messages: Message[]
//   lastUpdate: number
//   lastSummarizeIndex: number
//   clearContextIndex?: number
//   mask?: { topic?: string; name?: string }
// }

// export const BOT_HELLO: ChatMessage = createMessage({
//   role: 'assistant',
//   content: 'hello I am the assistant . what can i do for you?',
// })

// function createEmptySession(chat_id: string): ChatSession {
//   return {
//     chat_id,
//     messages: [],
//     lastUpdate: Date.now(),
//     lastSummarizeIndex: 0,
//   }
// }

// interface ChatStore {
//   sessions: ChatSession[]
//   currentChatId: string
//   currentSessionIndex: number
//   selectSession: (index: number) => void
//   isNewSession: () => boolean
//   setChatId: (chat_id: string) => void
//   addNewSession: (chat_id: string, messages: Message[]) => void
//   deleteSession: (chat_id: string) => void
//   currentSession: () => ChatSession
//   onNewMessage: (message: Message) => void
//   onUserInput: (content: string) => Promise<void>
//   updateCurrentSession: (updater: (session: ChatSession) => void) => void
//   updateMessage: (
//     sessionIndex: number,
//     messageIndex: number,
//     updater: (message?: Message) => void
//   ) => void
//   getMessagesWithMemory: () => Message[]
//   clearAllData: () => void
// }

// export const useChatStore = create<ChatStore>()((set, get) => ({
//   currentChatId: '',
//   sessions: [],
//   currentSessionIndex: 0,
//   setChatId(chat_id: string) {
//     set({
//       currentChatId: chat_id,
//     })
//   },
//   addNewSession(chat_id, messages) {
//     const isNew = get().isNewSession()
//     if (isNew) {
//       const session = createEmptySession(chat_id)
//       session['messages'] = messages
//       const sessions = [...get().sessions, session]
//       set({ sessions })
//     }
//   },
//   selectSession(index: number) {
//     set({
//       currentSessionIndex: index,
//     })
//   },
//   isNewSession() {
//     const id = get().currentChatId
//     const index = get().sessions.findIndex((item) => item?.chat_id === id)
//     return index === -1
//   },
//   deleteSession(chat_id) {
//     const sessions = get().sessions
//     const index = sessions.findIndex((item) => item?.chat_id === chat_id)
//     sessions.splice(index, 1)
//     set(() => ({
//       currentSessionIndex: index,
//       sessions,
//     }))
//   },
//   currentSession() {
//     const id = get().currentChatId
//     const sessions = get().sessions
//     const session = sessions?.find((item) => item?.chat_id === id)
//     return session || createEmptySession(id)
//   },

//   onNewMessage(message) {
//     get().updateCurrentSession((session) => {
//       session.lastUpdate = Date.now()
//     })
//   },

//   async onUserInput(content) {
//     // const modelConfig = session.mask.modelConfig;

//     const userMessage: ChatMessage = createMessage({
//       role: 'user',
//       content,
//     })

//     const botMessage: ChatMessage = createMessage({
//       role: 'assistant',
//       streaming: true,
//       id: userMessage.id! + 1,
//     })

//     const current = get().currentSession()
//     // save user's and bot's message
//     get().updateCurrentSession((session) => {
//       current.messages.push(userMessage)
//       current.messages.push(botMessage)
//     })

//     // make request
//     setTimeout(() => {
//       botMessage.streaming = false
//       botMessage.content = 'this is mock response.please wait a minute'
//       get().onNewMessage(botMessage)
//     }, 500)
//   },

//   getMessagesWithMemory() {
//     // 获取初始值
//     return []
//   },

//   updateMessage(
//     sessionIndex: number,
//     messageIndex: number,
//     updater: (message?: ChatMessage) => void
//   ) {
//     const sessions = get().sessions
//     const session = sessions.at(sessionIndex)
//     const messages = session?.messages
//     updater(messages?.at(messageIndex))
//     set(() => ({ sessions }))
//   },

//   updateCurrentSession(updater) {
//     const sessions = get().sessions
//     const index = get().currentSessionIndex
//     updater(sessions[index])
//     set(() => ({ sessions }))
//   },
//   clearAllData() {
//     localStorage.clear()
//     location.reload()
//   },
// }))
