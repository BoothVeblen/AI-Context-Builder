'use client'

// unused file
import React from 'react'
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface IProps {
  children:
    | React.ReactNode
    | (({
        listeners,
        isDragging,
      }: {
        listeners?: SyntheticListenerMap
        isDragging?: boolean
      }) => React.ReactNode)
  id: string
  handle?: boolean
  disabled?: boolean
}

export function SortableItem({
  children,
  id,
  handle = false,
  disabled = false,
}: IProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(handle ? {} : listeners)}
    >
      {typeof children === 'function'
        ? children({ listeners, isDragging })
        : children}
    </div>
  )
}
