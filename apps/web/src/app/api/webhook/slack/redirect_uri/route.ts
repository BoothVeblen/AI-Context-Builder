import { NextRequest, NextResponse } from 'next/server'

import { SLACK_REDIRECT_URI } from '@/lib/const'
import { logsnag } from '@/lib/logsnag'
import { createSlackClient, SlackUtils } from '@/lib/slack'
import { encodeQueryData } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams

    // error handling
    const error_description = query.get('error_description')
    if (error_description) {
      throw new Error(error_description)
    }

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
    const user_id = accessInfo.authed_user?.id ?? ''
    if (!app_id) throw new Error('app_id is undefined')
    if (!team_id) throw new Error('team_id is undefined')
    if (!access_token) throw new Error('app_id is undefined')

    const slack = new SlackUtils()
    await slack.initialize({
      app_id,
      team_id,
      access_token,
    })

    // check if the user email from slack is same as the state value
    const userInfo = await slack.getUserInfo(user_id)
    const email = userInfo?.profile?.email
    if (!email) {
      throw new Error('email is undefined, add scope users:read.email')
    }
    const state = query.get('state') // the state value is our user's email who request to install this app
    if (email !== state) {
      throw new Error(
        'The email you use to log in to Slack is inconsistent with the email you use to log in to Context Builder.'
      )
    }

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

    const user = { user_id }
    const slack_user = await slack.addOrUpdateUser(user)

    if (slack_user.is_admin === false) {
      throw new Error(
        `Only the administrator of this workspace has the privilege to share.`
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

    return NextResponse.redirect(
      new URL(
        `/result?${encodeQueryData({
          status: 'success',
          title: 'Success',
          desc: 'You can close this page',
        })}`,
        req.url
      )
    )
  } catch (error: any) {
    return NextResponse.redirect(
      new URL(
        `/result?${encodeQueryData({
          status: 'error',
          title: 'Failed',
          desc: error.message,
        })}`,
        req.url
      )
    )
  }
}
