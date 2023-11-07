'use client'

import { UserProfile } from '@/types/users'
import useUser from '@/hooks/use-user'
import UserProfileCard from '@/components/user-profile-card'

interface IProps {
  fallbackData?: UserProfile
}

export default function Profile(options?: IProps) {
  const { data, isLoading } = useUser({ fallbackData: options?.fallbackData })

  if (isLoading || !data) {
    return <UserProfileCard.Loading />
  }

  return <UserProfileCard {...data} />
}
