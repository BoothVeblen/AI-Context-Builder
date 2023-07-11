import { UserButton } from '@clerk/nextjs'

import { currentUser } from '@/lib/auth'
import { flags } from '@/lib/flags'

import LoginLink from './login-link'

export default async function AuthButton() {
  if (!flags.enabledAuth) return null

  const {
    id: userId,
    emailAddresses,
    firstName,
    lastName,
  } = (await currentUser()) ?? {}
  const name = `${firstName} ${lastName}`
  const email = emailAddresses?.[0].emailAddress

  return (
    <div className="flex h-16 items-center border-t border-slate-100">
      {userId ? (
        <div className="flex items-center space-x-2 truncate px-4">
          <div className="h-8 w-8">
            <UserButton />
          </div>
          <div>
            <p className="truncate text-sm font-medium">{name}</p>
            <p className="truncate text-xs font-medium text-slate-500">
              {email}
            </p>
          </div>
        </div>
      ) : (
        <LoginLink />
      )}
    </div>
  )
}
