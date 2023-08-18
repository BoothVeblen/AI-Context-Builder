'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeftIcon, Loader2Icon } from 'lucide-react'

import { flags } from '@/lib/flags'
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
  const searchParams = useSearchParams()
  const nextUrl = searchParams.get('nextUrl')
  const [isPending, startTransition] = useTransition()

  function handleGoBack() {
    startTransition(() => {
      if (nextUrl) {
        router.push(nextUrl)
      } else {
        router.back()
      }
    })
  }

  return (
    <div>
      <div className="flex items-center space-x-2 px-4 py-3">
        <Button
          variant="outline"
          className="h-8 w-8 p-0"
          onClick={handleGoBack}
        >
          {isPending ? (
            <Loader2Icon className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowLeftIcon className="h-4 w-4" />
          )}
        </Button>
        <div className="text-lg font-semibold">Back</div>
      </div>

      <div className="mt-4 space-y-2 p-2">
        <div className="pl-3 text-sm font-medium uppercase text-slate-500">
          App Settings
        </div>
        <Link
          className={cn(
            commonStyle,
            url?.includes('basics') ? 'bg-slate-200' : ''
          )}
          href={{
            pathname: `/app/${appId}/settings/basics`,
            search: searchParams.toString(),
          }}
          replace
        >
          <div className="text-sm font-medium">Basics</div>
          <div className="text-sm text-slate-500">
            Some basic configurations of the App.
          </div>
        </Link>
        {flags.enabledWorkflow && (
          <Link
            className={cn(
              commonStyle,
              url?.includes('workflow') ? 'bg-slate-200' : ''
            )}
            href={{
              pathname: `/app/${appId}/settings/workflow`,
              search: searchParams.toString(),
            }}
            replace
          >
            <div className="text-sm font-medium">Workflow</div>
            <div className="text-sm text-slate-500">
              Workflow related configurations of the App.
            </div>
          </Link>
        )}
      </div>

      <div className="mb-2 shrink-0 px-3">
        <div className="h-px bg-slate-200" />
      </div>

      <div className="px-2">
        <DeleteAppButton id={appId} name={appName} />
      </div>
    </div>
  )
}
