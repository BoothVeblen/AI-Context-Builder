'use client'

import Link from 'next/link'

import {
  cn,
  getAvatarBgColor,
  getFirstLetter,
  getPresetUrlOfImage,
} from '@/lib/utils'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface IProps {
  id: string
  name: string
  description: string
  icon: string
  creator?: string
}

export default function AppCard({
  id,
  name,
  description,
  icon,
  creator,
}: IProps) {
  const color = getAvatarBgColor(id || '')

  return (
    <Link href={`/app/${id}`}>
      <Card className="relative h-[278px] shadow-none hover:shadow-md">
        <div className="absolute top-20 h-px w-full bg-slate-200" />
        <CardHeader className="p-4">
          <div className="space-y-2">
            {icon ? (
              <img
                src={getPresetUrlOfImage(icon)}
                alt={id}
                className="relative h-24 w-24 rounded-lg bg-white object-cover"
              />
            ) : (
              <div
                className={cn(
                  'relative flex h-24 w-24 items-center justify-center rounded-lg text-2xl text-background',
                  `bg-${color}-600`
                )}
              >
                {getFirstLetter(name)}
              </div>
            )}
            <CardDescription className="text-sm font-normal">
              {creator}
            </CardDescription>
          </div>
          <Tooltip>
            <div className="flex">
              <TooltipTrigger asChild>
                <CardTitle className="truncate text-xl">{name}</CardTitle>
              </TooltipTrigger>
              <div className="flex-1" />
            </div>
            <TooltipContent side="top" className="max-w-[300px]" align="start">
              <p className="break-words">{name}</p>
            </TooltipContent>
          </Tooltip>
          <CardDescription className="line-clamp-4 break-words text-xs leading-5">
            {description}
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  )
}
