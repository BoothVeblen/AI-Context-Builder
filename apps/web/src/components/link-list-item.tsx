'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

import { cn } from '@/lib/utils'

const LinkListItem = React.forwardRef<
  React.ElementRef<'a'>,
  React.ComponentPropsWithoutRef<'a'>
>(({ className, title, href = '', children }, ref) => {
  const pathname = usePathname()
  const isSelected = href === pathname

  return (
    <Link href={href} ref={ref}>
      <li>
        <div
          className={cn(
            'block select-none space-y-1 rounded-md px-4 py-2 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground',
            isSelected ? 'bg-accent text-accent-foreground' : '',
            className
          )}
        >
          <div className="text-sm font-medium">{title}</div>
          {children && (
            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
              {children}
            </p>
          )}
        </div>
      </li>
    </Link>
  )
})

LinkListItem.displayName = 'LinkListItem'

export default LinkListItem
