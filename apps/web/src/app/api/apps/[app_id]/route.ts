import { NextRequest, NextResponse } from 'next/server'

import { removeApp } from '@/db/apps/actions'

// Get an app
export async function GET(
  req: NextRequest,
  { params }: { params: { app_id: string } }
) {
  const { app_id } = params
  return NextResponse.json({ success: true, data: { app_id } })
}

// TODO: Update an app
export async function PATCH(
  req: NextRequest,
  { params }: { params: { app_id: string } }
) {
  const { app_id } = params
  const body = await req.json()
  return NextResponse.json({ success: true, data: { app_id, body } })
}

// Delete an app
export async function DELETE(
  req: NextRequest,
  { params }: { params: { app_id: string } }
) {
  const { app_id } = params
  await removeApp(app_id)
  return NextResponse.json({ success: true, data: { app_id } })
}
