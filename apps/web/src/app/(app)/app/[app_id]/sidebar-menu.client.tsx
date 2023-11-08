'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useModal } from '@ebay/nice-modal-react'
import { GitCommitIcon, GitForkIcon, ShareIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { NewApp } from '@/db/apps/schema'
import CreateAppDialog from '@/components/create-app-dialog'

export function MenuItem({
  children,
  icon,
  href,
  onClick,
}: {
  children: React.ReactNode
  icon: React.ElementType
  href: string
  onClick?: () => void
}) {
  const Icon = icon as React.ElementType
  const isSelected = usePathname() === href
  return (
    <li>
      <Link
        href={href}
        onClick={onClick}
        className={cn(
          'flex h-11 items-center rounded-lg px-2 hover:bg-slate-200',
          isSelected && 'bg-slate-200'
        )}
      >
        <Icon className="mr-2 h-5 w-5" />
        <span className="text-sm font-medium">{children}</span>
      </Link>
    </li>
  )
}

interface IProps {
  appId: string
  isOwner: boolean
  appDetail: NewApp
}

export default function MenuClient({ appId, isOwner, appDetail }: IProps) {
  const createAppDialog = useModal(CreateAppDialog)

  return (
    <ul className="space-y-1 p-2">
      <MenuItem href={`/app/${appId}/workflow`} icon={GitCommitIcon}>
        Workflow
      </MenuItem>
      {!isOwner && (
        <MenuItem
          href=""
          onClick={() => {
            createAppDialog.show({
              defaultValues: appDetail,
              parentAppId: appId,
            })
          }}
          icon={GitForkIcon}
        >
          Customize
        </MenuItem>
      )}
      <MenuItem href={`/app/${appId}/share`} icon={ShareIcon}>
        Share
      </MenuItem>
    </ul>
  )
}
