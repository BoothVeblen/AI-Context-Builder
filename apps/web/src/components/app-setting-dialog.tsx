'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp, Settings, Share, Trash2 } from 'lucide-react'

import { cn } from '@/lib/utils'
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

interface IProps {
  appId: string
}

const AppSettingDialog = ({ appId }: IProps) => {
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

  return (
    <>
      <DropdownMenu open={open} onOpenChange={(open) => setOpen(open)}>
        <DropdownMenuTrigger asChild>
          <Button
            onClick={() => setOpen(true)}
            className="h-8 w-8 bg-white p-0 text-black"
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
            <AlertDialogTitle>
              Delete &quot;AI Interview&quot; App?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete “AI Interview” App? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-500 text-white">
              Delete App
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default AppSettingDialog
