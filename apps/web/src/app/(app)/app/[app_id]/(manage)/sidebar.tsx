'use client'

import { PropsWithChildren, useTransition } from 'react'
import { Route } from 'next'
import { Url } from 'next/dist/shared/lib/router/router'
import Link from 'next/link'
import {
  useRouter,
  useSearchParams,
  useSelectedLayoutSegments,
} from 'next/navigation'
import { ArrowLeftIcon, Loader2Icon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const commonStyle =
  'flex cursor-pointer flex-col rounded-md p-3 hover:bg-slate-200'

type SidebarLinkProps = {
  href: Url
  name: string
  desc: string
}

const SidebarLink = (props: SidebarLinkProps) => {
  const { href, name, desc } = props
  const segments = useSelectedLayoutSegments()
  const basename =
    (typeof href === 'string' ? href : href.pathname)?.split('/').pop() ?? ''
  return (
    <Link
      className={cn(
        commonStyle,
        segments?.includes(basename) ? 'bg-slate-200' : ''
      )}
      href={href}
      replace
    >
      <div className="text-sm font-medium">{name}</div>
      <div className="text-sm text-slate-500">{desc}</div>
    </Link>
  )
}
function Sidebar({ children }: PropsWithChildren) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextUrl = searchParams?.get('nextUrl')
  const [isPending, startTransition] = useTransition()

  function handleGoBack() {
    startTransition(() => {
      if (nextUrl) {
        router.push(nextUrl as Route)
      } else {
        router.back()
      }
      router.refresh()
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
      <div className="mt-4 space-y-2 p-2">{children}</div>
    </div>
  )
}

Sidebar.Link = SidebarLink

export default Sidebar
