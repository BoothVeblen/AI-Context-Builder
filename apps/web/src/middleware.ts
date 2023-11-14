import { NextResponse } from 'next/server'
import { authMiddleware } from '@clerk/nextjs'

import { flags } from './lib/flags'

export default authMiddleware({
  // debug: flags.isDev,
  publicRoutes: flags.enabledAuth
    ? ['/sign-in', '/sign-up', '/api/webhook/(.*)', '/api/cron/(.*)']
    : [],
  beforeAuth: () => {
    if (flags.enabledAuth) return NextResponse.next()
    return false
  },
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
