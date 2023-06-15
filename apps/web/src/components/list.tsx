import React from 'react'

import { cn } from '@/lib/utils'

import ListItem from './list-item'

interface IProps extends React.ComponentPropsWithoutRef<'ul'> {
  value: { id: string; title: string }[]
  selectedId: string
  onClickBuilder: (id: string) => (e: React.MouseEvent) => void
}

const List = React.forwardRef<React.ElementRef<'ul'>, IProps>(
  ({ value, selectedId, onClickBuilder, className, ...props }, ref) => {
    return (
      <ul
        ref={ref}
        className={cn('flex flex-col space-y-1', className)}
        {...props}
      >
        {value.map(({ id, title }) => {
          const isSelected = id === selectedId
          return (
            <ListItem
              key={id}
              title={title}
              defaultChecked={isSelected}
              onClick={onClickBuilder(id)}
            />
          )
        })}
      </ul>
    )
  }
)

List.displayName = 'List'

export default List
