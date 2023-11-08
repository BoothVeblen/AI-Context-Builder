import React, { MouseEventHandler, PropsWithChildren } from 'react'

import { cn } from '@/lib/utils'

interface Props {
  onClick?: MouseEventHandler<HTMLButtonElement>
}
export const actionCommonButtonProps = {
  size: 16,
  strokeWidth: 3,
} as const

const ChatAction = ({ onClick, children }: PropsWithChildren<Props>) => {
  return (
    <button
      className={cn(
        'mr-1 rounded-md border bg-white p-2',
        onClick
          ? 'cursor-pointer hover:bg-slate-100 active:bg-slate-300'
          : 'cursor-default'
      )}
      {...(onClick
        ? {
            onClick,
          }
        : {})}
    >
      {children}
    </button>
  )
}

export default ChatAction
