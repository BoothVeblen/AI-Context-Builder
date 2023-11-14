import useSWR from 'swr'

import { UserProfile } from '@/types/users'
import { fetcher } from '@/lib/utils'

interface IProps {
  fallbackData?: UserProfile
}

export default function useUser(options?: IProps) {
  const { data, isLoading } = useSWR<UserProfile>('/api/me/profile', fetcher, {
    fallbackData: options?.fallbackData,
    revalidateOnMount: !options?.fallbackData,
  })

  return {
    isLoading,
    data,
  }
}
