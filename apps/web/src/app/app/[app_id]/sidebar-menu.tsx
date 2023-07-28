'use client'

import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { GitCommitIcon, ShareIcon } from 'lucide-react'

import { flags } from '@/lib/flags'
import { cn } from '@/lib/utils'

const MENU_ITEMS = [
  ...(flags.enabledWorkflow
    ? [
        {
          id: 'workflow',
          name: 'Workflow',
          Icon: GitCommitIcon,
        },
      ]
    : []),
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
  const params = useParams()
  const pathname = usePathname()
  const appId = params.app_id

  return (
    <ul className="space-y-1 p-2">
      {MENU_ITEMS.map(({ id, name, Icon }) => {
        const href = `/app/${appId}/${id}`
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
