import { currentUser } from '@/lib/auth'
import { flags } from '@/lib/flags'

import AuthDropdownMenu from './auth-dropdown-menu'
import UserProfileCard from './user-profile-card'

export default async function AuthButton() {
  if (!flags.enabledAuth) return null

  const { name, email, imageUrl, isAdmin } = await currentUser()

  return (
    <AuthDropdownMenu>
      <button
        type="button"
        className="flex h-16 items-center border-t border-slate-200 px-4 text-left hover:bg-slate-100 focus:outline-none"
      >
        <UserProfileCard
          name={name}
          email={email}
          imageUrl={imageUrl}
          isAdmin={isAdmin}
        />
      </button>
    </AuthDropdownMenu>
  )
}
