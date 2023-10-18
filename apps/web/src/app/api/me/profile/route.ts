import { NextResponse } from 'next/server'

import { currentUser } from '@/lib/auth'

export async function GET() {
  const result = await currentUser()
  return NextResponse.json({ success: true, data: result })
}
