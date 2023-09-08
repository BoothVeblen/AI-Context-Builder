import { NextRequest, NextResponse } from 'next/server'

import { getSession } from '@/db/sessions/actions'

// Get session and related data
export async function GET(
  req: NextRequest,
  { params }: { params: { session_id: string } }
) {
  const { session_id } = params
  const data = await getSession(session_id)
  return NextResponse.json({ success: true, data })
}
