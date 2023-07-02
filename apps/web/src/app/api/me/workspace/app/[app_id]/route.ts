import { NextRequest, NextResponse } from 'next/server'

import { removeFromWorkspace } from '@/db/workspace/actions'

// Delete app from workspace for the authenticated user
export async function DELETE(
  req: NextRequest,
  { params }: { params: { app_id: string } }
) {
  const { app_id } = params
  await removeFromWorkspace(app_id)
  return NextResponse.json({ success: true, data: { app_id } })
}
