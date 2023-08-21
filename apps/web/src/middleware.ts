import { NextResponse } from 'next/server'
import { authMiddleware } from '@clerk/nextjs'

import { flags } from './lib/flags'

export default authMiddleware({
  // debug: flags.isDev,
  publicRoutes: flags.enabledAuth
    ? ['/sign-in', '/sign-up', '/api/webhook/(.*)', '/api/cron/(.*)']
    : [], // protect all routes with auth if enabledAuth is true
  // publicRoutes: flags.enabledAuth ? ['/', '/explore'] : [], // old logic, just for reference
  beforeAuth: () => {
    if (flags.enabledAuth) return NextResponse.next()
    return false
  },
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
