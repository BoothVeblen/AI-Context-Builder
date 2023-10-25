import * as React from 'react'
import { auth } from '@clerk/nextjs'

import { currentUser } from '@/lib/auth'
import { cn, getAvatarBgColor, getFirstLetter } from '@/lib/utils'
import { getApp } from '@/db/apps/actions'
import AppSettingDialog from '@/components/app-setting-dialog'

interface IProps {
  appId: string
}

export default async function Header({ appId }: IProps) {
  const { userId } = auth()
  const color = getAvatarBgColor(appId)
  const appDetail = await getApp(appId)
  const { name, description: desc, icon } = appDetail
  const { isAdmin } = await currentUser()
  const isOwner = userId === appDetail.created_by

  return (
    <div>
      <div
        className={cn(
          'relative h-32 bg-cover bg-center',
          !icon && `bg-${color}-600`
        )}
        style={{
          ...(icon
            ? {
                backgroundImage: `url(${icon})`,
              }
            : {}),
        }}
      >
        {!icon && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-5xl font-extrabold text-white">
              {getFirstLetter(name)}
            </div>
          </div>
        )}
        <div className="sticky top-0 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent px-4 py-2.5 text-white">
          <h1 className="mr-2 truncate text-lg font-semibold">{name}</h1>
          <div className="hidden lg:block">
            <AppSettingDialog
              appId={appId}
              name={name}
              isOwner={isOwner || isAdmin}
            />
          </div>
        </div>
      </div>
      {desc && (
        <div className="whitespace-pre-line break-words p-4 text-xs font-medium leading-5 text-slate-500">
          {desc}
        </div>
      )}
    </div>
  )
}
