'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowLeftIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

import DeleteAppButton from './delete-app-button'

const commonStyle =
  'flex cursor-pointer flex-col rounded-md p-3 hover:bg-slate-200'

interface IProps {
  appId: string
  appName: string
}

export default function Sidebar({ appId, appName }: IProps) {
  const router = useRouter()
  const url = usePathname() || ''

  function handleGoBack() {
    router.back()
  }

  return (
    <div>
      <div className="flex items-center space-x-2 px-4 py-3">
        <Button
          variant="outline"
          className="h-8 w-8 p-0"
          onClick={handleGoBack}
        >
          <ArrowLeftIcon className="h-4 w-4" />
        </Button>
        <div className="text-lg font-semibold">Back</div>
      </div>

      <div className="mt-4 space-y-2 px-3 py-2">
        <div className="text-sm font-medium uppercase text-slate-500">
          App Settings
        </div>
        <Link
          className={cn(
            commonStyle,
            url?.includes('basics') ? 'bg-slate-200' : ''
          )}
          href={`/app/${appId}/settings/basics`}
        >
          <div className="text-sm font-medium">Basics</div>
          <div className="text-sm text-slate-500">
            Some basic configurations of the App.
          </div>
        </Link>
        {/* <Link
          className={cn(
            commonStyle,
            url?.includes('workflow') ? 'bg-slate-200' : ''
          )}
          replace
          href={`/app/${appId}/settings/workflow`}
        >
          <div className="text-sm font-medium">Workflow</div>
          <div className="text-sm text-slate-500">
            Workflow related configurations of the App.
          </div>
        </Link> */}
      </div>

      <div className="my-2 h-px shrink-0 px-3" />

      <div className="px-3">
        <DeleteAppButton id={appId} name={appName} />
      </div>
    </div>
  )
}
