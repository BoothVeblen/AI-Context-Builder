'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronUp, Settings, Share, Trash2 } from 'lucide-react'
import { useSWRConfig } from 'swr'
import useSWRMutation from 'swr/mutation'

import { cn, fetcher } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { Button } from './ui/button'

function removeApp(url: string) {
  return fetcher(url, { method: 'DELETE' })
}

interface IProps {
  appId: string
  name: string
}

const AppSettingDialog = ({ appId, name }: IProps) => {
  const [open, setOpen] = useState<boolean>(false)
  const [deleteDialog, setDeleteDialog] = useState<boolean>(false)
  const menus = [
    {
      id: 'settings',
      name: 'App Setting',
      icon: <Settings size={16} />,
      link: `/app/${appId}/settings`,
    },
    {
      id: 'share',
      name: 'Share',
      icon: <Share size={16} />,
      link: ` /app/${appId}/share`,
    },
    {
      id: 'delete',
      name: 'Delete App',
      icon: <Trash2 size={16} />,
      link: '',
      danger: true,
    },
  ]

  const router = useRouter()
  const { mutate } = useSWRConfig()
  const { trigger, isMutating } = useSWRMutation(
    `/api/apps/${appId}`,
    removeApp
  )

  async function handleRemove() {
    try {
      const json = await trigger()
      console.log('json:', json)
      mutate('/api/me/workspace')
      router.push('/explore')
    } catch (error) {
      console.log('AppSettingDialog handleRemove error:', error)
    }
  }

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
          {menus?.map((item) => {
            return (
              <DropdownMenuItem
                key={item.id}
                className="cursor-pointer"
                onClick={() => {
                  setOpen(false)
                  if (item.id === 'delete') {
                    setDeleteDialog(true)
                  }
                }}
              >
                <Link
                  href={item?.link}
                  className={cn(
                    'flex w-full items-center gap-2	text-sm font-medium',
                    item.danger
                      ? 'text-red-500 hover:text-red-500'
                      : 'text-slate-700'
                  )}
                >
                  {item?.icon} {item?.name}
                </Link>
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{name}&quot; App?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{name}&quot; App? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleRemove}
              disabled={isMutating}
            >
              {isMutating ? 'Deleting...' : 'Delete App'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default AppSettingDialog