'use client'

import * as React from 'react'
import useSWR from 'swr'

import { fetcher } from '@/lib/utils'
import { Session } from '@/db/sessions/schema'

import SessionListItem from './session-list-item'

interface IProps {
  appId: string
  sessionList: Session[]
}

export default function SessionList({ appId, sessionList }: IProps) {
  const {
    isLoading,
    data: sessionListData,
    error,
    mutate,
  } = useSWR<Session[]>(`/api/apps/${appId}/sessions`, fetcher, {
    fallbackData: sessionList,
  })

  const isOnlyOneSession = sessionListData?.length === 1

  return (
    <div className="px-4 pb-2">
      <nav className="mt-1" aria-label="SessionList">
        <ul role="list" className="-mx-2 space-y-1">
          {sessionListData?.map(({ short_id, name }) => (
            <SessionListItem
              key={short_id}
              id={short_id}
              name={name}
              isOnlyOneSession={isOnlyOneSession}
            />
          ))}
        </ul>
      </nav>
    </div>
  )
}
