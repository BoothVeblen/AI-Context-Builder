import { currentUser } from '@/lib/auth'
import { flags } from '@/lib/flags'

import AuthDropdownMenu from './auth-dropdown-menu'
import UserProfileCard from './user-profile-card'

export default async function AuthButton() {
  if (!flags.enabledAuth) return null

  const { emailAddresses, firstName, lastName, imageUrl } =
    (await currentUser()) ?? {}
  const name = [firstName || '', lastName || ''].join(' ').trim()
  const email = emailAddresses?.[0].emailAddress

  return (
    <AuthDropdownMenu>
      <button
        type="button"
        className="flex h-16 items-center border-t border-slate-200 px-4 text-left hover:bg-slate-100 focus:outline-none"
      >
        <UserProfileCard name={name} email={email} imageUrl={imageUrl} />
      </button>
    </AuthDropdownMenu>
  )
}
