import Link from 'next/link'
import useSWR from 'swr'

import { fetcher } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import UserProfileCard from '@/components/user-profile-card'

function Profile() {
  const { data, isLoading } = useSWR('/api/me/profile', fetcher)

  const { emailAddresses, firstName, lastName, imageUrl } = data ?? {}
  const name = [firstName || '', lastName || ''].join(' ').trim()
  const email = emailAddresses?.[0].emailAddress

  if (isLoading) {
    return <UserProfileCard.Loading />
  }

  return <UserProfileCard name={name} email={email} imageUrl={imageUrl} />
}

export default function Account() {
  return (
    <div className="space-y-8 px-6 py-4">
      <h2 className="text-lg font-semibold">Account</h2>
      <div className="space-y-4">
        <h3 className="font-normal">Profile</h3>
        <div className="flex max-w-sm items-center gap-8">
          <Profile />
          <Button asChild variant="outline">
            <Link href="/profile" target="_blank">
              Edit
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
