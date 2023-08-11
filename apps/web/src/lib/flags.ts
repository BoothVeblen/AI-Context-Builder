import { BASE_URL } from './utils'

export const flags = {
  isProd: BASE_URL === 'https://build.withcontext.ai',
  isDev: process.env.NODE_ENV === 'development',
  enabledAuth:
    process.env.IS_DOCKER ||
    [
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      process.env.CLERK_SECRET_KEY,
    ].every((env) => env != undefined && env !== ''),
  isNeon: process.env.DATABASE_URL?.includes('neon.tech') || false,
  enabledWorkflow: true,
  enabledAIService: process.env.AI_SERVICE_API_BASE_URL != null,
  enabledPusher: process.env.NEXT_PUBLIC_PUSHER_APP_KEY != null,
  enabledVideoInteraction: true,
}
