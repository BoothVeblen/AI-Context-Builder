import { Info, RefreshCw } from 'lucide-react'

import { Button } from '../ui/button'

interface IProps {
  onRestart: () => void
  onCancel: () => void
}

const RestartConfirmPage = ({ onRestart, onCancel }: IProps) => {
  return (
    <div className="absolute z-10 h-full w-full bg-white">
      <div className="flex items-center gap-2">
        <Info /> Mission Changed
      </div>
      <div className="my-6 text-base">
        Modifying the task will reset the debug area, are you sure?
      </div>
      <div className="flex gap-1">
        <Button onClick={onRestart} className="gap-1">
          <RefreshCw size={16} />
          Restart
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

export default RestartConfirmPage
