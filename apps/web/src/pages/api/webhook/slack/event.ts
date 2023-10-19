import { NextApiRequest, NextApiResponse } from 'next'

import { logsnag } from '@/lib/logsnag'
import { OpenAIStream } from '@/lib/openai-stream'
import { SlackUtils } from '@/lib/slack'
import { nanoid } from '@/lib/utils'
import { addMessage, getFormattedMessages } from '@/db/messages/actions'
import { removeTeam } from '@/db/slack_teams/actions'

const baseUrl = `${process.env.AI_SERVICE_API_BASE_URL}/v1`

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({
        response_type: 'ephemeral',
        text: 'This endpoint only accepts POST requests',
      })
    }

    const { body } = req
    if (body.challenge) return res.status(200).json(body)

    // res.status(200).json(body) // response immediately to avoid retry from slack

    const isUserMessage =
      body.event?.type === 'message' &&
      !body.event?.bot_id &&
      !body.event?.message?.bot_id

    if (isUserMessage) {
      const message = body as any
      const app_id = message.api_app_id
      if (!app_id) throw new Error('app_id is undefined')
      const team_id = message.team_id
      if (!team_id) throw new Error('team_id is undefined')
      if (!message.event) throw new Error('message.event is undefined')
      const user_id = message.event.user
      if (!user_id) throw new Error('user_id is undefined')
      const channel_id = message.event.channel
      if (!channel_id) throw new Error('channel_id is undefined')

      const slack = new SlackUtils()
      await slack.initialize({ app_id, team_id })

      const result = await slack.postMessage({
        channel: channel_id,
        text: '_Thinking..._',
      })

      const ts = result.ts
      if (!ts) throw new Error('ts is undefined')

      const slack_user = await slack.addOrUpdateUser(
        {
          user_id,
        },
        { shouldUpdate: false }
      )

      const { session_id, api_session_id, slack_team_app_id } =
        (await slack.getCurrentSession(user_id)) || {}

      if (!session_id || !api_session_id || !slack_team_app_id) {
        slack.updateMessage({
          channel: channel_id,
          ts,
          text: 'Admin message: The config of this app has been updated. Please start a new chat from the Home tab.',
        })
        return res.status(200).json(body)
      }

      const messages = await getFormattedMessages(session_id)
      const content = message.event.text
      const payload = {
        session_id: api_session_id,
        messages: [...messages, { role: 'user', content }],
      }

      let completion = ''
      const messageId = nanoid()

      const requestId = nanoid()
      await logsnag?.track({
        user_id: slack_user.context_user_id,
        channel: 'chat',
        event: 'Chat Request (Slack)',
        icon: '➡️',
        description: `Send a chat request at Slack`,
        tags: {
          'request-id': requestId,
          'slack-app-id': app_id,
          'slack-team-id': team_id,
          'session-id': session_id,
        },
      })

      const requestTimestamp = Date.now()

      await OpenAIStream({
        baseUrl,
        payload,
        callback: {
          async onStart() {
            const responseTimestamp = Date.now()
            const latencyMs = responseTimestamp - requestTimestamp
            await logsnag?.track({
              user_id: slack_user.context_user_id,
              channel: 'chat',
              event: 'Chat Response (Slack)',
              icon: '⬅️',
              description: `Got a response within ${latencyMs}ms`,
              tags: {
                'request-id': requestId,
                'slack-app-id': app_id,
                'slack-team-id': team_id,
                'session-id': session_id,
                'latency-ms': latencyMs,
              },
            })
          },
          async onToken(text) {
            completion = completion + text
            await slack.updateMessage({
              channel: channel_id,
              ts,
              text: completion,
            })
          },
          async onCompletion(completion, metadata) {
            setTimeout(() => {
              const blocks = [
                {
                  type: 'section',
                  text: {
                    type: 'mrkdwn',
                    text: completion,
                  },
                },
                {
                  type: 'actions',
                  elements: [
                    {
                      type: 'button',
                      text: {
                        type: 'plain_text',
                        text: '👍',
                        emoji: true,
                      },
                      action_id: 'chat_feedback_good',
                      value: messageId,
                    },
                    {
                      type: 'button',
                      text: {
                        type: 'plain_text',
                        text: '👎',
                        emoji: true,
                      },
                      action_id: 'chat_feedback_bad',
                      value: messageId,
                    },
                  ],
                },
              ]
              slack.updateMessage({
                channel: channel_id,
                ts,
                blocks,
                text: completion,
              })
            }, 800)

            const responseTimestamp = Date.now()
            const latency = responseTimestamp - requestTimestamp
            const newMessage = {
              type: 'chat',
              short_id: messageId,
              session_id,
              query: content,
              answer: completion,
              feedback: null,
              feedback_content: null,
              latency,
              ...(metadata?.token?.total_tokens && {
                total_tokens: metadata.token.total_tokens,
              }),
              ...(metadata?.raw && { raw: metadata.raw }),
            }
            await addMessage(newMessage)
          },
        },
        data: {},
      })

      return res.status(200).json(body)
    }

    if (body.event?.type === 'app_home_opened') {
      const payload = body as any
      if (!payload.event) throw new Error('payload.event is undefined')
      const user_id = payload.event.user
      const app_id = payload.api_app_id
      const team_id = payload.team_id
      const channel_id = payload.event?.channel
      if (!user_id) throw new Error('user_id is undefined')
      if (!app_id) throw new Error('api_app_id is undefined')
      if (!team_id) throw new Error('team_id is undefined')
      if (!channel_id) throw new Error('channel_id is undefined')
      const slack = new SlackUtils()
      await slack.initialize({ app_id, team_id })
      await slack.publishHomeViews({ user_id, channel_id })
      return res.status(200).json(body)
    }

    if (body.event?.type === 'app_uninstalled') {
      const payload = body as any
      if (!payload.event) throw new Error('payload.event is undefined')
      const app_id = payload.api_app_id
      const team_id = payload.team_id
      if (!app_id) throw new Error('api_app_id is undefined')
      if (!team_id) throw new Error('team_id is undefined')
      await removeTeam(app_id, team_id)
      return res.status(200).json(body)
    }
  } catch (error: any) {
    console.error('error:', error.message)
    return res.status(500).json({ error: error.message })
  }
}
