import * as React from 'react'
import useSWR from 'swr'

import { fetcher } from '@/lib/utils'
import { getSessions } from '@/db/sessions/actions'
import { Session } from '@/db/sessions/schema'

import SessionListItem from './session-list-item'
import SessionList from './session-list.client'

interface IProps {
  appId: string
  sessionList: Session[]
}

export default async function ServerSessionList({ appId }: { appId: string }) {
  const sessionList = await getSessions(appId)
  return <SessionList appId={appId} sessionList={sessionList} />
}
