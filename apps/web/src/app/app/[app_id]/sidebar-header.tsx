import * as React from 'react'

import { cn, getAvatarBgColor, getFirstLetter } from '@/lib/utils'
import AppSettingDialog from '@/components/app-setting-dialog'

interface IProps {
  appId: string
  name: string
  desc: string
  icon: string
  isOwner: boolean
}

export default function Header({ appId, name, desc, icon, isOwner }: IProps) {
  const color = React.useMemo(() => getAvatarBgColor(appId), [appId])

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
          <AppSettingDialog appId={appId} name={name} isOwner={isOwner} />
        </div>
      </div>
      {desc && (
        <div className="whitespace-pre-line p-4 text-xs font-medium text-slate-500">
          {desc}
        </div>
      )}
    </div>
  )
}
