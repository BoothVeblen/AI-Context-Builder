import { BASE_URL } from './utils'

const hasValue = (env?: string) =>
  env !== undefined && env !== null && env !== ''

export const flags = {
  isProd: BASE_URL === 'https://build.withcontext.ai',
  isDev: process.env.NODE_ENV === 'development',
  enabledAuth:
    process.env.IS_DOCKER ||
    [
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      process.env.CLERK_SECRET_KEY,
    ].every(hasValue),
  isNeon: process.env.DATABASE_URL?.includes('neon.tech') || false,
  enabledAIService: hasValue(process.env.AI_SERVICE_API_BASE_URL),
  enabledPusher: hasValue(process.env.NEXT_PUBLIC_PUSHER_APP_KEY),
  enabledVideoInteraction: true,
  enabledLogSnag:
    BASE_URL === 'https://build.withcontext.ai' &&
    hasValue(process.env.LOGSNAG_TOKEN),
  enabledSlack: hasValue(process.env.NEXT_PUBLIC_SLACK_CLIENT_ID),
}
