import { NextRequest, NextResponse } from 'next/server'

import { auth } from '@/lib/auth'
import { addFeedback } from '@/db/messages/actions'
import { ChatFeedbackType } from '@/components/chat/feedback/types'

export const runtime = 'edge'

export type ChatFeedbackRequest = {
  message_id: string
  type: ChatFeedbackType
  content?: string
}

export async function POST(req: NextRequest) {
  const { userId } = auth()
  if (!userId) {
    throw new Error('Not authenticated')
  }

  const body: ChatFeedbackRequest = await req.json()
  const { message_id, content, type } = body

  await addFeedback({
    messageId: message_id,
    feedback: type,
    content,
  })

  return NextResponse.json({ success: true })
}
