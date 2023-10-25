import useSWR from 'swr'

import { fetcher } from '@/lib/utils'

export default function useUser() {
  const { data, isLoading } = useSWR('/api/me/profile', fetcher, {
    revalidateOnFocus: true,
  })

  return {
    isLoading,
    data,
  }
}
