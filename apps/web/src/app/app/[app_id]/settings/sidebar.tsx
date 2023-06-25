import { ArrowLeftIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'

export default function Sidebar() {
  return (
    <div>
      <div className="flex items-center space-x-2 px-4 py-3">
        <Button variant="outline" className="h-8 w-8 p-0">
          <ArrowLeftIcon className="h-4 w-4" />
        </Button>
        <div className="text-lg font-semibold">Back</div>
      </div>

      <div className="mt-4 space-y-2 px-3 py-2">
        <div className="text-sm font-medium uppercase text-slate-500">
          App Settings
        </div>
        <div className="cursor-pointer rounded-md p-3 hover:bg-slate-100">
          <div className="text-sm font-medium">Basics</div>
          <div className="text-sm text-slate-500">
            Some basic configurations of the App.
          </div>
        </div>
        <div className="rounded-md bg-slate-100 p-3">
          <div className="text-sm font-medium">Workflow</div>
          <div className="text-sm text-slate-500">
            Workflow related configurations of the App.
          </div>
        </div>
        <div className="cursor-pointer rounded-md p-3 hover:bg-slate-100">
          <div className="text-sm font-medium">Context</div>
          <div className="text-sm text-slate-500">
            Import your own data for LLM context enhancement.
          </div>
        </div>
      </div>
    </div>
  )
}
