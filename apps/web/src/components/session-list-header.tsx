'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Loader2Icon, PlusIcon } from 'lucide-react'
import { useSWRConfig } from 'swr'
import useSWRMutation from 'swr/mutation'

import { fetcher } from '@/lib/utils'

function addSession(url: string) {
  return fetcher(url, { method: 'POST' })
}

interface IProps {
  appId: string
}

export default function SessionListHeader({ appId }: IProps) {
  const router = useRouter()
  const { mutate } = useSWRConfig()
  const { trigger, isMutating } = useSWRMutation(
    `/api/apps/${appId}/sessions`,
    addSession
  )

  async function handleAdd() {
    try {
      const json = await trigger()
      console.log('SessionListHeader handleAdd json:', json)
      mutate('/api/me/workspace')
      router.push(`/app/${appId}/session/${json.sessionId}`)
    } catch (error) {
      console.log('SessionListHeader handleAdd error:', error)
    }
  }

  return (
    <div className="px-4 pt-2">
      <div className="-mx-2 flex h-9 items-center justify-between p-2">
        <div className="text-sm text-slate-900">New Chat</div>
        <button
          className="rounded-full p-1 hover:bg-slate-200"
          aria-hidden="true"
          onClick={handleAdd}
          disabled={isMutating}
        >
          {isMutating ? (
            <Loader2Icon className="h-4 w-4 animate-spin" />
          ) : (
            <PlusIcon className="h-4 w-4 shrink-0" />
          )}
        </button>
      </div>
    </div>
  )
}
