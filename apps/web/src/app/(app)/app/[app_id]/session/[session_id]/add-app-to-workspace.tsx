'use client'

import * as React from 'react'
import useSWRMutation from 'swr/mutation'

import { fetcher } from '@/lib/utils'

function addToWorkspace(url: string, { arg }: { arg: { app_id: string } }) {
  return fetcher(url, {
    method: 'POST',
    body: JSON.stringify(arg),
  })
}

interface IProps {
  appId: string
}

export default function AddAppToWorkspace({ appId }: IProps) {
  const { trigger } = useSWRMutation(`/api/me/workspace`, addToWorkspace)

  React.useEffect(() => {
    trigger({ app_id: appId })
  }, [appId, trigger])

  return null
}
