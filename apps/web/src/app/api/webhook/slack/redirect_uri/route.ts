import { NextRequest, NextResponse } from 'next/server'

import { SLACK_REDIRECT_URI } from '@/lib/const'
import { logsnag } from '@/lib/logsnag'
import { createSlackClient, SlackUtils } from '@/lib/slack'
import { encodeQueryData } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams
    const code = query.get('code')
    if (!code) throw new Error('code is undefined')

    const client_id = process.env.NEXT_PUBLIC_SLACK_CLIENT_ID
    const client_secret = process.env.SLACK_CLIENT_SECRET

    if (!client_id || !client_secret)
      throw new Error('client_id or client_secret is undefined')

    const client = createSlackClient()
    const accessInfo = await client.oauth.v2.access({
      client_id,
      client_secret,
      code,
      redirect_uri: SLACK_REDIRECT_URI,
      grant_type: 'authorization_code',
    })

    const app_id = accessInfo.app_id
    const team_id = accessInfo.team?.id
    const access_token = accessInfo.access_token
    if (!app_id) throw new Error('app_id is undefined')
    if (!team_id) throw new Error('team_id is undefined')
    if (!access_token) throw new Error('app_id is undefined')

    const slack = new SlackUtils()
    await slack.initialize({
      app_id,
      team_id,
      access_token,
    })

    const teamInfo = await slack.client.team.info({ team: team_id })
    if (!teamInfo.team) throw new Error('team is undefined')

    const team = {
      team_name: teamInfo.team.name ?? 'Default Team name',
      team_url: teamInfo.team.url,
      team_icon: teamInfo.team.icon?.image_132 || '',
      access_token,
      scope: accessInfo.scope,
      archived: false,
    }
    const slack_team = await slack.addOrUpdateTeam(team)

    const user = {
      user_id: accessInfo.authed_user?.id ?? '',
    }
    const slack_user = await slack.addOrUpdateUser(user)

    if (slack_user.is_admin === false) {
      const status = 'error'
      const title = 'Failed'
      const desc = `Only the administrator of this workspace has the privilege to share.`
      return NextResponse.redirect(
        new URL(`/result?${encodeQueryData({ status, title, desc })}`, req.url)
      )
    }

    await logsnag?.track({
      user_id: slack_user.context_user_id,
      channel: 'share',
      event: 'Install to Slack workspace',
      icon: '🔌',
      description: `Successfully installed to ${slack_team.team_name} (${slack_team.team_url})`,
      tags: {
        'slack-app-id': slack_team.app_id,
        'slack-team-id': slack_team.team_id,
      },
    })

    const status = 'success'
    const title = 'Success'
    const desc = `You can close this page`
    return NextResponse.redirect(
      new URL(`/result?${encodeQueryData({ status, title, desc })}`, req.url)
    )
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message })
  }
}
