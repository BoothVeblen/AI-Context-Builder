import { NextRequest, NextResponse } from 'next/server'

import { editApp, removeApp } from '@/db/apps/actions'
import { NewApp } from '@/db/apps/schema'

// Get an app
export async function GET(
  req: NextRequest,
  { params }: { params: { app_id: string } }
) {
  const { app_id } = params
  return NextResponse.json({ success: true, data: { app_id } })
}

// Update an app
export async function PATCH(
  req: NextRequest,
  { params }: { params: { app_id: string } }
) {
  const { app_id } = params
  const body = (await req.json()) as Partial<NewApp>
  const response = (await editApp(app_id, body)) as any
  if (response.error) {
    return NextResponse.json({ success: false, error: response.error })
  } else {
    return NextResponse.json({ success: true, data: { app_id, body } })
  }
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
