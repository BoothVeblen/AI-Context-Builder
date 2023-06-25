'use client'

import { WorkflowItem } from '@/store/settings'

import { SortableTree } from '@/components/dnd/sortable-tree'
import { TreeItem } from '@/components/dnd/types'

import WorkflowTreeItem from './workflow-tree-item'

interface IProps {
  value?: TreeItem[]
  onChange?: (items: TreeItem[]) => void
  data?: WorkflowItem[]
}

export default function WorkflowTree({ value = [], onChange, data }: IProps) {
  function handleChange(items: TreeItem[]) {
    onChange?.(items)
  }

  return (
    <SortableTree value={value} onChange={handleChange} indicator removable>
      {(props) => {
        const value = data?.find((d) => d.id === props.id)
        return <WorkflowTreeItem key={props.id} value={value} {...props} />
      }}
    </SortableTree>
  )
}
