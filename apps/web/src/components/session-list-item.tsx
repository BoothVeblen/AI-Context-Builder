'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import clsx from 'clsx'
import { MessageCircleIcon, TrashIcon } from 'lucide-react'

interface ISessionItem {
  token: string
  title: string
}

export default function SessionListItem({ token, title }: ISessionItem) {
  const params = useParams()
  const appId = params.app_id
  const sessionId = params.session_id
  const href = `/app/${appId}/session/${token}`
  const isSelected = sessionId == token
  return (
    <li>
      <Link
        href={href}
        className={clsx(
          isSelected ? 'bg-slate-100' : 'hover:bg-slate-100',
          'relative group flex items-center gap-x-2 p-2 rounded-md text-sm font-medium text-slate-900'
        )}
      >
        <MessageCircleIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="truncate">{title}</span>
        {isSelected && (
          <span
            className="absolute right-2 rounded-full bg-slate-100 p-1 text-center hover:bg-white"
            aria-hidden="true"
            // onClick={() => chatStore?.deleteSession(sessionId)}
          >
            <TrashIcon className="h-4 w-4 shrink-0" />
          </span>
        )}
      </Link>
    </li>
  )
}
