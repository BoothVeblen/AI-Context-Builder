import { NextRequest, NextResponse } from 'next/server'

import { auth } from '@/lib/auth'
import { addAnnotation } from '@/db/messages/actions'

export const runtime = 'edge'

export type ChatAnnotationRequest = {
  messageId: string
  annotation: string
}

export async function POST(req: NextRequest) {
  const { userId } = auth()
  if (!userId) {
    throw new Error('Not authenticated')
  }

  const body: ChatAnnotationRequest = await req.json()
  const { messageId: messageId, annotation } = body

  await addAnnotation({
    messageId,
    annotation,
  })

  return NextResponse.json({ success: true })
}
