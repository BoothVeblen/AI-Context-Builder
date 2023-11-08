'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useModal } from '@ebay/nice-modal-react'
import {
  Activity,
  ChevronDown,
  ChevronUp,
  CopyIcon,
  LogOutIcon,
  Settings,
  Share,
} from 'lucide-react'
import { useSWRConfig } from 'swr'
import useSWRMutation from 'swr/mutation'

import { cn, fetcher } from '@/lib/utils'
import { NewApp } from '@/db/apps/schema'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import ConfirmDialog from './confirm-dialog'
import CreateAppDialog from './create-app-dialog'
import { Button } from './ui/button'

function leaveApp(url: string) {
  return fetcher(url, { method: 'DELETE' })
}

interface IProps {
  appId: string
  name: string
  isAdmin: boolean
  isOwner: boolean
  appDetail: NewApp
}

const AppSettingDialog = ({
  appId,
  name,
  isAdmin,
  isOwner,
  appDetail,
}: IProps) => {
  const [open, setOpen] = useState<boolean>(false)
  const [deleteDialog, setDeleteDialog] = useState<boolean>(false)
  const modal = useModal(CreateAppDialog)

  const router = useRouter()
  const { mutate } = useSWRConfig()
  const { trigger, isMutating } = useSWRMutation(
    `/api/me/workspace/app/${appId}`,
    leaveApp
  )

  async function handleRemove() {
    try {
      await trigger()
      mutate('/api/me/workspace')
      router.push('/apps')
      router.refresh()
    } catch (error) {}
  }
  const renderItem = useCallback(
    ({
      icon,
      link,
      name,
      danger = false,
      onClick,
    }: {
      name: string
      icon: React.ReactNode
      link: string
      onClick?: () => void
      danger?: boolean
    }) => (
      <DropdownMenuItem
        className="cursor-pointer"
        onClick={() => {
          setOpen(false)
          setTimeout(() => onClick?.(), 0)
        }}
      >
        <Link
          href={link}
          className={cn(
            'flex w-full items-center gap-2	text-sm font-medium',
            danger ? 'text-red-500 hover:text-red-500' : 'text-slate-700'
          )}
        >
          {icon} {name}
        </Link>
      </DropdownMenuItem>
    ),
    []
  )

  return (
    <>
      <DropdownMenu open={open} onOpenChange={(open) => setOpen(open)}>
        <DropdownMenuTrigger asChild>
          <Button
            onClick={() => setOpen(true)}
            className="h-8 w-8 shrink-0 bg-white p-0 text-black"
            variant="outline"
          >
            {!open ? <ChevronDown /> : <ChevronUp />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[220px]" align="end">
          {(isOwner || isAdmin) && (
            <>
              {renderItem({
                icon: <Settings size={16} />,
                link: `/app/${appId}/settings/basics`,
                name: 'App Settings',
              })}
              {renderItem({
                icon: <Activity size={16} />,
                link: `/app/${appId}/analysis/monitoring`,
                name: 'App Analysis',
              })}
              <DropdownMenuSeparator />
            </>
          )}
          {isOwner && (
            <>
              {renderItem({
                icon: <CopyIcon size={16} />,
                link: '',
                name: 'Duplicate',
                onClick: () =>
                  modal.show({
                    defaultValues: appDetail,
                    parentAppId: appId,
                  }),
              })}
            </>
          )}
          {renderItem({
            icon: <Share size={16} />,
            link: `/app/${appId}/share`,
            name: 'Share',
          })}
          <DropdownMenuSeparator />
          {renderItem({
            icon: <LogOutIcon size={16} />,
            link: '',
            name: 'Leave App',
            danger: true,
            onClick: () => setDeleteDialog(true),
          })}
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        open={deleteDialog}
        onOpenChange={setDeleteDialog}
        title={`Leave “${name}” App?`}
        description={`Are you sure you want to leave “${name}” App? If you
        leave, the app will not appear on the left panel.`}
        confirmText="Leave App"
        loadingText="Leaving..."
        handleConfirm={handleRemove}
        isLoading={isMutating}
      />
    </>
  )
}

export default AppSettingDialog
