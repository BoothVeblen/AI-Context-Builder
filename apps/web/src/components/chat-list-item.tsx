'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import clsx from 'clsx'
import { MessageCircleIcon, TrashIcon } from 'lucide-react'

interface IChatItem {
  token: string
  title: string
}

export default function ChatListItem({ token, title }: IChatItem) {
  const params = useParams()
  const botId = params.bot_id
  const chatId = params.chat_id
  const href = `/bot/${botId}/chat/${token}`
  const isSelected = chatId == token

  return (
    <li>
      <Link
        href={href}
        className={clsx(
          isSelected ? 'bg-slate-100' : 'hover:bg-slate-100',
          'relative group flex items-center gap-x-2 h-8 px-2 rounded-md text-sm font-medium text-slate-900'
        )}
      >
        <MessageCircleIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="truncate">{title}</span>
        <span
          className="absolute right-2 hidden rounded-full bg-slate-100 p-1 text-center hover:bg-white group-hover:block"
          aria-hidden="true"
        >
          <TrashIcon className="h-4 w-4 shrink-0" />
        </span>
      </Link>
    </li>
  )
}
