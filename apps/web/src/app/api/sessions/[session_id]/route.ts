import { NextRequest, NextResponse } from 'next/server'

import { getPublicSession } from '@/db/sessions/actions'

// Get session and related data
export async function GET(
  req: NextRequest,
  { params }: { params: { session_id: string } }
) {
  const { session_id } = params
  const data = await getPublicSession(session_id)
  return NextResponse.json({ success: true, data })
}
