import { NextRequest, NextResponse } from 'next/server'

import { getMessages } from '@/db/messages/actions'

// Get messages data of a session
export async function GET(
  req: NextRequest,
  { params }: { params: { session_id: string } }
) {
  const { session_id } = params
  const data = await getMessages(session_id)
  return NextResponse.json({ success: true, data })
}
