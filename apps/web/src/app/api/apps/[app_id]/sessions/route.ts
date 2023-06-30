import { NextRequest, NextResponse } from 'next/server'

import { addSession, getSessions } from '@/db/sessions/actions'

// List sessions for an app
export async function GET(
  req: NextRequest,
  { params }: { params: { app_id: string } }
) {
  const { app_id } = params
  const result = await getSessions(app_id)
  return NextResponse.json({ success: true, data: result })
}

// Create a session for an app
export async function POST(
  req: NextRequest,
  { params }: { params: { app_id: string } }
) {
  const { app_id } = params
  const result = await addSession(app_id)
  return NextResponse.json({ success: true, data: result })
}
