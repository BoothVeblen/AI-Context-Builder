import {
  auth as clerkAuth,
  currentUser as clerkCurrentUser,
} from '@clerk/nextjs'
import {
  SignedInAuthObject,
  SignedOutAuthObject,
} from '@clerk/nextjs/dist/types/server'

import { getFlags } from './flags'

export function auth() {
  const { enabledAuth } = getFlags()
  if (enabledAuth) return clerkAuth()
  return {} as SignedInAuthObject | SignedOutAuthObject
}

export function currentUser() {
  const { enabledAuth } = getFlags()
  if (enabledAuth) return clerkCurrentUser()
  return Promise.resolve(null)
}
