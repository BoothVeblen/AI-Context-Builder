'use client'

import { WorkflowItem } from '@/store/settings'

import { cn } from '@/lib/utils'

interface IProps {
  id: string
  value?: WorkflowItem
  clone?: boolean
  ghost?: boolean
  childCount?: number
  handleProps?: any
}

export default function WorkflowTreeItem({
  id,
  value,
  clone,
  ghost,
  childCount,
  handleProps,
}: IProps) {
  const { type, subType, name } = value || {}

  function handleClick() {
    console.log('handleClick WorkflowTreeItem:', id)
  }

  return (
    <div className={cn('relative mb-4 w-[360px]', clone && '-rotate-3')}>
      <div
        className={cn(
          'relative overflow-hidden rounded-lg border bg-white p-4',
          ghost && 'border-gray-100'
        )}
        {...handleProps}
        onClick={handleClick}
      >
        <div className="text-sm text-slate-500">{type}</div>
        <div className="mt-3 text-sm font-medium text-slate-900">{name}</div>
        {ghost && <div className="absolute inset-0 bg-gray-100" />}
      </div>
      {clone && childCount && childCount > 1 ? (
        <span className="absolute right-[-10px] top-[-10px] flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
          {childCount}
        </span>
      ) : null}
    </div>
  )
}
