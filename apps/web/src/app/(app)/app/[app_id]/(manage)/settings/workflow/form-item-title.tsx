import { InfoIcon } from 'lucide-react'

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface IProps {
  title: string
  tip?: string
}

export default function FormItemTitle({ title, tip }: IProps) {
  return (
    <div className="flex items-center gap-1">
      {title}
      {tip && (
        <Tooltip>
          <TooltipTrigger asChild>
            <InfoIcon size={18} color="#94A3B8" />
          </TooltipTrigger>
          <TooltipContent className="relative max-w-xs">
            <p className="break-words text-sm font-normal">{tip}</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}
