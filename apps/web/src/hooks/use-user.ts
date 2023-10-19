import useSWR from 'swr'

import { fetcher } from '@/lib/utils'

export default function useUser() {
  const { data, isLoading } = useSWR('/api/me/profile', fetcher, {
    revalidateOnFocus: true,
  })

  const { emailAddresses, firstName, lastName, imageUrl } = data ?? {}
  const name = [firstName || '', lastName || ''].join(' ').trim()
  const email = emailAddresses?.[0].emailAddress

  return {
    isLoading,
    data: {
      email,
      name,
      imageUrl,
    },
  }
}
