import { NextRequest, NextResponse } from 'next/server'

import {
  addToWorkspace,
  getWorkspace,
  removeFromWorkspace,
} from '@/db/workspace/actions'

// List workspace for the authenticated user
export async function GET() {
  const result = await getWorkspace()
  return NextResponse.json({ success: true, data: result })
}

// Add app to workspace for the authenticated user
export async function POST(req: NextRequest) {
  const { app_id } = (await req.json()) as { app_id: string }
  const result = await addToWorkspace(app_id)
  return NextResponse.json({ success: true, data: result })
}

// Delete app from workspace for the authenticated user
export async function DELETE(req: NextRequest) {
  const { app_id } = (await req.json()) as { app_id: string }
  await removeFromWorkspace(app_id)
  return NextResponse.json({ success: true, data: { app_id } })
}
