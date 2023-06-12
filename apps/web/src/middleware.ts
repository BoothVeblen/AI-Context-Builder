import { NextResponse } from 'next/server'
import { authMiddleware } from '@clerk/nextjs'

import { getFlags } from './lib/flags'

const { isDev, enabledAuth } = getFlags()

export default authMiddleware({
  debug: isDev,
  publicRoutes: enabledAuth ? ['/', '/explore'] : [],
  beforeAuth: () => {
    if (enabledAuth) return NextResponse.next()
    return false
  },
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
