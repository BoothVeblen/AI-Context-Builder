'use client'

import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { GitCommitIcon, ShareIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

const MENU_ITEMS = [
  {
    id: 'workflow',
    name: 'Workflow',
    Icon: GitCommitIcon,
  },
  {
    id: 'share',
    name: 'Share',
    Icon: ShareIcon,
  },
]

function MenuItem({
  children,
  href,
  isSelected,
}: {
  children: React.ReactNode
  href: string
  isSelected: boolean
}) {
  return (
    <li>
      <Link
        href={href}
        className={cn(
          'flex h-11 items-center rounded-lg px-2 hover:bg-slate-200',
          isSelected && 'bg-slate-200'
        )}
      >
        {children}
      </Link>
    </li>
  )
}

export default function Menu() {
  const { app_id } = useParams() as {
    app_id: string
  }
  const pathname = usePathname()

  return (
    <ul className="space-y-1 p-2">
      {MENU_ITEMS.map(({ id, name, Icon }) => {
        const href = `/app/${app_id}/${id}`
        const isSelected = pathname === href
        return (
          <MenuItem key={id} href={href} isSelected={isSelected}>
            <Icon className="mr-2 h-5 w-5" />
            <span className="text-sm font-medium">{name}</span>
          </MenuItem>
        )
      })}
    </ul>
  )
}
