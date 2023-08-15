import { useMemo } from 'react'
import { useUser } from '@clerk/nextjs'

export default function useConfigBase64({ appName }: { appName: string }) {
  const { user } = useUser()

  const config = useMemo(() => {
    if (user) {
      const username = `${user.firstName ? user.firstName + ' ' : ''}${
        user.lastName || ''
      }`
      const botname = appName || 'The App'
      return window.btoa(JSON.stringify({ username, botname }))
    }

    return ''
  }, [user, appName])

  return config
}
