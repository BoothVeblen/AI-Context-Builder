import { NextResponse } from 'next/server'

import { seed } from '@/lib/seed'

export async function GET() {
  await seed()
  return NextResponse.json({ success: true })
}
