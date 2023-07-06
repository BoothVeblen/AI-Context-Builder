'use client'

import * as React from 'react'
import { UniqueIdentifier } from '@dnd-kit/core'

import { TreeItem } from '@/components/dnd/types'

import TaskDetail from './task-detail'
import TaskItem from './task-item'

const LIST = [
  {
    id: 't1',
    children: [{ id: 't3', children: [{ id: 't4' }, { id: 't5' }] }],
  },
  {
    id: 't2',
  },
] as TreeItem[]

export default function TaskList() {
  const [selectedId, setSelectedId] = React.useState<null | UniqueIdentifier>(
    null
  )

  function selectTask(taskId: UniqueIdentifier) {
    setSelectedId(taskId)
  }

  function closeTaskDetail() {
    setSelectedId(null)
  }

  return (
    <div className="flex flex-1">
      <div className="flex-1">
        <div className="-ml-6 mt-2">
          {LIST.map(({ id, children }) => (
            <TaskItem
              key={id}
              id={id}
              childItems={children}
              onSelect={selectTask}
              selectedId={selectedId}
            />
          ))}
        </div>
      </div>
      {selectedId && (
        <div className="w-96 border-l border-slate-100 p-6">
          <TaskDetail onClose={closeTaskDetail} />
        </div>
      )}
    </div>
  )
}
