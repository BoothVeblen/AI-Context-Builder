'use client'

import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { Box, PlusIcon } from 'lucide-react'
import useSWR from 'swr'

import { cn, fetcher, getAvatarBgColor, getFirstLetter } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

import CreateAppDialog from './create-app-dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'

interface WorkspaceItem {
  app_id: string | null
  app_name: string | null
  app_icon: string | null
  session_id: string | null
}

interface IProps {
  appList?: WorkspaceItem[]
}

const NavList = [
  {
    title: 'Explore',
    src: '/logo.png',
    link: '/explore',
    scopes: ['/explore'],
  },
  {
    title: 'My Space',
    icon: <Box className="text-orange-600" />,
    link: '/apps',
    scopes: ['/apps', '/datasets'],
  },
]

export default function WorkspaceSidebar({ appList }: IProps) {
  const pathname = usePathname()
  const { app_id: appId } = useParams() as {
    app_id: string
  }

  const { data: appListData } = useSWR<WorkspaceItem[]>(
    '/api/me/workspace',
    fetcher,
    {
      fallbackData: appList,
    }
  )

  return (
    <div className="flex h-full w-18 shrink-0 flex-col overflow-y-auto bg-slate-900 scrollbar-none">
      <div className="relative mt-6 flex shrink-0 flex-col space-y-4">
        {NavList?.map((item) => {
          const selected = item?.scopes?.some(
            (scope) => pathname?.startsWith(scope)
          )
          return (
            <div
              key={item?.title}
              className="group relative flex shrink-0 items-center justify-center"
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href={item?.link}>
                    <Avatar
                      className={cn(
                        'h-12 w-12 rounded-3xl bg-white transition-all group-hover:rounded-2xl',
                        selected && 'rounded-2xl'
                      )}
                    >
                      {item?.src ? (
                        <img
                          src="/logo.png"
                          alt=""
                          className="aspect-square h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          {item?.icon}
                        </div>
                      )}
                    </Avatar>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{item?.title}</TooltipContent>
              </Tooltip>
              <div
                className={cn(
                  'absolute left-0 top-1/2 h-0 w-1 -translate-x-2 -translate-y-1/2 rounded-r-sm bg-white transition-all group-hover:h-5 group-hover:translate-x-0',
                  selected && 'h-10 translate-x-0 group-hover:h-10'
                )}
              />
            </div>
          )
        })}
      </div>
      <div className="m-auto mt-6 h-px w-14 shrink-0 bg-slate-200" />
      <nav className="flex-1 py-6">
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
                            src={appItem.app_icon}
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
                  <TooltipContent side="right">
                    {appItem.app_name}
                  </TooltipContent>
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
            <CreateAppDialog
              dialogTrigger={
                <li className="group flex justify-center">
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
              }
            />
          </div>
        </ul>
      </nav>
    </div>
  )
}
