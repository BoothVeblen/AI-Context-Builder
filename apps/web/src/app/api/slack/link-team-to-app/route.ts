import { NextRequest, NextResponse } from 'next/server'

import { linkTeamToApp, unLinkTeamFromApp } from '@/db/slack_team_apps/actions'

export async function POST(req: NextRequest) {
  try {
    const {
      app_id,
      team_id,
      context_app_id,
      unlink = false,
    } = (await req.json()) as {
      app_id: string
      team_id: string
      context_app_id: string
      unlink?: boolean
    }
    if (!app_id || !team_id || !context_app_id) {
      throw new Error('Missing body: app_id, team_id, context_app_id')
    }
    const data = unlink
      ? await unLinkTeamFromApp(app_id, team_id, context_app_id)
      : await linkTeamToApp(app_id, team_id, context_app_id)
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message })
  }
}
