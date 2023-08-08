import { AvatarFallback } from '@radix-ui/react-avatar'
import { ReactNode } from 'react-markdown/lib/ast-to-react'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface IProps {
  children?: ReactNode
  content?: string
}

export function HoverTooltip({ children, content }: IProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right" className="max-md:hidden sm:hidden lg:block">
        <p className="font-normal">{content}</p>
      </TooltipContent>
    </Tooltip>
  )
}
