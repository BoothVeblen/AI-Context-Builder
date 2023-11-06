export const SLACK_REDIRECT_URI = `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhook/slack/redirect_uri`

export const SLACK_AUTHORIZE_URL = `https://slack.com/oauth/v2/authorize?client_id=${
  process.env.NEXT_PUBLIC_SLACK_CLIENT_ID
}&scope=app_mentions:read,chat:write,im:history,users:read,users:read.email,team:read&user_scope=&redirect_uri=${encodeURIComponent(
  SLACK_REDIRECT_URI
)}`

export const MESSAGE_FOR_KEEP_STREAM_CONNECTION = 'waiting...\n'
export const MESSAGE_FOR_STREAM_ENDING = '[DONE]'
