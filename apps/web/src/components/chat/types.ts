import { type Message as RawMessage } from 'ai'

import { App } from '@/db/apps/schema'
import { Session } from '@/db/sessions/schema'

import { ChatFeedbackType } from './feedback/types'

export type ChatSession = Pick<Session, 'short_id' | 'api_session_id' | 'name'>

export type ChatApp = Pick<
  App,
  'short_id' | 'icon' | 'name' | 'opening_remarks' | 'enable_video_interaction'
>

interface BaseMessage {
  createdAt?: Date
  id: string
  type: 'chat' | 'event'
  role: RawMessage['role']
}

export interface EventMessage extends BaseMessage {
  type: 'event'
  eventType: string
}

export interface ChatMessage extends BaseMessage, RawMessage {
  type: 'chat'
  feedback?: ChatFeedbackType
  feedback_content?: string
  content: string
}

export type Message = ChatMessage | EventMessage
