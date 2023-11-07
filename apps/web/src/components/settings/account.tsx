import Link from 'next/link'

import { Button } from '@/components/ui/button'

import Profile from './profile'

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
