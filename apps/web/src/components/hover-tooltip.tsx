import { ReactNode } from 'react'

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface IProps {
  children?: ReactNode
  content?: string
  side?: 'top' | 'right' | 'bottom' | 'left'
  show?: boolean
}

export function HoverTooltip({
  children,
  content,
  side = 'top',
  show = true,
}: IProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      {show && (
        <TooltipContent
          side={side}
          className="max-md:hidden sm:hidden lg:block"
        >
          <p className="font-normal">{content}</p>
        </TooltipContent>
      )}
    </Tooltip>
  )
}
