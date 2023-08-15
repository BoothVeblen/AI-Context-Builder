import { LogSnag } from 'logsnag'

import { flags } from './flags'

export const logsnag = flags.enabledLogSnag
  ? new LogSnag({
      token: process.env.LOGSNAG_TOKEN!,
      project: 'builder',
    })
  : null
