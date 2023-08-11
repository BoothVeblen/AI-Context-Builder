import Pusher from 'pusher'

import { flags } from './flags'

export function initPusher() {
  const pusher = flags.enabledPusher
    ? new Pusher({
        appId: process.env.PUSHER_APP_ID!,
        key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY!,
        secret: process.env.PUSHER_APP_SECRET!,
        cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER!,
        useTLS: true,
      })
    : null

  return pusher
}
