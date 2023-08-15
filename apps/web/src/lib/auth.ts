import {
  auth as clerkAuth,
  currentUser as clerkCurrentUser,
} from '@clerk/nextjs'
import {
  SignedInAuthObject,
  SignedOutAuthObject,
} from '@clerk/nextjs/dist/types/server'

import { flags } from './flags'

export function auth() {
  if (flags.enabledAuth) return clerkAuth()
  return {} as SignedInAuthObject | SignedOutAuthObject
}

export function currentUser() {
  if (flags.enabledAuth) return clerkCurrentUser()
  return Promise.resolve(null)
}

export async function currentUserEmail() {
  if (flags.enabledAuth) {
    const { emailAddresses } = (await clerkCurrentUser()) ?? {}
    const email = emailAddresses?.[0].emailAddress
    if (email) return email
  }
  return Promise.resolve(null)
}
