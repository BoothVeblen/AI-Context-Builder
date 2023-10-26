import { PropsWithChildren } from 'react'
import { AlertCircleIcon } from 'lucide-react'

export default async function WarningLabel({ children }: PropsWithChildren) {
  return (
    <div className="border-l-2 border-yellow-400 bg-yellow-50 p-2">
      <div className="flex items-center gap-1">
        <AlertCircleIcon className="h-4 w-4 shrink-0 text-yellow-400" />
        <p className="text-sm text-yellow-700">{children}</p>
      </div>
    </div>
  )
}
