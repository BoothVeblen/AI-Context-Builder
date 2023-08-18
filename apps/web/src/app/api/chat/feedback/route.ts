import { NextRequest, NextResponse } from 'next/server'

import { auth } from '@/lib/auth'
import { addFeedback } from '@/db/sessions/actions'
import { ChatFeedbackType } from '@/components/chat/feedback/types'

export const runtime = 'edge'

export type ChatFeedbackRequest = {
  session_id: string
  message_id: string
  content?: string
  type: ChatFeedbackType
}

export async function POST(req: NextRequest) {
  const { userId } = auth()
  if (!userId) {
    throw new Error('Not authenticated')
  }

  const body: ChatFeedbackRequest = await req.json()
  const { session_id, message_id, content, type } = body

  await addFeedback({
    sessionId: session_id,
    messageId: message_id,
    feedback: type,
    content,
  })

  return NextResponse.json({ success: true })
}
