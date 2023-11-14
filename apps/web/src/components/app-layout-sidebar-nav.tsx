'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Box } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/avatar'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const data = [
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

function NavItem({
  link,
  src,
  icon,
  title,
  selected,
}: {
  link: string
  src?: string
  icon?: React.ReactNode
  title: string
  selected: boolean
}) {
  return (
    <div className="group relative flex shrink-0 items-center justify-center">
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href={link}>
            <Avatar
              className={cn(
                'h-12 w-12 rounded-3xl bg-white transition-all group-hover:rounded-2xl',
                selected && 'rounded-2xl'
              )}
            >
              {src ? (
                <img
                  src="/logo.png"
                  alt=""
                  className="aspect-square h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  {icon}
                </div>
              )}
            </Avatar>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right">{title}</TooltipContent>
      </Tooltip>
      <div
        className={cn(
          'absolute left-0 top-1/2 h-0 w-1 -translate-x-2 -translate-y-1/2 rounded-r-sm bg-white transition-all group-hover:h-5 group-hover:translate-x-0',
          selected && 'h-10 translate-x-0 group-hover:h-10'
        )}
      />
    </div>
  )
}

export default function NavList() {
  const pathname = usePathname()

  return (
    <div className="relative mt-6 flex shrink-0 flex-col space-y-4">
      {data.map((item) => {
        const { title, src, link, icon, scopes } = item
        const selected = scopes?.some((scope) => pathname?.startsWith(scope))
        return (
          <NavItem
            key={title}
            title={title}
            src={src}
            link={link}
            icon={icon}
            selected={selected}
          />
        )
      })}
    </div>
  )
}
