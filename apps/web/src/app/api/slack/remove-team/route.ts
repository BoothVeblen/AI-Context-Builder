import { NextRequest, NextResponse } from 'next/server'

import { removeTeam } from '@/db/slack_teams/actions'

export async function POST(req: NextRequest) {
  try {
    const { app_id, team_id } = (await req.json()) as {
      app_id: string
      team_id: string
    }
    if (!app_id || !team_id) {
      throw new Error('Missing body: app_id, team_id')
    }
    await removeTeam(app_id, team_id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message })
  }
}
