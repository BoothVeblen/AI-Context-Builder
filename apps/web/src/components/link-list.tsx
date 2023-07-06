import React from 'react'

import { cn } from '@/lib/utils'

import LinkListItem from './link-list-item'

interface IProps extends React.ComponentPropsWithoutRef<'ul'> {
  value: { href: string; title: string }[]
}

const LinkList = React.forwardRef<React.ElementRef<'ul'>, IProps>(
  ({ value, className, ...props }, ref) => {
    return (
      <ul
        ref={ref}
        className={cn('flex flex-col space-y-1', className)}
        {...props}
      >
        {value.map(({ href, title }) => {
          return <LinkListItem key={href} title={title} href={href} />
        })}
      </ul>
    )
  }
)

LinkList.displayName = 'LinkList'

export default LinkList
