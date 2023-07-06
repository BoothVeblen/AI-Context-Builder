import { XIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface IProps {
  onClose: () => void
}

export default function TaskDetail({ onClose }: IProps) {
  return (
    <div className="space-y-8">
      <div className="-mr-2 -mt-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold">View App task</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <XIcon className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <div className="text-base font-medium">Title</div>
        <div className="text-sm">Task title</div>
      </div>
    </div>
  )
}
