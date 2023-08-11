import Pusher from 'pusher-js'

import { flags } from './flags'

export function initPusher() {
  const pusher = flags.enabledPusher
    ? new Pusher(process.env.NEXT_PUBLIC_PUSHER_APP_KEY!, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER!,
      })
    : null

  return pusher
}
