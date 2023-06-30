import { NextRequest, NextResponse } from 'next/server'

import { removeSession } from '@/db/sessions/actions'

// Get a session
export async function GET(
  req: NextRequest,
  { params }: { params: { session_id: string } }
) {
  const { session_id } = params
  return NextResponse.json({ success: true, data: { session_id } })
}

// Delete a session for an app
export async function DELETE(
  req: NextRequest,
  { params }: { params: { app_id: string; session_id: string } }
) {
  const { app_id, session_id } = params
  const result = await removeSession(app_id, session_id)
  return NextResponse.json({ success: true, data: result })
}
