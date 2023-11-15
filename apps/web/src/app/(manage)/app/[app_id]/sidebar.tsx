'use client'

import { useTransition } from 'react'
import { Url } from 'next/dist/shared/lib/router/router'
import Link from 'next/link'
import { useRouter, useSelectedLayoutSegments } from 'next/navigation'
import { ArrowLeftIcon, Loader2Icon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const commonStyle =
  'flex cursor-pointer flex-col rounded-md p-3 hover:bg-slate-200'

interface SidebarLinkProps {
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

interface SidebarProps {
  children: React.ReactNode
  directUrl?: string
}

function Sidebar({ children, directUrl }: SidebarProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  function handleGoBack() {
    startTransition(() => {
      if (directUrl) {
        router.push(directUrl)
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
