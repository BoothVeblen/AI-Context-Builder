import { NextResponse } from 'next/server'

import { getMyTeamList } from '@/db/slack_teams/actions'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET() {
  const data = await getMyTeamList()
  return NextResponse.json({ success: true, data })
}
