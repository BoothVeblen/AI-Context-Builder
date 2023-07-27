import { NextRequest, NextResponse } from 'next/server'

import { addApp, getApps } from '@/db/apps/actions'
import { NewApp } from '@/db/apps/schema'

// List apps for the authenticated user
export async function GET() {
  const result = await getApps()
  return NextResponse.json({ success: true, data: result })
}

// Create an app for the authenticated user
export async function POST(req: NextRequest) {
  const { name, description, icon } = (await req.json()) as NewApp
  const response = (await addApp({ name, description, icon })) as any
  if (response.error) {
    return NextResponse.json({ success: false, error: response.error })
  } else {
    return NextResponse.json({ success: true, data: response })
  }
}
