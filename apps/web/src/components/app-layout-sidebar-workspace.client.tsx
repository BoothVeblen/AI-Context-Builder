'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useModal } from '@ebay/nice-modal-react'
import { PlusIcon } from 'lucide-react'
import useSWR from 'swr'

import {
  cn,
  fetcher,
  getAvatarBgColor,
  getFirstLetter,
  getPresetUrlOfImage,
} from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

import createAppDialog from './create-app-dialog'

interface WorkspaceItem {
  app_id: string | null
  app_name: string | null
  app_icon: string | null
  session_id: string | null
}

interface IProps {
  appList?: WorkspaceItem[]
}

export default function WorkspaceList({ appList }: IProps) {
  const { app_id: appId } = useParams() as {
    app_id: string
  }

  const { data: appListData } = useSWR<WorkspaceItem[]>(
    '/api/me/workspace',
    fetcher,
    {
      fallbackData: appList,
      revalidateOnMount: !appList,
    }
  )

  const modal = useModal(createAppDialog)

  return (
    <ul role="list" className="flex flex-col space-y-4">
      {appListData?.map((appItem) => {
        const isSelected = appId === appItem.app_id
        const color = getAvatarBgColor(appItem.app_id || '')
        return (
          <li
            key={appItem.app_id}
            className="group relative flex justify-center"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={`/app/${appItem.app_id}/session/${appItem.session_id}`}
                >
                  <Avatar
                    className={cn(
                      'h-12 w-12 rounded-3xl bg-white transition-all group-hover:rounded-2xl',
                      isSelected && 'rounded-2xl',
                      !appItem.app_icon ? `bg-${color}-600` : ''
                    )}
                  >
                    {appItem.app_icon && (
                      <img
                        src={getPresetUrlOfImage(appItem.app_icon)}
                        alt=""
                        className="aspect-square h-full w-full object-cover"
                      />
                    )}
                    <AvatarFallback className="bg-transparent text-white">
                      {getFirstLetter(appItem.app_name || '')}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{appItem.app_name}</TooltipContent>
            </Tooltip>
            <div
              className={cn(
                'absolute left-0 top-1/2 h-0 w-1 -translate-x-2 -translate-y-1/2 rounded-r-sm bg-white transition-all group-hover:h-5 group-hover:translate-x-0',
                isSelected && 'h-10 translate-x-0 group-hover:h-10'
              )}
            />
          </li>
        )
      })}
      <div className="hidden lg:block">
        <li className="group flex justify-center" onClick={() => modal.show()}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Avatar className="h-12 w-12 cursor-pointer rounded-3xl bg-white transition-all group-hover:rounded-2xl">
                <AvatarFallback className="bg-white">
                  <PlusIcon />
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent side="right">Create an app</TooltipContent>
          </Tooltip>
        </li>
      </div>
    </ul>
  )
}
