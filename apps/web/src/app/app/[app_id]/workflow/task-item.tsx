import { UniqueIdentifier } from '@dnd-kit/core'
import { WrenchIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { TreeItem } from '@/components/dnd/types'

interface IProps {
  id: UniqueIdentifier
  childItems?: TreeItem[]
  onSelect: (taskId: UniqueIdentifier) => void
  selectedId: UniqueIdentifier | null
}

export default function TaskItem({
  id,
  childItems,
  onSelect,
  selectedId,
}: IProps) {
  const isSelected = id === selectedId

  return (
    <div className="pl-12 pt-4">
      <button
        className={cn(
          'w-[360px] rounded-lg border border-slate-200 px-4 pb-6 pt-3 text-start',
          isSelected && 'bg-slate-50'
        )}
        onClick={() => onSelect(id)}
      >
        <div className="flex items-center space-x-2 text-slate-500">
          <WrenchIcon />
          <div className="text-sm">Tools</div>
        </div>
        <div className="mt-4 text-sm text-slate-900">Task title</div>
      </button>
      {childItems &&
        childItems.length > 0 &&
        childItems.map(({ id, children }) => (
          <TaskItem
            key={id}
            id={id}
            childItems={children}
            onSelect={onSelect}
            selectedId={selectedId}
          />
        ))}
    </div>
  )
}
