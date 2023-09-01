'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Activity,
  ChevronDown,
  ChevronUp,
  LogOutIcon,
  Settings,
  Share,
} from 'lucide-react'
import { useSWRConfig } from 'swr'
import useSWRMutation from 'swr/mutation'

import { cn, fetcher } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import ConfirmDialog from './confirm-dialog'
import { Button } from './ui/button'

function leaveApp(url: string) {
  return fetcher(url, { method: 'DELETE' })
}

interface IProps {
  appId: string
  name: string
  isOwner: boolean
}

const AppSettingDialog = ({ appId, name, isOwner }: IProps) => {
  const [open, setOpen] = useState<boolean>(false)
  const [deleteDialog, setDeleteDialog] = useState<boolean>(false)

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
          onClick?.()
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
          {isOwner && (
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
