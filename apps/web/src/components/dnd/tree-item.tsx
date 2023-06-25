'use client'

import type { HTMLAttributes } from 'react'
import React, { forwardRef } from 'react'
import { UniqueIdentifier } from '@dnd-kit/core'

import { cn } from '@/lib/utils'

import { ITreeItemChildren } from './types'

export interface Props
  extends Omit<HTMLAttributes<HTMLLIElement>, 'id' | 'children'> {
  itemId?: UniqueIdentifier
  childCount?: number
  clone?: boolean
  collapsed?: boolean
  depth: number
  disableInteraction?: boolean
  disableSelection?: boolean
  ghost?: boolean
  handleProps?: any
  indicator?: boolean
  indentationWidth: number
  value?: string
  children?: ITreeItemChildren
  onCollapse?: () => void
  onRemove?: () => void
  wrapperRef?: (node: HTMLLIElement) => void
  isDragValid?: boolean
}

export const TreeItem = forwardRef<HTMLDivElement, Props>(
  (
    {
      childCount,
      clone,
      depth,
      disableSelection,
      disableInteraction,
      ghost,
      handleProps,
      indentationWidth,
      indicator,
      collapsed,
      hidden,
      onCollapse,
      onRemove,
      style,
      value,
      children,
      wrapperRef,
      isDragValid = false,
      itemId,
      ...props
    },
    ref
  ) => {
    return (
      <li
        className={cn(
          'list-none pl-[var(--tree-item-spacing)]'
          // 'mb-[-1px] box-border list-none pl-[var(--spacing)]',
          // clone && 'pointer-events-none inline-block p-0 pl-2.5 pt-1.5',
          // ghost && 'opacity-50',
          // indicator && 'z-1 relative mb-[-1px] opacity-100'
          // disableSelection && styles.disableSelection,
          // disableInteraction && styles.disableInteraction,
          // !isDragValid && styles.invalid
        )}
        ref={wrapperRef}
        style={
          {
            '--tree-item-spacing': `${indentationWidth * depth}px`,
          } as React.CSSProperties
        }
        {...props}
      >
        <div
          // className="relative box-border flex items-center border border-gray-300 bg-white px-2.5 py-[var(--vertical-padding)] text-gray-900"
          ref={ref}
          style={style}
        >
          {/* <div>
            <GripVerticalIcon
              sx={{ cursor: 'grab', '&:focus': { outline: 'none' } }}
              {...handleProps}
            />
          </div> */}
          {/* {!children && !!value ? (
            <span
              className={cn(
                'grow overflow-hidden text-ellipsis whitespace-nowrap pl-2 text-gray-700',
                hidden && 'text-gray-200'
              )}
            >
              {value}
            </span>
          ) : null} */}
          {/* {children ? children : null} */}
          {typeof children === 'function'
            ? children({
                id: itemId,
                handleProps,
                onRemove,
                clone,
                ghost,
                childCount,
              })
            : children}
          {/* {!clone && onRemove && <CloseIcon onClick={onRemove} sx={{ cursor: 'pointer' }} />} */}
          {/* {isHovered && !clone && actions && <Actions actions={actions} />} */}
          {/* {clone && childCount && childCount > 1 ? (
            <span className="absolute right-[-10px] top-[-10px] flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
              {childCount}
            </span>
          ) : null} */}
        </div>
      </li>
    )
  }
)

TreeItem.displayName = 'TreeItem'
