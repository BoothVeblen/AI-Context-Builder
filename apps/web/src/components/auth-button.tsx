import { currentUser } from '@/lib/auth'
import { flags } from '@/lib/flags'

import AuthDropdownMenu from './auth-dropdown-menu'
import Profile from './settings/profile'

export default async function AuthButton() {
  if (!flags.enabledAuth) return null

  const profileData = await currentUser()

  return (
    <AuthDropdownMenu>
      <button
        type="button"
        className="flex h-16 items-center border-t border-slate-200 px-4 text-left hover:bg-slate-100 focus:outline-none"
      >
        <Profile fallbackData={profileData} />
      </button>
    </AuthDropdownMenu>
  )
}
