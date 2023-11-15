import * as React from 'react'

import { getSessions } from '@/db/sessions/actions'

import SessionListClient from './session-list.client'

interface IProps {
  appId: string
}

export default async function SessionList({ appId }: IProps) {
  const sessionList = await getSessions(appId)
  return <SessionListClient appId={appId} sessionList={sessionList} />
}
