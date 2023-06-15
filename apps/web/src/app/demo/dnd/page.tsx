import { TreeItem } from '@/components/dnd/types'

import WorkflowTree from './workflow-tree'

const ITEMS_VALUE: TreeItem[] = [
  {
    id: 'a',
    children: [
      {
        id: 'b',
        children: [],
      },
    ],
  },
  {
    id: 'c',
    children: [],
  },
]

export default function DemoPage() {
  return (
    <div className="flex-1 p-4">
      <WorkflowTree defaultValue={ITEMS_VALUE} />
    </div>
  )
}
