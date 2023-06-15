import React from 'react'

import { cn } from '@/lib/utils'

const ListItem = React.forwardRef<
  React.ElementRef<'div'>,
  React.ComponentPropsWithoutRef<'div'>
>(({ className, title, children, defaultChecked, ...props }, ref) => {
  return (
    <li>
      <div
        ref={ref}
        className={cn(
          'block select-none space-y-1 rounded-md px-4 py-2 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground',
          defaultChecked
            ? 'bg-accent text-accent-foreground'
            : 'cursor-pointer',
          className
        )}
        {...props}
      >
        <div className="text-sm font-medium">{title}</div>
        {children && (
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        )}
      </div>
    </li>
  )
})

ListItem.displayName = 'ListItem'

export default ListItem
