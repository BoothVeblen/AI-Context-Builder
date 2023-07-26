import { NextRequest, NextResponse } from 'next/server'

import { deployApp } from '@/db/apps/actions'
import { NewApp } from '@/db/apps/schema'

// Update an app
export async function PATCH(
  req: NextRequest,
  { params }: { params: { app_id: string } }
) {
  const { app_id } = params
  const body = (await req.json()) as Partial<NewApp>
  const response = (await deployApp(app_id, body)) as any
  if (response.error) {
    return NextResponse.json({ success: false, error: response.error })
  } else {
    return NextResponse.json({ success: true, data: { app_id, body } })
  }
}
