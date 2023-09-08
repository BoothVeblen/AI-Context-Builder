import { type Message as RawMessage } from 'ai'

import { App } from '@/db/apps/schema'
import { Session } from '@/db/sessions/schema'
import { User } from '@/db/users/schema'

import { ChatFeedbackType } from './feedback/types'

export type ChatSession = Pick<Session, 'short_id' | 'api_session_id' | 'name'>

export type ChatApp = Pick<
  App,
  'short_id' | 'icon' | 'name' | 'opening_remarks' | 'enable_video_interaction'
>

export type ChatUser = Pick<User, 'first_name' | 'last_name' | 'image_url'>

interface BaseMessage {
  createdAt?: Date
  id: string
  type: 'chat' | 'event'
  role: RawMessage['role']
}

export interface EventMessage extends BaseMessage {
  type: 'event'
  eventType: string
  content?: string
}

export interface ChatMessage extends BaseMessage, RawMessage {
  type: 'chat'
  feedback?: ChatFeedbackType
  feedback_content?: string
  meta?: {
    latency?: number
    token?: {
      total_tokens?: number
    }
    raw?: any
  }
}

export type Message = ChatMessage | EventMessage

export interface ProcessTaskFromAPI {
  key: string
  type: string
  finished?: boolean
  succeed?: boolean
}

export interface ProcessTask {
  key: string
  type: string
  status: 'none' | 'pending' | 'succeed' | 'failed'
}
