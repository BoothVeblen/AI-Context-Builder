import { useMemo } from 'react'
import { useUser } from '@clerk/nextjs'
import { encode } from 'js-base64'

export default function useConfigBase64({ appName }: { appName: string }) {
  const { user } = useUser()

  const config = useMemo(() => {
    if (user) {
      const username = [user.firstName || '', user.lastName || '']
        .join(' ')
        .trim()
      const botname = appName || 'The App'
      return encode(JSON.stringify({ username, botname }))
    }

    return ''
  }, [user, appName])

  return config
}
