import { NextRequest, NextResponse } from 'next/server'

import { addApp, forkApp, getApps } from '@/db/apps/actions'
import { NewApp } from '@/db/apps/schema'

// List apps for the authenticated user
export async function GET() {
  const result = await getApps()
  return NextResponse.json({ success: true, data: result })
}

// Create or Fork an app for the authenticated user
export async function POST(req: NextRequest) {
  const { name, description, icon, parent_app_id } =
    (await req.json()) as NewApp
  const response = parent_app_id
    ? await forkApp(parent_app_id, { name, description, icon })
    : await addApp({ name, description, icon })
  if (response.error) {
    return NextResponse.json({ success: false, error: response.error })
  } else {
    return NextResponse.json({ success: true, data: response })
  }
}
