'use client'

import { SortableTree } from '@/components/dnd/sortable-tree'
import { TreeItem } from '@/components/dnd/types'

import WorkflowTreeItem from './workflow-tree-item'

interface IProps {
  defaultValue?: TreeItem[]
}

export default function WorkflowTree({ defaultValue }: IProps) {
  function handleChange(items: TreeItem[]) {
    console.log('items:', items)
  }

  return (
    <SortableTree
      value={defaultValue}
      onChange={handleChange}
      indicator
      removable
    >
      {(props) => <WorkflowTreeItem key={props.id} {...props} />}
    </SortableTree>
  )
}
