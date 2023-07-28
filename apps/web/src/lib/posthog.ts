import { PostHog } from 'posthog-node'

export const serverLog = new PostHog(process.env.POSTHOG_API_KEY!, {
  host: 'https://app.posthog.com',
})
