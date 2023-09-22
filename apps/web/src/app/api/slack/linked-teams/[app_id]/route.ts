import { NextRequest, NextResponse } from 'next/server'

import { getLinkedTeamList } from '@/db/slack_team_apps/actions'

export async function GET(
  req: NextRequest,
  { params }: { params: { app_id: string } }
) {
  const { app_id } = params
  const data = await getLinkedTeamList(app_id)
  return NextResponse.json({ success: true, data })
}
