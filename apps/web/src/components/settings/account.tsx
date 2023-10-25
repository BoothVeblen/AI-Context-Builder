import Link from 'next/link'

import useUser from '@/hooks/use-user'
import { Button } from '@/components/ui/button'
import UserProfileCard from '@/components/user-profile-card'

function Profile() {
  const { data, isLoading } = useUser()

  if (isLoading) {
    return <UserProfileCard.Loading />
  }

  const { email, name, imageUrl } = data
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
